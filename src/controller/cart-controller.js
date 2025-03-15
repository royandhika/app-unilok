import cartService from "../service/cart-service.js";

const postCart = async (req, res, next) => {
    try {
        const response = await cartService.postCart(req.body);

        res.status(200).json({
            data: response,
            message: "Submit cart item success",
        });
    } catch (e) {
        next(e);
    }
};

const getCart = async (req, res, next) => {
    try {
        const response = await cartService.getCart(req.body);

        res.status(200).json({
            data: response,
        });
    } catch (e) {
        next(e);
    }
};

const patchCart = async (req, res, next) => {
    try {
        const response = await cartService.patchCart(req.params, req.body);

        res.status(200).json({
            data: response,
        });
    } catch (e) {
        next(e);
    }
};

const deleteCart = async (req, res, next) => {
    try {
        await cartService.deleteCart(req.params, req.body);

        res.status(200).json({
            message: "Delete cart item success",
        });
    } catch (e) {
        next(e);
    }
};

export default { postCart, getCart, patchCart, deleteCart };
