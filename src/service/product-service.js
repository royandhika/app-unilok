import { asc, desc, eq, and, like } from "drizzle-orm";
import { colours, productImages, productVariants, products } from "../app/db-schema.js";
import { db } from "../app/db.js";
import { ResponseError } from "../error/response-error.js";

const postColour = async (body) => {
    const requestColour = body.colours.map((colour) => ({
        name: colour.name,
        hex: colour.hex,
    }));

    const [insertMany] = await db.insert(colours).values(requestColour);
    const response = { count: insertMany.affectedRows };

    return response;
};

const postProduct = async (body) => {
    const [response] = await db.insert(products).values(body).$returningId();

    return response;
};

const postProductImage = async (param, body) => {
    const requestImage = body.images.map((img) => ({
        product_id: param.id,
        url: img.url,
        is_thumbnail: img.is_thumbnail,
    }));

    const [insertMany] = await db.insert(productImages).values(requestImage);
    const response = { count: insertMany.affectedRows };

    return response;
};

const postProductVariant = async (param, body) => {
    const requestVariant = body.variants.map((variant) => ({
        product_id: param.id,
        colour_id: variant.colour_id,
        size: variant.size,
        stock: variant.stock,
        reserved_stock: variant.reserved_stock,
        price: variant.price,
    }));

    const [insertMany] = await db.insert(productVariants).values(requestVariant);
    const response = { count: insertMany.affectedRows };

    return response;
};

const getProduct = async (query) => {
    const { search, gender, category, sortBy = "created_at", order = "desc", limit = "10", page = "1" } = query;

    const orderDirection = order === "desc" ? desc : asc;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const conditions = [];
    if (gender) {
        conditions.push(eq(products.gender, gender));
    }
    if (category) {
        conditions.push(eq(products.category, category));
    }
    if (search) {
        conditions.push(like(products.title, `%${search}%`));
    }

    let queries = db
        .select({
            id: products.id,
            title: products.title,
            thumbnail: productImages.url,
            price: products.base_price,
            category: products.category,
            gender: products.gender,
            tags: products.tags,
        })
        .from(products)
        .leftJoin(productImages, and(eq(products.id, productImages.product_id), eq(productImages.is_thumbnail, 1)))
        .$dynamic()
        .orderBy(orderDirection(products[sortBy]));

    if (conditions.length > 0) {
        queries = queries.where(and(...conditions));
    }

    // Meta data
    const count = await queries;
    const totalItems = `${count.length}`;
    const totalPages = `${Math.ceil(count.length / limit)}`;

    if (limit && offset) {
        queries = queries.limit(parseInt(limit));
        queries = queries.offset(parseInt(offset));
    }

    // Response data
    const response = await queries;

    const meta = {
        page: page,
        page_size: limit,
        total_items: totalItems,
        total_pages: totalPages,
    };

    return [response, meta];
};

const getProductId = async (param) => {
    const response = await db.query.products.findFirst({
        where: eq(products.id, param.id),
        columns: {
            id: true,
            title: true,
            description: true,
            base_price: true,
            category: true,
            gender: true,
            tags: true,
        },
        with: {
            productImages: {
                columns: {
                    url: true,
                },
            },
            productVariants: {
                columns: {
                    size: true,
                    stock: true,
                    reserved_stock: true,
                    price: true,
                },
                with: {
                    colours: {
                        columns: {
                            name: true,
                            hex: true,
                        },
                    },
                },
            },
        },
    });

    if (!response) throw new ResponseError(404, "Product not found");

    return response;
};

export default {
    postColour,
    postProduct,
    postProductImage,
    postProductVariant,
    getProduct,
    getProductId,
};
