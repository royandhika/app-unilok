import { and, eq, gt, sql } from "drizzle-orm";
import { orderItems, orders, productImages, productVariants, users, cartItems } from "../app/db-schema.js";
import { db } from "../app/db.js";
import { ResponseError } from "../error/response-error.js";
import axios from "axios";
import "dotenv/config";
const imgDomain = process.env.IMG_DOM;

// Ambil shipping cost
const getShippingCost = async (body) => {
    const apiKey = process.env.RAJAONGKIR_APIKEY;
    const originId = process.env.RAJAONGKIR_ORIGIN;
    const postalCode = body.postal_code;
    const weight = body.weight;

    const destination = await axios.get(
        `https://rajaongkir.komerce.id/api/v1/destination/domestic-destination?search=${postalCode}&limit=5&offset=0`,
        {
            headers: {
                key: apiKey,
            },
        }
    );
    const destinationId = destination.data.data[0].id;

    const bodyRequest = new URLSearchParams();
    bodyRequest.append("origin", originId);
    bodyRequest.append("destination", destinationId);
    bodyRequest.append("courier", "jne:pos");
    bodyRequest.append("weight", weight);
    const shippingCost = await axios.post(`https://rajaongkir.komerce.id/api/v1/calculate/domestic-cost`, bodyRequest, {
        headers: {
            key: apiKey,
        },
    });

    const response = shippingCost.data.data;

    return response;
};

// Buat order baru
const postOrder = async (body) => {
    // Buat transaction untuk antisipasi gagal
    // Ambil shippingcost lagi
    const apiKey = process.env.RAJAONGKIR_APIKEY;
    const originId = process.env.RAJAONGKIR_ORIGIN;
    const xenditKey = process.env.XENDIT_APIKEY;
    const postalCode = body.postal_code;
    const weight = body.weight;
    let orderId;

    const destination = await axios.get(
        `https://rajaongkir.komerce.id/api/v1/destination/domestic-destination?search=${postalCode}&limit=5&offset=0`,
        {
            headers: {
                key: apiKey,
            },
        }
    );
    const destinationId = destination.data.data[0].id;

    const bodyRequest = new URLSearchParams();
    bodyRequest.append("origin", originId);
    bodyRequest.append("destination", destinationId);
    bodyRequest.append("courier", "jne:pos");
    bodyRequest.append("weight", weight);
    const responseOngkir = await axios.post(
        `https://rajaongkir.komerce.id/api/v1/calculate/domestic-cost`,
        bodyRequest,
        {
            headers: {
                key: apiKey,
            },
        }
    );

    const shippingCost = responseOngkir.data.data;

    function getShippingCost(list, selected) {
        const match = list.find(
            (item) =>
                item.name === selected.name &&
                item.code === selected.code &&
                item.service === selected.service &&
                item.description === selected.description &&
                item.etd === selected.etd
        );

        return match ? match.cost : null;
    }
    body.shipping.cost = getShippingCost(shippingCost, body.shipping);

    await db.transaction(async (tx) => {
        for (const item of body.items) {
            // Cek sisa stock cukup apa ga
            const [variant] = await db
                .select()
                .from(productVariants)
                .where(eq(productVariants.id, item.product_variant_id));
            // Kalau ga cukup throw error
            if (!variant || variant.stock < item.quantity) throw new ResponseError(409, "Insufficient stock");

            // Isi harga dari product_variants
            item.price = variant.price;

            // Kurangi stock di product_variants
            await tx
                .update(productVariants)
                .set({
                    stock: sql`${productVariants.stock} - ${item.quantity}`,
                })
                .where(eq(productVariants.id, item.product_variant_id));
        }

        const totalPrice = body.items.reduce((total, item) => total + item.price, 0);

        // Insert ke orders
        const [insertOrder] = await tx
            .insert(orders)
            .values({
                address_id: body.address_id,
                user_id: body.user_id,
                price: totalPrice,
                shipping_cost: body.shipping.cost,
                shipping_detail: {
                    name: body.shipping.name,
                    code: body.shipping.code,
                    service: body.shipping.service,
                    description: body.shipping.description,
                    etd: body.shipping.etd,
                },
            })
            .$returningId();
        orderId = insertOrder.id;
        // Kemudian baru insert ke order_items dari id order
        const requestOrderItem = body.items.map((item) => ({
            order_id: orderId,
            product_variant_id: item.product_variant_id,
            quantity: item.quantity,
            price: item.price,
        }));

        await tx.insert(orderItems).values(requestOrderItem);
    });

    const [invoiceNew] = await db.select().from(orders).where(eq(orders.id, orderId));
    const [userExist] = await db.select().from(users).where(eq(users.id, body.user_id));

    // Kirim invoice ke xendit
    const invoiceId = invoiceNew.id.toString().padStart(8, "0");
    const invoiceBody = {
        external_id: `invoice-${invoiceId}`,
        amount: invoiceNew.price + invoiceNew.shipping_cost,
        payer_email: userExist.email,
        description: `user${invoiceNew.user_id}-${invoiceNew.address_id}`,
    };

    const response = await axios.post(`https://api.xendit.co/v2/invoices`, invoiceBody, {
        auth: {
            username: xenditKey,
            password: "",
        },
    });

    await db.update(orders).set({
        invoice_url: response.data.invoice_url,
    });

    return response.data;
};

// Lihat semua order dari user
const getOrder = async (query, body) => {
    const { status, limit = "10", page = "1" } = query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const conditions = [];
    conditions.push(eq(orders.user_id, body.user_id));
    if (status) {
        conditions.push(eq(orders.status, status));
    }

    const count = await db.query.orders.findMany({
        where: conditions.length > 0 ? and(...conditions) : undefined,
        columns: {
            id: true,
        },
        with: {
            orderItems: {
                columns: {
                    id: true,
                },
            },
        },
    });


    const response = await db.query.orders.findMany({
        where: conditions.length > 0 ? and(...conditions) : undefined,
        limit: parseInt(limit),
        offset: parseInt(offset),
        columns: {
            id: true,
            user_id: true,
            address_id: true,
            status: true,
            price: true,
            invoice_url: true,
            created_at: true,
        },
        with: {
            orderItems: {
                columns: {
                    id: true,
                    product_variant_id: true,
                    quantity: true,
                    price: true,
                },
            },
        },
    });

    // Meta data
    const totalItems = `${count.length}`;
    const totalPages = `${Math.ceil(count.length / limit)}`;

    const meta = {
        page: page,
        page_size: limit,
        total_items: totalItems,
        total_pages: totalPages,
    };
    
    return [response, meta];
};

// Lihat detail salah satu order
const getOrderId = async (param, body) => {
    // Lengkap dengan relasi ke quantity dan harga
    let response = await db.query.orders.findFirst({
        where: and(eq(orders.id, param.orderId, eq(orders.user_id, body.user_id))),
        columns: {
            id: true,
            user_id: true,
            address_id: true,
            status: true,
            price: true,
            invoice_url: true,
            shipping_cost: true,
            shipping_detail: true,
            shipping_invoice: true,
            created_at: true,
        },
        with: {
            orderItems: {
                columns: {
                    product_variant_id: true,
                    quantity: true,
                    price: true,
                },
                with: {
                    productVariants: {
                        columns: {
                            id: true,
                            product_id: true,
                            size: true,
                        },
                        with: {
                            colours: {
                                columns: {
                                    name: true,
                                    hex: true,
                                },
                            },
                            products: {
                                columns: {
                                    title: true,
                                },
                                with: {
                                    productImages: {
                                        columns: {
                                            url: true,
                                        },
                                        where: eq(productImages.is_thumbnail, 1),
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
    });

    response = {
        id: response.id,
        user_id: response.user_id,
        address_id: response.address_id,
        status: response.status,
        price: response.price,
        invoice_url: response.invoice_url,
        shipping_cost: response.shipping_cost,
        shipping_detail: response.shipping_detail,
        shipping_invoice: response.shipping_invoice,
        created_at: response.created_at,
        productVariants: response.orderItems.map((item) => ({
            title: item.productVariants.products.title,
            thumbnail: `${imgDomain}/${item.productVariants.products.productImages[0].url}`,
            product_variant_id: item.product_variant_id,
            quantity: item.quantity,
            price: item.price,
            colour_name: item.productVariants.colours.name,
            colour_hex: item.productVariants.colours.hex,
        })),
    };

    return response;
};

const patchOrder = async (param, body) => {
    // Ubah status jadi PAID
    await db
        .update(orders)
        .set({
            status: body.status,
        })
        .where(eq(orders.id, param.orderId));
};

const getOrderCount = async (body) => {
    // Hitung Cart
    // Hitung Order Pending
    // Hitung Order Paid
    // Hitung Order Shipped
    const [cart] = await db
        .select({
            count_cart: sql`count(*)`,
        })
        .from(cartItems)
        .where(and(eq(cartItems.user_id, body.user_id), gt(cartItems.quantity, 0)));

    const [pending] = await db
        .select({
            count_pending: sql`count(*)`,
        })
        .from(orders)
        .where(and(eq(orders.user_id, body.user_id), eq(orders.status, "Pending")));

    const [paid] = await db
        .select({
            count_paid: sql`count(*)`,
        })
        .from(orders)
        .where(and(eq(orders.user_id, body.user_id), eq(orders.status, "Paid")));

    const [shipped] = await db
        .select({
            count_shipped: sql`count(*)`,
        })
        .from(orders)
        .where(and(eq(orders.user_id, body.user_id), eq(orders.status, "Shipped")));

    const response = {
        cart: cart.count_cart,
        pending: pending.count_pending,
        paid: paid.count_paid,
        shipped: shipped.count_shipped,
    };
    return response;
};

export default {
    getShippingCost,
    postOrder,
    getOrder,
    getOrderId,
    patchOrder,
    getOrderCount,
};
