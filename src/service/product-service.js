import { asc, desc, eq, and, like } from "drizzle-orm";
import { colours, productImages, productVariants, products } from "../app/db-schema.js";
import { db } from "../app/db.js";
import { ResponseError } from "../error/response-error.js";

// Insert colour baru ke master
const postColour = async (body) => {
    // Ubah list jadi object
    const requestColour = body.colours.map((colour) => ({
        name: colour.name,
        hex: colour.hex,
    }));

    // Response dengan jumlah rownya
    const [insertMany] = await db.insert(colours).values(requestColour);
    const response = { count: insertMany.affectedRows };

    return response;
};

// Buat product baru (harus satu per satu)
const postProduct = async (body) => {
    const [response] = await db.insert(products).values(body).$returningId();
    
    // Response dengan product_id
    return response;
};

// Masukkan gambar dari product
const postProductImage = async (param, body) => {
    // Ubah list jadi object
    const requestImage = body.images.map((img) => ({
        product_id: param.productId,
        url: img.url,
        is_thumbnail: img.is_thumbnail,
    }));

    // Response dengan jumlah rownya
    const [insertMany] = await db.insert(productImages).values(requestImage);
    const response = { count: insertMany.affectedRows };

    return response;
};

// Masukkan variant dari product (informasi stock, warna, harga, dll)
const postProductVariant = async (param, body) => {
    // Ubah list jadi object
    const requestVariant = body.variants.map((variant) => ({
        product_id: param.productId,
        colour_id: variant.colour_id,
        size: variant.size,
        stock: variant.stock,
        reserved_stock: variant.reserved_stock,
        price: variant.price,
    }));

    // Response dengan jumlah rownya
    const [insertMany] = await db.insert(productVariants).values(requestVariant);
    const response = { count: insertMany.affectedRows };

    return response;
};

// Lihat all products dengan filter search
const getProduct = async (query) => {
    // Deconstruct object dan isi default value
    const { search, gender, category, sortBy = "created_at", order = "desc", limit = "10", page = "1" } = query;

    // Isi kriteria query secara dinamis
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

    // Query tanpa where
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

    const meta = {
        page: page,
        page_size: limit,
        total_items: totalItems,
        total_pages: totalPages,
    };
    
    // Response data
    if (limit && offset) {
        queries = queries.limit(parseInt(limit));
        queries = queries.offset(parseInt(offset));
    }

    const response = await queries;

    return [response, meta];
};

// Lihat detail dari satu product
const getProductId = async (param) => {
    // Lihat products lengkap dengan relasinya untuk lihat detail foto dan stock
    const response = await db.query.products.findFirst({
        where: eq(products.id, param.productId),
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

// Cek detail harga, stock, dan warna dari tiap product_variants
const getProductVariantId = async (param) => {
    // Untuk kebutuhan cart & submit order
    const response = await db.query.productVariants.findFirst({
        where: and(eq(productVariants.id, param.variantId), eq(productVariants.product_id, param.productId)),
        columns: {
            id: true,
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
    getProductVariantId,
};
