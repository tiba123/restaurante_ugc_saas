import { createConnection } from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

const conn = await createConnection(process.env.DATABASE_URL);

const sqls = [
  // chat_sessions already created
  // chat_messages already created
  `CREATE TABLE IF NOT EXISTS \`places_cache\` (
    \`id\` int AUTO_INCREMENT NOT NULL,
    \`placeId\` varchar(255) NOT NULL,
    \`name\` varchar(255) NOT NULL,
    \`category\` varchar(100),
    \`address\` text,
    \`neighborhood\` varchar(100),
    \`city\` varchar(100) DEFAULT 'São Paulo',
    \`rating\` decimal(3,1),
    \`totalRatings\` int DEFAULT 0,
    \`priceLevel\` int,
    \`types\` json,
    \`positiveReviews\` json,
    \`negativeReviews\` json,
    \`aiSummary\` text,
    \`highlights\` json,
    \`mapsUrl\` text,
    \`website\` text,
    \`phone\` varchar(50),
    \`openNow\` boolean,
    \`photoUrl\` text,
    \`lat\` decimal(10,7),
    \`lng\` decimal(10,7),
    \`cachedAt\` timestamp NOT NULL DEFAULT (now()),
    \`expiresAt\` timestamp,
    CONSTRAINT \`places_cache_id\` PRIMARY KEY(\`id\`),
    CONSTRAINT \`places_cache_placeId_unique\` UNIQUE(\`placeId\`)
  )`,
  `CREATE TABLE IF NOT EXISTS \`user_quiz_profiles\` (
    \`id\` int AUTO_INCREMENT NOT NULL,
    \`userId\` int NOT NULL,
    \`cuisinePrefs\` json,
    \`budgetRange\` enum('economico','moderado','premium','luxo') DEFAULT 'moderado',
    \`ambience\` json,
    \`companionType\` enum('sozinho','casal','amigos','familia','negocios') DEFAULT 'amigos',
    \`preferredNeighborhoods\` json,
    \`interests\` json,
    \`dietaryRestrictions\` json,
    \`quizCompleted\` boolean NOT NULL DEFAULT false,
    \`createdAt\` timestamp NOT NULL DEFAULT (now()),
    \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT \`user_quiz_profiles_id\` PRIMARY KEY(\`id\`),
    CONSTRAINT \`user_quiz_profiles_userId_unique\` UNIQUE(\`userId\`)
  )`,
];

for (const sql of sqls) {
  await conn.execute(sql);
  console.log("✓ Table created");
}
await conn.end();
console.log("✅ All chat tables created successfully!");
