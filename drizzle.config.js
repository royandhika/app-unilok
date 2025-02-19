import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
    out: "./drizzle/migrations",
    schema: "./src/app/db-schema.js",
    dialect: "mysql",
    dbCredentials: {
        url: process.env.DATABASE_URL,
    },
});