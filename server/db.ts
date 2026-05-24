import { and, desc, eq, ilike, like, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  InsertRestaurant,
  InsertVideo,
  InsertReview,
  achievements,
  benefits,
  platformStats,
  restaurantAccounts,
  restaurants,
  reviews,
  userAchievements,
  userBenefits,
  users,
  videoComments,
  videoLikes,
  videos,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Users ────────────────────────────────────────────────────────────────────
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};

  const fields = ["name", "email", "loginMethod"] as const;
  for (const f of fields) {
    const v = user[f];
    if (v !== undefined) { values[f] = v ?? null; updateSet[f] = v ?? null; }
  }
  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role; updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin"; updateSet.role = "admin";
  }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result[0];
}

export async function updateUserProfile(id: number, data: Partial<InsertUser>) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set(data).where(eq(users.id, id));
}

export async function getAllUsers(limit = 50, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users).limit(limit).offset(offset).orderBy(desc(users.createdAt));
}

// ─── Restaurants ──────────────────────────────────────────────────────────────
export async function createRestaurant(data: InsertRestaurant) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const result = await db.insert(restaurants).values(data);
  return result;
}

export async function getRestaurantById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(restaurants).where(eq(restaurants.id, id)).limit(1);
  return result[0];
}

export async function getRestaurantBySlug(slug: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(restaurants).where(eq(restaurants.slug, slug)).limit(1);
  return result[0];
}

export async function getRestaurantByOwnerId(ownerId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(restaurants).where(eq(restaurants.ownerId, ownerId)).limit(1);
  return result[0];
}

export async function updateRestaurant(id: number, data: Partial<InsertRestaurant>) {
  const db = await getDb();
  if (!db) return;
  await db.update(restaurants).set(data).where(eq(restaurants.id, id));
}

export async function listRestaurants(opts: {
  search?: string;
  category?: string;
  neighborhood?: string;
  minRating?: number;
  limit?: number;
  offset?: number;
}) {
  const db = await getDb();
  if (!db) return [];
  const { search, category, neighborhood, minRating, limit = 20, offset = 0 } = opts;

  const conditions = [eq(restaurants.isActive, true)];
  if (search) {
    conditions.push(
      or(
        like(restaurants.name, `%${search}%`),
        like(restaurants.cuisine, `%${search}%`),
        like(restaurants.neighborhood, `%${search}%`)
      ) as any
    );
  }
  if (category) conditions.push(eq(restaurants.category, category as any));
  if (neighborhood) conditions.push(like(restaurants.neighborhood, `%${neighborhood}%`));

  return db
    .select()
    .from(restaurants)
    .where(and(...conditions))
    .limit(limit)
    .offset(offset)
    .orderBy(desc(restaurants.averageRating));
}

export async function getAllRestaurants(limit = 50, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(restaurants).limit(limit).offset(offset).orderBy(desc(restaurants.createdAt));
}

// ─── Restaurant Accounts ──────────────────────────────────────────────────────
export async function upsertRestaurantAccount(data: {
  openId: string;
  restaurantId: number;
  name?: string | null;
  email?: string | null;
  loginMethod?: string | null;
}) {
  const db = await getDb();
  if (!db) return;
  await db
    .insert(restaurantAccounts)
    .values({ ...data, lastSignedIn: new Date() })
    .onDuplicateKeyUpdate({
      set: { name: data.name, email: data.email, lastSignedIn: new Date() },
    });
}

export async function getRestaurantAccountByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(restaurantAccounts)
    .where(eq(restaurantAccounts.openId, openId))
    .limit(1);
  return result[0];
}

// ─── Videos ───────────────────────────────────────────────────────────────────
export async function createVideo(data: InsertVideo) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const result = await db.insert(videos).values(data);
  return result;
}

export async function getVideoById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(videos).where(eq(videos.id, id)).limit(1);
  return result[0];
}

export async function getFeedVideos(limit = 10, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(videos)
    .where(and(eq(videos.status, "approved"), eq(videos.isPublic, true)))
    .limit(limit)
    .offset(offset)
    .orderBy(desc(videos.createdAt));
}

export async function getVideosByRestaurant(restaurantId: number, status?: string) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(videos.restaurantId, restaurantId)];
  if (status) conditions.push(eq(videos.status, status as any));
  return db
    .select()
    .from(videos)
    .where(and(...conditions))
    .orderBy(desc(videos.createdAt));
}

export async function getVideosByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(videos)
    .where(eq(videos.userId, userId))
    .orderBy(desc(videos.createdAt));
}

export async function updateVideoStatus(
  id: number,
  status: "approved" | "rejected" | "processing",
  opts?: { rejectionReason?: string; approvedBy?: number }
) {
  const db = await getDb();
  if (!db) return;
  const updateData: Record<string, unknown> = { status };
  if (status === "approved") {
    updateData.isPublic = true;
    updateData.approvedAt = new Date();
    if (opts?.approvedBy) updateData.approvedBy = opts.approvedBy;
  }
  if (status === "rejected" && opts?.rejectionReason) {
    updateData.rejectionReason = opts.rejectionReason;
  }
  await db.update(videos).set(updateData).where(eq(videos.id, id));
}

export async function incrementVideoViews(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(videos).set({ views: sql`${videos.views} + 1` }).where(eq(videos.id, id));
}

export async function getAllVideos(limit = 50, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(videos).limit(limit).offset(offset).orderBy(desc(videos.createdAt));
}

// ─── Video Likes ──────────────────────────────────────────────────────────────
export async function toggleVideoLike(videoId: number, userId: number) {
  const db = await getDb();
  if (!db) return { liked: false };

  const existing = await db
    .select()
    .from(videoLikes)
    .where(and(eq(videoLikes.videoId, videoId), eq(videoLikes.userId, userId)))
    .limit(1);

  if (existing.length > 0) {
    await db
      .delete(videoLikes)
      .where(and(eq(videoLikes.videoId, videoId), eq(videoLikes.userId, userId)));
    await db.update(videos).set({ likes: sql`${videos.likes} - 1` }).where(eq(videos.id, videoId));
    return { liked: false };
  } else {
    await db.insert(videoLikes).values({ videoId, userId });
    await db.update(videos).set({ likes: sql`${videos.likes} + 1` }).where(eq(videos.id, videoId));
    return { liked: true };
  }
}

export async function getUserLikedVideos(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const likes = await db.select().from(videoLikes).where(eq(videoLikes.userId, userId));
  return likes.map((l) => l.videoId);
}

// ─── Video Comments ───────────────────────────────────────────────────────────
export async function addVideoComment(videoId: number, userId: number, content: string) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(videoComments).values({ videoId, userId, content });
  await db
    .update(videos)
    .set({ comments: sql`${videos.comments} + 1` })
    .where(eq(videos.id, videoId));
}

export async function getVideoComments(videoId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(videoComments)
    .where(eq(videoComments.videoId, videoId))
    .orderBy(desc(videoComments.createdAt));
}

// ─── Reviews ─────────────────────────────────────────────────────────────────
export async function createReview(data: InsertReview) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(reviews).values(data);

  // Update restaurant average rating
  const allReviews = await db
    .select()
    .from(reviews)
    .where(eq(reviews.restaurantId, data.restaurantId));
  const avg = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
  await db
    .update(restaurants)
    .set({
      averageRating: avg.toFixed(2) as any,
      totalReviews: allReviews.length,
    })
    .where(eq(restaurants.id, data.restaurantId));
}

export async function getReviewsByRestaurant(restaurantId: number, limit = 20, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(reviews)
    .where(eq(reviews.restaurantId, restaurantId))
    .limit(limit)
    .offset(offset)
    .orderBy(desc(reviews.createdAt));
}

export async function getReviewsByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(reviews)
    .where(eq(reviews.userId, userId))
    .orderBy(desc(reviews.createdAt));
}

export async function getAllReviews(limit = 50, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(reviews).limit(limit).offset(offset).orderBy(desc(reviews.createdAt));
}

// ─── Benefits ─────────────────────────────────────────────────────────────────
export async function getBenefitsByRestaurant(restaurantId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(benefits)
    .where(and(eq(benefits.restaurantId, restaurantId), eq(benefits.isActive, true)));
}

export async function getUserBenefits(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(userBenefits).where(eq(userBenefits.userId, userId));
}

// ─── Achievements ─────────────────────────────────────────────────────────────
export async function getUserAchievements(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(userAchievements)
    .where(eq(userAchievements.userId, userId));
}

// ─── Platform Stats ───────────────────────────────────────────────────────────
export async function getPlatformStats() {
  const db = await getDb();
  if (!db) return null;

  const [totalUsersRes, totalRestaurantsRes, totalVideosRes, totalReviewsRes] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(users),
    db.select({ count: sql<number>`count(*)` }).from(restaurants),
    db.select({ count: sql<number>`count(*)` }).from(videos),
    db.select({ count: sql<number>`count(*)` }).from(reviews),
  ]);

  const totalViewsRes = await db
    .select({ total: sql<number>`sum(${videos.views})` })
    .from(videos);

  const pendingVideosRes = await db
    .select({ count: sql<number>`count(*)` })
    .from(videos)
    .where(eq(videos.status, "pending"));

  return {
    totalUsers: Number(totalUsersRes[0]?.count ?? 0),
    totalRestaurants: Number(totalRestaurantsRes[0]?.count ?? 0),
    totalVideos: Number(totalVideosRes[0]?.count ?? 0),
    totalReviews: Number(totalReviewsRes[0]?.count ?? 0),
    totalViews: Number(totalViewsRes[0]?.total ?? 0),
    pendingVideos: Number(pendingVideosRes[0]?.count ?? 0),
  };
}
