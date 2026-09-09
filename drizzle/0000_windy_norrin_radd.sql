CREATE TABLE `achievements` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text NOT NULL,
	`category` text NOT NULL,
	`rarity` text NOT NULL,
	`xp_reward` integer NOT NULL,
	`metric` text NOT NULL,
	`target` integer NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `daily_goals` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`kind` text NOT NULL,
	`target` integer NOT NULL,
	`date` text NOT NULL,
	`progress` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_goals_user_date` ON `daily_goals` (`user_id`,`date`);--> statement-breakpoint
CREATE TABLE `key_statistics` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`key` text NOT NULL,
	`presses` integer DEFAULT 0 NOT NULL,
	`correct` integer DEFAULT 0 NOT NULL,
	`response_ms` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_key_stats_user_key` ON `key_statistics` (`user_id`,`key`);--> statement-breakpoint
CREATE TABLE `lesson_attempts` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`lesson_id` integer NOT NULL,
	`wpm` integer NOT NULL,
	`raw_wpm` integer NOT NULL,
	`accuracy` real NOT NULL,
	`consistency` real NOT NULL,
	`score` integer NOT NULL,
	`duration` integer NOT NULL,
	`errors` integer NOT NULL,
	`characters` integer NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_lesson_attempts_user_lesson_date` ON `lesson_attempts` (`user_id`,`lesson_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `lesson_bests` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`lesson_id` integer NOT NULL,
	`best_score` integer NOT NULL,
	`best_wpm` integer NOT NULL,
	`best_accuracy` real NOT NULL,
	`best_consistency` real NOT NULL,
	`best_duration` integer NOT NULL,
	`attempt_id` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`attempt_id`) REFERENCES `lesson_attempts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_lesson_bests_user_lesson` ON `lesson_bests` (`user_id`,`lesson_id`);--> statement-breakpoint
CREATE TABLE `lesson_progress` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`lesson_id` integer NOT NULL,
	`best_wpm` integer,
	`best_accuracy` real,
	`completed_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_lesson_progress_user_lesson` ON `lesson_progress` (`user_id`,`lesson_id`);--> statement-breakpoint
CREATE TABLE `profiles` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`username` text NOT NULL,
	`avatar_url` text,
	`public_profile` integer DEFAULT false NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `typing_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`mode` text NOT NULL,
	`wpm` integer NOT NULL,
	`raw_wpm` integer NOT NULL,
	`accuracy` real NOT NULL,
	`duration` integer NOT NULL,
	`errors` integer NOT NULL,
	`typed_text` text,
	`suspicious` integer DEFAULT false NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_sessions_id_user` ON `typing_sessions` (`id`,`user_id`);--> statement-breakpoint
CREATE TABLE `user_achievements` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`achievement_id` text NOT NULL,
	`progress` integer DEFAULT 0 NOT NULL,
	`unlocked_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`achievement_id`) REFERENCES `achievements`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_achievement_user_item` ON `user_achievements` (`user_id`,`achievement_id`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`role` text DEFAULT 'USER' NOT NULL,
	`subscription_plan` text DEFAULT 'FREE' NOT NULL,
	`xp` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_users_email` ON `users` (`email`);--> statement-breakpoint
CREATE TABLE `xp_transactions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`amount` integer NOT NULL,
	`source` text NOT NULL,
	`source_id` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
