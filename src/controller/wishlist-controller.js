import wishlistService from "../service/wishlist-service.js";

const postWishlist = async (req, res, next) => {
    try {
        const response = await wishlistService.postWishlist(req.params, req.body);

        res.status(200).json({
            data: response,
        });
    } catch (e) {
        next(e);
    }
};

const getWishlist = async (req, res, next) => {
    try {
        const response = await wishlistService.getWishlist(req.params, req.body);

        res.status(200).json({
            data: response,
        });
    } catch (e) {
        next(e);
    }
};

const getAllWishlist = async (req, res, next) => {
    try {
        const [response, meta] = await wishlistService.getAllWishlist(req.query, req.body);

        res.status(200).json({
            meta: meta,
            data: response,
        });
    } catch (e) {
        next(e);
    }
};

export default {
    postWishlist,
    getWishlist,
    getAllWishlist,
};
