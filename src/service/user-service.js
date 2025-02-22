import { db } from "../app/db.js";
import bcrypt from "bcrypt";
import { users, userProfiles, userAddresses } from "../app/db-schema.js";
import { validate } from "../util/utility.js";
import { patchUserValidation, postUserValidation } from "../validation/user-validation.js";
import { ResponseError } from "../error/response-error.js";
import { eq, and } from "drizzle-orm";

const postUser = async (body) => {
    const request = validate(postUserValidation, body);

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

const patchUser = async (body) => {
    const request = validate(patchUserValidation, body);

    if (request.email) {
        await db
            .update(users)
            .set({
                email: request.email,
                verified_email: 0,
            })
            .where(eq(users.id, request.user_id));
    }

    if (request.phone) {
        await db
            .update(users)
            .set({
                phone: request.phone,
                verified_phone: 0,
            })
            .where(eq(users.id, request.user_id));
    }

    const [response] = await db
        .select({
            id: users.id,
            username: users.username,
            email: users.email,
            verified_email: users.verified_email,
            phone: users.phone,
            verified_phone: users.verified_phone,
        })
        .from(users)
        .where(eq(users.id, request.user_id));

    return response;
};

const getUserProfile = async (body) => {
    const [response] = await db
        .select({
            id: userProfiles.id,
            user_id: userProfiles.user_id,
            username: users.username,
            avatar: userProfiles.avatar,
            full_name: userProfiles.full_name,
            birthdate: userProfiles.birthdate,
            gender: userProfiles.gender,
        })
        .from(userProfiles)
        .leftJoin(users, eq(userProfiles.user_id, users.id))
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
        .select({
            id: userProfiles.id,
            user_id: userProfiles.user_id,
            avatar: userProfiles.avatar,
            full_name: userProfiles.full_name,
            birthdate: userProfiles.birthdate,
            gender: userProfiles.gender,
        })
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

const getUserAddress = async (body) => {
    const response = await db
        .select({
            id: userAddresses.id,
            user_id: userAddresses.user_id,
            name: userAddresses.name,
            phone: userAddresses.phone,
            address: userAddresses.address,
            postal_code: userAddresses.postal_code,
            district: userAddresses.district,
            city: userAddresses.city,
            province: userAddresses.province,
            notes: userAddresses.notes,
            is_default: userAddresses.is_default,
            flag: userAddresses.flag,
        })
        .from(userAddresses)
        .where(eq(userAddresses.user_id, body.user_id));

    return response;
};

const getUserAddressId = async (param, body) => {
    const [response] = await db
        .select({
            id: userAddresses.id,
            user_id: userAddresses.user_id,
            name: userAddresses.name,
            phone: userAddresses.phone,
            address: userAddresses.address,
            postal_code: userAddresses.postal_code,
            district: userAddresses.district,
            city: userAddresses.city,
            province: userAddresses.province,
            notes: userAddresses.notes,
            is_default: userAddresses.is_default,
            flag: userAddresses.flag,
        })
        .from(userAddresses)
        .where(and(eq(userAddresses.user_id, body.user_id), eq(userAddresses.id, param.id)));

    if (!response) throw new ResponseError(404, "Address not found");

    return response;
};

export default {
    postUser,
    patchUser,
    getUserProfile,
    patchUserProfile,
    postUserAddress,
    getUserAddress,
    getUserAddressId,
};
