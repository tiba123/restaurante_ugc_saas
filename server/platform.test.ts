import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// ─── Mock DB helpers ──────────────────────────────────────────────────────────
vi.mock("./db", () => ({
  upsertUser: vi.fn(),
  getUserByOpenId: vi.fn(),
  getUserById: vi.fn().mockResolvedValue({ id: 1, name: "Test User", role: "user", totalVideos: 0, totalLikes: 0, totalReviews: 0 }),
  getRestaurantById: vi.fn().mockResolvedValue({ id: 1, name: "Test Restaurant", slug: "test-restaurant", averageRating: "4.50", totalVideos: 5, totalViews: 100 }),
  getRestaurantBySlug: vi.fn().mockResolvedValue({ id: 1, name: "Test Restaurant", slug: "test-restaurant", averageRating: "4.50", totalVideos: 5, totalViews: 100 }),
  getRestaurantByOwnerId: vi.fn().mockResolvedValue({ id: 1, name: "Test Restaurant", slug: "test-restaurant", averageRating: "4.50", totalVideos: 5, totalViews: 100 }),
  getFeedVideos: vi.fn().mockResolvedValue([]),
  getVideoById: vi.fn().mockResolvedValue({ id: 1, userId: 1, restaurantId: 1, videoUrl: "/test.mp4", videoKey: "test.mp4", status: "approved", views: 10, likes: 5, comments: 2, isPublic: true }),
  getVideosByRestaurant: vi.fn().mockResolvedValue([]),
  getVideosByUser: vi.fn().mockResolvedValue([]),
  getReviewsByRestaurant: vi.fn().mockResolvedValue([]),
  getReviewsByUser: vi.fn().mockResolvedValue([]),
  getUserAchievements: vi.fn().mockResolvedValue([]),
  getUserBenefits: vi.fn().mockResolvedValue([]),
  getUserLikedVideos: vi.fn().mockResolvedValue([]),
  getVideoComments: vi.fn().mockResolvedValue([]),
  listRestaurants: vi.fn().mockResolvedValue([]),
  createRestaurant: vi.fn().mockResolvedValue(undefined),
  createVideo: vi.fn().mockResolvedValue(undefined),
  createReview: vi.fn().mockResolvedValue(undefined),
  addVideoComment: vi.fn().mockResolvedValue(undefined),
  toggleVideoLike: vi.fn().mockResolvedValue({ liked: true }),
  updateVideoStatus: vi.fn().mockResolvedValue(undefined),
  updateRestaurant: vi.fn().mockResolvedValue(undefined),
  updateUserProfile: vi.fn().mockResolvedValue(undefined),
  incrementVideoViews: vi.fn().mockResolvedValue(undefined),
  upsertRestaurantAccount: vi.fn().mockResolvedValue(undefined),
  getRestaurantAccountByOpenId: vi.fn().mockResolvedValue(null),
  getAllVideos: vi.fn().mockResolvedValue([]),
  getAllRestaurants: vi.fn().mockResolvedValue([]),
  getAllUsers: vi.fn().mockResolvedValue([]),
  getAllReviews: vi.fn().mockResolvedValue([]),
  getPlatformStats: vi.fn().mockResolvedValue({ totalUsers: 10, totalRestaurants: 5, totalVideos: 20, totalViews: 500, totalReviews: 30 }),
}));

vi.mock("./storage", () => ({
  storagePut: vi.fn().mockResolvedValue({ key: "test-key", url: "/manus-storage/test-key" }),
}));

// ─── Context factories ────────────────────────────────────────────────────────
function makePublicCtx(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

function makeUserCtx(overrides: Partial<TrpcContext["user"]> = {}): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "user-open-id",
      email: "user@test.com",
      name: "Test User",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
      ...overrides,
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

function makeAdminCtx(): TrpcContext {
  return makeUserCtx({ role: "admin" });
}

// ─── Tests ────────────────────────────────────────────────────────────────────
describe("auth", () => {
  it("me returns null for unauthenticated users", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    const result = await caller.auth.me();
    expect(result).toBeNull();
  });

  it("me returns user for authenticated users", async () => {
    const caller = appRouter.createCaller(makeUserCtx());
    const result = await caller.auth.me();
    expect(result?.id).toBe(1);
    expect(result?.role).toBe("user");
  });
});

describe("videos.feed", () => {
  it("returns empty feed for public users", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    const result = await caller.videos.feed({ limit: 10, offset: 0 });
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("restaurants.list", () => {
  it("returns empty list when no restaurants", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    const result = await caller.restaurants.list({ limit: 20, offset: 0 });
    expect(Array.isArray(result)).toBe(true);
  });

  it("returns restaurant by slug", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    const result = await caller.restaurants.bySlug({ slug: "test-restaurant" });
    expect(result.name).toBe("Test Restaurant");
  });
});

describe("consumer.profile", () => {
  it("returns profile for authenticated user", async () => {
    const caller = appRouter.createCaller(makeUserCtx());
    const result = await caller.consumer.profile();
    expect(result.id).toBe(1);
    expect(result.name).toBe("Test User");
  });

  it("throws UNAUTHORIZED for unauthenticated user", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    await expect(caller.consumer.profile()).rejects.toThrow();
  });
});

describe("restaurantDashboard", () => {
  it("returns my restaurant for authenticated owner", async () => {
    const caller = appRouter.createCaller(makeUserCtx());
    const result = await caller.restaurantDashboard.myRestaurant();
    expect(result?.name).toBe("Test Restaurant");
  });

  it("returns metrics for restaurant owner", async () => {
    const caller = appRouter.createCaller(makeUserCtx());
    const result = await caller.restaurantDashboard.metrics();
    expect(result).toHaveProperty("totalVideos");
    expect(result).toHaveProperty("totalViews");
    expect(result).toHaveProperty("averageRating");
  });
});

describe("admin", () => {
  it("throws FORBIDDEN for non-admin user", async () => {
    const caller = appRouter.createCaller(makeUserCtx());
    await expect(caller.admin.overview()).rejects.toThrow();
  });

  it("returns overview for admin user", async () => {
    const caller = appRouter.createCaller(makeAdminCtx());
    const result = await caller.admin.overview();
    expect(result.isAdmin).toBe(true);
    expect(result).toHaveProperty("totalVideos");
    expect(result).toHaveProperty("totalRestaurants");
    expect(result).toHaveProperty("totalUsers");
  });

  it("returns all users for admin", async () => {
    const caller = appRouter.createCaller(makeAdminCtx());
    const result = await caller.admin.allUsers();
    expect(Array.isArray(result)).toBe(true);
  });
});
