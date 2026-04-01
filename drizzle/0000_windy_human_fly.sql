CREATE TABLE `books` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`author` text DEFAULT 'Author' NOT NULL,
	`description` text,
	`trim_size_id` text DEFAULT '6x9' NOT NULL,
	`paper_type` text DEFAULT 'white' NOT NULL,
	`ink_type` text DEFAULT 'bw' NOT NULL,
	`cover_finish` text DEFAULT 'matte' NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	`deleted_at` text
);
--> statement-breakpoint
CREATE TABLE `chapters` (
	`id` text PRIMARY KEY NOT NULL,
	`book_id` text NOT NULL,
	`title` text NOT NULL,
	`order` integer DEFAULT 0 NOT NULL,
	`content` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	`deleted_at` text,
	FOREIGN KEY (`book_id`) REFERENCES `books`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `covers` (
	`id` text PRIMARY KEY NOT NULL,
	`book_id` text NOT NULL,
	`front_cover_url` text,
	`front_cover_width` integer,
	`front_cover_height` integer,
	`back_cover_type` text,
	`back_cover_image_url` text,
	`back_cover_image_width` integer,
	`back_cover_image_height` integer,
	`back_cover_text` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`book_id`) REFERENCES `books`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `toc_entries` (
	`id` text PRIMARY KEY NOT NULL,
	`book_id` text NOT NULL,
	`title` text NOT NULL,
	`level` integer DEFAULT 1 NOT NULL,
	`anchor_id` text,
	`position` integer DEFAULT 0 NOT NULL,
	`is_custom` integer DEFAULT false NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	`deleted_at` text,
	FOREIGN KEY (`book_id`) REFERENCES `books`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `toc_entries_book_id_idx` ON `toc_entries` (`book_id`);