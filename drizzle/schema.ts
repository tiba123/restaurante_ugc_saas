import {
  boolean,
  decimal,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  json,
} from "drizzle-orm/mysql-core";

// ─── Users (consumers + admins) ──────────────────────────────────────────────
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  username: varchar("username", { length: 64 }).unique(),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  avatarUrl: text("avatarUrl"),
  coverUrl: text("coverUrl"),
  bio: text("bio"),
  city: varchar("city", { length: 100 }).default("São Paulo"),
  favoriteCuisine: varchar("favoriteCuisine", { length: 100 }),
  instagramHandle: varchar("instagramHandle", { length: 100 }),
  tiktokHandle: varchar("tiktokHandle", { length: 100 }),
  totalVideos: int("totalVideos").default(0).notNull(),
  totalLikes: int("totalLikes").default(0).notNull(),
  totalReviews: int("totalReviews").default(0).notNull(),
  totalRestaurantsVisited: int("totalRestaurantsVisited").default(0).notNull(),
  totalFriends: int("totalFriends").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Restaurants ─────────────────────────────────────────────────────────────
export const restaurants = mysqlTable("restaurants", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(), // references users.id (restaurant owner)
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  description: text("description"),
  cuisine: varchar("cuisine", { length: 100 }),
  category: mysqlEnum("category", [
    "fine_dining",
    "casual",
    "fast_food",
    "bar",
    "cafe",
    "pizzeria",
    "sushi",
    "churrascaria",
    "vegano",
    "internacional",
    "outros",
  ]).default("casual"),
  address: text("address"),
  neighborhood: varchar("neighborhood", { length: 100 }),
  city: varchar("city", { length: 100 }).default("São Paulo"),
  state: varchar("state", { length: 2 }).default("SP"),
  phone: varchar("phone", { length: 20 }),
  website: varchar("website", { length: 255 }),
  instagramHandle: varchar("instagramHandle", { length: 100 }),
  logoUrl: text("logoUrl"),
  coverUrl: text("coverUrl"),
  openingHours: json("openingHours"), // { mon: "11:00-23:00", ... }
  priceRange: mysqlEnum("priceRange", ["$", "$$", "$$$", "$$$$"]).default("$$"),
  averageRating: decimal("averageRating", { precision: 3, scale: 2 }).default("0.00"),
  totalReviews: int("totalReviews").default(0).notNull(),
  totalVideos: int("totalVideos").default(0).notNull(),
  totalViews: int("totalViews").default(0).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  isVerified: boolean("isVerified").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Restaurant = typeof restaurants.$inferSelect;
export type InsertRestaurant = typeof restaurants.$inferInsert;

// ─── Restaurant Accounts (separate login for restaurant owners) ───────────────
export const restaurantAccounts = mysqlTable("restaurant_accounts", {
  id: int("id").autoincrement().primaryKey(),
  restaurantId: int("restaurantId").notNull(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["restaurant", "admin"]).default("restaurant").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type RestaurantAccount = typeof restaurantAccounts.$inferSelect;

// ─── Videos ──────────────────────────────────────────────────────────────────
export const videos = mysqlTable("videos", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  restaurantId: int("restaurantId").notNull(),
  title: varchar("title", { length: 255 }),
  description: text("description"),
  videoUrl: text("videoUrl").notNull(),
  videoKey: text("videoKey").notNull(),
  thumbnailUrl: text("thumbnailUrl"),
  thumbnailKey: text("thumbnailKey"),
  duration: int("duration"), // seconds
  status: mysqlEnum("status", [
    "pending",
    "approved",
    "rejected",
    "processing",
  ]).default("pending").notNull(),
  rejectionReason: text("rejectionReason"),
  views: int("views").default(0).notNull(),
  likes: int("likes").default(0).notNull(),
  comments: int("comments").default(0).notNull(),
  rating: int("rating"), // 1-5 stars given in this video review
  tags: json("tags"), // string[]
  isPublic: boolean("isPublic").default(false).notNull(),
  approvedAt: timestamp("approvedAt"),
  approvedBy: int("approvedBy"), // restaurantAccount.id
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Video = typeof videos.$inferSelect;
export type InsertVideo = typeof videos.$inferInsert;

// ─── Video Likes ─────────────────────────────────────────────────────────────
export const videoLikes = mysqlTable("video_likes", {
  id: int("id").autoincrement().primaryKey(),
  videoId: int("videoId").notNull(),
  userId: int("userId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── Video Comments ───────────────────────────────────────────────────────────
export const videoComments = mysqlTable("video_comments", {
  id: int("id").autoincrement().primaryKey(),
  videoId: int("videoId").notNull(),
  userId: int("userId").notNull(),
  content: text("content").notNull(),
  likes: int("likes").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type VideoComment = typeof videoComments.$inferSelect;

// ─── Reviews ─────────────────────────────────────────────────────────────────
export const reviews = mysqlTable("reviews", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  restaurantId: int("restaurantId").notNull(),
  videoId: int("videoId"), // optional: linked video
  rating: int("rating").notNull(), // 1-5
  title: varchar("title", { length: 255 }),
  content: text("content"),
  tags: json("tags"), // string[] e.g. ["ótima comida", "bom atendimento"]
  foodRating: int("foodRating"), // 1-5
  serviceRating: int("serviceRating"), // 1-5
  ambianceRating: int("ambianceRating"), // 1-5
  valueRating: int("valueRating"), // 1-5
  isVerified: boolean("isVerified").default(false), // visited via platform
  helpfulCount: int("helpfulCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Review = typeof reviews.$inferSelect;
export type InsertReview = typeof reviews.$inferInsert;

// ─── Achievements ─────────────────────────────────────────────────────────────
export const achievements = mysqlTable("achievements", {
  id: int("id").autoincrement().primaryKey(),
  key: varchar("key", { length: 100 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  iconUrl: text("iconUrl"),
  points: int("points").default(0).notNull(),
  requirement: json("requirement"), // { type: "videos", count: 5 }
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Achievement = typeof achievements.$inferSelect;

// ─── User Achievements ────────────────────────────────────────────────────────
export const userAchievements = mysqlTable("user_achievements", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  achievementId: int("achievementId").notNull(),
  earnedAt: timestamp("earnedAt").defaultNow().notNull(),
});

// ─── Benefits (discounts, free dishes) ───────────────────────────────────────
export const benefits = mysqlTable("benefits", {
  id: int("id").autoincrement().primaryKey(),
  restaurantId: int("restaurantId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  type: mysqlEnum("type", ["discount", "free_dish", "priority", "other"]).default("discount"),
  discountPercent: int("discountPercent"), // e.g. 20 for 20%
  requiredVideos: int("requiredVideos").default(1), // how many approved videos needed
  isActive: boolean("isActive").default(true).notNull(),
  expiresAt: timestamp("expiresAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Benefit = typeof benefits.$inferSelect;

// ─── User Benefits (claimed) ──────────────────────────────────────────────────
export const userBenefits = mysqlTable("user_benefits", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  benefitId: int("benefitId").notNull(),
  status: mysqlEnum("status", ["active", "used", "expired"]).default("active").notNull(),
  claimedAt: timestamp("claimedAt").defaultNow().notNull(),
  usedAt: timestamp("usedAt"),
});

// ─── Friendships ────────────────────────────────────────────────────────────
export const friendships = mysqlTable("friendships", {
  id: int("id").autoincrement().primaryKey(),
  requesterId: int("requesterId").notNull(),   // who sent the request
  addresseeId: int("addresseeId").notNull(),   // who received the request
  status: mysqlEnum("status", ["pending", "accepted", "declined", "blocked"])
    .default("pending")
    .notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Friendship = typeof friendships.$inferSelect;

// ─── User Activities (social feed) ───────────────────────────────────────────
export const userActivities = mysqlTable("user_activities", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  type: mysqlEnum("type", [
    "video_posted",
    "video_approved",
    "review_posted",
    "restaurant_visited",
    "achievement_earned",
    "friendship_started",
  ]).notNull(),
  restaurantId: int("restaurantId"),   // nullable
  videoId: int("videoId"),             // nullable
  reviewId: int("reviewId"),           // nullable
  achievementId: int("achievementId"), // nullable
  friendId: int("friendId"),           // nullable
  metadata: json("metadata"),          // extra data (e.g. rating, tags)
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type UserActivity = typeof userActivities.$inferSelect;

// ─── Restaurant Visits ────────────────────────────────────────────────────────
export const restaurantVisits = mysqlTable("restaurant_visits", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  restaurantId: int("restaurantId").notNull(),
  visitedAt: timestamp("visitedAt").defaultNow().notNull(),
  videoId: int("videoId"),   // linked video if any
  reviewId: int("reviewId"), // linked review if any
});

export type RestaurantVisit = typeof restaurantVisits.$inferSelect;

// ─── Platform Stats (cached) ──────────────────────────────────────────────────
export const platformStats = mysqlTable("platform_stats", {
  id: int("id").autoincrement().primaryKey(),
  date: varchar("date", { length: 10 }).notNull(), // YYYY-MM-DD
  totalUsers: int("totalUsers").default(0).notNull(),
  totalRestaurants: int("totalRestaurants").default(0).notNull(),
  totalVideos: int("totalVideos").default(0).notNull(),
  totalViews: int("totalViews").default(0).notNull(),
  totalReviews: int("totalReviews").default(0).notNull(),
  newUsers: int("newUsers").default(0).notNull(),
  newRestaurants: int("newRestaurants").default(0).notNull(),
  newVideos: int("newVideos").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── Missions (gamification) ──────────────────────────────────────────────────
export const missions = mysqlTable("missions", {
  id: int("id").autoincrement().primaryKey(),
  key: varchar("key", { length: 100 }).notNull().unique(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  instructions: text("instructions"),
  type: mysqlEnum("type", [
    "photo",       // tirar foto do prato
    "video",       // gravar vídeo provando a comida
    "review",      // deixar avaliação
    "questions",   // responder perguntas
    "checkin",     // fazer check-in no restaurante
    "share",       // compartilhar nas redes sociais
  ]).notNull(),
  points: int("points").default(10).notNull(),
  isOptional: boolean("isOptional").default(false).notNull(),
  order: int("order").default(0).notNull(),
  iconEmoji: varchar("iconEmoji", { length: 10 }).default("🎯"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Mission = typeof missions.$inferSelect;

// ─── Mission Sessions (user accepts a mission set at a restaurant) ────────────
export const missionSessions = mysqlTable("mission_sessions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  restaurantId: int("restaurantId").notNull(),
  status: mysqlEnum("status", ["active", "completed", "expired", "abandoned"])
    .default("active")
    .notNull(),
  totalPoints: int("totalPoints").default(0).notNull(),
  acceptedAt: timestamp("acceptedAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
  expiresAt: timestamp("expiresAt"),
});

export type MissionSession = typeof missionSessions.$inferSelect;

// ─── Mission Progress (per mission within a session) ─────────────────────────
export const missionProgress = mysqlTable("mission_progress", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: int("sessionId").notNull(),
  missionId: int("missionId").notNull(),
  userId: int("userId").notNull(),
  status: mysqlEnum("status", ["locked", "available", "in_progress", "completed"])
    .default("available")
    .notNull(),
  pointsEarned: int("pointsEarned").default(0).notNull(),
  completedAt: timestamp("completedAt"),
  data: json("data"), // answers, photo url, video url, etc.
});

export type MissionProgressRow = typeof missionProgress.$inferSelect;

// ─── Rewards (recompensas por pontuação) ─────────────────────────────────────
export const rewards = mysqlTable("rewards", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  type: mysqlEnum("type", ["free_item", "discount", "credits", "priority"])
    .default("discount")
    .notNull(),
  pointsRequired: int("pointsRequired").notNull(),
  discountPercent: int("discountPercent"),
  freeItemDescription: varchar("freeItemDescription", { length: 255 }),
  creditsValue: decimal("creditsValue", { precision: 10, scale: 2 }),
  iconEmoji: varchar("iconEmoji", { length: 10 }).default("🎁"),
  badgeColor: varchar("badgeColor", { length: 50 }).default("amber"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Reward = typeof rewards.$inferSelect;

// ─── User Rewards (recompensas resgatadas) ────────────────────────────────────
export const userRewards = mysqlTable("user_rewards", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  rewardId: int("rewardId").notNull(),
  sessionId: int("sessionId"),
  restaurantId: int("restaurantId"),
  status: mysqlEnum("status", ["available", "used", "expired"]).default("available").notNull(),
  couponCode: varchar("couponCode", { length: 32 }),
  claimedAt: timestamp("claimedAt").defaultNow().notNull(),
  usedAt: timestamp("usedAt"),
  expiresAt: timestamp("expiresAt"),
});

export type UserReward = typeof userRewards.$inferSelect;

// ─── User Credits (saldo de créditos) ────────────────────────────────────────
export const userCredits = mysqlTable("user_credits", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  balance: decimal("balance", { precision: 10, scale: 2 }).default("0.00").notNull(),
  totalEarned: decimal("totalEarned", { precision: 10, scale: 2 }).default("0.00").notNull(),
  totalSpent: decimal("totalSpent", { precision: 10, scale: 2 }).default("0.00").notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserCredit = typeof userCredits.$inferSelect;
