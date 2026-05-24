import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

// ─── Video URLs from Pexels (free, no auth needed for direct links) ───────────
// Using publicly accessible food/restaurant video URLs
const FOOD_VIDEOS = [
  {
    url: "https://videos.pexels.com/video-files/3209828/3209828-uhd_2560_1440_25fps.mp4",
    thumb: "https://images.pexels.com/videos/3209828/free-video-3209828.jpg?auto=compress&cs=tinysrgb&dpr=1&w=500",
    title: "Hambúrguer artesanal suculento",
    description: "Que hambúrguer incrível! Carne no ponto, pão brioche e aquele molho especial. Recomendo demais!",
    rating: 5,
    tags: ["hambúrguer", "artesanal", "suculento"],
  },
  {
    url: "https://videos.pexels.com/video-files/3296272/3296272-uhd_2560_1440_25fps.mp4",
    thumb: "https://images.pexels.com/videos/3296272/free-video-3296272.jpg?auto=compress&cs=tinysrgb&dpr=1&w=500",
    title: "Pizza napolitana perfeita",
    description: "A melhor pizza que já comi em SP! Massa fininha, molho de tomate fresco e mussarela de búfala.",
    rating: 5,
    tags: ["pizza", "italiana", "napolitana"],
  },
  {
    url: "https://videos.pexels.com/video-files/5908226/5908226-hd_1920_1080_30fps.mp4",
    thumb: "https://images.pexels.com/videos/5908226/free-video-5908226.jpg?auto=compress&cs=tinysrgb&dpr=1&w=500",
    title: "Sushi premium no Itaim",
    description: "Experiência gastronômica incrível! O sashimi estava fresquíssimo e a apresentação impecável.",
    rating: 5,
    tags: ["sushi", "japonês", "premium"],
  },
  {
    url: "https://videos.pexels.com/video-files/4253925/4253925-uhd_2560_1440_25fps.mp4",
    thumb: "https://images.pexels.com/videos/4253925/free-video-4253925.jpg?auto=compress&cs=tinysrgb&dpr=1&w=500",
    title: "Churrasco gaúcho autêntico",
    description: "Picanha na brasa do jeito certo! Sal grosso, fogo alto e aquela crosta perfeita. Simplesmente incrível.",
    rating: 4,
    tags: ["churrasco", "picanha", "gaúcho"],
  },
  {
    url: "https://videos.pexels.com/video-files/3191574/3191574-uhd_2560_1440_25fps.mp4",
    thumb: "https://images.pexels.com/videos/3191574/free-video-3191574.jpg?auto=compress&cs=tinysrgb&dpr=1&w=500",
    title: "Café da manhã completo",
    description: "Esse café da manhã é de outro nível! Pão de queijo quentinho, tapioca, frutas frescas e suco natural.",
    rating: 4,
    tags: ["café", "manhã", "brunch"],
  },
  {
    url: "https://videos.pexels.com/video-files/3209828/3209828-uhd_2560_1440_25fps.mp4",
    thumb: "https://images.pexels.com/videos/3209828/free-video-3209828.jpg?auto=compress&cs=tinysrgb&dpr=1&w=500",
    title: "Risoto de funghi porcini",
    description: "Risoto cremoso do jeito que eu gosto! Al dente, com muito funghi e um toque de trufa. Perfeito!",
    rating: 5,
    tags: ["risoto", "italiano", "funghi"],
  },
  {
    url: "https://videos.pexels.com/video-files/3296272/3296272-uhd_2560_1440_25fps.mp4",
    thumb: "https://images.pexels.com/videos/3296272/free-video-3296272.jpg?auto=compress&cs=tinysrgb&dpr=1&w=500",
    title: "Tacos mexicanos autênticos",
    description: "Tacos de carnitas com guacamole caseiro! Tortilla de milho fresquinha e muito coentro. Delicioso!",
    rating: 4,
    tags: ["mexicano", "tacos", "carnitas"],
  },
  {
    url: "https://videos.pexels.com/video-files/5908226/5908226-hd_1920_1080_30fps.mp4",
    thumb: "https://images.pexels.com/videos/5908226/free-video-5908226.jpg?auto=compress&cs=tinysrgb&dpr=1&w=500",
    title: "Steak perfeito ao ponto",
    description: "Esse bife ancho é simplesmente perfeito! Selado na manteiga com alecrim, ao ponto como pedido.",
    rating: 5,
    tags: ["steak", "carne", "fine dining"],
  },
  {
    url: "https://videos.pexels.com/video-files/4253925/4253925-uhd_2560_1440_25fps.mp4",
    thumb: "https://images.pexels.com/videos/4253925/free-video-4253925.jpg?auto=compress&cs=tinysrgb&dpr=1&w=500",
    title: "Açaí bowl com granola",
    description: "Açaí fresquinho com granola artesanal, frutas e mel. Perfeito para uma tarde saudável em SP!",
    rating: 4,
    tags: ["açaí", "saudável", "bowl"],
  },
  {
    url: "https://videos.pexels.com/video-files/3191574/3191574-uhd_2560_1440_25fps.mp4",
    thumb: "https://images.pexels.com/videos/3191574/free-video-3191574.jpg?auto=compress&cs=tinysrgb&dpr=1&w=500",
    title: "Feijoada completa de sexta",
    description: "Feijoada completa com todos os acompanhamentos! Couve refogada, farofa, laranja e muito samba.",
    rating: 5,
    tags: ["feijoada", "brasileiro", "tradicional"],
  },
  {
    url: "https://videos.pexels.com/video-files/3209828/3209828-uhd_2560_1440_25fps.mp4",
    thumb: "https://images.pexels.com/videos/3209828/free-video-3209828.jpg?auto=compress&cs=tinysrgb&dpr=1&w=500",
    title: "Ramen japonês autêntico",
    description: "Caldo de tonkotsu cozido por 12 horas! Macarrão al dente, ovo marinado e chashu de porco.",
    rating: 5,
    tags: ["ramen", "japonês", "tonkotsu"],
  },
  {
    url: "https://videos.pexels.com/video-files/3296272/3296272-uhd_2560_1440_25fps.mp4",
    thumb: "https://images.pexels.com/videos/3296272/free-video-3296272.jpg?auto=compress&cs=tinysrgb&dpr=1&w=500",
    title: "Sorvete artesanal de pistache",
    description: "Sorvete artesanal de pistache com calda de caramelo salgado. Simplesmente divino!",
    rating: 4,
    tags: ["sorvete", "artesanal", "sobremesa"],
  },
];

const RESTAURANTS = [
  {
    name: "Burger Lab SP",
    slug: "burger-lab-sp",
    description: "O melhor hambúrguer artesanal de São Paulo. Ingredientes selecionados, pão brioche artesanal e carnes nobres.",
    cuisine: "Americana",
    category: "casual",
    address: "Rua dos Pinheiros, 512",
    neighborhood: "Pinheiros",
    phone: "(11) 3456-7890",
    website: "https://burgerlabsp.com.br",
    instagramHandle: "burgerlabsp",
    priceRange: "$$",
    logoUrl: "https://images.pexels.com/photos/1639557/pexels-photo-1639557.jpeg?auto=compress&cs=tinysrgb&w=400",
    coverUrl: "https://images.pexels.com/photos/1639557/pexels-photo-1639557.jpeg?auto=compress&cs=tinysrgb&w=1200",
    averageRating: "4.80",
    totalReviews: 127,
    totalVideos: 0,
    totalViews: 3420,
    isActive: true,
    isVerified: true,
  },
  {
    name: "Sushi Tanaka",
    slug: "sushi-tanaka",
    description: "Culinária japonesa autêntica no coração do Itaim Bibi. Peixes frescos importados diariamente.",
    cuisine: "Japonesa",
    category: "fine_dining",
    address: "Rua Joaquim Floriano, 466",
    neighborhood: "Itaim Bibi",
    phone: "(11) 3078-2233",
    website: "https://sushitanaka.com.br",
    instagramHandle: "sushitanaka",
    priceRange: "$$$",
    logoUrl: "https://images.pexels.com/photos/2098085/pexels-photo-2098085.jpeg?auto=compress&cs=tinysrgb&w=400",
    coverUrl: "https://images.pexels.com/photos/2098085/pexels-photo-2098085.jpeg?auto=compress&cs=tinysrgb&w=1200",
    averageRating: "4.90",
    totalReviews: 89,
    totalVideos: 0,
    totalViews: 5120,
    isActive: true,
    isVerified: true,
  },
  {
    name: "La Trattoria",
    slug: "la-trattoria",
    description: "Autêntica cozinha italiana com massas frescas artesanais, vinhos selecionados e ambiente aconchegante.",
    cuisine: "Italiana",
    category: "fine_dining",
    address: "Alameda Santos, 1165",
    neighborhood: "Jardim Paulista",
    phone: "(11) 3253-4455",
    website: "https://latrattoria.com.br",
    instagramHandle: "latrattoriasp",
    priceRange: "$$$",
    logoUrl: "https://images.pexels.com/photos/1279330/pexels-photo-1279330.jpeg?auto=compress&cs=tinysrgb&w=400",
    coverUrl: "https://images.pexels.com/photos/1279330/pexels-photo-1279330.jpeg?auto=compress&cs=tinysrgb&w=1200",
    averageRating: "4.70",
    totalReviews: 203,
    totalVideos: 0,
    totalViews: 7890,
    isActive: true,
    isVerified: true,
  },
  {
    name: "Churrascaria Gaúcha",
    slug: "churrascaria-gaucha",
    description: "Rodízio de churrasco gaúcho com mais de 20 cortes nobres. Picanha, costela, fraldinha e muito mais.",
    cuisine: "Brasileira",
    category: "churrascaria",
    address: "Av. Brigadeiro Faria Lima, 2232",
    neighborhood: "Jardim Europa",
    phone: "(11) 3816-9900",
    website: "https://churrascariagaucha.com.br",
    instagramHandle: "churrascariagaucha",
    priceRange: "$$",
    logoUrl: "https://images.pexels.com/photos/1251208/pexels-photo-1251208.jpeg?auto=compress&cs=tinysrgb&w=400",
    coverUrl: "https://images.pexels.com/photos/1251208/pexels-photo-1251208.jpeg?auto=compress&cs=tinysrgb&w=1200",
    averageRating: "4.60",
    totalReviews: 341,
    totalVideos: 0,
    totalViews: 9230,
    isActive: true,
    isVerified: true,
  },
  {
    name: "Café Paulista",
    slug: "cafe-paulista",
    description: "O melhor café da manhã e brunch de SP. Pão de queijo fresquinho, tapiocas e sucos naturais.",
    cuisine: "Brasileira",
    category: "cafe",
    address: "Rua Oscar Freire, 889",
    neighborhood: "Cerqueira César",
    phone: "(11) 3064-2211",
    website: "https://cafepaulista.com.br",
    instagramHandle: "cafepaulistasp",
    priceRange: "$",
    logoUrl: "https://images.pexels.com/photos/312418/pexels-photo-312418.jpeg?auto=compress&cs=tinysrgb&w=400",
    coverUrl: "https://images.pexels.com/photos/312418/pexels-photo-312418.jpeg?auto=compress&cs=tinysrgb&w=1200",
    averageRating: "4.50",
    totalReviews: 156,
    totalVideos: 0,
    totalViews: 4100,
    isActive: true,
    isVerified: false,
  },
  {
    name: "El Mariachi",
    slug: "el-mariachi",
    description: "Culinária mexicana autêntica com tacos, burritos e margaritas. Ambiente animado e colorido.",
    cuisine: "Mexicana",
    category: "casual",
    address: "Rua Aspicuelta, 344",
    neighborhood: "Vila Madalena",
    phone: "(11) 3815-7766",
    website: "https://elmariachi.com.br",
    instagramHandle: "elmariachivila",
    priceRange: "$$",
    logoUrl: "https://images.pexels.com/photos/461198/pexels-photo-461198.jpeg?auto=compress&cs=tinysrgb&w=400",
    coverUrl: "https://images.pexels.com/photos/461198/pexels-photo-461198.jpeg?auto=compress&cs=tinysrgb&w=1200",
    averageRating: "4.40",
    totalReviews: 98,
    totalVideos: 0,
    totalViews: 2870,
    isActive: true,
    isVerified: false,
  },
  {
    name: "Steakhouse Prime",
    slug: "steakhouse-prime",
    description: "Carnes premium maturadas, ambiente sofisticado e carta de vinhos exclusiva. Fine dining em SP.",
    cuisine: "Internacional",
    category: "fine_dining",
    address: "Rua Haddock Lobo, 1626",
    neighborhood: "Jardins",
    phone: "(11) 3062-8899",
    website: "https://steakhouseprime.com.br",
    instagramHandle: "steakhouseprime",
    priceRange: "$$$$",
    logoUrl: "https://images.pexels.com/photos/3535383/pexels-photo-3535383.jpeg?auto=compress&cs=tinysrgb&w=400",
    coverUrl: "https://images.pexels.com/photos/3535383/pexels-photo-3535383.jpeg?auto=compress&cs=tinysrgb&w=1200",
    averageRating: "4.85",
    totalReviews: 67,
    totalVideos: 0,
    totalViews: 6540,
    isActive: true,
    isVerified: true,
  },
  {
    name: "Ramen House",
    slug: "ramen-house",
    description: "Ramen artesanal com caldos cozidos por mais de 12 horas. Tonkotsu, Shoyu e Miso.",
    cuisine: "Japonesa",
    category: "casual",
    address: "Rua Tomás González, 89",
    neighborhood: "Liberdade",
    phone: "(11) 3277-4433",
    website: "https://ramenhouse.com.br",
    instagramHandle: "ramenhousesp",
    priceRange: "$$",
    logoUrl: "https://images.pexels.com/photos/884600/pexels-photo-884600.jpeg?auto=compress&cs=tinysrgb&w=400",
    coverUrl: "https://images.pexels.com/photos/884600/pexels-photo-884600.jpeg?auto=compress&cs=tinysrgb&w=1200",
    averageRating: "4.75",
    totalReviews: 184,
    totalVideos: 0,
    totalViews: 5670,
    isActive: true,
    isVerified: true,
  },
];

const USERS = [
  { name: "Ana Beatriz Santos", email: "ana@example.com", openId: "seed-user-001", bio: "Foodie apaixonada por São Paulo. Já visitei mais de 200 restaurantes!", avatarUrl: "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=200", city: "São Paulo", totalVideos: 8, totalLikes: 342, totalReviews: 15 },
  { name: "Carlos Eduardo Lima", email: "carlos@example.com", openId: "seed-user-002", bio: "Chef amador e crítico gastronômico nas horas vagas.", avatarUrl: "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=200", city: "São Paulo", totalVideos: 12, totalLikes: 567, totalReviews: 22 },
  { name: "Fernanda Oliveira", email: "fernanda@example.com", openId: "seed-user-003", bio: "Sempre em busca do próximo restaurante incrível de SP.", avatarUrl: "https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=200", city: "São Paulo", totalVideos: 5, totalLikes: 198, totalReviews: 9 },
  { name: "Rafael Mendes", email: "rafael@example.com", openId: "seed-user-004", bio: "Apaixonado por culinária japonesa e italiana.", avatarUrl: "https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=200", city: "São Paulo", totalVideos: 7, totalLikes: 289, totalReviews: 18 },
  { name: "Juliana Costa", email: "juliana@example.com", openId: "seed-user-005", bio: "Influenciadora gastronômica e criadora de conteúdo.", avatarUrl: "https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=200", city: "São Paulo", totalVideos: 20, totalLikes: 1240, totalReviews: 35 },
];

const REVIEW_TEXTS = [
  "Experiência incrível! O atendimento foi impecável e a comida superou todas as expectativas. Voltarei com certeza!",
  "Lugar maravilhoso! Ambiente aconchegante, comida deliciosa e preço justo. Recomendo muito.",
  "Fui no aniversário da minha esposa e foi perfeito. Equipe atenciosa, pratos bem elaborados e sobremesa divina.",
  "Melhor restaurante que já fui em SP! A qualidade dos ingredientes é notável e o chef claramente sabe o que faz.",
  "Ambiente sofisticado sem ser pretensioso. Comida de alta qualidade e carta de vinhos excelente.",
  "Descobri esse lugar por indicação e não me arrependo. Já voltei três vezes esse mês!",
  "Perfeito para um jantar especial. Iluminação agradável, música boa e pratos que parecem obras de arte.",
  "O melhor custo-benefício da região. Porções generosas e sabor autêntico.",
];

async function seed() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  const db = drizzle(connection);

  console.log("🌱 Iniciando seed da plataforma Tastee...\n");

  // ─── Insert Users ──────────────────────────────────────────────────────────
  console.log("👤 Inserindo usuários demo...");
  const insertedUserIds = [];
  for (const user of USERS) {
    try {
      await connection.execute(
        `INSERT INTO users (openId, name, email, loginMethod, role, avatarUrl, bio, city, totalVideos, totalLikes, totalReviews, createdAt, updatedAt, lastSignedIn)
         VALUES (?, ?, ?, 'demo', 'user', ?, ?, ?, ?, ?, ?, NOW(), NOW(), NOW())
         ON DUPLICATE KEY UPDATE name=VALUES(name), email=VALUES(email), avatarUrl=VALUES(avatarUrl), bio=VALUES(bio)`,
        [user.openId, user.name, user.email, user.avatarUrl, user.bio, user.city, user.totalVideos, user.totalLikes, user.totalReviews]
      );
      const [rows] = await connection.execute(`SELECT id FROM users WHERE openId = ?`, [user.openId]);
      insertedUserIds.push(rows[0].id);
      console.log(`  ✓ ${user.name} (id: ${rows[0].id})`);
    } catch (e) {
      console.error(`  ✗ Erro ao inserir ${user.name}:`, e.message);
    }
  }

  // ─── Insert Restaurants ────────────────────────────────────────────────────
  console.log("\n🍽️  Inserindo restaurantes demo...");
  const insertedRestaurantIds = [];
  for (let i = 0; i < RESTAURANTS.length; i++) {
    const r = RESTAURANTS[i];
    const ownerId = insertedUserIds[i % insertedUserIds.length];
    try {
      await connection.execute(
        `INSERT INTO restaurants (ownerId, name, slug, description, cuisine, category, address, neighborhood, city, state, phone, website, instagramHandle, logoUrl, coverUrl, priceRange, averageRating, totalReviews, totalVideos, totalViews, isActive, isVerified, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'São Paulo', 'SP', ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, NOW(), NOW())
         ON DUPLICATE KEY UPDATE name=VALUES(name)`,
        [ownerId, r.name, r.slug, r.description, r.cuisine, r.category, r.address, r.neighborhood, r.phone, r.website, r.instagramHandle, r.logoUrl, r.coverUrl, r.priceRange, r.averageRating, r.totalReviews, r.totalViews, r.isActive ? 1 : 0, r.isVerified ? 1 : 0]
      );
      const [rows] = await connection.execute(`SELECT id FROM restaurants WHERE slug = ?`, [r.slug]);
      insertedRestaurantIds.push(rows[0].id);
      console.log(`  ✓ ${r.name} (id: ${rows[0].id})`);
    } catch (e) {
      console.error(`  ✗ Erro ao inserir ${r.name}:`, e.message);
    }
  }

  // ─── Insert Videos ─────────────────────────────────────────────────────────
  console.log("\n🎥 Inserindo vídeos demo...");
  const insertedVideoIds = [];
  for (let i = 0; i < FOOD_VIDEOS.length; i++) {
    const v = FOOD_VIDEOS[i];
    const userId = insertedUserIds[i % insertedUserIds.length];
    const restaurantId = insertedRestaurantIds[i % insertedRestaurantIds.length];
    const views = Math.floor(Math.random() * 5000) + 200;
    const likes = Math.floor(views * (0.05 + Math.random() * 0.15));
    const comments = Math.floor(likes * (0.1 + Math.random() * 0.2));
    try {
      await connection.execute(
        `INSERT INTO videos (userId, restaurantId, title, description, videoUrl, videoKey, thumbnailUrl, thumbnailKey, duration, status, views, likes, comments, rating, tags, isPublic, approvedAt, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'approved', ?, ?, ?, ?, ?, 1, NOW(), NOW(), NOW())`,
        [userId, restaurantId, v.title, v.description, v.url, `seed/video-${i}.mp4`, v.thumb, `seed/thumb-${i}.jpg`, 45 + Math.floor(Math.random() * 90), views, likes, comments, v.rating, JSON.stringify(v.tags)]
      );
      const [rows] = await connection.execute(`SELECT id FROM videos WHERE videoKey = ?`, [`seed/video-${i}.mp4`]);
      insertedVideoIds.push(rows[0].id);
      console.log(`  ✓ "${v.title}" (id: ${rows[0].id}, views: ${views})`);
    } catch (e) {
      console.error(`  ✗ Erro ao inserir vídeo "${v.title}":`, e.message);
    }
  }

  // ─── Insert 2 Pending Videos (for restaurant dashboard testing) ────────────
  console.log("\n⏳ Inserindo vídeos pendentes para teste de aprovação...");
  const pendingVideos = [
    { title: "Experiência no Burger Lab", description: "Fui hoje no Burger Lab e foi incrível! O hambúrguer smash estava perfeito.", rating: 5 },
    { title: "Jantar romântico no Sushi Tanaka", description: "Levei minha namorada no Sushi Tanaka e ela amou! Ambiente lindo e sushi fresquíssimo.", rating: 5 },
    { title: "Almoço de domingo na Churrascaria", description: "Rodízio completo com a família! Picanha, costela, fraldinha... tudo perfeito.", rating: 4 },
  ];
  for (let i = 0; i < pendingVideos.length; i++) {
    const pv = pendingVideos[i];
    const userId = insertedUserIds[i % insertedUserIds.length];
    const restaurantId = insertedRestaurantIds[i % insertedRestaurantIds.length];
    try {
      await connection.execute(
        `INSERT INTO videos (userId, restaurantId, title, description, videoUrl, videoKey, thumbnailUrl, duration, status, views, likes, comments, rating, tags, isPublic, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', 0, 0, 0, ?, '[]', 0, NOW(), NOW())`,
        [userId, restaurantId, pv.title, pv.description, FOOD_VIDEOS[i].url, `pending/video-${i}.mp4`, FOOD_VIDEOS[i].thumb, 60, pv.rating]
      );
      console.log(`  ✓ Pendente: "${pv.title}"`);
    } catch (e) {
      console.error(`  ✗ Erro ao inserir vídeo pendente:`, e.message);
    }
  }

  // ─── Update restaurant totalVideos ────────────────────────────────────────
  console.log("\n📊 Atualizando contadores de vídeos dos restaurantes...");
  for (const rid of insertedRestaurantIds) {
    await connection.execute(
      `UPDATE restaurants SET totalVideos = (SELECT COUNT(*) FROM videos WHERE restaurantId = ? AND status = 'approved') WHERE id = ?`,
      [rid, rid]
    );
  }

  // ─── Insert Reviews ────────────────────────────────────────────────────────
  console.log("\n⭐ Inserindo avaliações demo...");
  let reviewCount = 0;
  for (const restaurantId of insertedRestaurantIds) {
    const numReviews = 3 + Math.floor(Math.random() * 4);
    for (let i = 0; i < numReviews; i++) {
      const userId = insertedUserIds[i % insertedUserIds.length];
      const rating = 4 + Math.floor(Math.random() * 2);
      const text = REVIEW_TEXTS[Math.floor(Math.random() * REVIEW_TEXTS.length)];
      try {
        await connection.execute(
          `INSERT INTO reviews (userId, restaurantId, rating, title, content, foodRating, serviceRating, ambianceRating, valueRating, isVerified, helpfulCount, createdAt, updatedAt)
           VALUES (?, ?, ?, 'Experiência incrível!', ?, ?, ?, ?, ?, 1, ?, NOW(), NOW())`,
          [userId, restaurantId, rating, text, rating, Math.min(5, rating + Math.floor(Math.random() * 2) - 1), Math.min(5, rating + Math.floor(Math.random() * 2) - 1), Math.min(5, rating - Math.floor(Math.random() * 2)), Math.floor(Math.random() * 20)]
        );
        reviewCount++;
      } catch (e) {
        // skip duplicates
      }
    }
  }
  console.log(`  ✓ ${reviewCount} avaliações inseridas`);

  // ─── Insert Video Likes ────────────────────────────────────────────────────
  console.log("\n❤️  Inserindo curtidas nos vídeos...");
  let likeCount = 0;
  for (const videoId of insertedVideoIds) {
    const numLikes = 2 + Math.floor(Math.random() * 4);
    for (let i = 0; i < numLikes; i++) {
      const userId = insertedUserIds[i % insertedUserIds.length];
      try {
        await connection.execute(
          `INSERT IGNORE INTO video_likes (videoId, userId, createdAt) VALUES (?, ?, NOW())`,
          [videoId, userId]
        );
        likeCount++;
      } catch (e) {
        // skip duplicates
      }
    }
  }
  console.log(`  ✓ ${likeCount} curtidas inseridas`);

  // ─── Insert Video Comments ─────────────────────────────────────────────────
  console.log("\n💬 Inserindo comentários nos vídeos...");
  const COMMENT_TEXTS = [
    "Que delícia! Preciso ir lá!",
    "Já fui e confirmo, é incrível mesmo!",
    "Minha boca está salivando só de ver!",
    "Esse lugar é um dos meus favoritos de SP!",
    "Vou marcar com meu namorado esse fim de semana!",
    "Perfeito para um jantar especial!",
    "Melhor que vi em muito tempo!",
    "Obrigada pela dica, já estou indo!",
  ];
  let commentCount = 0;
  for (const videoId of insertedVideoIds.slice(0, 8)) {
    const numComments = 2 + Math.floor(Math.random() * 4);
    for (let i = 0; i < numComments; i++) {
      const userId = insertedUserIds[i % insertedUserIds.length];
      const text = COMMENT_TEXTS[Math.floor(Math.random() * COMMENT_TEXTS.length)];
      try {
        await connection.execute(
          `INSERT INTO video_comments (videoId, userId, content, likes, createdAt, updatedAt) VALUES (?, ?, ?, ?, NOW(), NOW())`,
          [videoId, userId, text, Math.floor(Math.random() * 15)]
        );
        commentCount++;
      } catch (e) {
        // skip
      }
    }
  }
  console.log(`  ✓ ${commentCount} comentários inseridos`);

  // ─── Insert Achievements ───────────────────────────────────────────────────
  console.log("\n🏆 Inserindo conquistas...");
  const ACHIEVEMENTS = [
    { key: "first_video", name: "Primeiro Vídeo!", description: "Enviou seu primeiro vídeo de avaliação", points: 50 },
    { key: "five_videos", name: "Criador de Conteúdo", description: "Enviou 5 vídeos aprovados", points: 150 },
    { key: "ten_videos", name: "Influenciador Local", description: "Enviou 10 vídeos aprovados", points: 300 },
    { key: "first_review", name: "Crítico Gastronômico", description: "Escreveu sua primeira avaliação", points: 25 },
    { key: "hundred_likes", name: "Viral!", description: "Seus vídeos receberam 100 curtidas", points: 200 },
  ];
  for (const ach of ACHIEVEMENTS) {
    try {
      await connection.execute(
        `INSERT IGNORE INTO achievements (\`key\`, name, description, points, createdAt) VALUES (?, ?, ?, ?, NOW())`,
        [ach.key, ach.name, ach.description, ach.points]
      );
    } catch (e) {
      // skip
    }
  }
  console.log(`  ✓ ${ACHIEVEMENTS.length} conquistas inseridas`);

  // ─── Summary ──────────────────────────────────────────────────────────────
  console.log("\n✅ Seed concluído com sucesso!");
  console.log("─".repeat(50));
  console.log(`👤 Usuários: ${insertedUserIds.length}`);
  console.log(`🍽️  Restaurantes: ${insertedRestaurantIds.length}`);
  console.log(`🎥 Vídeos aprovados: ${insertedVideoIds.length}`);
  console.log(`⏳ Vídeos pendentes: ${pendingVideos.length}`);
  console.log(`⭐ Avaliações: ${reviewCount}`);
  console.log(`❤️  Curtidas: ${likeCount}`);
  console.log(`💬 Comentários: ${commentCount}`);
  console.log("─".repeat(50));
  console.log("\n🚀 Plataforma pronta para testes!");

  await connection.end();
}

seed().catch((e) => {
  console.error("Erro no seed:", e);
  process.exit(1);
});
