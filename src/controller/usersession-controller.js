import usersessionService from "../service/usersession-service.js";

const postSession = async (req, res, next) => {
    try {
        req.body.userAgent = req.headers["user-agent"];
        req.body.ipAddress = req.ip;

        const result = await usersessionService.postSession(req.body);

        res.cookie("refresh_token", result.refresh_token, {
            httpOnly: true,
            // secure: process.env.NODE_ENV === 'production',
            secure: true,
            sameSite: "Strict",
            maxAge: 48 * 60 * 60 * 1000, // Expired 48 jam di cookie
        });

        res.status(200).json({
            data: result,
        });
    } catch (e) {
        next(e);
    }
};

const postSessionRefresh = async (req, res, next) => {
    try {
        req.body.userAgent = req.headers["user-agent"];
        req.body.ipAddress = req.ip;

        const result = await usersessionService.postSessionRefresh(req.headers, req.body);

        res.cookie("refresh_token", result.refresh_token, {
            httpOnly: true,
            // secure: process.env.NODE_ENV === 'production',
            secure: true,
            sameSite: "Strict",
            maxAge: 48 * 60 * 60 * 1000, // Expired 48 jam di cookie
        });

        res.status(200).json({
            data: result,
        });
    } catch (e) {
        next(e);
    }
};

const deleteSession = async (req, res, next) => {
    try {
        const result = await usersessionService.deleteSession(req.headers, req.body);

        res.clearCookie("refresh_token");
        // Hapus accesstoken di frontend
        res.status(200).json({
            data: result,
            message: "Logout success",
        });
    } catch (e) {
        next(e);
    }
};

const deleteSessionAll = async (req, res, next) => {
    try {
        const result = await usersessionService.deleteSessionAll(req.body);

        res.clearCookie("refresh_token");
        // Hapus accesstoken di frontend
        res.status(200).json({
            data: result,
            message: "Logout success",
        });
    } catch (e) {
        next(e);
    }
};

export default {
    postSession,
    postSessionRefresh,
    deleteSession,
    deleteSessionAll,
};
