import winston from "winston";

const customPrintf = winston.format.printf(({ level, message, timestamp, ...metadata }) => {
    // Jika message atau metadata adalah object, stringify untuk menghindari [object Object]
    const formattedMessage =
        typeof message === "object" ? JSON.stringify(message, null, 2) : message;
    const meta =
        metadata && Object.keys(metadata).length > 0 ? JSON.stringify(metadata, null, 2) : "";

    return `${timestamp} [${level}]: ${formattedMessage} ${meta}`;
});

export const logger = winston.createLogger({
    level: "info",
    format: winston.format.combine(
        winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        winston.format.colorize(), // Tambahkan warna sesuai level log
        // winston.format.json(),
        customPrintf
    ),
    transports: [new winston.transports.Console()],
});
