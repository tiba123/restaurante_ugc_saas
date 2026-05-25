import mysql from "mysql2/promise";
import * as dotenv from "dotenv";
dotenv.config();

const conn = await mysql.createConnection(process.env.DATABASE_URL);

try {
  // Clear existing
  await conn.execute("DELETE FROM rewards");
  await conn.execute("DELETE FROM missions");

  // Insert missions
  await conn.execute(`
    INSERT INTO missions (\`key\`, title, description, type, points, iconEmoji, \`order\`) VALUES
    ('photo_prato', 'Foto do Prato', 'Tire uma foto quando o prato chegar na mesa e compartilhe sua primeira impressão visual.', 'photo', 10, '📸', 1),
    ('survey_experiencia', 'Responda ao Restaurante', 'Responda 3 perguntas rápidas: o que achou, o que mais gostou e o que menos gostou.', 'questions', 10, '💬', 2),
    ('video_provando', 'Grave um Vídeo Provando', 'Grave um vídeo curto provando a comida e mostrando sua reação genuína.', 'video', 30, '🎬', 3),
    ('review_sincera', 'Avaliação Sincera', 'Deixe uma avaliação sincera e detalhada do restaurante para ajudar outros consumidores.', 'review', 10, '⭐', 4)
  `);
  console.log("✅ Missões inseridas");

  // Insert rewards
  await conn.execute(`
    INSERT INTO rewards (title, description, type, pointsRequired, discountPercent, freeItemDescription, creditsValue, iconEmoji, badgeColor, isActive) VALUES
    ('Bebida Grátis', 'Você ganhou uma bebida de até R$8 grátis! Apresente o cupom ao garçom.', 'free_item', 10, 0, 'Bebida até R$8', 0, '🥤', '#3B82F6', TRUE),
    ('10% de Desconto', 'Você ganhou 10% de desconto em sua refeição! Válido por 30 dias.', 'discount', 30, 10, NULL, 0, '🎁', '#8B5CF6', TRUE),
    ('50% de Desconto', 'Incrível! Você ganhou 50% de desconto em sua refeição! Aproveite!', 'discount', 60, 50, NULL, 0, '🏆', '#F59E0B', TRUE)
  `);
  console.log("✅ Recompensas inseridas");

  const [m] = await conn.execute("SELECT COUNT(*) as c FROM missions");
  const [r] = await conn.execute("SELECT COUNT(*) as c FROM rewards");
  console.log(`📊 Missões: ${m[0].c} | Recompensas: ${r[0].c}`);
} finally {
  await conn.end();
}
