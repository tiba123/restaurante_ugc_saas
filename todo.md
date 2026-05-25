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
- [x] Gráfico de tags interativo: clique em barra/fatia/pill filtra vídeos relacionados no painel abaixo

## Fase 9: Rede Social Gastronômica
- [x] Schema: tabelas friendships, user_activities, restaurant_visits + campos sociais em users
- [x] Migration e aplicação no banco
- [x] Backend: router social (searchUsers, getProfile, getMyProfile, updateProfile, uploadAvatar, uploadCover)
- [x] Backend: sendRequest, respondRequest, removeFriend, listFriends, pendingRequests, friendsFeed
- [x] Perfil customizável: avatar, foto de capa, bio, cidade, culinária favorita, redes sociais
- [x] Estatísticas do perfil: total de vídeos, avaliações, restaurantes visitados, amigos
- [x] Página pública de perfil de usuário (/u/:userId) com vídeos, avaliações e restaurantes
- [x] Sistema de amizades: busca de usuários, envio/aceite/recusa de solicitações
- [x] Feed social de amigos: atividades recentes (novo vídeo, nova avaliação, restaurante visitado)
- [x] Seção "Restaurantes visitados" no perfil do usuário
- [x] GlobalNav com navbar superior + bottom nav mobile + menu dropdown do usuário
- [x] Rotas /profile, /friends, /social, /u/:userId integradas no App.tsx

## Fase 10: Landing Page Imersiva (TripAdvisor-style)
- [x] Hero com vídeo de fundo full-width e barra de busca centralizada
- [x] Quick links de culinária no hero (Hambúrguer, Sushi, Pizza, Churrasco, Vegano)
- [x] Stats bar com ícones e métricas da plataforma
- [x] Seção "Escolhas da Semana" com carousel horizontal e ranking numerado
- [x] Seção UGC em destaque: vídeo grande + grid 2x2 de vídeos menores
- [x] Grid de categorias de culinária com emoji e cores por tipo
- [x] Grid de restaurantes em destaque com layout horizontal (thumbnail + info)
- [x] Seção de bairros gastronômicos de SP com cards coloridos
- [x] Seção "Como Funciona" com 3 passos numerados
- [x] CTA para restaurantes com layout assimétrico
- [x] Footer completo com 4 colunas e links organizados

## Fase 11: Gamificação — Missões e Recompensas
- [x] Schema: tabelas missions, mission_sessions, mission_progress, rewards, user_rewards, user_credits
- [x] Migration e aplicação no banco
- [x] Backend: missionsRouterDef (list, rewards, accept, activeSession, complete, myRewards)
- [x] Página /missions com estilo gamer: missão principal, missões secundárias, barra de progresso
- [x] Cards de missão com pontuação, status (bloqueada/ativa/concluída) e animações
- [x] Sistema de recompensas com tiers (10pts, 30pts, 60pts) e badges visuais + cupons
- [x] Seed de 4 missões e 3 recompensas no banco
- [x] Rota /missions integrada no App.tsx com ícone Target na navbar

## Fase 12: Câmera Nativa e Upload Automático
- [x] Componente VideoCamera.tsx com MediaRecorder API (acesso à câmera/microfone)
- [x] Preview em tempo real via getUserMedia com seleção de câmera frontal/traseira
- [x] Gravação com timer visual, limite de 60s e botão stop
- [x] Preview do vídeo gravado antes de confirmar o upload
- [x] Upload automático via base64 para o storage da plataforma com barra de progresso
- [x] Página /upload com fluxo: escolher método → gravar/selecionar → detalhes → upload → sucesso
- [x] Endpoint backend atualizado para aceitar videoData (câmera nativa) e videoBase64 (legado)
- [x] Fallback para seleção de arquivo quando câmera não está disponível
- [x] Botão "Gravar" com ícone PlusCircle na navbar (desktop + mobile)
- [x] Integração com sistema de missões: +30pts ao completar upload

## Fase 12b: Melhorias de Upload (próxima iteração)
- [ ] Integrar fluxo de upload ao missionsRouter para registrar conclusão e creditar pontos persistidos
- [ ] Melhorar feedback de progresso de upload com indicadores mais precisos
