import { and, eq, gt } from "drizzle-orm";
import { userSessions, users } from "../app/db-schema.js";
import { db } from "../app/db.js";
import bcrypt from "bcrypt";
import { signToken, validate } from "../util/utility.js";
import { loginValidation } from "../validation/usersession-validation.js";
import { ResponseError } from "../error/response-error.js";

// Buat session baru alias login
const postSession = async (body) => {
    // Validasi input dari request
    const request = validate(loginValidation, body);

    // Cek username beneran ada ga
    const [usernameExist] = await db
        .select({
            id: users.id,
            username: users.username,
            password: users.password,
        })
        .from(users)
        .where(eq(users.username, request.username));
    if (!usernameExist) throw new ResponseError(400, "Username or password wrong");

    // Cek password bener ga
    const isValidPassword = await bcrypt.compare(request.password, usernameExist.password);
    if (!isValidPassword) throw new ResponseError(400, "Username or password wrong");

    // Buatkan refresh & access token
    const refreshToken = await signToken(usernameExist, "refresh");
    const accessToken = await signToken(usernameExist, "access");

    // Insert ke table user_sessions
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

// Lihat session yang aktif sekarang
const getSession = async (body) => {
    const result = await db
        .select({
            id: userSessions.id,
            user_id: userSessions.user_id,
            user_agent: userSessions.user_agent,
            ip_address: userSessions.ip_address,
            is_active: userSessions.is_active,
        })
        .from(userSessions)
        .where(
            and(
                eq(userSessions.user_id, body.user_id),
                eq(userSessions.is_active, 1),
                gt(userSessions.expires_at, new Date(Date.now() + 7 * 60 * 60 * 1000))
            )
        );

    return result;
};

// Refresh token baru kalau access token sudah habis
const postSessionRefresh = async (header, body) => {
    // Ambil token dari header untuk dimatch ke table
    const requestRefreshToken = header["authorization"]?.split(" ")[1];

    // Cek refresh token masih valid di table apa ga
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

    // Buatkan refresh & access yang baru
    const newAccessToken = await signToken(body, "access");
    const newRefreshToken = await signToken(body, "refresh");

    // Set token yang lama jadi inactive di table
    await db.update(userSessions).set({ is_active: 0 }).where(eq(userSessions.refresh_token, requestRefreshToken));

    // Insert ke table user_sessions dan response tokennya
    const [insertId] = await db
        .insert(userSessions)
        .values({
            user_id: body.user_id,
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

// Logout atau hapus session yang aktif sekarang
const deleteSession = async (header) => {
    // Ambil refresh token dari header untuk dimatch ke table
    const requestRefreshToken = header["authorization"]?.split(" ")[1];

    // Cek refresh token masih valid di table apa ga
    const [isValidRefreshToken] = await db
        .select()
        .from(userSessions)
        .where(eq(userSessions.refresh_token, requestRefreshToken));

    if (!isValidRefreshToken) throw new ResponseError(401, "Refresh token invalid");

    // Set token jadi inactive
    await db.update(userSessions).set({ is_active: 0 }).where(eq(userSessions.refresh_token, requestRefreshToken));

    const [response] = await db
        .select({ user_id: userSessions.user_id })
        .from(userSessions)
        .where(eq(userSessions.refresh_token, requestRefreshToken));

    return response;
};

// Logout semua session aktif user
const deleteSessionAll = async (body) => {
    // Set inactive berdasarkan user_id
    await db.update(userSessions).set({ is_active: 0 }).where(eq(userSessions.user_id, body.user_id));

    const [response] = await db
        .select({ user_id: userSessions.user_id })
        .from(userSessions)
        .where(eq(userSessions.user_id, body.user_id));

    return response;
};

export default {
    postSession,
    getSession,
    postSessionRefresh,
    deleteSession,
    deleteSessionAll,
};
