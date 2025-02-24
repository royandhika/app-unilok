import productService from "../service/product-service.js";

const postColour = async (req, res, next) => {
    try {
        const response = await productService.postColour(req.body);

        res.status(200).json({
            data: response,
            message: "Submit colour(s) success",
        });
    } catch (e) {
        next(e);
    }
};

const postProduct = async (req, res, next) => {
    try {
        const response = await productService.postProduct(req.body);

        res.status(200).json({
            data: response,
            message: "Submit product success",
        });
    } catch (e) {
        next(e);
    }
};

const postProductImage = async (req, res, next) => {
    try {
        const response = await productService.postProductImage(req.params, req.body);

        res.status(200).json({
            data: response,
            message: "Submit product image(s) success",
        });
    } catch (e) {
        next(e);
    }
};

const postProductVariant = async (req, res, next) => {
    try {
        const response = await productService.postProductVariant(req.params, req.body);

        res.status(200).json({
            data: response,
            message: "Submit product variant(s) success",
        });
    } catch (e) {
        next(e);
    }
};

const getProduct = async (req, res, next) => {
    try {
        const [response, meta] = await productService.getProduct(req.query);

        res.status(200).json({
            meta: meta,
            data: response,
        });
    } catch (e) {
        next(e);
    }
};

const getProductId = async (req, res, next) => {
    try {
        const response = await productService.getProductId(req.params);

        res.status(200).json({
            data: response,
        });
    } catch (e) {
        next(e);
    }
};

const getProductVariantId = async (req, res, next) => {
    try {
        const response = await productService.getProductVariantId(req.params);

        res.status(200).json({
            data: response,
        });
    } catch (e) {
        next(e);
    }
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
