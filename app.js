import { web } from "./src/app/web.js";
import { logger } from "./src/app/logging.js";
import "dotenv/config";
const PORT = process.env.PORT;

web.listen(PORT, () => {
    logger.info(`App start, on port ${PORT}`);
});
