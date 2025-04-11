import orderService from "../service/order-service.js";

const getShippingCost = async (req, res, next) => {
    try {
        const response = await orderService.getShippingCost(req.body);

        res.status(200).json({
            data: response,
        });
    } catch (e) {
        next(e);
    }
};

const postOrder = async (req, res, next) => {
    try {
        const response = await orderService.postOrder(req.body);

        res.status(200).json({
            message: "Order created successfully",
            data: response,
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
    getShippingCost,
    postOrder,
    getOrder,
    getOrderId,
    patchOrder,
};
