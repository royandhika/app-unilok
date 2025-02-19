import { verifyToken } from "../util/utility.js";

const authMiddleware = async (req, res, next) => {
    const accessToken = req.headers["authorization"]?.split(" ")[1];

    const payload = await verifyToken(accessToken);

    if (!payload) {
        res.status(401)
            .json({
                errors: "Unauthorized",
            })
            .end();
    } else {
        (req.body.user_id = payload.id), (req.body.username = payload.username);
        next();
    }
};

export { authMiddleware };
