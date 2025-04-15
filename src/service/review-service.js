import { orderItems, productReviews } from "../app/db-schema.js";
import { eq, sql } from "drizzle-orm";
import { db } from "../app/db.js";
import "dotenv/config";

const postReview = async (param, body) => {
    // Ambil product variant id dulu
    const [variantId] = await db.select().from(orderItems).where(eq(orderItems.id, param.itemId));

    const [insertReview] = await db
        .insert(productReviews)
        .values({
            order_item_id: param.itemId,
            product_variant_id: variantId.product_variant_id,
            user_id: body.user_id,
            rating: body.rating,
            comment: body.comment,
        })
        .$returningId();

    const [response] = await db
        .select({
            id: productReviews.id,
            order_item_id: productReviews.order_item_id,
            product_variant_id: productReviews.product_variant_id,
            user_id: productReviews.user_id,
            rating: productReviews.rating,
            comment: productReviews.comment,
            created_at: productReviews.created_at,
        })
        .from(productReviews)
        .where({
            id: insertReview.id,
        });

    return response;
};

const getReviewByProduct = async (param) => {
    const query = sql.raw(`
        with src as (
            select 
                products.id, 
                product_reviews.rating, 
                count(*) AS jumlah
            from products
            left join product_variants
                on products.id = product_variants.product_id 
            left join product_reviews
                on product_variants.id = product_reviews.product_variant_id 
            where products.id = ${param.id}
            group by products.id, product_reviews.rating 
        )
        ,final as (
            select 
                rating,
                jumlah,
                avg(rating*jumlah) over() AS average
            from src
            where rating is not null
        )
        select * from final
        `);
    const [response] = await db.execute(query); 

    return response;
};

export default {
    postReview,
    getReviewByProduct,
};
