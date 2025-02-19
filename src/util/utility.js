import { ResponseError } from "../error/response-error.js";
import jwt from "jsonwebtoken";
import "dotenv/config";
const jwtKey = process.env.JWT_SECRET_KEY;

const validate = (schema, request) => {
    const result = schema.validate(request, {
        abortEarly: false,
    });
    if (result.error) {
        let errorMessage = result.error.message;
        errorMessage = errorMessage.replace(/['"]/g, "");
        errorMessage = errorMessage.charAt(0).toUpperCase() + errorMessage.slice(1);

        throw new ResponseError(400, errorMessage);
    } else {
        return result.value;
    }
};

const signToken = async (payload, type) => {
    const expiresIn = type === "refresh" ? "48h" : type === "access" ? "5m" : undefined;

    // Payloadnya butuh id & username
    const token = jwt.sign(
        {
            id: payload.id,
            username: payload.username,
        },
        jwtKey,
        {
            expiresIn: expiresIn,
        }
    );

    return token;
};

const verifyToken = async (token) => {
    try {
        const payload = jwt.verify(token, jwtKey);
        return payload;
    } catch {
        const payload = undefined;
        return payload;
    }
};

export { validate, signToken, verifyToken };
