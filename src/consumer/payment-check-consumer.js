import { connect } from "amqplib";
import "dotenv/config";
import { logger } from "../app/logging.js";

import { db } from "../app/db.js";
import { orderItems, orders, productVariants } from "../app/db-schema.js";
import { eq, sql } from "drizzle-orm";

const RABBITMQ_URL = process.env.RABBITMQ_URL;
const RABBITMQ_QUEUE = process.env.RABBITMQ_QUEUE;
const RABBITMQ_EXCHANGE = process.env.RABBITMQ_EXCHANGE;

export const startPaymentCheckConsumer = async () => {
    const connection = await connect(RABBITMQ_URL);
    const channel = await connection.createChannel();

    await channel.assertExchange(
        RABBITMQ_EXCHANGE,
        "x-delayed-message", // Same as producer
        {
            durable: true,
            arguments: { "x-delayed-type": "direct" }, // Same as producer
        }
    );
    await channel.assertQueue(RABBITMQ_QUEUE, { durable: true });
    await channel.bindQueue(RABBITMQ_QUEUE, RABBITMQ_EXCHANGE, "");

    channel.consume(RABBITMQ_QUEUE, async (msg) => {
        if (msg === null) {
            return;
        }
        try {
            const { orderId } = JSON.parse(msg.content.toString());
            const [selectedOrder] = await db.select().from(orders).where(eq(orders.id, orderId));
            if (selectedOrder.status.toLowerCase() !== "pending") {
                channel.ack(msg);
                return;
            }

            const items = await db.select().from(orderItems).where(eq(orderItems.order_id, orderId));
            for (const item of items) {
                const quantity = item.quantity;
                await db
                    .update(productVariants)
                    .set({ stock: sql`stock + ${quantity}` })
                    .where(eq(productVariants.id, item.product_variant_id));
            }
            channel.ack(msg);
        } catch (error) {
            logger.error("consume delayed message error: ", error);
            channel.nack(msg);
        }
    });
};
