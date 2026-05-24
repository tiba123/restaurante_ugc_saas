CREATE TABLE `friendships` (
	`id` int AUTO_INCREMENT NOT NULL,
	`requesterId` int NOT NULL,
	`addresseeId` int NOT NULL,
	`status` enum('pending','accepted','declined','blocked') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `friendships_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `restaurant_visits` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`restaurantId` int NOT NULL,
	`visitedAt` timestamp NOT NULL DEFAULT (now()),
	`videoId` int,
	`reviewId` int,
	CONSTRAINT `restaurant_visits_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_activities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` enum('video_posted','video_approved','review_posted','restaurant_visited','achievement_earned','friendship_started') NOT NULL,
	`restaurantId` int,
	`videoId` int,
	`reviewId` int,
	`achievementId` int,
	`friendId` int,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `user_activities_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `username` varchar(64);--> statement-breakpoint
ALTER TABLE `users` ADD `coverUrl` text;--> statement-breakpoint
ALTER TABLE `users` ADD `favoriteCuisine` varchar(100);--> statement-breakpoint
ALTER TABLE `users` ADD `instagramHandle` varchar(100);--> statement-breakpoint
ALTER TABLE `users` ADD `tiktokHandle` varchar(100);--> statement-breakpoint
ALTER TABLE `users` ADD `totalRestaurantsVisited` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `totalFriends` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_username_unique` UNIQUE(`username`);