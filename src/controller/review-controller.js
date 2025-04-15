import reviewService from "../service/review-service.js";

const postReview = async (req, res, next) => {
    try {
        const response = await reviewService.postReview(req.params, req.body);

        res.status(200).json({
            message: "Review created successfully",
            data: response,
        });
    } catch (e) {
        next(e);
    }
};

const getReviewByProduct = async (req, res, next) => {
    try {
        const response = await reviewService.getReviewByProduct(req.params);

        res.status(200).json({
            data: response,
        });
    } catch (e) {
        next(e);
    }
};

export default {
    postReview,
    getReviewByProduct,
};
