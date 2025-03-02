ALTER TABLE `order_items` MODIFY COLUMN `price` bigint NOT NULL;--> statement-breakpoint
ALTER TABLE `product_variants` MODIFY COLUMN `price` bigint NOT NULL;--> statement-breakpoint
ALTER TABLE `products` MODIFY COLUMN `base_price` bigint NOT NULL;