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
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  avatarUrl: text("avatarUrl"),
  bio: text("bio"),
  city: varchar("city", { length: 100 }).default("São Paulo"),
  totalVideos: int("totalVideos").default(0).notNull(),
  totalLikes: int("totalLikes").default(0).notNull(),
  totalReviews: int("totalReviews").default(0).notNull(),
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
