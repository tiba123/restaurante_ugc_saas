import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import {
  addVideoComment,
  createRestaurant,
  createReview,
  createVideo,
  getAllRestaurants,
  getAllUsers,
  getAllVideos,
  getFeedVideos,
  getPlatformStats,
  getRestaurantAccountByOpenId,
  getRestaurantById,
  getRestaurantByOwnerId,
  getRestaurantBySlug,
  getReviewsByRestaurant,
  getReviewsByUser,
  getUserAchievements,
  getUserBenefits,
  getUserById,
  getUserByOpenId,
  getUserLikedVideos,
  getVideoById,
  getVideoComments,
  getVideosByRestaurant,
  getVideosByUser,
  incrementVideoViews,
  listRestaurants,
  toggleVideoLike,
  updateRestaurant,
  updateUserProfile,
  updateVideoStatus,
  upsertRestaurantAccount,
  getAllReviews,
  updateVideoTags,
  sendFriendRequest,
  respondFriendRequest,
  removeFriend,
  getFriendshipStatus,
  getFriends,
  getPendingRequests,
  getSentRequests,
  searchUsers,
  getUserPublicProfile,
  getFriendsFeed,
  logActivity,
  recordVisit,
  getUserVisitedRestaurants,
  getFriendsWhoVisited,
} from "./db";
import { storagePut } from "./storage";
import { generateAutoTags, serializeTags, deserializeTags, getTagMeta } from "./autoTags";

// ─── Auth Router ──────────────────────────────────────────────────────────────
const authRouter = router({
  me: publicProcedure.query((opts) => opts.ctx.user),
  logout: publicProcedure.mutation(({ ctx }) => {
    const cookieOptions = getSessionCookieOptions(ctx.req);
    ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
    return { success: true } as const;
  }),
});

// ─── Videos Router ────────────────────────────────────────────────────────────
const videosRouter = router({
  feed: publicProcedure
    .input(z.object({ limit: z.number().default(10), offset: z.number().default(0) }))
    .query(async ({ input }) => {
      const items = await getFeedVideos(input.limit, input.offset);
      // Enrich with restaurant info
      const enriched = await Promise.all(
        items.map(async (v) => {
          const restaurant = await getRestaurantById(v.restaurantId);
          const user = await getUserById(v.userId);
          return { ...v, restaurant, user };
        })
      );
      return enriched;
    }),

  byId: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const video = await getVideoById(input.id);
      if (!video) throw new TRPCError({ code: "NOT_FOUND" });
      await incrementVideoViews(input.id);
      const restaurant = await getRestaurantById(video.restaurantId);
      const user = await getUserById(video.userId);
      return { ...video, restaurant, user };
    }),

  upload: protectedProcedure
    .input(
      z.object({
        restaurantId: z.number(),
        title: z.string().optional(),
        description: z.string().optional(),
        rating: z.number().min(1).max(5).optional(),
        tags: z.array(z.string()).optional(),
        videoBase64: z.string(),
        videoMimeType: z.string().default("video/mp4"),
        thumbnailBase64: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.user.id;
      const videoBuffer = Buffer.from(input.videoBase64, "base64");
      const videoKey = `videos/${userId}/${Date.now()}.mp4`;
      const { url: videoUrl } = await storagePut(videoKey, videoBuffer, input.videoMimeType);

      let thumbnailUrl: string | undefined;
      let thumbnailKey: string | undefined;
      if (input.thumbnailBase64) {
        const thumbBuffer = Buffer.from(input.thumbnailBase64, "base64");
        const tKey = `thumbnails/${userId}/${Date.now()}.jpg`;
        const { url: tUrl } = await storagePut(tKey, thumbBuffer, "image/jpeg");
        thumbnailUrl = tUrl;
        thumbnailKey = tKey;
      }

      // Generate auto tags via LLM
      const restaurant = await getRestaurantById(input.restaurantId);
      const autoTags = await generateAutoTags({
        title: input.title,
        description: input.description,
        rating: input.rating,
        restaurantName: restaurant?.name,
        cuisine: restaurant?.cuisine,
      });
      const serializedTags = serializeTags(autoTags);

      const newVideo = await createVideo({
        userId,
        restaurantId: input.restaurantId,
        title: input.title,
        description: input.description,
        videoUrl,
        videoKey,
        thumbnailUrl,
        thumbnailKey,
        rating: input.rating,
        tags: serializedTags as any,
        status: "pending",
        isPublic: false,
      });

      // Log social activity
      try {
        await logActivity({ userId, type: "video_posted", restaurantId: input.restaurantId, videoId: newVideo?.id });
        await recordVisit(userId, input.restaurantId);
      } catch (e) { console.warn("[Activity] Failed to log upload activity:", e); }

      return { success: true, message: "Vídeo enviado para aprovação do restaurante.", autoTags };
    }),

  like: protectedProcedure
    .input(z.object({ videoId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      return toggleVideoLike(input.videoId, ctx.user.id);
    }),

  comment: protectedProcedure
    .input(z.object({ videoId: z.number(), content: z.string().min(1).max(500) }))
    .mutation(async ({ input, ctx }) => {
      await addVideoComment(input.videoId, ctx.user.id, input.content);
      return { success: true };
    }),

  comments: publicProcedure
    .input(z.object({ videoId: z.number() }))
    .query(async ({ input }) => {
      const comments = await getVideoComments(input.videoId);
      const enriched = await Promise.all(
        comments.map(async (c) => {
          const user = await getUserById(c.userId);
          return { ...c, user };
        })
      );
      return enriched;
    }),

  myVideos: protectedProcedure.query(async ({ ctx }) => {
    const items = await getVideosByUser(ctx.user.id);
    const enriched = await Promise.all(
      items.map(async (v) => {
        const restaurant = await getRestaurantById(v.restaurantId);
        return { ...v, restaurant };
      })
    );
    return enriched;
  }),

  likedVideoIds: protectedProcedure.query(async ({ ctx }) => {
    return getUserLikedVideos(ctx.user.id);
  }),
});

// ─── Restaurants Router ───────────────────────────────────────────────────────
const restaurantsRouter = router({
  list: publicProcedure
    .input(
      z.object({
        search: z.string().optional(),
        category: z.string().optional(),
        neighborhood: z.string().optional(),
        minRating: z.number().optional(),
        limit: z.number().default(20),
        offset: z.number().default(0),
      })
    )
    .query(async ({ input }) => {
      return listRestaurants(input);
    }),

  bySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      const restaurant = await getRestaurantBySlug(input.slug);
      if (!restaurant) throw new TRPCError({ code: "NOT_FOUND" });
      const restaurantVideos = await getVideosByRestaurant(restaurant.id, "approved");
      const restaurantReviews = await getReviewsByRestaurant(restaurant.id);
      const enrichedReviews = await Promise.all(
        restaurantReviews.map(async (r) => {
          const user = await getUserById(r.userId);
          return { ...r, user };
        })
      );
      return { ...restaurant, videos: restaurantVideos, reviews: enrichedReviews };
    }),

  byId: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const restaurant = await getRestaurantById(input.id);
      if (!restaurant) throw new TRPCError({ code: "NOT_FOUND" });
      return restaurant;
    }),

  register: protectedProcedure
    .input(
      z.object({
        name: z.string().min(2),
        cuisine: z.string().optional(),
        category: z.string().optional(),
        address: z.string().optional(),
        neighborhood: z.string().optional(),
        phone: z.string().optional(),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const slug = input.name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

      await createRestaurant({
        ownerId: ctx.user.id,
        name: input.name,
        slug: `${slug}-${Date.now()}`,
        cuisine: input.cuisine,
        category: input.category as any,
        address: input.address,
        neighborhood: input.neighborhood,
        phone: input.phone,
        description: input.description,
      });

      return { success: true };
    }),
});

// ─── Reviews Router ───────────────────────────────────────────────────────────
const reviewsRouter = router({
  byRestaurant: publicProcedure
    .input(z.object({ restaurantId: z.number(), limit: z.number().default(20), offset: z.number().default(0) }))
    .query(async ({ input }) => {
      const items = await getReviewsByRestaurant(input.restaurantId, input.limit, input.offset);
      const enriched = await Promise.all(
        items.map(async (r) => {
          const user = await getUserById(r.userId);
          return { ...r, user };
        })
      );
      return enriched;
    }),

  create: protectedProcedure
    .input(
      z.object({
        restaurantId: z.number(),
        rating: z.number().min(1).max(5),
        title: z.string().optional(),
        content: z.string().optional(),
        tags: z.array(z.string()).optional(),
        foodRating: z.number().min(1).max(5).optional(),
        serviceRating: z.number().min(1).max(5).optional(),
        ambianceRating: z.number().min(1).max(5).optional(),
        valueRating: z.number().min(1).max(5).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const newReview = await createReview({
        userId: ctx.user.id,
        restaurantId: input.restaurantId,
        rating: input.rating,
        title: input.title,
        content: input.content,
        tags: input.tags as any,
        foodRating: input.foodRating,
        serviceRating: input.serviceRating,
        ambianceRating: input.ambianceRating,
        valueRating: input.valueRating,
      });
      // Log social activity
      try {
        await logActivity({ userId: ctx.user.id, type: "review_posted", restaurantId: input.restaurantId, reviewId: newReview?.id });
        await recordVisit(ctx.user.id, input.restaurantId);
      } catch (e) { console.warn("[Activity] Failed to log review activity:", e); }
      return { success: true };
    }),
});

// ─── Consumer Router ──────────────────────────────────────────────────────────
const consumerRouter = router({
  profile: protectedProcedure.query(async ({ ctx }) => {
    const user = await getUserById(ctx.user.id);
    if (!user) throw new TRPCError({ code: "NOT_FOUND" });
    const myVideos = await getVideosByUser(ctx.user.id);
    const myReviews = await getReviewsByUser(ctx.user.id);
    const myAchievements = await getUserAchievements(ctx.user.id);
    const myBenefits = await getUserBenefits(ctx.user.id);
    return { ...user, videos: myVideos, reviews: myReviews, achievements: myAchievements, benefits: myBenefits };
  }),

  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().optional(),
        bio: z.string().optional(),
        avatarUrl: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      await updateUserProfile(ctx.user.id, input);
      return { success: true };
    }),

  uploadAvatar: protectedProcedure
    .input(z.object({ imageBase64: z.string(), mimeType: z.string().default("image/jpeg") }))
    .mutation(async ({ input, ctx }) => {
      const buffer = Buffer.from(input.imageBase64, "base64");
      const key = `avatars/${ctx.user.id}/${Date.now()}.jpg`;
      const { url } = await storagePut(key, buffer, input.mimeType);
      await updateUserProfile(ctx.user.id, { avatarUrl: url });
      return { url };
    }),
});

// ─── Restaurant Dashboard Router ──────────────────────────────────────────────
const restaurantDashboardRouter = router({
  myRestaurant: protectedProcedure.query(async ({ ctx }) => {
    const restaurant = await getRestaurantByOwnerId(ctx.user.id);
    if (!restaurant) return null;
    return restaurant;
  }),

  pendingVideos: protectedProcedure.query(async ({ ctx }) => {
    const restaurant = await getRestaurantByOwnerId(ctx.user.id);
    if (!restaurant) throw new TRPCError({ code: "NOT_FOUND", message: "Restaurante não encontrado" });
    const pending = await getVideosByRestaurant(restaurant.id, "pending");
    const enriched = await Promise.all(
      pending.map(async (v) => {
        const user = await getUserById(v.userId);
        return { ...v, user };
      })
    );
    return enriched;
  }),

  allVideos: protectedProcedure.query(async ({ ctx }) => {
    const restaurant = await getRestaurantByOwnerId(ctx.user.id);
    if (!restaurant) throw new TRPCError({ code: "NOT_FOUND" });
    const items = await getVideosByRestaurant(restaurant.id);
    const enriched = await Promise.all(
      items.map(async (v) => {
        const user = await getUserById(v.userId);
        return { ...v, user };
      })
    );
    return enriched;
  }),

  approveVideo: protectedProcedure
    .input(z.object({ videoId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const video = await getVideoById(input.videoId);
      if (!video) throw new TRPCError({ code: "NOT_FOUND" });
      const restaurant = await getRestaurantByOwnerId(ctx.user.id);
      if (!restaurant || video.restaurantId !== restaurant.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      await updateVideoStatus(input.videoId, "approved", { approvedBy: ctx.user.id });
      // Update restaurant video count
      await updateRestaurant(restaurant.id, { totalVideos: restaurant.totalVideos + 1 });
      // Log social activity for the video owner
      try {
        await logActivity({ userId: video.userId, type: "video_approved", restaurantId: video.restaurantId, videoId: video.id });
      } catch (e) { console.warn("[Activity] Failed to log approval activity:", e); }
      // Re-generate auto tags on approval if video has no tags or only manual tags
      const existingTags = Array.isArray(video.tags) ? video.tags : [];
      if (existingTags.length === 0) {
        try {
          const autoTags = await generateAutoTags({
            title: video.title,
            description: video.description,
            rating: video.rating,
            restaurantName: restaurant.name,
            cuisine: restaurant.cuisine,
          });
          await updateVideoTags(input.videoId, serializeTags(autoTags));
        } catch (e) {
          console.warn("[AutoTags] Failed to generate tags on approval:", e);
        }
      }
      return { success: true };
    }),

  rejectVideo: protectedProcedure
    .input(z.object({ videoId: z.number(), reason: z.string().optional() }))
    .mutation(async ({ input, ctx }) => {
      const video = await getVideoById(input.videoId);
      if (!video) throw new TRPCError({ code: "NOT_FOUND" });
      const restaurant = await getRestaurantByOwnerId(ctx.user.id);
      if (!restaurant || video.restaurantId !== restaurant.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      await updateVideoStatus(input.videoId, "rejected", { rejectionReason: input.reason });
      return { success: true };
    }),

  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().optional(),
        description: z.string().optional(),
        cuisine: z.string().optional(),
        category: z.string().optional(),
        address: z.string().optional(),
        neighborhood: z.string().optional(),
        phone: z.string().optional(),
        website: z.string().optional(),
        instagramHandle: z.string().optional(),
        priceRange: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const restaurant = await getRestaurantByOwnerId(ctx.user.id);
      if (!restaurant) throw new TRPCError({ code: "NOT_FOUND" });
      await updateRestaurant(restaurant.id, input as any);
      return { success: true };
    }),

  uploadLogo: protectedProcedure
    .input(z.object({ imageBase64: z.string(), mimeType: z.string().default("image/jpeg") }))
    .mutation(async ({ input, ctx }) => {
      const restaurant = await getRestaurantByOwnerId(ctx.user.id);
      if (!restaurant) throw new TRPCError({ code: "NOT_FOUND" });
      const buffer = Buffer.from(input.imageBase64, "base64");
      const key = `logos/${restaurant.id}/${Date.now()}.jpg`;
      const { url } = await storagePut(key, buffer, input.mimeType);
      await updateRestaurant(restaurant.id, { logoUrl: url });
      return { url };
    }),

  metrics: protectedProcedure.query(async ({ ctx }) => {
    const restaurant = await getRestaurantByOwnerId(ctx.user.id);
    if (!restaurant) throw new TRPCError({ code: "NOT_FOUND" });
    const allVideos = await getVideosByRestaurant(restaurant.id);
    const approved = allVideos.filter((v) => v.status === "approved");
    const pending = allVideos.filter((v) => v.status === "pending");
    const rejected = allVideos.filter((v) => v.status === "rejected");
    const totalViews = approved.reduce((sum, v) => sum + v.views, 0);
    const totalLikes = approved.reduce((sum, v) => sum + v.likes, 0);
    const totalComments = approved.reduce((sum, v) => sum + v.comments, 0);
    const reviews = await getReviewsByRestaurant(restaurant.id);

    // ── Tag distribution from approved videos ──────────────────────────────
    const tagCounts: Record<string, { label: string; category: string; emoji: string; count: number; views: number; likes: number }> = {};
    for (const video of approved) {
      const rawTags = Array.isArray(video.tags) ? (video.tags as string[]) : [];
      const parsed = deserializeTags(rawTags);
      for (const tag of parsed) {
        const key = `${tag.label}|${tag.category}`;
        if (!tagCounts[key]) {
          tagCounts[key] = { label: tag.label, category: tag.category, emoji: tag.emoji, count: 0, views: 0, likes: 0 };
        }
        tagCounts[key].count += 1;
        tagCounts[key].views += video.views;
        tagCounts[key].likes += video.likes;
      }
    }
    const tagDistribution = Object.values(tagCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 12);

    // ── Category summary ───────────────────────────────────────────────────
    const categoryCounts: Record<string, number> = {};
    for (const t of tagDistribution) {
      categoryCounts[t.category] = (categoryCounts[t.category] ?? 0) + t.count;
    }
    const categoryDistribution = Object.entries(categoryCounts).map(([category, count]) => {
      const meta = getTagMeta(category as any);
      return { category, count, color: meta.color, label: meta.label };
    }).sort((a, b) => b.count - a.count);

    return {
      restaurant,
      totalVideos: allVideos.length,
      approvedVideos: approved.length,
      pendingVideos: pending.length,
      rejectedVideos: rejected.length,
      totalViews,
      totalLikes,
      totalComments,
      totalReviews: reviews.length,
      averageRating: restaurant.averageRating,
      tagDistribution,
      categoryDistribution,
    };
  }),
});

// ─── Admin Router ─────────────────────────────────────────────────────────────
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
  return next({ ctx });
});

const adminRouter = router({
  stats: adminProcedure.query(async () => {
    return getPlatformStats();
  }),

  users: adminProcedure
    .input(z.object({ limit: z.number().default(50), offset: z.number().default(0) }))
    .query(async ({ input }) => {
      return getAllUsers(input.limit, input.offset);
    }),

  restaurants: adminProcedure
    .input(z.object({ limit: z.number().default(50), offset: z.number().default(0) }))
    .query(async ({ input }) => {
      return getAllRestaurants(input.limit, input.offset);
    }),

  videos: adminProcedure
    .input(z.object({ limit: z.number().default(50), offset: z.number().default(0) }))
    .query(async ({ input }) => {
      const items = await getAllVideos(input.limit, input.offset);
      const enriched = await Promise.all(
        items.map(async (v) => {
          const restaurant = await getRestaurantById(v.restaurantId);
          const user = await getUserById(v.userId);
          return { ...v, restaurant, user };
        })
      );
      return enriched;
    }),

  reviews: adminProcedure
    .input(z.object({ limit: z.number().default(50), offset: z.number().default(0) }))
    .query(async ({ input }) => {
      const items = await getAllReviews(input.limit, input.offset);
      const enriched = await Promise.all(
        items.map(async (r) => {
          const user = await getUserById(r.userId);
          const restaurant = await getRestaurantById(r.restaurantId);
          return { ...r, user, restaurant };
        })
      );
      return enriched;
    }),

  toggleRestaurantStatus: adminProcedure
    .input(z.object({ restaurantId: z.number(), isActive: z.boolean() }))
    .mutation(async ({ input }) => {
      await updateRestaurant(input.restaurantId, { isActive: input.isActive });
      return { success: true };
    }),

  moderateVideo: adminProcedure
    .input(z.object({ videoId: z.number(), status: z.enum(["approved", "rejected"]), reason: z.string().optional() }))
    .mutation(async ({ input }) => {
      await updateVideoStatus(input.videoId, input.status, { rejectionReason: input.reason });
      return { success: true };
    }),

  // New admin endpoints used by AdminDashboard
  overview: adminProcedure.query(async () => {
    const stats = await getPlatformStats();
    const allVids = await getAllVideos(1000, 0);
    const approved = allVids.filter((v) => v.status === "approved").length;
    const pending = allVids.filter((v) => v.status === "pending").length;
    const rejected = allVids.filter((v) => v.status === "rejected").length;
    const totalViews = allVids.reduce((s, v) => s + v.views, 0);
    const totalLikes = allVids.reduce((s, v) => s + v.likes, 0);
    const totalComments = allVids.reduce((s, v) => s + v.comments, 0);
    const allRevs = await getAllReviews(1000, 0);
    const allRests = await getAllRestaurants(1000, 0);
    const allUsrs = await getAllUsers(1000, 0);
    const verified = allRests.filter((r) => r.isVerified).length;
    return {
      isAdmin: true,
      totalVideos: allVids.length,
      approvedVideos: approved,
      pendingVideos: pending,
      rejectedVideos: rejected,
      totalViews,
      totalLikes,
      totalComments,
      totalReviews: allRevs.length,
      totalRestaurants: allRests.length,
      verifiedRestaurants: verified,
      totalUsers: allUsrs.length,
    };
  }),

  allVideos: adminProcedure
    .input(z.object({ search: z.string().optional() }))
    .query(async ({ input }) => {
      const items = await getAllVideos(200, 0);
      const enriched = await Promise.all(
        items.map(async (v) => {
          const restaurant = await getRestaurantById(v.restaurantId);
          const user = await getUserById(v.userId);
          return { ...v, restaurant, user };
        })
      );
      if (input.search) {
        const q = input.search.toLowerCase();
        return enriched.filter(
          (v) =>
            v.title?.toLowerCase().includes(q) ||
            v.restaurant?.name?.toLowerCase().includes(q) ||
            v.user?.name?.toLowerCase().includes(q)
        );
      }
      return enriched;
    }),

  allRestaurants: adminProcedure
    .input(z.object({ search: z.string().optional() }))
    .query(async ({ input }) => {
      const items = await getAllRestaurants(200, 0);
      if (input.search) {
        const q = input.search.toLowerCase();
        return items.filter((r) => r.name.toLowerCase().includes(q) || r.neighborhood?.toLowerCase().includes(q));
      }
      return items;
    }),

  allUsers: adminProcedure.query(async () => {
    return getAllUsers(200, 0);
  }),

  approveVideo: adminProcedure
    .input(z.object({ videoId: z.number() }))
    .mutation(async ({ input }) => {
      await updateVideoStatus(input.videoId, "approved", {});
      return { success: true };
    }),

  rejectVideo: adminProcedure
    .input(z.object({ videoId: z.number(), reason: z.string().optional() }))
    .mutation(async ({ input }) => {
      await updateVideoStatus(input.videoId, "rejected", { rejectionReason: input.reason });
      return { success: true };
    }),

  verifyRestaurant: adminProcedure
    .input(z.object({ restaurantId: z.number() }))
    .mutation(async ({ input }) => {
      await updateRestaurant(input.restaurantId, { isVerified: true });
      return { success: true };
    }),

  promoteUser: adminProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ input }) => {
      await updateUserProfile(input.userId, { role: "admin" } as any);
      return { success: true };
    }),
});

// ─── Social Router ────────────────────────────────────────────────────────────
const socialRouter = router({
  searchUsers: protectedProcedure
    .input(z.object({ query: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const results = await searchUsers(input.query, ctx.user.id);
      const enriched = await Promise.all(
        results.map(async (u) => {
          const fs = await getFriendshipStatus(ctx.user.id, u.id);
          return { ...u, friendshipStatus: fs?.status ?? null, friendshipId: fs?.id ?? null, isRequester: fs?.requesterId === ctx.user.id };
        })
      );
      return enriched;
    }),

  getProfile: protectedProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ ctx, input }) => {
      const profile = await getUserPublicProfile(input.userId);
      if (!profile) throw new TRPCError({ code: "NOT_FOUND" });
      const fs = await getFriendshipStatus(ctx.user.id, input.userId);
      const userVideos = await getVideosByUser(input.userId);
      const approvedVideos = userVideos.filter((v) => v.status === "approved");
      const userReviews = await getReviewsByUser(input.userId);
      const visitedRestaurants = await getUserVisitedRestaurants(input.userId);
      const friends = await getFriends(input.userId);
      return {
        ...profile,
        friendshipStatus: fs?.status ?? null,
        friendshipId: fs?.id ?? null,
        isRequester: fs?.requesterId === ctx.user.id,
        videos: approvedVideos.slice(0, 12),
        reviews: userReviews.slice(0, 6),
        visitedRestaurants: visitedRestaurants.slice(0, 12),
        friends: friends.slice(0, 8),
      };
    }),

  getMyProfile: protectedProcedure.query(async ({ ctx }) => {
    const profile = await getUserPublicProfile(ctx.user.id);
    if (!profile) throw new TRPCError({ code: "NOT_FOUND" });
    const userVideos = await getVideosByUser(ctx.user.id);
    const userReviews = await getReviewsByUser(ctx.user.id);
    const visitedRestaurants = await getUserVisitedRestaurants(ctx.user.id);
    const friends = await getFriends(ctx.user.id);
    const pendingRequests = await getPendingRequests(ctx.user.id);
    return {
      ...profile,
      videos: userVideos,
      reviews: userReviews,
      visitedRestaurants,
      friends,
      pendingRequestsCount: pendingRequests.length,
    };
  }),

  updateProfile: protectedProcedure
    .input(z.object({
      name: z.string().optional(),
      username: z.string().min(3).max(30).regex(/^[a-z0-9_]+$/).optional(),
      bio: z.string().max(300).optional(),
      city: z.string().optional(),
      favoriteCuisine: z.string().optional(),
      instagramHandle: z.string().optional(),
      tiktokHandle: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      await updateUserProfile(ctx.user.id, input as any);
      return { success: true };
    }),

  uploadAvatar: protectedProcedure
    .input(z.object({ base64: z.string(), mimeType: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const buf = Buffer.from(input.base64, "base64");
      const key = `avatars/${ctx.user.id}-${Date.now()}.jpg`;
      const { url } = await storagePut(key, buf, input.mimeType);
      await updateUserProfile(ctx.user.id, { avatarUrl: url } as any);
      return { url };
    }),

  uploadCover: protectedProcedure
    .input(z.object({ base64: z.string(), mimeType: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const buf = Buffer.from(input.base64, "base64");
      const key = `covers/${ctx.user.id}-${Date.now()}.jpg`;
      const { url } = await storagePut(key, buf, input.mimeType);
      await updateUserProfile(ctx.user.id, { coverUrl: url } as any);
      return { url };
    }),

  sendRequest: protectedProcedure
    .input(z.object({ addresseeId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.id === input.addresseeId) throw new TRPCError({ code: "BAD_REQUEST", message: "Você não pode adicionar a si mesmo." });
      await sendFriendRequest(ctx.user.id, input.addresseeId);
      return { success: true };
    }),

  respondRequest: protectedProcedure
    .input(z.object({ friendshipId: z.number(), action: z.enum(["accepted", "declined"]) }))
    .mutation(async ({ ctx, input }) => {
      await respondFriendRequest(input.friendshipId, ctx.user.id, input.action);
      return { success: true };
    }),

  removeFriend: protectedProcedure
    .input(z.object({ friendId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await removeFriend(ctx.user.id, input.friendId);
      return { success: true };
    }),

  listFriends: protectedProcedure.query(async ({ ctx }) => getFriends(ctx.user.id)),

  pendingRequests: protectedProcedure.query(async ({ ctx }) => getPendingRequests(ctx.user.id)),

  sentRequests: protectedProcedure.query(async ({ ctx }) => getSentRequests(ctx.user.id)),

  friendsFeed: protectedProcedure
    .input(z.object({ limit: z.number().default(30), offset: z.number().default(0) }))
    .query(async ({ ctx, input }) => getFriendsFeed(ctx.user.id, input.limit, input.offset)),

  friendsWhoVisited: protectedProcedure
    .input(z.object({ restaurantId: z.number() }))
    .query(async ({ ctx, input }) => getFriendsWhoVisited(input.restaurantId, ctx.user.id)),

  myVisitedRestaurants: protectedProcedure.query(async ({ ctx }) => getUserVisitedRestaurants(ctx.user.id)),
});


// ─── Missions Router (Gamification) ──────────────────────────────────────────
const missionsRouterDef = router({
  list: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    const { missions } = await import("../drizzle/schema");
    const { asc } = await import("drizzle-orm");
    return db.select().from(missions).orderBy(asc(missions.order));
  }),

  rewards: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    const { rewards } = await import("../drizzle/schema");
    const { asc } = await import("drizzle-orm");
    return db.select().from(rewards).orderBy(asc(rewards.pointsRequired));
  }),

  accept: protectedProcedure
    .input(z.object({ restaurantId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const { missionSessions, missionProgress, missions } = await import("../drizzle/schema");
      const { asc } = await import("drizzle-orm");
      const expiresAt = new Date(Date.now() + 4 * 60 * 60 * 1000);
      const [result] = await db.insert(missionSessions).values({
        userId: ctx.user.id,
        restaurantId: input.restaurantId,
        status: "active",
        totalPoints: 0,
        expiresAt,
      });
      const sessionId = (result as any).insertId as number;
      const allMissions = await db.select().from(missions).orderBy(asc(missions.order));
      if (allMissions.length > 0) {
        await db.insert(missionProgress).values(
          allMissions.map((m) => ({
            sessionId,
            missionId: m.id,
            userId: ctx.user.id,
            status: "available" as const,
            pointsEarned: 0,
          }))
        );
      }
      return { sessionId, expiresAt };
    }),

  activeSession: protectedProcedure
    .input(z.object({ restaurantId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return null;
      const { missionSessions, missionProgress, missions } = await import("../drizzle/schema");
      const { and, eq: eqOp, desc } = await import("drizzle-orm");
      const [session] = await db
        .select()
        .from(missionSessions)
        .where(and(eqOp(missionSessions.userId, ctx.user.id), eqOp(missionSessions.restaurantId, input.restaurantId), eqOp(missionSessions.status, "active")))
        .orderBy(desc(missionSessions.acceptedAt))
        .limit(1);
      if (!session) return null;
      const progress = await db
        .select({ progress: missionProgress, mission: missions })
        .from(missionProgress)
        .innerJoin(missions, eqOp(missionProgress.missionId, missions.id))
        .where(eqOp(missionProgress.sessionId, session.id));
      return { session, progress };
    }),

  complete: protectedProcedure
    .input(z.object({
      sessionId: z.number(),
      missionId: z.number(),
      data: z.record(z.string(), z.any()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const { missionProgress, missionSessions, missions, rewards, userRewards } = await import("../drizzle/schema");
      const { and, eq: eqOp, lte } = await import("drizzle-orm");
      const [mission] = await db.select().from(missions).where(eqOp(missions.id, input.missionId)).limit(1);
      if (!mission) throw new Error("Mission not found");
      await db
        .update(missionProgress)
        .set({ status: "completed", pointsEarned: mission.points, completedAt: new Date(), data: input.data ?? null })
        .where(and(eqOp(missionProgress.sessionId, input.sessionId), eqOp(missionProgress.missionId, input.missionId)));
      const [session] = await db.select().from(missionSessions).where(eqOp(missionSessions.id, input.sessionId)).limit(1);
      const newTotal = (session?.totalPoints ?? 0) + mission.points;
      await db.update(missionSessions).set({ totalPoints: newTotal }).where(eqOp(missionSessions.id, input.sessionId));
      const unlockedRewards = await db.select().from(rewards).where(lte(rewards.pointsRequired, newTotal));
      const newlyUnlocked: typeof unlockedRewards = [];
      for (const reward of unlockedRewards) {
        const existing = await db.select().from(userRewards)
          .where(and(eqOp(userRewards.userId, ctx.user.id), eqOp(userRewards.rewardId, reward.id), eqOp(userRewards.sessionId, input.sessionId)))
          .limit(1);
        if (existing.length === 0) {
          const code = Math.random().toString(36).substring(2, 10).toUpperCase();
          await db.insert(userRewards).values({
            userId: ctx.user.id,
            rewardId: reward.id,
            sessionId: input.sessionId,
            couponCode: code,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          });
          newlyUnlocked.push(reward);
        }
      }
      return { pointsEarned: mission.points, totalPoints: newTotal, newlyUnlocked };
    }),

  myRewards: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    const { userRewards, rewards } = await import("../drizzle/schema");
    const { eq: eqOp } = await import("drizzle-orm");
    return db.select({ userReward: userRewards, reward: rewards })
      .from(userRewards)
      .innerJoin(rewards, eqOp(userRewards.rewardId, rewards.id))
      .where(eqOp(userRewards.userId, ctx.user.id));
  }),
});

// ─── App Router ───────────────────────────────────────────────────────────────
export const appRouter = router({
  system: systemRouter,
  auth: authRouter,
  videos: videosRouter,
  restaurants: restaurantsRouter,
  reviews: reviewsRouter,
  consumer: consumerRouter,
  restaurantDashboard: restaurantDashboardRouter,
  admin: adminRouter,
  social: socialRouter,
  missions: missionsRouterDef,
});

export type AppRouter = typeof appRouter;
