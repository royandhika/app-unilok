import { and, eq, asc, desc } from "drizzle-orm";
import { wishlists } from "../app/db-schema.js";
import { db } from "../app/db.js";

const postWishlist = async (param, body) => {
    const [wishlistExist] = await db
        .select({
            id: wishlists.id,
            user_id: wishlists.user_id,
            product_id: wishlists.product_id,
            is_active: wishlists.is_active,
        })
        .from(wishlists)
        .where(
            and(
                eq(wishlists.user_id, body.user_id),
                eq(wishlists.product_id, param.productId)
                // eq(wishlists.is_active, 0)
            )
        );
    let isActive;
    if (wishlistExist && wishlistExist.is_active === 1) {
        isActive = 0;
    } else if (wishlistExist && wishlistExist.is_active === 0) {
        isActive = 1;
    }

    if (wishlistExist) {
        await db
            .update(wishlists)
            .set({ is_active: isActive })
            .where(and(eq(wishlists.user_id, body.user_id), eq(wishlists.product_id, param.productId)));
    }
    if (!wishlistExist) {
        await db.insert(wishlists).values({
            user_id: body.user_id,
            product_id: param.productId,
            is_active: 1,
        });
    }

    const [response] = await db
        .select({
            id: wishlists.id,
            user_id: wishlists.user_id,
            product_id: wishlists.product_id,
            is_active: wishlists.is_active,
        })
        .from(wishlists)
        .where(and(eq(wishlists.user_id, body.user_id), eq(wishlists.product_id, param.productId)));

    return response;
};

const getWishlist = async (param, body) => {
    const [response] = await db
        .select({
            id: wishlists.id,
            user_id: wishlists.user_id,
            product_id: wishlists.product_id,
            is_active: wishlists.is_active,
        })
        .from(wishlists)
        .where(and(eq(wishlists.user_id, body.user_id), eq(wishlists.product_id, param.productId)));

    return response;
};

const getAllWishlist = async (query, body) => {
    const { limit = "10", page = "1", order = "desc" } = query;

    const orderDirection = order === "desc" ? desc : asc;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const count = await db.query.wishlists.findMany({
        where: and(eq(wishlists.user_id, body.user_id), eq(wishlists.is_active, 1)),
        columns: {
            id: true,
        },
    });

    const response = await db.query.wishlists.findMany({
        where: and(eq(wishlists.user_id, body.user_id), eq(wishlists.is_active, 1)),
        limit: parseInt(limit),
        offset: parseInt(offset),
        orderBy: [orderDirection(wishlists.created_at)],
        columns: {
            id: true,
            product_id: true,
            user_id: true,
            is_active: true,
        },
        with: {
            products: {
                columns: {
                    title: true,
                    base_price: true,
                    category: true,
                    gender: true,
                    tags: true,
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

export default {
    postWishlist,
    getWishlist,
    getAllWishlist,
};
