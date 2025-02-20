import userService from "../service/user-service.js";

const postUser = async (req, res, next) => {
    try {
        const result = await userService.postUser(req.body);

        res.status(200).json({
            data: result,
        });
    } catch (e) {
        next(e);
    }
};

const getUserProfile = async (req, res, next) => {
    try {
        const result = await userService.getUserProfile(req.body);

        res.status(200).json({
            data: result,
        });
    } catch (e) {
        next(e);
    }
};

const patchUserProfile = async (req, res, next) => {
    try {
        const result = await userService.patchUserProfile(req.body);

        res.status(200).json({
            data: result,
        });
    } catch (e) {
        next(e);
    }
};

const postUserAddress = async (req, res, next) => {
    try {
        const result = await userService.postUserAddress(req.body);

        res.status(200).json({
            data: result,
        });
    } catch (e) {
        next(e);
    }
};

const getUserAddress = async (req, res, next) => {
    try {
        const result = await userService.getUserAddress(req.body);

        res.status(200).json({
            data: result,
        });
    } catch (e) {
        next(e);
    }
};

const getUserAddressId = async (req, res, next) => {
    try {
        const result = await userService.getUserAddressId(req.params, req.body);

        res.status(200).json({
            data: result,
        });
    } catch (e) {
        next(e);
    }
};

export default {
    postUser,
    getUserProfile,
    patchUserProfile,
    postUserAddress,
    getUserAddress,
    getUserAddressId,
};
