import { db } from "../app/db.js";
import { eq, and, gt } from "drizzle-orm";
import { cartItems, productImages } from "../app/db-schema.js";
import { ResponseError } from "../error/response-error.js";

const postCart = async (body) => {
    // Kalau variant id sudah ada, jangan boleh
    const [cartExist] = await db
        .select()
        .from(cartItems)
        .where(and(eq(cartItems.user_id, body.user_id), eq(cartItems.product_variant_id, body.product_variant_id)));

    let cartId = undefined;
    // Kalau sudah pernah ada tapi 0, tambah quantitynya jadi 1
    if (cartExist && cartExist.quantity === 0) {
        await db
            .update(cartItems)
            .set({
                quantity: 1,
            })
            .where(and(eq(cartItems.user_id, body.user_id), eq(cartItems.product_variant_id, body.product_variant_id)));

        cartId = cartExist.id;
    }
    // Kalau ada dan > 0, lempar error
    else if (cartExist && cartExist.quantity > 0) {
        throw new ResponseError(400, "Product variant already exist");
    }
    // Kalau belum ada, insert baru
    else {
        const [insertOne] = await db
            .insert(cartItems)
            .values({
                user_id: body.user_id,
                product_variant_id: body.product_variant_id,
                quantity: 1,
            })
            .$returningId();

        cartId = insertOne.id;
    }

    // Response dengan isi cartnya
    const [response] = await db
        .select({
            id: cartItems.id,
            user_id: cartItems.user_id,
            product_variant_id: cartItems.product_variant_id,
            quantity: cartItems.quantity,
        })
        .from(cartItems)
        .where(eq(cartItems.id, cartId));

    return response;
};

const getCart = async (body) => {
    // Get isi cart berdasarkan user id, lengkap dengan detail productnya
    const response = await db.query.cartItems.findMany({
        where: and(eq(cartItems.user_id, body.user_id), gt(cartItems.quantity, 0)),
        columns: {
            id: true,
            user_id: true,
            quantity: true,
        },
        with: {
            productVariants: {
                columns: {
                    product_id: true,
                    size: true,
                    stock: true,
                    price: true,
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
    });

    return response;
};

const patchCart = async (param, body) => {
    // Pastikan dulu ada barangnya
    const [cartExist] = await db
        .select()
        .from(cartItems)
        .where(and(eq(cartItems.id, param.cartId), eq(cartItems.user_id, body.user_id), gt(cartItems.quantity, 0)));

    if (!cartExist) throw new ResponseError(404, "Cart item not found");

    // Update quantity di cart
    await db
        .update(cartItems)
        .set({
            quantity: body.quantity,
        })
        .where(and(eq(cartItems.id, param.cartId), eq(cartItems.user_id, body.user_id)));

    // Response dengan isi cartnya
    const [response] = await db
        .select({
            id: cartItems.id,
            user_id: cartItems.user_id,
            product_variant_id: cartItems.product_variant_id,
            quantity: cartItems.quantity,
        })
        .from(cartItems)
        .where(eq(cartItems.id, param.cartId));

    return response;
};

const deleteCart = async (param, body) => {
    // Pastikan dulu ada barangnya
    const [cartExist] = await db
        .select()
        .from(cartItems)
        .where(and(eq(cartItems.id, param.cartId), eq(cartItems.user_id, body.user_id), gt(cartItems.quantity, 0)));

    if (!cartExist) throw new ResponseError(404, "Cart item not found");

    // Soft delete alias set quantity = 0
    await db
        .update(cartItems)
        .set({
            quantity: 0,
        })
        .where(and(eq(cartItems.id, param.cartId), eq(cartItems.user_id, body.user_id)));
};

export default { postCart, getCart, patchCart, deleteCart };
