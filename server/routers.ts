import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
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
} from "./db";
import { storagePut } from "./storage";

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

      await createVideo({
        userId,
        restaurantId: input.restaurantId,
        title: input.title,
        description: input.description,
        videoUrl,
        videoKey,
        thumbnailUrl,
        thumbnailKey,
        rating: input.rating,
        tags: input.tags as any,
        status: "pending",
        isPublic: false,
      });

      return { success: true, message: "Vídeo enviado para aprovação do restaurante." };
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
      await createReview({
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
});

export type AppRouter = typeof appRouter;
