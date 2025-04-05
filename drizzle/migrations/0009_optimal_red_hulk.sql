ALTER TABLE `orders` ADD `price` bigint NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `shipping_cost` bigint NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `shipping_detail` json NOT NULL;--> statement-breakpoint
ALTER TABLE `order_items` DROP COLUMN `shipping_cost`;--> statement-breakpoint
ALTER TABLE `order_items` DROP COLUMN `shipping_detail`;