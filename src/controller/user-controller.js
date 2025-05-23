import userService from "../service/user-service.js";

const postUser = async (req, res, next) => {
    try {
        const response = await userService.postUser(req.body);

        res.status(200).json({
            data: response,
            message: "Register success",
        });
    } catch (e) {
        next(e);
    }
};

const getUserVerif = async (req, res, next) => {
    try {
        const response = await userService.getUserVerif(req.params);

        res.status(200).json({
            data: response,
            message: "Verification success",
        });
    } catch (e) {
        next(e);
    }
};

const patchUser = async (req, res, next) => {
    try {
        const response = await userService.patchUser(req.body);

        res.status(200).json({
            data: response,
        });
    } catch (e) {
        next(e);
    }
};

const getUserProfile = async (req, res, next) => {
    try {
        const response = await userService.getUserProfile(req.body);

        res.status(200).json({
            data: response,
        });
    } catch (e) {
        next(e);
    }
};

const patchUserProfile = async (req, res, next) => {
    try {
        const response = await userService.patchUserProfile(req.body);

        res.status(200).json({
            data: response,
        });
    } catch (e) {
        next(e);
    }
};

const postUserAvatar = async (req, res, next) => {
    try {
        const response = await userService.postUserAvatar(req.file, req.authBody);

        res.status(200).json({
            data: response,
            message: "Upload avatar success",
        });
    } catch (e) {
        next(e);
    }
};

const postUserAddress = async (req, res, next) => {
    try {
        const response = await userService.postUserAddress(req.body);

        res.status(200).json({
            data: response,
            message: "Create address success",
        });
    } catch (e) {
        next(e);
    }
};

const getUserAddress = async (req, res, next) => {
    try {
        const response = await userService.getUserAddress(req.body);

        res.status(200).json({
            data: response,
        });
    } catch (e) {
        next(e);
    }
};

const getUserAddressId = async (req, res, next) => {
    try {
        const response = await userService.getUserAddressId(req.params, req.body);

        res.status(200).json({
            data: response,
        });
    } catch (e) {
        next(e);
    }
};

const patchUserAddressId = async (req, res, next) => {
    try {
        const response = await userService.patchUserAddressId(req.params, req.body);

        res.status(200).json({
            data: response,
        });
    } catch (e) {
        next(e);
    }
};

const deleteUserAddressId = async (req, res, next) => {
    try {
        const response = await userService.deleteUserAddressId(req.params, req.body);

        res.status(200).json({
            data: response,
            message: "Delete success",
        });
    } catch (e) {
        next(e);
    }
};

export default {
    postUser,
    getUserVerif,
    patchUser,
    getUserProfile,
    patchUserProfile,
    postUserAvatar,
    postUserAddress,
    getUserAddress,
    getUserAddressId,
    patchUserAddressId,
    deleteUserAddressId,
};
