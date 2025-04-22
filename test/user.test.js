import supertest from "supertest";
import { web } from "../src/app/web.js";
import { db, pool } from "../src/app/db.js";
import { users } from "../src/app/db-schema.js";
import { eq } from "drizzle-orm";

let token;

describe("Public: Register", function () {
    afterEach(async () => {
        await db.delete(users).where(eq(users.username, "usertest-jest"));
    });

    it("Should be able to create new user", async () => {
        const response = await supertest(web).post("/v1/users").send({
            username: "usertest-jest",
            password: "passWord01-testing",
            email: "testJest01@gmail.com",
        });

        expect(response.status).toBe(200);
        expect(response.body.data.id).toBeDefined();
        expect(response.body.data.username).toBe("usertest-jest");
    });

    it("Should not be able to create new user (duplicate)", async () => {
        await supertest(web).post("/v1/users").send({
            username: "usertest-jest",
            password: "passWord01-testing",
            email: "testJest01@gmail.com",
        });

        const response = await supertest(web).post("/v1/users").send({
            username: "usertest-jest",
            password: "passWord01-testing",
            email: "testJest01@gmail.com",
        });

        expect(response.status).toBe(400);
        expect(response.body.errors).toBeDefined();
    });

    it("Should not be able to create new user (wrong format)", async () => {
        const response = await supertest(web).post("/v1/users").send({
            username: "usertest-jest",
            password: "passWord01-testing",
            email: "testJest01@gmailcom",
        });

        expect(response.status).toBe(400);
        expect(response.body.errors).toBeDefined();
    });
});

describe("Public: Login", function () {
    beforeEach(async () => {
        await supertest(web).post("/v1/users").send({
            username: "usertest-jest",
            password: "passWord01-testing",
            email: "testJest01@gmail.com",
        });
    });

    afterEach(async () => {
        await db.delete(users).where(eq(users.username, "usertest-jest"));
    });

    it("Should be able to login user", async () => {
        const response = await supertest(web)
            .post("/v1/users/me/sessions")
            .set("user-agent", "JestTestRunner/1.0 (Node.js; supertest)")
            .send({
                username: "usertest-jest",
                password: "passWord01-testing",
            });

        expect(response.status).toBe(200);
        expect(response.body.data.id).toBeDefined();
        expect(response.body.data.username).toBe("usertest-jest");
        expect(response.body.data.refresh_token).toBeDefined();
        expect(response.body.data.access_token).toBeDefined();
    });

    it("Should not be able to login user (wrong password)", async () => {
        const response = await supertest(web)
            .post("/v1/users/me/sessions")
            .set("user-agent", "JestTestRunner/1.0 (Node.js; supertest)")
            .send({
                username: "usertest-jest",
                password: "wrongpassWord",
            });

        expect(response.status).toBe(400);
        expect(response.body.errors).toBeDefined();
    });
});

describe("Private: User resources", function () {
    beforeEach(async () => {
        await supertest(web).post("/v1/users").send({
            username: "usertest-jest",
            password: "passWord01-testing",
            email: "testJest01@gmail.com",
        });

        const response = await supertest(web)
            .post("/v1/users/me/sessions")
            .set("user-agent", "JestTestRunner/1.0 (Node.js; supertest)")
            .send({
                username: "usertest-jest",
                password: "passWord01-testing",
            });

        token = response.body.data.access_token;
    });

    afterEach(async () => {
        await db.delete(users).where(eq(users.username, "usertest-jest"));
    });

    afterAll(async () => {
        await pool.end();
    });

    it("Should not be able to access private resources (invalid token)", async () => {
        const response = await supertest(web)
            .get("/v1/users/me/profiles")
            .set("authorization", `Bearer some-invalid-token`);

        expect(response.status).toBe(401);
        expect(response.body.errors).toBeDefined();
    });

    it("Should be able to update phone", async () => {
        const response = await supertest(web).patch("/v1/users").set("authorization", `Bearer ${token}`).send({
            phone: "6285921756705",
        });

        expect(response.status).toBe(200);
        expect(response.body.data.id).toBeDefined();
        expect(response.body.data.phone).toBe("6285921756705");
        expect(response.body.data.username).toBe("usertest-jest");
    });

    it("Should be able to update email", async () => {
        const response = await supertest(web).patch("/v1/users").set("authorization", `Bearer ${token}`).send({
            email: "testJest02@gmail.com",
        });

        expect(response.status).toBe(200);
        expect(response.body.data.id).toBeDefined();
        expect(response.body.data.email).toBe("testJest02@gmail.com");
        expect(response.body.data.username).toBe("usertest-jest");
    });

    it("Should be able to get profile data", async () => {
        const response = await supertest(web).get("/v1/users/me/profiles").set("authorization", `Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(response.body.data.id).toBeDefined();
        expect(response.body.data.username).toBe("usertest-jest");
        expect(response.body.data.email).toBeDefined();
        expect(response.body.data.phone).toBeDefined();
        expect(response.body.data.avatar).toBeDefined();
        expect(response.body.data.full_name).toBeDefined();
        expect(response.body.data.birthdate).toBeDefined();
        expect(response.body.data.gender).toBeDefined();
    });

    it("Should be able to update profile data", async () => {
        const response = await supertest(web)
            .patch("/v1/users/me/profiles")
            .set("authorization", `Bearer ${token}`)
            .send({
                avatar: "https://images.vexels.com/content/145908/preview/male-avatar-maker-2a7919.png",
                full_name: "User Testing",
                gender: "Male",
                birthdate: "1998-08-04",
            });

        expect(response.status).toBe(200);
        expect(response.body.data.id).toBeDefined();
        expect(response.body.data.username).toBe("usertest-jest");
        expect(response.body.data.email).toBeDefined();
        expect(response.body.data.phone).toBeDefined();
        expect(response.body.data.avatar).toBe(
            "https://images.vexels.com/content/145908/preview/male-avatar-maker-2a7919.png"
        );
        expect(response.body.data.full_name).toBe("User Testing");
        expect(response.body.data.birthdate).toBeDefined();
        expect(response.body.data.gender).toBe("Male");
    });

    it("Should be able to add new address", async () => {
        const response = await supertest(web)
            .post("/v1/users/me/addresses")
            .set("authorization", `Bearer ${token}`)
            .send({
                name: "Roy Andhika",
                phone: "085921756700",
                address: "Rukita Dwiwarna Mangga Besar",
                postal_code: "10740",
                district: "Sawah Besar",
                city: "Jakarta Utara",
                province: "DKI Jakarta",
                notes: "Kamar 512",
                is_default: 1,
                flag: "Home",
            });

        expect(response.status).toBe(200);
        expect(response.body.data.id).toBeDefined();
        expect(response.body.data.name).toBe("Roy Andhika");
        expect(response.body.data.phone).toBe("085921756700");
        expect(response.body.data.address).toBe("Rukita Dwiwarna Mangga Besar");
        expect(response.body.data.flag).toBe("Home");
        expect(response.body.data.is_default).toBe(1);
    });

    it("Should be able to get all user address", async () => {
        await supertest(web).post("/v1/users/me/addresses").set("authorization", `Bearer ${token}`).send({
            name: "Roy Andhika",
            phone: "085921756700",
            address: "Rukita Dwiwarna Mangga Besar",
            postal_code: "10740",
            district: "Sawah Besar",
            city: "Jakarta Utara",
            province: "DKI Jakarta",
            notes: "Kamar 512",
            is_default: 1,
            flag: "Home",
        });

        const response = await supertest(web).get("/v1/users/me/addresses").set("authorization", `Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(response.body.data[0]).toBeDefined();
    });

    it("Should be able to get address by id", async () => {
        const addressId = await supertest(web)
            .post("/v1/users/me/addresses")
            .set("authorization", `Bearer ${token}`)
            .send({
                name: "Roy Andhika",
                phone: "085921756700",
                address: "Rukita Dwiwarna Mangga Besar",
                postal_code: "10740",
                district: "Sawah Besar",
                city: "Jakarta Utara",
                province: "DKI Jakarta",
                notes: "Kamar 512",
                is_default: 1,
                flag: "Home",
            });

        const response = await supertest(web)
            .get(`/v1/users/me/addresses/${addressId.body.data.id}`)
            .set("authorization", `Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(response.body.data.id).toBe(addressId.body.data.id);
        expect(response.body.data.name).toBe("Roy Andhika");
        expect(response.body.data.phone).toBe("085921756700");
        expect(response.body.data.address).toBe("Rukita Dwiwarna Mangga Besar");
        expect(response.body.data.flag).toBe("Home");
        expect(response.body.data.is_default).toBe(1);
    });

    it("Should be able to update address", async () => {
        const addressId = await supertest(web)
            .post("/v1/users/me/addresses")
            .set("authorization", `Bearer ${token}`)
            .send({
                name: "Roy Andhika",
                phone: "085921756700",
                address: "Rukita Dwiwarna Mangga Besar",
                postal_code: "10740",
                district: "Sawah Besar",
                city: "Jakarta Utara",
                province: "DKI Jakarta",
                notes: "Kamar 512",
                is_default: 1,
                flag: "Home",
            });

        const response = await supertest(web)
            .patch(`/v1/users/me/addresses/${addressId.body.data.id}`)
            .set("authorization", `Bearer ${token}`)
            .send({
                name: "Roy",
                phone: "085921756700",
                address: "Rukita Dwiwarna Mangga Besar",
                postal_code: "10740",
                district: "Sawah Besar",
                city: "Jakarta Utara",
                province: "DKI Jakarta",
                notes: "Kamar 512",
                is_default: 0,
                flag: "Office",
            });

        expect(response.status).toBe(200);
        expect(response.body.data.id).toBe(addressId.body.data.id);
        expect(response.body.data.name).toBe("Roy");
        expect(response.body.data.phone).toBe("085921756700");
        expect(response.body.data.address).toBe("Rukita Dwiwarna Mangga Besar");
        expect(response.body.data.flag).toBe("Office");
        expect(response.body.data.is_default).toBe(1);
    });

    it("Should be able to delete address", async () => {
        const addressId = await supertest(web)
            .post("/v1/users/me/addresses")
            .set("authorization", `Bearer ${token}`)
            .send({
                name: "Roy Andhika",
                phone: "085921756700",
                address: "Rukita Dwiwarna Mangga Besar",
                postal_code: "10740",
                district: "Sawah Besar",
                city: "Jakarta Utara",
                province: "DKI Jakarta",
                notes: "Kamar 512",
                is_default: 1,
                flag: "Home",
            });

        const response = await supertest(web)
            .delete(`/v1/users/me/addresses/${addressId.body.data.id}`)
            .set("authorization", `Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(response.body.data.id).toBe(addressId.body.data.id);
        expect(response.body.message).toBeDefined();
    });
});
