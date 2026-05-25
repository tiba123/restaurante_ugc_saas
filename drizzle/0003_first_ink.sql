CREATE TABLE `mission_progress` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` int NOT NULL,
	`missionId` int NOT NULL,
	`userId` int NOT NULL,
	`status` enum('locked','available','in_progress','completed') NOT NULL DEFAULT 'available',
	`pointsEarned` int NOT NULL DEFAULT 0,
	`completedAt` timestamp,
	`data` json,
	CONSTRAINT `mission_progress_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `mission_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`restaurantId` int NOT NULL,
	`status` enum('active','completed','expired','abandoned') NOT NULL DEFAULT 'active',
	`totalPoints` int NOT NULL DEFAULT 0,
	`acceptedAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	`expiresAt` timestamp,
	CONSTRAINT `mission_sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `missions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`key` varchar(100) NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`instructions` text,
	`type` enum('photo','video','review','questions','checkin','share') NOT NULL,
	`points` int NOT NULL DEFAULT 10,
	`isOptional` boolean NOT NULL DEFAULT false,
	`order` int NOT NULL DEFAULT 0,
	`iconEmoji` varchar(10) DEFAULT '🎯',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `missions_id` PRIMARY KEY(`id`),
	CONSTRAINT `missions_key_unique` UNIQUE(`key`)
);
--> statement-breakpoint
CREATE TABLE `rewards` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`type` enum('free_item','discount','credits','priority') NOT NULL DEFAULT 'discount',
	`pointsRequired` int NOT NULL,
	`discountPercent` int,
	`freeItemDescription` varchar(255),
	`creditsValue` decimal(10,2),
	`iconEmoji` varchar(10) DEFAULT '🎁',
	`badgeColor` varchar(50) DEFAULT 'amber',
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `rewards_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_credits` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`balance` decimal(10,2) NOT NULL DEFAULT '0.00',
	`totalEarned` decimal(10,2) NOT NULL DEFAULT '0.00',
	`totalSpent` decimal(10,2) NOT NULL DEFAULT '0.00',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_credits_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_credits_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `user_rewards` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`rewardId` int NOT NULL,
	`sessionId` int,
	`restaurantId` int,
	`status` enum('available','used','expired') NOT NULL DEFAULT 'available',
	`couponCode` varchar(32),
	`claimedAt` timestamp NOT NULL DEFAULT (now()),
	`usedAt` timestamp,
	`expiresAt` timestamp,
	CONSTRAINT `user_rewards_id` PRIMARY KEY(`id`)
);
