import orderService from "../service/order-service.js";

const postOrder = async (req, res, next) => {
    try {
        await orderService.postOrder(req.body);

        res.status(200).json({
            message: "Order created successfully",
        });
    } catch (e) {
        next(e);
    }
};

const getOrder = async (req, res, next) => {
    try {
        const response = await orderService.getOrder(req.body);

        res.status(200).json({
            data: response,
        });
    } catch (e) {
        next(e);
    }
};

const getOrderId = async (req, res, next) => {
    try {
        const response = await orderService.getOrderId(req.params, req.body);

        res.status(200).json({
            data: response,
        });
    } catch (e) {
        next(e);
    }
};

const patchOrder = async (req, res, next) => {
    try {
        const response = await orderService.patchOrder(req.params, req.body);

        res.status(200).json({
            data: response,
        });
    } catch (e) {
        next(e);
    }
};

export default {
    postOrder,
    getOrder,
    getOrderId,
    patchOrder,
};
