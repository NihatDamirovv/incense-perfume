CREATE TABLE `brands` (
	`id` text PRIMARY KEY NOT NULL,
	`name_key` text NOT NULL,
	`data` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `brands_name_key_unique` ON `brands` (`name_key`);--> statement-breakpoint
CREATE TABLE `site_settings` (
	`key` text PRIMARY KEY NOT NULL,
	`data` text NOT NULL,
	`revision` integer DEFAULT 0 NOT NULL
);
