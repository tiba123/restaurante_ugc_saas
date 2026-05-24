/**
 * Script para gerar tags automáticas nos vídeos existentes do banco de dados.
 * Usa fallback baseado em culinária do restaurante quando LLM não está disponível.
 */
import "dotenv/config";
import mysql from "mysql2/promise";

const DB_URL = process.env.DATABASE_URL;
if (!DB_URL) {
  console.error("DATABASE_URL não encontrada");
  process.exit(1);
}

// ─── Tag pools por culinária/categoria ───────────────────────────────────────
const CUISINE_TAGS = {
  "Hambúrguer": [
    "🔥 Sabor Incrível|food",
    "🥩 Carne no Ponto|food",
    "👍 Recomendo Muito|experience",
    "⭐ Atendimento Impecável|service",
  ],
  "Japonesa": [
    "🍣 Sushi Fresquíssimo|food",
    "🌿 Ingredientes Frescos|food",
    "✨ Ambiente Sofisticado|ambiance",
    "💎 Vale Cada Centavo|value",
  ],
  "Italiana": [
    "🍝 Massa Artesanal|food",
    "🔥 Sabor Incrível|food",
    "🕯️ Ambiente Romântico|ambiance",
    "⭐ Atendimento Impecável|service",
  ],
  "Churrasco": [
    "🥩 Carne no Ponto|food",
    "🔥 Grelhado Perfeito|food",
    "👨‍👩‍👧 Ideal para Família|experience",
    "💰 Ótimo Custo-Benefício|value",
  ],
  "Café": [
    "🌿 Ingredientes Frescos|food",
    "🏡 Espaço Aconchegante|ambiance",
    "⚡ Serviço Rápido|service",
    "✅ Preço Justo|value",
  ],
  "Mexicana": [
    "🌶️ Tempero Autêntico|food",
    "🔥 Sabor Incrível|food",
    "🎵 Música Agradável|ambiance",
    "👍 Recomendo Muito|experience",
  ],
  "Steakhouse": [
    "🥩 Carne no Ponto|food",
    "✨ Ambiente Sofisticado|ambiance",
    "💼 Muito Profissional|service",
    "🌟 Experiência Única|experience",
  ],
  "Japonesa Ramen": [
    "🍲 Caldo Encorpado|food",
    "🌿 Ingredientes Frescos|food",
    "🤝 Equipe Atenciosa|service",
    "🔄 Voltarei Com Certeza|experience",
  ],
  "default": [
    "🔥 Sabor Incrível|food",
    "⭐ Atendimento Impecável|service",
    "👍 Recomendo Muito|experience",
    "💰 Ótimo Custo-Benefício|value",
  ],
};

// Map restaurante → culinária
const RESTAURANT_CUISINE_MAP = {
  "Burger Lab SP": "Hambúrguer",
  "Sushi Tanaka": "Japonesa",
  "La Trattoria": "Italiana",
  "Churrascaria Gaúcha": "Churrasco",
  "Café Paulista": "Café",
  "El Mariachi": "Mexicana",
  "Steakhouse Prime": "Steakhouse",
  "Ramen House": "Japonesa Ramen",
};

// Tags específicas por título de vídeo
const VIDEO_SPECIFIC_TAGS = {
  "Hambúrguer artesanal suculento": ["🔥 Sabor Incrível|food", "🥩 Carne no Ponto|food", "👨‍🍳 Prato Bem Elaborado|food", "👍 Recomendo Muito|experience"],
  "Pizza napolitana perfeita": ["🍕 Pizza Napolitana|food", "🔥 Sabor Incrível|food", "🕯️ Ambiente Romântico|ambiance", "💎 Vale Cada Centavo|value"],
  "Sushi premium no Itaim": ["🍣 Sushi Fresquíssimo|food", "🌿 Ingredientes Frescos|food", "✨ Ambiente Sofisticado|ambiance", "🌟 Experiência Única|experience"],
  "Churrasco gaúcho autêntico": ["🥩 Carne no Ponto|food", "🔥 Grelhado Perfeito|food", "👨‍👩‍👧 Ideal para Família|experience", "💰 Ótimo Custo-Benefício|value"],
  "Café da manhã completo": ["🌿 Ingredientes Frescos|food", "🏡 Espaço Aconchegante|ambiance", "⚡ Serviço Rápido|service", "✅ Preço Justo|value"],
  "Risoto de funghi porcini": ["🍝 Massa Artesanal|food", "👨‍🍳 Prato Bem Elaborado|food", "🕯️ Ambiente Romântico|ambiance", "⭐ Atendimento Impecável|service"],
  "Tacos mexicanos autênticos": ["🌶️ Tempero Autêntico|food", "🔥 Sabor Incrível|food", "🎵 Música Agradável|ambiance", "👍 Recomendo Muito|experience"],
  "Steak perfeito ao ponto": ["🥩 Carne no Ponto|food", "✨ Ambiente Sofisticado|ambiance", "💼 Muito Profissional|service", "🌟 Experiência Única|experience"],
  "Açaí bowl com granola": ["🌿 Ingredientes Frescos|food", "⚡ Serviço Rápido|service", "✅ Preço Justo|value", "🔄 Voltarei Com Certeza|experience"],
  "Feijoada completa de sexta": ["🍲 Caldo Encorpado|food", "👨‍🍳 Prato Bem Elaborado|food", "👨‍👩‍👧 Ideal para Família|experience", "🎉 Especial para Datas|experience"],
  "Ramen japonês autêntico": ["🍲 Caldo Encorpado|food", "🌿 Ingredientes Frescos|food", "🤝 Equipe Atenciosa|service", "🔄 Voltarei Com Certeza|experience"],
  "Sorvete artesanal de pistache": ["🍮 Sobremesa Divina|food", "🌿 Ingredientes Frescos|food", "🏡 Espaço Aconchegante|ambiance", "💰 Ótimo Custo-Benefício|value"],
};

async function main() {
  console.log("🏷️  Gerando tags automáticas para vídeos existentes...\n");

  const conn = await mysql.createConnection(DB_URL);

  // Buscar todos os vídeos com seus restaurantes
  const [rows] = await conn.execute(`
    SELECT v.id, v.title, v.tags, r.name as restaurant_name, r.cuisine
    FROM videos v
    LEFT JOIN restaurants r ON v.restaurantId = r.id
    ORDER BY v.id
  `);

  let updated = 0;
  let skipped = 0;

  for (const row of rows) {
    const { id, title, tags, restaurant_name, cuisine } = row;

    // Verificar se já tem tags ricas (com pipe)
    let existingTags = [];
    try {
      existingTags = typeof tags === "string" ? JSON.parse(tags) : (Array.isArray(tags) ? tags : []);
    } catch {}

    const hasRichTags = existingTags.some(t => typeof t === "string" && t.includes("|"));
    if (hasRichTags) {
      console.log(`  ⏭️  Vídeo #${id} "${title}" — tags ricas já existem`);
      skipped++;
      continue;
    }

    // Escolher tags: específicas por título > por culinária > default
    let selectedTags = VIDEO_SPECIFIC_TAGS[title];
    if (!selectedTags) {
      const cuisineKey = RESTAURANT_CUISINE_MAP[restaurant_name] || cuisine;
      selectedTags = CUISINE_TAGS[cuisineKey] || CUISINE_TAGS["default"];
    }

    // Atualizar no banco
    await conn.execute(
      "UPDATE videos SET tags = ? WHERE id = ?",
      [JSON.stringify(selectedTags), id]
    );

    console.log(`  ✓ Vídeo #${id} "${title}" → ${selectedTags.length} tags`);
    updated++;
  }

  await conn.end();

  console.log(`\n✅ Concluído!`);
  console.log(`   Atualizados: ${updated} vídeos`);
  console.log(`   Ignorados:   ${skipped} vídeos (já tinham tags)`);
}

main().catch((err) => {
  console.error("Erro:", err);
  process.exit(1);
});
