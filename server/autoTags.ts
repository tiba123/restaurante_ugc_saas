import { invokeLLM } from "./_core/llm";

// ─── Tag categories with visual metadata ─────────────────────────────────────
export const TAG_CATEGORIES = {
  food: {
    label: "Comida",
    color: "#E07A5F",
    bg: "#FDF0EC",
    keywords: ["sabor", "gosto", "prato", "comida", "carne", "peixe", "massa", "pizza", "sushi", "hambúrguer", "fresco", "tempero", "molho", "ingrediente", "culinária", "receita", "chef"],
  },
  service: {
    label: "Atendimento",
    color: "#3D405B",
    bg: "#ECEDF3",
    keywords: ["atendimento", "garçom", "serviço", "equipe", "staff", "rápido", "gentil", "atencioso", "simpático", "profissional", "cordial"],
  },
  ambiance: {
    label: "Ambiente",
    color: "#81B29A",
    bg: "#EEF5F1",
    keywords: ["ambiente", "decoração", "música", "iluminação", "espaço", "confortável", "aconchegante", "bonito", "sofisticado", "romântico", "agradável", "limpo"],
  },
  value: {
    label: "Custo-Benefício",
    color: "#F2CC8F",
    bg: "#FEF8EC",
    keywords: ["preço", "valor", "custo", "benefício", "barato", "acessível", "justo", "porção", "quantidade"],
  },
  experience: {
    label: "Experiência",
    color: "#9C6B98",
    bg: "#F4EEF4",
    keywords: ["experiência", "incrível", "perfeito", "recomendo", "voltarei", "especial", "aniversário", "jantar", "almoço", "evento"],
  },
} as const;

export type TagCategory = keyof typeof TAG_CATEGORIES;

export interface GeneratedTag {
  label: string;
  category: TagCategory;
  emoji: string;
}

// ─── Predefined high-quality tags per category ────────────────────────────────
const TAG_POOL: Record<TagCategory, Array<{ label: string; emoji: string }>> = {
  food: [
    { label: "Sabor Incrível", emoji: "🔥" },
    { label: "Ingredientes Frescos", emoji: "🌿" },
    { label: "Prato Bem Elaborado", emoji: "👨‍🍳" },
    { label: "Porção Generosa", emoji: "🍽️" },
    { label: "Carne no Ponto", emoji: "🥩" },
    { label: "Massa Artesanal", emoji: "🍝" },
    { label: "Sushi Fresquíssimo", emoji: "🍣" },
    { label: "Pizza Napolitana", emoji: "🍕" },
    { label: "Tempero Autêntico", emoji: "🌶️" },
    { label: "Sobremesa Divina", emoji: "🍮" },
    { label: "Caldo Encorpado", emoji: "🍲" },
    { label: "Grelhado Perfeito", emoji: "🔥" },
  ],
  service: [
    { label: "Atendimento Impecável", emoji: "⭐" },
    { label: "Equipe Atenciosa", emoji: "🤝" },
    { label: "Serviço Rápido", emoji: "⚡" },
    { label: "Staff Simpático", emoji: "😊" },
    { label: "Muito Profissional", emoji: "💼" },
    { label: "Recomendação Certeira", emoji: "🎯" },
  ],
  ambiance: [
    { label: "Ambiente Sofisticado", emoji: "✨" },
    { label: "Decoração Incrível", emoji: "🎨" },
    { label: "Música Agradável", emoji: "🎵" },
    { label: "Espaço Aconchegante", emoji: "🏡" },
    { label: "Iluminação Perfeita", emoji: "💡" },
    { label: "Ambiente Romântico", emoji: "🕯️" },
    { label: "Vista Privilegiada", emoji: "🌆" },
  ],
  value: [
    { label: "Ótimo Custo-Benefício", emoji: "💰" },
    { label: "Preço Justo", emoji: "✅" },
    { label: "Vale Cada Centavo", emoji: "💎" },
    { label: "Porção Farta", emoji: "🍱" },
  ],
  experience: [
    { label: "Experiência Única", emoji: "🌟" },
    { label: "Voltarei Com Certeza", emoji: "🔄" },
    { label: "Recomendo Muito", emoji: "👍" },
    { label: "Perfeito para Casal", emoji: "💑" },
    { label: "Ideal para Família", emoji: "👨‍👩‍👧" },
    { label: "Ótimo para Negócios", emoji: "💼" },
    { label: "Especial para Datas", emoji: "🎉" },
  ],
};

// ─── LLM-based tag generation ─────────────────────────────────────────────────
export async function generateAutoTags(params: {
  title?: string | null;
  description?: string | null;
  rating?: number | null;
  restaurantName?: string;
  cuisine?: string | null;
}): Promise<GeneratedTag[]> {
  const { title, description, rating, restaurantName, cuisine } = params;

  const context = [
    title && `Título: ${title}`,
    description && `Descrição: ${description}`,
    rating && `Nota: ${rating}/5 estrelas`,
    restaurantName && `Restaurante: ${restaurantName}`,
    cuisine && `Culinária: ${cuisine}`,
  ]
    .filter(Boolean)
    .join("\n");

  if (!context.trim()) {
    return getFallbackTags(rating);
  }

  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `Você é um especialista em gastronomia e análise de avaliações de restaurantes. 
Sua tarefa é analisar avaliações de vídeos de restaurantes e gerar tags que destacam os PONTOS FORTES do restaurante.

Regras:
- Gere entre 3 e 5 tags no total
- Cada tag deve ser concisa (2-4 palavras)
- Foque nos pontos positivos mencionados ou implícitos
- Distribua as tags entre categorias diferentes quando possível
- Use apenas as categorias: food, service, ambiance, value, experience
- Escolha tags do pool disponível ou crie variações próximas

Pool de tags disponíveis por categoria:
${Object.entries(TAG_POOL)
  .map(([cat, tags]) => `${cat}: ${tags.map((t) => t.label).join(", ")}`)
  .join("\n")}

Retorne APENAS um JSON válido com o array de tags.`,
        },
        {
          role: "user",
          content: `Analise esta avaliação e gere tags de pontos fortes:\n\n${context}`,
        },
      ],
      responseFormat: {
        type: "json_schema",
        json_schema: {
          name: "auto_tags",
          strict: true,
          schema: {
            type: "object",
            properties: {
              tags: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    label: { type: "string", description: "Nome da tag em português, 2-4 palavras" },
                    category: {
                      type: "string",
                      enum: ["food", "service", "ambiance", "value", "experience"],
                      description: "Categoria da tag",
                    },
                    emoji: { type: "string", description: "Um emoji representativo" },
                  },
                  required: ["label", "category", "emoji"],
                  additionalProperties: false,
                },
                minItems: 3,
                maxItems: 5,
              },
            },
            required: ["tags"],
            additionalProperties: false,
          },
        },
      },
    });

    const content = response.choices?.[0]?.message?.content;
    if (!content) return getFallbackTags(rating);

    const parsed = JSON.parse(typeof content === "string" ? content : JSON.stringify(content));
    const tags: GeneratedTag[] = parsed.tags || [];

    // Validate and sanitize
    const validCategories = Object.keys(TAG_CATEGORIES) as TagCategory[];
    const validTags = tags.filter(
      (t) => t.label && t.category && validCategories.includes(t.category as TagCategory)
    );

    return validTags.length >= 2 ? validTags : getFallbackTags(rating);
  } catch (err) {
    console.warn("[AutoTags] LLM generation failed, using fallback:", err);
    return getFallbackTags(rating);
  }
}

// ─── Fallback tags when LLM is unavailable ────────────────────────────────────
function getFallbackTags(rating?: number | null): GeneratedTag[] {
  const tags: GeneratedTag[] = [
    { label: "Sabor Incrível", category: "food", emoji: "🔥" },
    { label: "Recomendo Muito", category: "experience", emoji: "👍" },
  ];

  if (rating && rating >= 5) {
    tags.push({ label: "Experiência Única", category: "experience", emoji: "🌟" });
  }
  if (rating && rating >= 4) {
    tags.push({ label: "Atendimento Impecável", category: "service", emoji: "⭐" });
  }

  return tags;
}

// ─── Get tag visual metadata ──────────────────────────────────────────────────
export function getTagMeta(category: TagCategory) {
  return TAG_CATEGORIES[category] ?? TAG_CATEGORIES.food;
}

// ─── Serialize tags for DB storage ───────────────────────────────────────────
export function serializeTags(tags: GeneratedTag[]): string[] {
  return tags.map((t) => `${t.emoji} ${t.label}|${t.category}`);
}

// ─── Deserialize tags from DB ─────────────────────────────────────────────────
export function deserializeTags(raw: unknown): GeneratedTag[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (typeof item !== "string") return null;
      const pipeIdx = item.lastIndexOf("|");
      if (pipeIdx === -1) {
        // Legacy plain tag
        return { label: item, category: "food" as TagCategory, emoji: "🍽️" };
      }
      const labelWithEmoji = item.slice(0, pipeIdx);
      const category = item.slice(pipeIdx + 1) as TagCategory;
      const spaceIdx = labelWithEmoji.indexOf(" ");
      const emoji = spaceIdx > -1 ? labelWithEmoji.slice(0, spaceIdx) : "🍽️";
      const label = spaceIdx > -1 ? labelWithEmoji.slice(spaceIdx + 1) : labelWithEmoji;
      return { label, category, emoji };
    })
    .filter((t): t is GeneratedTag => t !== null);
}
