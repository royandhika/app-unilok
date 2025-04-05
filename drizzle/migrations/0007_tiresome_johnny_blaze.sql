ALTER TABLE `products` MODIFY COLUMN `title` varchar(80) NOT NULL;--> statement-breakpoint
ALTER TABLE `order_items` ADD `shipping_detail` json NOT NULL;