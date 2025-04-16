ALTER TABLE `wishlists` DROP FOREIGN KEY `wishlists_product_id_product_variants_id_fk`;
--> statement-breakpoint
ALTER TABLE `wishlists` ADD CONSTRAINT `wishlists_product_id_products_id_fk` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE cascade ON UPDATE no action;