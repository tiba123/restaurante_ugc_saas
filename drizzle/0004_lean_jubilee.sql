CREATE TABLE `chat_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` int NOT NULL,
	`role` enum('user','assistant') NOT NULL,
	`content` text NOT NULL,
	`recommendedPlaces` json DEFAULT ('[]'),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `chat_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `chat_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`sessionKey` varchar(64) NOT NULL,
	`title` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `chat_sessions_id` PRIMARY KEY(`id`),
	CONSTRAINT `chat_sessions_sessionKey_unique` UNIQUE(`sessionKey`)
);
--> statement-breakpoint
CREATE TABLE `places_cache` (
	`id` int AUTO_INCREMENT NOT NULL,
	`placeId` varchar(255) NOT NULL,
	`name` varchar(255) NOT NULL,
	`category` varchar(100),
	`address` text,
	`neighborhood` varchar(100),
	`city` varchar(100) DEFAULT 'São Paulo',
	`rating` decimal(3,1),
	`totalRatings` int DEFAULT 0,
	`priceLevel` int,
	`types` json DEFAULT ('[]'),
	`positiveReviews` json DEFAULT ('[]'),
	`negativeReviews` json DEFAULT ('[]'),
	`aiSummary` text,
	`highlights` json DEFAULT ('[]'),
	`mapsUrl` text,
	`website` text,
	`phone` varchar(50),
	`openNow` boolean,
	`photoUrl` text,
	`lat` decimal(10,7),
	`lng` decimal(10,7),
	`cachedAt` timestamp NOT NULL DEFAULT (now()),
	`expiresAt` timestamp,
	CONSTRAINT `places_cache_id` PRIMARY KEY(`id`),
	CONSTRAINT `places_cache_placeId_unique` UNIQUE(`placeId`)
);
--> statement-breakpoint
CREATE TABLE `user_quiz_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`cuisinePrefs` json DEFAULT ('[]'),
	`budgetRange` enum('economico','moderado','premium','luxo') DEFAULT 'moderado',
	`ambience` json DEFAULT ('[]'),
	`companionType` enum('sozinho','casal','amigos','familia','negocios') DEFAULT 'amigos',
	`preferredNeighborhoods` json DEFAULT ('[]'),
	`interests` json DEFAULT ('[]'),
	`dietaryRestrictions` json DEFAULT ('[]'),
	`quizCompleted` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_quiz_profiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_quiz_profiles_userId_unique` UNIQUE(`userId`)
);
