CREATE TABLE `achievements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`key` varchar(100) NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`iconUrl` text,
	`points` int NOT NULL DEFAULT 0,
	`requirement` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `achievements_id` PRIMARY KEY(`id`),
	CONSTRAINT `achievements_key_unique` UNIQUE(`key`)
);
--> statement-breakpoint
CREATE TABLE `benefits` (
	`id` int AUTO_INCREMENT NOT NULL,
	`restaurantId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`type` enum('discount','free_dish','priority','other') DEFAULT 'discount',
	`discountPercent` int,
	`requiredVideos` int DEFAULT 1,
	`isActive` boolean NOT NULL DEFAULT true,
	`expiresAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `benefits_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `platform_stats` (
	`id` int AUTO_INCREMENT NOT NULL,
	`date` varchar(10) NOT NULL,
	`totalUsers` int NOT NULL DEFAULT 0,
	`totalRestaurants` int NOT NULL DEFAULT 0,
	`totalVideos` int NOT NULL DEFAULT 0,
	`totalViews` int NOT NULL DEFAULT 0,
	`totalReviews` int NOT NULL DEFAULT 0,
	`newUsers` int NOT NULL DEFAULT 0,
	`newRestaurants` int NOT NULL DEFAULT 0,
	`newVideos` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `platform_stats_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `restaurant_accounts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`restaurantId` int NOT NULL,
	`openId` varchar(64) NOT NULL,
	`name` text,
	`email` varchar(320),
	`loginMethod` varchar(64),
	`role` enum('restaurant','admin') NOT NULL DEFAULT 'restaurant',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `restaurant_accounts_id` PRIMARY KEY(`id`),
	CONSTRAINT `restaurant_accounts_openId_unique` UNIQUE(`openId`)
);
--> statement-breakpoint
CREATE TABLE `restaurants` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`slug` varchar(255) NOT NULL,
	`description` text,
	`cuisine` varchar(100),
	`category` enum('fine_dining','casual','fast_food','bar','cafe','pizzeria','sushi','churrascaria','vegano','internacional','outros') DEFAULT 'casual',
	`address` text,
	`neighborhood` varchar(100),
	`city` varchar(100) DEFAULT 'São Paulo',
	`state` varchar(2) DEFAULT 'SP',
	`phone` varchar(20),
	`website` varchar(255),
	`instagramHandle` varchar(100),
	`logoUrl` text,
	`coverUrl` text,
	`openingHours` json,
	`priceRange` enum('$','$$','$$$','$$$$') DEFAULT '$$',
	`averageRating` decimal(3,2) DEFAULT '0.00',
	`totalReviews` int NOT NULL DEFAULT 0,
	`totalVideos` int NOT NULL DEFAULT 0,
	`totalViews` int NOT NULL DEFAULT 0,
	`isActive` boolean NOT NULL DEFAULT true,
	`isVerified` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `restaurants_id` PRIMARY KEY(`id`),
	CONSTRAINT `restaurants_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `reviews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`restaurantId` int NOT NULL,
	`videoId` int,
	`rating` int NOT NULL,
	`title` varchar(255),
	`content` text,
	`tags` json,
	`foodRating` int,
	`serviceRating` int,
	`ambianceRating` int,
	`valueRating` int,
	`isVerified` boolean DEFAULT false,
	`helpfulCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `reviews_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_achievements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`achievementId` int NOT NULL,
	`earnedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `user_achievements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_benefits` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`benefitId` int NOT NULL,
	`status` enum('active','used','expired') NOT NULL DEFAULT 'active',
	`claimedAt` timestamp NOT NULL DEFAULT (now()),
	`usedAt` timestamp,
	CONSTRAINT `user_benefits_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `video_comments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`videoId` int NOT NULL,
	`userId` int NOT NULL,
	`content` text NOT NULL,
	`likes` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `video_comments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `video_likes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`videoId` int NOT NULL,
	`userId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `video_likes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `videos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`restaurantId` int NOT NULL,
	`title` varchar(255),
	`description` text,
	`videoUrl` text NOT NULL,
	`videoKey` text NOT NULL,
	`thumbnailUrl` text,
	`thumbnailKey` text,
	`duration` int,
	`status` enum('pending','approved','rejected','processing') NOT NULL DEFAULT 'pending',
	`rejectionReason` text,
	`views` int NOT NULL DEFAULT 0,
	`likes` int NOT NULL DEFAULT 0,
	`comments` int NOT NULL DEFAULT 0,
	`rating` int,
	`tags` json,
	`isPublic` boolean NOT NULL DEFAULT false,
	`approvedAt` timestamp,
	`approvedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `videos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `avatarUrl` text;--> statement-breakpoint
ALTER TABLE `users` ADD `bio` text;--> statement-breakpoint
ALTER TABLE `users` ADD `city` varchar(100) DEFAULT 'São Paulo';--> statement-breakpoint
ALTER TABLE `users` ADD `totalVideos` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `totalLikes` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `totalReviews` int DEFAULT 0 NOT NULL;