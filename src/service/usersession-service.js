import { and, eq } from "drizzle-orm";
import { userSessions, users } from "../app/db-schema.js";
import { db } from "../app/db.js";
import bcrypt from "bcrypt";
import { signToken, validate, verifyToken } from "../util/utility.js";
import { loginValidation } from "../validation/usersession-validation.js";
import { ResponseError } from "../error/response-error.js";

const postSession = async (body) => {
    const request = validate(loginValidation, body);

    const [usernameExist] = await db
        .select({
            id: users.id,
            username: users.username,
            password: users.password,
        })
        .from(users)
        .where(eq(users.username, request.username));
    if (!usernameExist) throw new ResponseError(400, "Username or password wrong");

    const isValidPassword = await bcrypt.compare(request.password, usernameExist.password);
    if (!isValidPassword) throw new ResponseError(400, "Username or password wrong");

    const refreshToken = await signToken(usernameExist, "refresh");
    const accessToken = await signToken(usernameExist, "access");

    const [insertId] = await db
        .insert(userSessions)
        .values({
            user_id: usernameExist.id,
            refresh_token: refreshToken,
            user_agent: request.userAgent,
            ip_address: request.ipAddress,
            is_active: 1,
        })
        .$returningId();

    const [response] = await db
        .select({
            id: userSessions.id,
            user_id: userSessions.user_id,
            refresh_token: userSessions.refresh_token,
        })
        .from(userSessions)
        .where(eq(userSessions.id, insertId.id));

    response.access_token = accessToken;

    return response;
};

const postSessionRefresh = async (header, body) => {
    // const requestUsername = cookie.refresh_token
    //     ? await verifyToken(cookie.refresh_token)
    //     : await verifyToken(body.refresh_token);
    // const requestRefreshToken = cookie.refresh_token ? cookie.refresh_token : body.refresh_token;

    // if (!requestUsername) throw new ResponseError(401, "Refresh token invalid");
    const requestRefreshToken = header["authorization"]?.split(" ")[1];
    body.id = body.user_id;

    const [isValidRefreshToken] = await db
        .select({
            user_id: userSessions.user_id,
        })
        .from(userSessions)
        .where(
            and(
                eq(userSessions.user_id, body.user_id),
                eq(userSessions.refresh_token, requestRefreshToken),
                eq(userSessions.is_active, 1)
            )
        );

    if (!isValidRefreshToken) throw new ResponseError(401, "Refresh token invalid");

    const newAccessToken = await signToken(body, "access");
    const newRefreshToken = await signToken(body, "refresh");

    await db.update(userSessions).set({ is_active: 0 }).where(eq(userSessions.refresh_token, requestRefreshToken));

    const [insertId] = await db
        .insert(userSessions)
        .values({
            user_id: body.id,
            refresh_token: newRefreshToken,
            user_agent: body.userAgent,
            ip_address: body.ipAddress,
            is_active: 1,
        })
        .$returningId();

    const [response] = await db
        .select({
            id: userSessions.id,
            user_id: userSessions.user_id,
            refresh_token: userSessions.refresh_token,
        })
        .from(userSessions)
        .where(eq(userSessions.id, insertId.id));

    response.access_token = newAccessToken;

    return response;
};

const deleteSession = async (header, body) => {
    const requestRefreshToken = header["authorization"]?.split(" ")[1];

    const [isValidRefreshToken] = await db
        .select()
        .from(userSessions)
        .where(eq(userSessions.refresh_token, requestRefreshToken));

    if (!isValidRefreshToken) throw new ResponseError(401, "Refresh token invalid");

    await db.update(userSessions).set({ is_active: 0 }).where(eq(userSessions.refresh_token, requestRefreshToken));

    const [result] = await db
        .select({ user_id: userSessions.user_id })
        .from(userSessions)
        .where(eq(userSessions.refresh_token, requestRefreshToken));

    return result;
};

const deleteSessionAll = async (body) => {
    await db.update(userSessions).set({ is_active: 0 }).where(eq(userSessions.user_id, body.user_id));

    const [result] = await db
        .select({ user_id: userSessions.user_id })
        .from(userSessions)
        .where(eq(userSessions.user_id, body.user_id));

    return result;
};

export default {
    postSession,
    postSessionRefresh,
    deleteSession,
    deleteSessionAll,
};
