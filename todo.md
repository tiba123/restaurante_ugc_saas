# Plataforma UGC de Avaliação de Restaurantes — TODO

## Fase 1: Schema e Estrutura Base
- [x] Schema do banco: users, restaurants, videos, reviews, tags, achievements, benefits
- [x] Migrations e aplicação no banco
- [x] Helpers de DB (db.ts)

## Fase 2: Design System
- [x] Paleta de cores premium (dark/light), tipografia sofisticada
- [x] CSS global com variáveis e tokens de design
- [x] Componentes base reutilizáveis

## Fase 3: Backend (tRPC Routers)
- [x] Router: auth (me, logout)
- [x] Router: videos (feed, upload, approve, reject, like, view, comments)
- [x] Router: restaurants (list, search, filter, profile, register, update)
- [x] Router: reviews (create, list, by restaurant)
- [x] Router: admin (overview, stats, moderate, manage restaurants/users, allVideos, allRestaurants, allUsers, approveVideo, rejectVideo, verifyRestaurant, promoteUser)
- [x] Router: consumer (profile, history, achievements, benefits, uploadAvatar)
- [x] Router: restaurantDashboard (myRestaurant, pendingVideos, allVideos, approveVideo, rejectVideo, metrics, updateProfile, uploadLogo)
- [x] Storage helpers para upload de vídeos e imagens

## Fase 4: Ambiente do Consumidor
- [x] Landing page pública com hero e CTA
- [x] Feed infinito de vídeos (scroll vertical estilo TikTok)
- [x] Player de vídeo com curtidas, comentários e compartilhamento
- [x] Página de perfil do consumidor (histórico, conquistas, benefícios)
- [x] Fluxo de upload de vídeo com seleção de restaurante
- [x] Sistema de avaliação (estrelas + comentários + tags)
- [x] Busca e filtro de restaurantes (categoria, localização SP, nota, culinária)
- [x] Página pública de perfil do restaurante (feed, avaliações, nota média)

## Fase 5: Ambiente do Restaurante
- [x] Dashboard com métricas (visualizações, engajamento, NPS)
- [x] Fila de aprovação/rejeição de vídeos
- [x] Gestão de perfil do restaurante (foto, descrição, horários, localização)
- [x] Histórico de vídeos aprovados e rejeitados
- [x] Métricas de vídeos individuais

## Fase 6: Ambiente Admin
- [x] Dashboard com KPIs gerais da plataforma
- [x] Moderação de conteúdo (vídeos, reviews)
- [x] Gestão de restaurantes cadastrados
- [x] Gestão de usuários/consumidores
- [x] Métricas em tempo real

## Fase 7: Integração e Testes
- [x] Roteamento separado por papel (consumer, restaurant, admin)
- [x] Guards de autenticação e autorização
- [x] Testes unitários (vitest) — 13 testes passando
- [x] Página de cadastro de restaurante
- [x] Checkpoint final

## Fase 8: Features Adicionais
- [x] Sistema de tags automáticas via IA (LLM) nos vídeos do feed com badges coloridos por categoria
- [x] Seed de tags para vídeos existentes (15 vídeos atualizados)
- [x] Gráfico de distribuição de tags no dashboard do restaurante (barras horizontais + pizza por categoria)
