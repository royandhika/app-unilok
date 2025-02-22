CREATE TABLE `product_images` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`product_id` bigint unsigned NOT NULL,
	`url` text NOT NULL,
	`is_thumbnail` tinyint NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `product_images_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
RENAME TABLE `product_colour` TO `colours`;--> statement-breakpoint
ALTER TABLE `product_variants` DROP FOREIGN KEY `product_variants_colour_id_product_colour_id_fk`;
--> statement-breakpoint
ALTER TABLE `colours` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `colours` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `product_images` ADD CONSTRAINT `product_images_product_id_products_id_fk` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `product_variants` ADD CONSTRAINT `product_variants_colour_id_colours_id_fk` FOREIGN KEY (`colour_id`) REFERENCES `colours`(`id`) ON DELETE cascade ON UPDATE no action;