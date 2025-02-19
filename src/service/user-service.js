import { db } from "../app/db.js";
import bcrypt from "bcrypt";
import { users, userProfiles, userAddresses } from "../app/db-schema.js";
import { validate } from "../util/utility.js";
import { registerValidation } from "../validation/user-validation.js";
import { ResponseError } from "../error/response-error.js";
import { eq, and } from "drizzle-orm";

const postUser = async (body) => {
    const request = validate(registerValidation, body);

    const [usernameExist] = await db
        .select({
            id: users.id,
        })
        .from(users)
        .where(eq(users.username, request.username));
    const [emailExists] = await db
        .select({
            id: users.id,
        })
        .from(users)
        .where(eq(users.email, request.email));

    if (usernameExist && emailExists)
        throw new ResponseError(400, `${request.username} and ${request.email} already exist`);
    if (usernameExist) throw new ResponseError(400, `${request.username} already exist`);
    if (emailExists) throw new ResponseError(400, `${request.email} already exist`);

    request.password = await bcrypt.hash(request.password, 10);
    const [response] = await db.insert(users).values(request).$returningId();
    await db.insert(userProfiles).values({ user_id: response.id });

    return response;
};

const getUserProfile = async (body) => {
    const [response] = await db
        .select
        // Tambahin kolom, jangan semua diambil
        ()
        .from(userProfiles)
        .where(eq(userProfiles.user_id, body.user_id));

    if (!response) throw new ResponseError(404, "User not found");

    return response;
};

const patchUserProfile = async (body) => {
    await db
        .update(userProfiles)
        .set({
            avatar: body.avatar,
            full_name: body.full_name,
            gender: body.gender,
            birthdate: body.birthdate,
        })
        .where(eq(userProfiles.user_id, body.user_id));

    const [response] = await db
        .select
        // Tambahin kolom, jangan semua diambil
        ()
        .from(userProfiles)
        .where(eq(userProfiles.user_id, body.user_id));

    return response;
};

const postUserAddress = async (body) => {
    const [defaultExisting] = await db
        .select()
        .from(userAddresses)
        .where(and(eq(userAddresses.user_id, body.user_id), eq(userAddresses.is_default, 1)));

    if (!defaultExisting) body.is_default = 1;

    if (body.is_default === 1)
        await db.update(userAddresses).set({ is_default: 0 }).where(eq(userAddresses.user_id, body.user_id));

    const [response] = await db
        .insert(userAddresses)
        .values({
            user_id: body.user_id,
            name: body.name,
            phone: body.phone,
            address: body.address,
            postal_code: body.postal_code,
            district: body.district,
            city: body.city,
            province: body.province,
            notes: body.notes,
            is_default: body.is_default,
            flag: body.flag,
        })
        .$returningId();

    return response;
};

export default {
    postUser,
    getUserProfile,
    patchUserProfile,
    postUserAddress,
};
