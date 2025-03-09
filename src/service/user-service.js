import { db } from "../app/db.js";
import bcrypt from "bcrypt";
import { users, userProfiles, userAddresses } from "../app/db-schema.js";
import { signToken, validate, verifEmail, verifyToken } from "../util/utility.js";
import { patchUserValidation, postUserValidation } from "../validation/user-validation.js";
import { ResponseError } from "../error/response-error.js";
import { eq, and, ne } from "drizzle-orm";
import "dotenv/config";
const imgDomain = process.env.IMG_DOM;

// Buat user baru
const postUser = async (body) => {
    // Validasi input data dari request
    const request = validate(postUserValidation, body);

    // Cek existing data, jangan sampe sama
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

    // Hash password
    request.password = await bcrypt.hash(request.password, 10);
    // Insert ke users
    const [insertUser] = await db.insert(users).values(request).$returningId();
    // Otomatis buat di user_profiles juga
    await db.insert(userProfiles).values({ user_id: insertUser.id });

    // Buat response
    const [response] = await db
        .select({
            id: users.id,
            username: users.username,
            email: users.email,
        })
        .from(users)
        .where(eq(users.id, insertUser.id));

    const token = await signToken(response, "verif");
    verifEmail(response.email, token);

    return response;
};

const getUserVerif = async (param) => {
    // Verif token
    const payload = await verifyToken(param);

    if (!payload) throw new ResponseError(401, "Unauthorized");

    // Update verified_email
    await db
        .update(users)
        .set({
            verified_email: 1,
        })
        .where(eq(users.id, payload.user_id));

    // Response balik data users
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

// Update email atau no hp di users
const patchUser = async (body) => {
    // Validasi input data dari request
    const request = validate(patchUserValidation, body);

    // Kalau isinya email, update emailnya
    if (request.email) {
        // Cek ada email yang sama ga
        const [emailExist] = await db.select().from(users).where(eq(users.email, request.email));

        if (emailExist) throw new ResponseError(400, `${request.email} already exist`);

        await db.update(users).set({
            email: request.email,
            verified_email: 0,
        });
    }

    // Kalau ada no hp juga diupdate
    if (request.phone) {
        // Cek ada phone yang sama ga
        const [phoneExist] = await db.select().from(users).where(eq(users.phone, request.phone));

        if (phoneExist) throw new ResponseError(400, `${request.phone} already exist`);

        await db
            .update(users)
            .set({
                phone: request.phone,
                verified_phone: 0,
            })
            .where(eq(users.id, request.user_id));
    }

    // Response balik data users
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

// Lihat isi user_profiles
const getUserProfile = async (body) => {
    // Kelengkapan users dan user_profiles untuk keperluan frontend
    const [response] = await db
        .select({
            id: userProfiles.id,
            user_id: userProfiles.user_id,
            username: users.username,
            email: users.email,
            verified_email: users.verified_email,
            phone: users.phone,
            verified_phone: users.verified_phone,
            avatar: userProfiles.avatar,
            full_name: userProfiles.full_name,
            birthdate: userProfiles.birthdate,
            gender: userProfiles.gender,
        })
        .from(userProfiles)
        .leftJoin(users, eq(userProfiles.user_id, users.id))
        .where(eq(userProfiles.user_id, body.user_id));

    if (!response) throw new ResponseError(404, "User not found");

    // Tambah domain di response
    response.avatar = `${imgDomain}${response.avatar}`;

    return response;
};

// Update kelengkapan user_profiles
const patchUserProfile = async (body) => {
    // Update table user_profiles
    await db
        .update(userProfiles)
        .set({
            avatar: body.avatar,
            full_name: body.full_name,
            gender: body.gender,
            birthdate: body.birthdate,
        })
        .where(eq(userProfiles.user_id, body.user_id));

    // Response data user_profiles dengan kelengkapan dari users juga
    const [response] = await db
        .select({
            id: userProfiles.id,
            user_id: userProfiles.user_id,
            username: users.username,
            email: users.email,
            verified_email: users.verified_email,
            phone: users.phone,
            verified_phone: users.verified_phone,
            avatar: userProfiles.avatar,
            full_name: userProfiles.full_name,
            birthdate: userProfiles.birthdate,
            gender: userProfiles.gender,
        })
        .from(userProfiles)
        .leftJoin(users, eq(userProfiles.user_id, users.id))
        .where(eq(userProfiles.user_id, body.user_id));

    // Tambah domain di response
    response.avatar = `${imgDomain}${response.avatar}`;

    return response;
};

// Upload avatar
const postUserAvatar = async (file, body) => {
    // Simpan nama file ke db
    await db
        .update(userProfiles)
        .set({ avatar: `avatar/${file.filename}` })
        .where(eq(userProfiles.user_id, body.user_id));

    // Buat response link avatar
    const [response] = await db
        .select({ avatar: userProfiles.avatar })
        .from(userProfiles)
        .where(eq(userProfiles.user_id, body.user_id));

    // Tambah domain di response
    response.avatar = `${imgDomain}${response.avatar}`;

    return response;
};

// Buat address baru
const postUserAddress = async (body) => {
    // Cek apakah sudah punya default address sebelumnya
    const [defaultExisting] = await db
        .select()
        .from(userAddresses)
        .where(
            and(
                eq(userAddresses.user_id, body.user_id),
                eq(userAddresses.is_default, 1),
                eq(userAddresses.is_hidden, 0)
            )
        );

    // Kalau belum, otomatis yang baru akan jadi default
    if (!defaultExisting) body.is_default = 1;

    // Kalau sudah ada default dan yang baru juga default, ubah yang lama jadi 0
    if (body.is_default === 1)
        await db.update(userAddresses).set({ is_default: 0 }).where(eq(userAddresses.user_id, body.user_id));

    // Insert ke table
    const [insertOne] = await db
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

    const [response] = await db
        .select({
            id: userAddresses.id,
            name: userAddresses.name,
            phone: userAddresses.phone,
            address: userAddresses.address,
            flag: userAddresses.flag,
            is_default: userAddresses.is_default,
        })
        .from(userAddresses)
        .where(eq(userAddresses.id, insertOne.id));

    return response;
};

// Lihat semua user_addresses
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
        .where(and(eq(userAddresses.user_id, body.user_id), eq(userAddresses.is_hidden, 0)));

    return response;
};

// Lihat detail address ketika dipilih salah satu
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
        .where(
            and(
                eq(userAddresses.user_id, body.user_id),
                eq(userAddresses.id, param.addressId),
                eq(userAddresses.is_hidden, 0)
            )
        );

    if (!response) throw new ResponseError(404, "Address not found");

    return response;
};

// Update info address
const patchUserAddressId = async (param, body) => {
    // Cek ada di table ga
    const [addressExist] = await db
        .select()
        .from(userAddresses)
        .where(
            and(
                eq(userAddresses.id, param.addressId),
                eq(userAddresses.user_id, body.user_id),
                eq(userAddresses.is_hidden, 0)
            )
        );

    if (!addressExist) throw new ResponseError(404, "Address not found");

    // Cek apakah sudah punya default address selain yang diedit
    const [defaultExisting] = await db
        .select()
        .from(userAddresses)
        .where(
            and(
                eq(userAddresses.user_id, body.user_id),
                eq(userAddresses.is_default, 1),
                ne(userAddresses.id, param.addressId),
                eq(userAddresses.is_hidden, 0)
            )
        );

    // Kalau belum, otomatis yang baru akan jadi default
    if (!defaultExisting) body.is_default = 1;

    // Kalau sudah ada default dan yang baru juga default, ubah yang lama jadi 0
    if (body.is_default === 1)
        await db.update(userAddresses).set({ is_default: 0 }).where(eq(userAddresses.user_id, body.user_id));

    // Update value dan return
    await db
        .update(userAddresses)
        .set({
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
        .where(and(eq(userAddresses.user_id, body.user_id), eq(userAddresses.id, param.addressId)));

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
        .where(and(eq(userAddresses.user_id, body.user_id), eq(userAddresses.id, param.addressId)));

    return response;
};

// Hapus address
const deleteUserAddressId = async (param, body) => {
    // Cek ada di table ga
    const [addressExist] = await db
        .select()
        .from(userAddresses)
        .where(
            and(
                eq(userAddresses.id, param.addressId),
                eq(userAddresses.user_id, body.user_id),
                eq(userAddresses.is_hidden, 0)
            )
        );

    if (!addressExist) throw new ResponseError(404, "Address not found");

    // Kalau yang dihapus ini default, lempar defaultnya ke next (random) address (kalau ada)
    if (addressExist.is_default === 1) {
        const [randomExisting] = await db
            .select()
            .from(userAddresses)
            .where(
                and(
                    eq(userAddresses.user_id, body.user_id),
                    eq(userAddresses.is_hidden, 0),
                    ne(userAddresses.id, param.addressId)
                )
            )
            .limit(1);

        // Kalau ada, jadiin default, kalo gaada yasudah
        if (randomExisting) {
            await db.update(userAddresses).set({ is_default: 1 }).where(eq(userAddresses.id, randomExisting.id));
        }
        await db.update(userAddresses).set({ is_default: 0 }).where(eq(userAddresses.id, param.addressId));
    }

    // Soft delete
    await db.update(userAddresses).set({ is_hidden: 1 }).where(eq(userAddresses.id, param.addressId));

    // Buat response
    const response = { id: parseInt(param.addressId), user_id: body.user_id };

    return response;
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
