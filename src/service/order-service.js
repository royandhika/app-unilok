import { and, eq, sql } from "drizzle-orm";
import { orderItems, orders, productVariants, users } from "../app/db-schema.js";
import { db } from "../app/db.js";
import { ResponseError } from "../error/response-error.js";
import axios from "axios";
import "dotenv/config";
import { connect } from "amqplib";
import { logger } from "../app/logging.js";

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

    return shippingCost.data.data;
};

const scheduledDelayedPaymentMessage = async (orderId) => {
    const connection = await connect(process.env.RABBITMQ_URL);
    const channel = await connection.createChannel();

    await channel.assertExchange(process.env.RABBITMQ_EXCHANGE, "x-delayed-message", {
        durable: true,
        arguments: { "x-delayed-type": "direct" }, // Required for delayed messages
    });
    await channel.assertQueue(process.env.RABBITMQ_QUEUE, { durable: true });
    await channel.bindQueue(process.env.RABBITMQ_QUEUE, process.env.RABBITMQ_EXCHANGE, "");

    await channel.publish(process.env.RABBITMQ_EXCHANGE, "", Buffer.from(JSON.stringify({ orderId: orderId })), {
        headers: {
            "x-delay": Number(process.env.PAYMENT_CHECK_DELAY_MS),
        },
    });

    await channel.close();
    await connection.close();
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

    logger.error("x");

    await scheduledDelayedPaymentMessage(orderId);

    logger.error("done");

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

    return response.data;
};

// Lihat semua order dari user
const getOrder = async (body) => {
    const response = await db.query.orders.findMany({
        where: eq(orders.user_id, body.user_id),
        columns: {
            id: true,
            user_id: true,
            address_id: true,
            status: true,
            created_at: true,
        },
        with: {
            orderItems: {
                columns: {
                    product_variant_id: true,
                    quantity: true,
                    price: true,
                },
            },
        },
    });

    return response;
};

// Lihat detail salah satu order
const getOrderId = async (param, body) => {
    // Lengkap dengan relasi ke quantity dan harga
    const response = await db.query.orders.findFirst({
        where: and(eq(orders.id, param.orderId, eq(orders.user_id, body.user_id))),
        columns: {
            id: true,
            user_id: true,
            address_id: true,
            status: true,
            created_at: true,
        },
        with: {
            orderItems: {
                columns: {
                    product_variant_id: true,
                    quantity: true,
                    price: true,
                },
            },
        },
    });

    return response;
};

const patchOrder = async (param, body) => {};

export default {
    getShippingCost,
    postOrder,
    getOrder,
    getOrderId,
    patchOrder,
};
