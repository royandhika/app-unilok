import { and, eq, sql } from "drizzle-orm";
import { orderItems, orders, productVariants } from "../app/db-schema.js";
import { db } from "../app/db.js";
import { ResponseError } from "../error/response-error.js";

const postOrder = async (body) => {
    await db.transaction(async (tx) => {
        for (const item of body.items) {
            const [variant] = await db
                .select()
                .from(productVariants)
                .where(eq(productVariants.id, item.product_variant_id));

            if (!variant || variant.stock < item.quantity) throw new ResponseError(409, "Insufficient stock");

            await tx
                .update(productVariants)
                .set({
                    stock: sql`${productVariants.stock} - ${item.quantity}`,
                })
                .where(eq(productVariants.id, item.product_variant_id));
        }

        const [insertOrder] = await tx
            .insert(orders)
            .values({
                address_id: body.address_id,
                user_id: body.user_id,
            })
            .$returningId();

        const requestOrderItem = body.items.map((item) => ({
            order_id: insertOrder.id,
            product_variant_id: item.product_variant_id,
            quantity: item.quantity,
            price: item.price,
        }));

        await tx.insert(orderItems).values(requestOrderItem);
    });
};

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

const getOrderId = async (param, body) => {
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
    postOrder,
    getOrder,
    getOrderId,
    patchOrder,
};
