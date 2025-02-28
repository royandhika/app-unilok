import mysql from "mysql2/promise";
import { drizzle } from "drizzle-orm/mysql2";
import * as schema from "./db-schema.js";
import "dotenv/config";
import { logger } from "./logging.js";
import { DefaultLogger } from "drizzle-orm";

const pool = mysql.createPool(process.env.DATABASE_URL);

const loggerWinston = {
    write: (message) => {
        logger.info(message.trim());
    },
};

export const db = drizzle(pool, {
    schema,
    mode: "default",
    logger: new DefaultLogger({ writer: loggerWinston }),
});

export { pool };
