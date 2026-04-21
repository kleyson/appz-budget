CREATE TABLE `categories` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`color` text DEFAULT '#8b5cf6' NOT NULL,
	`created_at` text,
	`updated_at` text,
	`created_by` text,
	`updated_by` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `categories_name_unique` ON `categories` (`name`);--> statement-breakpoint
CREATE TABLE `expenses` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`expense_name` text NOT NULL,
	`period` text NOT NULL,
	`category` text NOT NULL,
	`budget` real DEFAULT 0,
	`cost` real DEFAULT 0,
	`notes` text,
	`month_id` integer NOT NULL,
	`order` integer DEFAULT 0,
	`purchases` text,
	`expense_date` text,
	`created_at` text,
	`updated_at` text,
	`created_by` text,
	`updated_by` text,
	FOREIGN KEY (`month_id`) REFERENCES `months`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `income_types` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`color` text DEFAULT '#10b981' NOT NULL,
	`created_at` text,
	`updated_at` text,
	`created_by` text,
	`updated_by` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `income_types_name_unique` ON `income_types` (`name`);--> statement-breakpoint
CREATE TABLE `incomes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`income_type_id` integer NOT NULL,
	`period` text NOT NULL,
	`budget` real DEFAULT 0,
	`amount` real DEFAULT 0,
	`month_id` integer NOT NULL,
	`created_at` text,
	`updated_at` text,
	`created_by` text,
	`updated_by` text,
	FOREIGN KEY (`income_type_id`) REFERENCES `income_types`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`month_id`) REFERENCES `months`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `months` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`year` integer NOT NULL,
	`month` integer NOT NULL,
	`name` text NOT NULL,
	`start_date` text NOT NULL,
	`end_date` text NOT NULL,
	`is_closed` integer DEFAULT false,
	`closed_at` text,
	`closed_by` text,
	`created_at` text,
	`updated_at` text,
	`created_by` text,
	`updated_by` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `months_name_unique` ON `months` (`name`);--> statement-breakpoint
CREATE TABLE `password_reset_tokens` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`token` text NOT NULL,
	`short_code` text,
	`expires_at` text NOT NULL,
	`used` integer DEFAULT false,
	`created_at` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `password_reset_tokens_token_unique` ON `password_reset_tokens` (`token`);--> statement-breakpoint
CREATE TABLE `periods` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`color` text DEFAULT '#8b5cf6' NOT NULL,
	`created_at` text,
	`updated_at` text,
	`created_by` text,
	`updated_by` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `periods_name_unique` ON `periods` (`name`);--> statement-breakpoint
CREATE TABLE `seed_records` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`seed_id` text NOT NULL,
	`executed_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `seed_records_seed_id_unique` ON `seed_records` (`seed_id`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`email` text NOT NULL,
	`hashed_password` text NOT NULL,
	`full_name` text,
	`is_active` integer DEFAULT true,
	`is_admin` integer DEFAULT false,
	`created_at` text,
	`updated_at` text,
	`created_by` text,
	`updated_by` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);