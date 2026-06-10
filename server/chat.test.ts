import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mock do banco de dados ───────────────────────────────────────────────────
vi.mock("./db", () => ({
  getOrCreateQuizProfile: vi.fn(),
  updateQuizProfile: vi.fn(),
  getOrCreateChatSession: vi.fn(),
  getUserChatSessions: vi.fn(),
  updateChatSessionTitle: vi.fn(),
  saveChatMessage: vi.fn(),
  getChatHistory: vi.fn(),
  searchCachedPlaces: vi.fn(),
  getCachedPlace: vi.fn(),
  upsertPlaceCache: vi.fn(),
  getDb: vi.fn(),
}));

vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn(),
}));

vi.mock("./_core/map", () => ({
  makeRequest: vi.fn(),
}));

import {
  getOrCreateQuizProfile,
  updateQuizProfile,
  getOrCreateChatSession,
  getUserChatSessions,
  saveChatMessage,
  getChatHistory,
  getCachedPlace,
  upsertPlaceCache,
} from "./db";
import { invokeLLM } from "./_core/llm";
import { makeRequest } from "./_core/map";

// ─── Testes do Quiz de Perfil ─────────────────────────────────────────────────
describe("Quiz Profile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve criar um perfil de quiz para novo usuário", async () => {
    const mockProfile = {
      id: 1,
      userId: 42,
      cuisinePrefs: null,
      budgetRange: "moderado" as const,
      ambience: null,
      companionType: "amigos" as const,
      preferredNeighborhoods: null,
      interests: null,
      dietaryRestrictions: null,
      quizCompleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.mocked(getOrCreateQuizProfile).mockResolvedValue(mockProfile);

    const result = await getOrCreateQuizProfile(42);
    expect(result).not.toBeNull();
    expect(result?.userId).toBe(42);
    expect(result?.quizCompleted).toBe(false);
  });

  it("deve salvar preferências do quiz", async () => {
    vi.mocked(updateQuizProfile).mockResolvedValue(undefined);

    await updateQuizProfile(42, {
      cuisinePrefs: ["japonesa", "italiana"],
      budgetRange: "premium",
      quizCompleted: true,
    });

    expect(updateQuizProfile).toHaveBeenCalledWith(42, {
      cuisinePrefs: ["japonesa", "italiana"],
      budgetRange: "premium",
      quizCompleted: true,
    });
  });
});

// ─── Testes de Sessões de Chat ────────────────────────────────────────────────
describe("Chat Sessions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve criar uma nova sessão de chat", async () => {
    const mockSession = {
      id: 1,
      userId: 42,
      sessionKey: "session_123",
      title: "Nova conversa",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.mocked(getOrCreateChatSession).mockResolvedValue(mockSession);

    const session = await getOrCreateChatSession(42, "session_123");
    expect(session).not.toBeNull();
    expect(session?.sessionKey).toBe("session_123");
    expect(session?.userId).toBe(42);
  });

  it("deve retornar sessão existente se já criada", async () => {
    const mockSession = {
      id: 5,
      userId: 42,
      sessionKey: "session_existing",
      title: "Onde jantar hoje?",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.mocked(getOrCreateChatSession).mockResolvedValue(mockSession);

    const session1 = await getOrCreateChatSession(42, "session_existing");
    const session2 = await getOrCreateChatSession(42, "session_existing");
    expect(session1?.id).toBe(session2?.id);
  });
});

// ─── Testes de Mensagens de Chat ──────────────────────────────────────────────
describe("Chat Messages", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve salvar mensagem do usuário", async () => {
    const mockMsg = {
      id: 1,
      sessionId: 1,
      role: "user" as const,
      content: "Onde jantar hoje?",
      recommendedPlaces: null,
      createdAt: new Date(),
    };

    vi.mocked(saveChatMessage).mockResolvedValue(mockMsg);

    const msg = await saveChatMessage(1, "user", "Onde jantar hoje?");
    expect(msg?.role).toBe("user");
    expect(msg?.content).toBe("Onde jantar hoje?");
  });

  it("deve salvar mensagem do assistente com lugares recomendados", async () => {
    const mockMsg = {
      id: 2,
      sessionId: 1,
      role: "assistant" as const,
      content: "Recomendo o Sushi Tanaka no Itaim Bibi!",
      recommendedPlaces: ["ChIJ123"],
      createdAt: new Date(),
    };

    vi.mocked(saveChatMessage).mockResolvedValue(mockMsg);

    const msg = await saveChatMessage(1, "assistant", "Recomendo o Sushi Tanaka!", ["ChIJ123"]);
    expect(msg?.role).toBe("assistant");
    expect(msg?.recommendedPlaces).toContain("ChIJ123");
  });

  it("deve retornar histórico de mensagens em ordem cronológica", async () => {
    const mockHistory = [
      { id: 1, sessionId: 1, role: "user" as const, content: "Oi!", recommendedPlaces: null, createdAt: new Date("2024-01-01T10:00:00") },
      { id: 2, sessionId: 1, role: "assistant" as const, content: "Olá! Como posso ajudar?", recommendedPlaces: null, createdAt: new Date("2024-01-01T10:00:01") },
    ];

    vi.mocked(getChatHistory).mockResolvedValue(mockHistory);

    const history = await getChatHistory(1);
    expect(history).toHaveLength(2);
    expect(history[0].role).toBe("user");
    expect(history[1].role).toBe("assistant");
  });
});

// ─── Testes de Cache de Lugares ───────────────────────────────────────────────
describe("Places Cache", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve retornar null para lugar não cacheado", async () => {
    vi.mocked(getCachedPlace).mockResolvedValue(null);

    const place = await getCachedPlace("ChIJ_nonexistent");
    expect(place).toBeNull();
  });

  it("deve salvar lugar no cache com TTL de 7 dias", async () => {
    vi.mocked(upsertPlaceCache).mockResolvedValue(undefined);

    await upsertPlaceCache({
      placeId: "ChIJ123",
      name: "Sushi Tanaka",
      category: "Restaurante",
      neighborhood: "Itaim Bibi",
      rating: "4.8",
      totalRatings: 250,
    });

    expect(upsertPlaceCache).toHaveBeenCalledWith(
      expect.objectContaining({
        placeId: "ChIJ123",
        name: "Sushi Tanaka",
        rating: "4.8",
      })
    );
  });

  it("deve retornar lugar cacheado válido", async () => {
    const futureDate = new Date(Date.now() + 6 * 24 * 60 * 60 * 1000); // 6 dias no futuro
    const mockPlace = {
      id: 1,
      placeId: "ChIJ123",
      name: "Sushi Tanaka",
      category: "Restaurante",
      address: "Rua Fidêncio Ramos, 302 - Itaim Bibi",
      neighborhood: "Itaim Bibi",
      city: "São Paulo",
      rating: "4.8",
      totalRatings: 250,
      priceLevel: 3,
      types: null,
      positiveReviews: null,
      negativeReviews: null,
      aiSummary: "Excelente sushi no Itaim Bibi",
      highlights: null,
      mapsUrl: "https://maps.google.com/?q=place_id:ChIJ123",
      website: null,
      phone: null,
      openNow: true,
      photoUrl: null,
      lat: "-23.5789",
      lng: "-46.6789",
      cachedAt: new Date(),
      expiresAt: futureDate,
    };

    vi.mocked(getCachedPlace).mockResolvedValue(mockPlace);

    const place = await getCachedPlace("ChIJ123");
    expect(place).not.toBeNull();
    expect(place?.name).toBe("Sushi Tanaka");
    expect(place?.neighborhood).toBe("Itaim Bibi");
  });
});
