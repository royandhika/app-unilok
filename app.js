import { web } from "./src/app/web.js";
import { logger } from "./src/app/logging.js";
import "dotenv/config";
import { startPaymentCheckConsumer } from "./src/consumer/payment-check-consumer.js";
const PORT = process.env.PORT;

web.listen(PORT, async () => {
    logger.info(`App start, on port ${PORT}`);
    await startPaymentCheckConsumer();
});
