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
  restaurantVisits,
  reviews,
  userAchievements,
  userActivities,
  userBenefits,
  users,
  videoComments,
  videoLikes,
  videos,
  friendships,
  userQuizProfiles,
  chatSessions,
  chatMessages,
  placesCache,
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
  return { id: Number((result as any).insertId) };
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

export async function updateVideoTags(id: number, tags: string[]) {
  const db = await getDb();
  if (!db) return;
  await db.update(videos).set({ tags } as any).where(eq(videos.id, id));
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
  const result = await db.insert(reviews).values(data);
  const reviewId = Number((result as any).insertId);

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
  return { id: reviewId };
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

// ─── Friendships ─────────────────────────────────────────────────────────────
export async function sendFriendRequest(requesterId: number, addresseeId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  // Check if already exists
  const existing = await db
    .select()
    .from(friendships)
    .where(
      or(
        and(eq(friendships.requesterId, requesterId), eq(friendships.addresseeId, addresseeId)),
        and(eq(friendships.requesterId, addresseeId), eq(friendships.addresseeId, requesterId))
      ) as any
    )
    .limit(1);
  if (existing.length > 0) return existing[0];
  await db.insert(friendships).values({ requesterId, addresseeId, status: "pending" });
}

export async function respondFriendRequest(
  friendshipId: number,
  userId: number,
  action: "accepted" | "declined"
) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const row = await db.select().from(friendships).where(eq(friendships.id, friendshipId)).limit(1);
  if (!row[0] || row[0].addresseeId !== userId) throw new Error("Not authorized");
  await db.update(friendships).set({ status: action }).where(eq(friendships.id, friendshipId));

  if (action === "accepted") {
    // Increment friend count for both
    await db.update(users).set({ totalFriends: sql`${users.totalFriends} + 1` }).where(eq(users.id, row[0].requesterId));
    await db.update(users).set({ totalFriends: sql`${users.totalFriends} + 1` }).where(eq(users.id, userId));
    // Log activity for both
    await db.insert(userActivities).values({ userId: row[0].requesterId, type: "friendship_started", friendId: userId });
    await db.insert(userActivities).values({ userId, type: "friendship_started", friendId: row[0].requesterId });
  }
}

export async function removeFriend(userId: number, friendId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.delete(friendships).where(
    or(
      and(eq(friendships.requesterId, userId), eq(friendships.addresseeId, friendId)),
      and(eq(friendships.requesterId, friendId), eq(friendships.addresseeId, userId))
    ) as any
  );
  await db.update(users).set({ totalFriends: sql`GREATEST(${users.totalFriends} - 1, 0)` }).where(eq(users.id, userId));
  await db.update(users).set({ totalFriends: sql`GREATEST(${users.totalFriends} - 1, 0)` }).where(eq(users.id, friendId));
}

export async function getFriendshipStatus(userId: number, otherId: number) {
  const db = await getDb();
  if (!db) return null;
  const row = await db
    .select()
    .from(friendships)
    .where(
      or(
        and(eq(friendships.requesterId, userId), eq(friendships.addresseeId, otherId)),
        and(eq(friendships.requesterId, otherId), eq(friendships.addresseeId, userId))
      ) as any
    )
    .limit(1);
  return row[0] ?? null;
}

export async function getFriendIds(userId: number): Promise<number[]> {
  const db = await getDb();
  if (!db) return [];
  const rows = await db
    .select()
    .from(friendships)
    .where(
      and(
        eq(friendships.status, "accepted"),
        or(eq(friendships.requesterId, userId), eq(friendships.addresseeId, userId)) as any
      )
    );
  return rows.map((r) => (r.requesterId === userId ? r.addresseeId : r.requesterId));
}

export async function getFriends(userId: number) {
  const friendIds = await getFriendIds(userId);
  if (friendIds.length === 0) return [];
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users).where(
    sql`${users.id} IN (${sql.join(friendIds.map((id) => sql`${id}`), sql`, `)})`
  );
}

export async function getPendingRequests(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db
    .select()
    .from(friendships)
    .where(and(eq(friendships.addresseeId, userId), eq(friendships.status, "pending")));
  if (rows.length === 0) return [];
  const requesterIds = rows.map((r) => r.requesterId);
  const requesterUsers = await db.select().from(users).where(
    sql`${users.id} IN (${sql.join(requesterIds.map((id) => sql`${id}`), sql`, `)})`
  );
  return rows.map((r) => ({
    ...r,
    requester: requesterUsers.find((u) => u.id === r.requesterId),
  }));
}

export async function getSentRequests(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(friendships).where(
    and(eq(friendships.requesterId, userId), eq(friendships.status, "pending"))
  );
}

// ─── User Search ──────────────────────────────────────────────────────────────
export async function searchUsers(query: string, excludeId?: number, limit = 20) {
  const db = await getDb();
  if (!db) return [];
  const conditions: any[] = [
    or(
      like(users.name, `%${query}%`),
      like(users.username, `%${query}%`),
      like(users.email, `%${query}%`)
    ),
  ];
  if (excludeId) conditions.push(sql`${users.id} != ${excludeId}`);
  return db
    .select({
      id: users.id,
      name: users.name,
      username: users.username,
      avatarUrl: users.avatarUrl,
      bio: users.bio,
      city: users.city,
      totalVideos: users.totalVideos,
      totalFriends: users.totalFriends,
    })
    .from(users)
    .where(and(...conditions))
    .limit(limit);
}

export async function getUserPublicProfile(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select({
      id: users.id,
      name: users.name,
      username: users.username,
      avatarUrl: users.avatarUrl,
      coverUrl: users.coverUrl,
      bio: users.bio,
      city: users.city,
      favoriteCuisine: users.favoriteCuisine,
      instagramHandle: users.instagramHandle,
      tiktokHandle: users.tiktokHandle,
      totalVideos: users.totalVideos,
      totalLikes: users.totalLikes,
      totalReviews: users.totalReviews,
      totalRestaurantsVisited: users.totalRestaurantsVisited,
      totalFriends: users.totalFriends,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return result[0];
}

// ─── User Activities ──────────────────────────────────────────────────────────
export async function logActivity(data: {
  userId: number;
  type: "video_posted" | "video_approved" | "review_posted" | "restaurant_visited" | "achievement_earned" | "friendship_started";
  restaurantId?: number;
  videoId?: number;
  reviewId?: number;
  achievementId?: number;
  friendId?: number;
  metadata?: Record<string, unknown>;
}) {
  const db = await getDb();
  if (!db) return;
  await db.insert(userActivities).values(data);
}

export async function getFriendsFeed(userId: number, limit = 30, offset = 0) {
  const friendIds = await getFriendIds(userId);
  if (friendIds.length === 0) return [];
  const db = await getDb();
  if (!db) return [];

  const activities = await db
    .select()
    .from(userActivities)
    .where(sql`${userActivities.userId} IN (${sql.join(friendIds.map((id) => sql`${id}`), sql`, `)})`)
    .orderBy(desc(userActivities.createdAt))
    .limit(limit)
    .offset(offset);

  if (activities.length === 0) return [];

  // Enrich with user data
  const actorIds = Array.from(new Set(activities.map((a) => a.userId)));
  const actorUsers = await db.select({
    id: users.id, name: users.name, username: users.username, avatarUrl: users.avatarUrl,
  }).from(users).where(sql`${users.id} IN (${sql.join(actorIds.map((id) => sql`${id}`), sql`, `)})`);

  // Enrich with restaurant data
  const restaurantIds = Array.from(new Set(activities.filter((a) => a.restaurantId).map((a) => a.restaurantId!)));
  const activityRestaurants = restaurantIds.length > 0
    ? await db.select({ id: restaurants.id, name: restaurants.name, slug: restaurants.slug, logoUrl: restaurants.logoUrl, neighborhood: restaurants.neighborhood, averageRating: restaurants.averageRating })
        .from(restaurants)
        .where(sql`${restaurants.id} IN (${sql.join(restaurantIds.map((id) => sql`${id}`), sql`, `)})`)
    : [];

  // Enrich with video data
  const videoIds = Array.from(new Set(activities.filter((a) => a.videoId).map((a) => a.videoId!)));
  const activityVideos = videoIds.length > 0
    ? await db.select({ id: videos.id, title: videos.title, thumbnailUrl: videos.thumbnailUrl, views: videos.views, likes: videos.likes })
        .from(videos)
        .where(sql`${videos.id} IN (${sql.join(videoIds.map((id) => sql`${id}`), sql`, `)})`)
    : [];

  return activities.map((a) => ({
    ...a,
    user: actorUsers.find((u) => u.id === a.userId),
    restaurant: activityRestaurants.find((r) => r.id === a.restaurantId),
    video: activityVideos.find((v) => v.id === a.videoId),
  }));
}

// ─── Restaurant Visits ────────────────────────────────────────────────────────
export async function recordVisit(userId: number, restaurantId: number, videoId?: number, reviewId?: number) {
  const db = await getDb();
  if (!db) return;
  // Check if already visited
  const existing = await db
    .select()
    .from(restaurantVisits)
    .where(and(eq(restaurantVisits.userId, userId), eq(restaurantVisits.restaurantId, restaurantId)))
    .limit(1);
  if (existing.length === 0) {
    await db.update(users).set({ totalRestaurantsVisited: sql`${users.totalRestaurantsVisited} + 1` }).where(eq(users.id, userId));
  }
  await db.insert(restaurantVisits).values({ userId, restaurantId, videoId, reviewId });
}

export async function getUserVisitedRestaurants(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const visits = await db
    .select({ restaurantId: restaurantVisits.restaurantId, visitedAt: restaurantVisits.visitedAt })
    .from(restaurantVisits)
    .where(eq(restaurantVisits.userId, userId))
    .orderBy(desc(restaurantVisits.visitedAt));

  if (visits.length === 0) return [];
  const uniqueIds = Array.from(new Set(visits.map((v) => v.restaurantId)));
  const restaurantData = await db
    .select()
    .from(restaurants)
    .where(sql`${restaurants.id} IN (${sql.join(uniqueIds.map((id) => sql`${id}`), sql`, `)})`);

  return uniqueIds.map((id) => ({
    ...restaurantData.find((r) => r.id === id)!,
    lastVisit: visits.find((v) => v.restaurantId === id)?.visitedAt,
  })).filter((r) => r.id);
}

export async function getFriendsWhoVisited(restaurantId: number, userId: number) {
  const friendIds = await getFriendIds(userId);
  if (friendIds.length === 0) return [];
  const db = await getDb();
  if (!db) return [];
  const visits = await db
    .select({ userId: restaurantVisits.userId, visitedAt: restaurantVisits.visitedAt })
    .from(restaurantVisits)
    .where(
      and(
        eq(restaurantVisits.restaurantId, restaurantId),
        sql`${restaurantVisits.userId} IN (${sql.join(friendIds.map((id) => sql`${id}`), sql`, `)})`
      )
    )
    .orderBy(desc(restaurantVisits.visitedAt));

  if (visits.length === 0) return [];
  const visitorIds = Array.from(new Set(visits.map((v) => v.userId)));
  const visitorUsers = await db.select({
    id: users.id, name: users.name, username: users.username, avatarUrl: users.avatarUrl,
  }).from(users).where(sql`${users.id} IN (${sql.join(visitorIds.map((id) => sql`${id}`), sql`, `)})`);

  return visitorUsers.map((u) => ({
    ...u,
    lastVisit: visits.find((v) => v.userId === u.id)?.visitedAt,
  }));
}

// ─── Quiz de Perfil ───────────────────────────────────────────────────────────
export async function getOrCreateQuizProfile(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const existing = await db.select().from(userQuizProfiles).where(eq(userQuizProfiles.userId, userId)).limit(1);
  if (existing[0]) return existing[0];
  await db.insert(userQuizProfiles).values({ userId, quizCompleted: false });
  const created = await db.select().from(userQuizProfiles).where(eq(userQuizProfiles.userId, userId)).limit(1);
  return created[0] ?? null;
}

export async function updateQuizProfile(userId: number, data: {
  cuisinePrefs?: string[];
  budgetRange?: "economico" | "moderado" | "premium" | "luxo";
  ambience?: string[];
  companionType?: "sozinho" | "casal" | "amigos" | "familia" | "negocios";
  preferredNeighborhoods?: string[];
  interests?: string[];
  dietaryRestrictions?: string[];
  quizCompleted?: boolean;
}) {
  const db = await getDb();
  if (!db) return;
  await db.insert(userQuizProfiles)
    .values({ userId, ...data })
    .onDuplicateKeyUpdate({ set: data });
}

// ─── Chat Sessions ────────────────────────────────────────────────────────────
export async function getOrCreateChatSession(userId: number, sessionKey: string) {
  const db = await getDb();
  if (!db) return null;
  const existing = await db.select().from(chatSessions).where(eq(chatSessions.sessionKey, sessionKey)).limit(1);
  if (existing[0]) return existing[0];
  await db.insert(chatSessions).values({ userId, sessionKey, title: "Nova conversa" });
  const created = await db.select().from(chatSessions).where(eq(chatSessions.sessionKey, sessionKey)).limit(1);
  return created[0] ?? null;
}

export async function getUserChatSessions(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(chatSessions)
    .where(eq(chatSessions.userId, userId))
    .orderBy(desc(chatSessions.updatedAt))
    .limit(20);
}

export async function updateChatSessionTitle(sessionId: number, title: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(chatSessions).set({ title }).where(eq(chatSessions.id, sessionId));
}

// ─── Chat Messages ────────────────────────────────────────────────────────────
export async function saveChatMessage(sessionId: number, role: "user" | "assistant", content: string, recommendedPlaces?: string[]) {
  const db = await getDb();
  if (!db) return null;
  await db.insert(chatMessages).values({ sessionId, role, content, recommendedPlaces: recommendedPlaces ?? [] });
  const msgs = await db.select().from(chatMessages)
    .where(eq(chatMessages.sessionId, sessionId))
    .orderBy(desc(chatMessages.createdAt))
    .limit(1);
  return msgs[0] ?? null;
}

export async function getChatHistory(sessionId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(chatMessages)
    .where(eq(chatMessages.sessionId, sessionId))
    .orderBy(chatMessages.createdAt);
}

// ─── Places Cache ─────────────────────────────────────────────────────────────
export async function getCachedPlace(placeId: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(placesCache).where(eq(placesCache.placeId, placeId)).limit(1);
  const place = result[0];
  if (!place) return null;
  // Check TTL (7 days)
  if (place.expiresAt && new Date() > place.expiresAt) return null;
  return place;
}

export async function upsertPlaceCache(data: {
  placeId: string;
  name: string;
  category?: string;
  address?: string;
  neighborhood?: string;
  city?: string;
  rating?: string;
  totalRatings?: number;
  priceLevel?: number;
  types?: string[];
  positiveReviews?: string[];
  negativeReviews?: string[];
  aiSummary?: string;
  highlights?: string[];
  mapsUrl?: string;
  website?: string;
  phone?: string;
  openNow?: boolean;
  photoUrl?: string;
  lat?: string;
  lng?: string;
}) {
  const db = await getDb();
  if (!db) return;
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  const values = { ...data, cachedAt: new Date(), expiresAt };
  await db.insert(placesCache).values(values).onDuplicateKeyUpdate({ set: values });
}

export async function searchCachedPlaces(query: string, limit = 5) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(placesCache)
    .where(
      or(
        like(placesCache.name, `%${query}%`),
        like(placesCache.category, `%${query}%`),
        like(placesCache.neighborhood, `%${query}%`)
      )
    )
    .limit(limit);
}
