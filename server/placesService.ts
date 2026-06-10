/**
 * placesService.ts
 * Serviço de busca de lugares no Google Places API com cache inteligente.
 * Busca lugares em São Paulo, extrai avaliações positivas/negativas e gera
 * resumo por IA para uso no chat de recomendações.
 */

import { makeRequest, PlacesSearchResult, PlaceDetailsResult } from "./_core/map";
import { invokeLLM } from "./_core/llm";
import { getCachedPlace, upsertPlaceCache } from "./db";

// ─── Tipos ─────────────────────────────────────────────────────────────────────
export interface PlaceInfo {
  placeId: string;
  name: string;
  category: string;
  address: string;
  neighborhood: string;
  city: string;
  rating: number;
  totalRatings: number;
  priceLevel: number;
  types: string[];
  positiveReviews: string[];
  negativeReviews: string[];
  aiSummary: string;
  highlights: string[];
  mapsUrl: string;
  website?: string;
  phone?: string;
  openNow?: boolean;
  photoUrl?: string;
  lat: number;
  lng: number;
}

// ─── Mapeamento de tipo Google → categoria legível ─────────────────────────────
function inferCategory(types: string[]): string {
  const map: Record<string, string> = {
    restaurant: "Restaurante",
    food: "Alimentação",
    cafe: "Café",
    bar: "Bar",
    bakery: "Padaria",
    meal_takeaway: "Delivery",
    meal_delivery: "Delivery",
    shopping_mall: "Shopping",
    store: "Loja",
    clothing_store: "Moda",
    supermarket: "Supermercado",
    gas_station: "Posto de Gasolina",
    lodging: "Hotel",
    tourist_attraction: "Atração Turística",
    museum: "Museu",
    park: "Parque",
    gym: "Academia",
    hospital: "Hospital",
    pharmacy: "Farmácia",
    bank: "Banco",
    atm: "Caixa Eletrônico",
    movie_theater: "Cinema",
    night_club: "Balada",
    beauty_salon: "Salão de Beleza",
    spa: "Spa",
  };
  for (const type of types) {
    if (map[type]) return map[type];
  }
  return "Estabelecimento";
}

// ─── Extrair bairro do endereço formatado ──────────────────────────────────────
function extractNeighborhood(address: string): string {
  // Endereços do Google geralmente: "Rua X, 123 - Bairro, São Paulo - SP"
  const match = address.match(/- ([^,]+),\s*São Paulo/i);
  if (match) return match[1].trim();
  const parts = address.split(",");
  if (parts.length >= 2) return parts[1].trim();
  return "São Paulo";
}

// ─── Gerar resumo por IA ───────────────────────────────────────────────────────
async function generateAiSummary(place: {
  name: string;
  category: string;
  rating: number;
  positiveReviews: string[];
  negativeReviews: string[];
}): Promise<{ summary: string; highlights: string[] }> {
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `Você é um especialista em gastronomia e turismo em São Paulo. 
          Gere um resumo conciso e útil sobre um estabelecimento com base nas avaliações.
          Responda em português brasileiro, de forma amigável e informativa.`,
        },
        {
          role: "user",
          content: `Estabelecimento: ${place.name} (${place.category})
Nota: ${place.rating}/5

Avaliações positivas:
${place.positiveReviews.slice(0, 3).join("\n")}

Avaliações negativas:
${place.negativeReviews.slice(0, 2).join("\n")}

Gere um resumo de 2-3 frases e 3-5 destaques (pontos fortes) em formato JSON.`,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "place_summary",
          strict: true,
          schema: {
            type: "object",
            properties: {
              summary: { type: "string", description: "Resumo de 2-3 frases sobre o lugar" },
              highlights: {
                type: "array",
                items: { type: "string" },
                description: "3-5 destaques/pontos fortes do lugar",
              },
            },
            required: ["summary", "highlights"],
            additionalProperties: false,
          },
        },
      },
    });

    const content = response.choices?.[0]?.message?.content;
    if (content && typeof content === "string") {
      const parsed = JSON.parse(content);
      return { summary: parsed.summary || "", highlights: parsed.highlights || [] };
    }
  } catch (e) {
    console.warn("[placesService] AI summary failed:", e);
  }
  return { summary: "", highlights: [] };
}

// ─── Buscar detalhes de um lugar ───────────────────────────────────────────────
async function fetchPlaceDetails(placeId: string): Promise<PlaceInfo | null> {
  try {
    const details = await makeRequest<PlaceDetailsResult>("/maps/api/place/details/json", {
      place_id: placeId,
      fields: "place_id,name,formatted_address,formatted_phone_number,website,rating,user_ratings_total,reviews,opening_hours,geometry,types,price_level,photos",
      language: "pt-BR",
    });

    if (details.status !== "OK" || !details.result) return null;

    const r = details.result;
    const reviews = r.reviews || [];
    const positiveReviews = reviews
      .filter((rv) => rv.rating >= 4)
      .map((rv) => rv.text)
      .filter(Boolean);
    const negativeReviews = reviews
      .filter((rv) => rv.rating <= 2)
      .map((rv) => rv.text)
      .filter(Boolean);

    const types = (r as any).types || [];
    const category = inferCategory(types);
    const address = r.formatted_address || "";
    const neighborhood = extractNeighborhood(address);
    const rating = r.rating || 0;
    const lat = r.geometry?.location?.lat || 0;
    const lng = r.geometry?.location?.lng || 0;

    // Gerar resumo por IA (apenas se tiver avaliações)
    let aiSummary = "";
    let highlights: string[] = [];
    if (positiveReviews.length > 0 || negativeReviews.length > 0) {
      const aiResult = await generateAiSummary({ name: r.name, category, rating, positiveReviews, negativeReviews });
      aiSummary = aiResult.summary;
      highlights = aiResult.highlights;
    }

    // URL do Google Maps
    const mapsUrl = `https://www.google.com/maps/place/?q=place_id:${placeId}`;

    // Foto (primeira foto do lugar)
    let photoUrl: string | undefined;
    const photos = (r as any).photos;
    if (photos && photos.length > 0) {
      const photoRef = photos[0].photo_reference;
      if (photoRef) {
        photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${photoRef}`;
      }
    }

    return {
      placeId,
      name: r.name,
      category,
      address,
      neighborhood,
      city: "São Paulo",
      rating,
      totalRatings: r.user_ratings_total || 0,
      priceLevel: (r as any).price_level || 0,
      types,
      positiveReviews,
      negativeReviews,
      aiSummary,
      highlights,
      mapsUrl,
      website: r.website,
      phone: r.formatted_phone_number,
      openNow: r.opening_hours?.open_now,
      photoUrl,
      lat,
      lng,
    };
  } catch (e) {
    console.warn("[placesService] fetchPlaceDetails error:", e);
    return null;
  }
}

// ─── Buscar lugares por query (com cache) ──────────────────────────────────────
export async function searchPlaces(query: string, limit = 5): Promise<PlaceInfo[]> {
  try {
    // Buscar no Google Places Text Search
    const searchResult = await makeRequest<PlacesSearchResult>("/maps/api/place/textsearch/json", {
      query: `${query} São Paulo SP`,
      language: "pt-BR",
      region: "br",
    });

    if (searchResult.status !== "OK" || !searchResult.results?.length) {
      return [];
    }

    const topResults = searchResult.results.slice(0, limit);
    const places: PlaceInfo[] = [];

    for (const result of topResults) {
      const placeId = result.place_id;

      // Verificar cache primeiro
      const cached = await getCachedPlace(placeId);
      if (cached) {
        places.push({
          placeId: cached.placeId,
          name: cached.name,
          category: cached.category || "Estabelecimento",
          address: cached.address || "",
          neighborhood: cached.neighborhood || "São Paulo",
          city: cached.city || "São Paulo",
          rating: parseFloat(cached.rating || "0"),
          totalRatings: cached.totalRatings || 0,
          priceLevel: cached.priceLevel || 0,
          types: (cached.types as string[]) || [],
          positiveReviews: (cached.positiveReviews as string[]) || [],
          negativeReviews: (cached.negativeReviews as string[]) || [],
          aiSummary: cached.aiSummary || "",
          highlights: (cached.highlights as string[]) || [],
          mapsUrl: cached.mapsUrl || `https://www.google.com/maps/place/?q=place_id:${placeId}`,
          website: cached.website || undefined,
          phone: cached.phone || undefined,
          openNow: cached.openNow ?? undefined,
          photoUrl: cached.photoUrl || undefined,
          lat: parseFloat(cached.lat || "0"),
          lng: parseFloat(cached.lng || "0"),
        });
        continue;
      }

      // Buscar detalhes completos
      const details = await fetchPlaceDetails(placeId);
      if (!details) continue;

      // Salvar no cache
      await upsertPlaceCache({
        placeId: details.placeId,
        name: details.name,
        category: details.category,
        address: details.address,
        neighborhood: details.neighborhood,
        city: details.city,
        rating: String(details.rating),
        totalRatings: details.totalRatings,
        priceLevel: details.priceLevel,
        types: details.types,
        positiveReviews: details.positiveReviews,
        negativeReviews: details.negativeReviews,
        aiSummary: details.aiSummary,
        highlights: details.highlights,
        mapsUrl: details.mapsUrl,
        website: details.website,
        phone: details.phone,
        openNow: details.openNow,
        photoUrl: details.photoUrl,
        lat: String(details.lat),
        lng: String(details.lng),
      });

      places.push(details);
    }

    return places;
  } catch (e) {
    console.warn("[placesService] searchPlaces error:", e);
    return [];
  }
}
