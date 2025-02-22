import sessionService from "../service/session-service.js";

const postSession = async (req, res, next) => {
    try {
        req.body.userAgent = req.headers["user-agent"];
        req.body.ipAddress = req.ip;

        const response = await sessionService.postSession(req.body);

        res.cookie("refresh_token", response.refresh_token, {
            httpOnly: true,
            // secure: process.env.NODE_ENV === 'production',
            secure: true,
            sameSite: "Strict",
            maxAge: 720 * 60 * 60 * 1000, // Expired 720 jam di cookie
        });

        res.status(200).json({
            data: response,
        });
    } catch (e) {
        next(e);
    }
};

const getSession = async (req, res, next) => {
    try {
        const response = await sessionService.getSession(req.body);

        res.status(200).json({
            data: response,
        });
    } catch (e) {
        next(e);
    }
};

const postSessionRefresh = async (req, res, next) => {
    try {
        req.body.userAgent = req.headers["user-agent"];
        req.body.ipAddress = req.ip;

        const response = await sessionService.postSessionRefresh(req.headers, req.body);

        res.cookie("refresh_token", response.refresh_token, {
            httpOnly: true,
            // secure: process.env.NODE_ENV === 'production',
            secure: true,
            sameSite: "Strict",
            maxAge: 720 * 60 * 60 * 1000, // Expired 720 jam di cookie
        });

        res.status(200).json({
            data: response,
        });
    } catch (e) {
        next(e);
    }
};

const deleteSession = async (req, res, next) => {
    try {
        const response = await sessionService.deleteSession(req.headers, req.body);

        res.clearCookie("refresh_token");
        // Hapus accesstoken di frontend
        res.status(200).json({
            data: response,
            message: "Logout success",
        });
    } catch (e) {
        next(e);
    }
};

const deleteSessionAll = async (req, res, next) => {
    try {
        const response = await sessionService.deleteSessionAll(req.body);

        res.clearCookie("refresh_token");
        // Hapus accesstoken di frontend
        res.status(200).json({
            data: response,
            message: "Logout success",
        });
    } catch (e) {
        next(e);
    }
};

export default {
    postSession,
    getSession,
    postSessionRefresh,
    deleteSession,
    deleteSessionAll,
};
