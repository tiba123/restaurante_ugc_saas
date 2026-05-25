import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { useState, useRef, useEffect } from "react";
import {
  Star, Play, ChevronRight, ChevronLeft, MapPin, Shield, Award, Users,
  Utensils, Video, Search, TrendingUp, Heart, Eye, MessageCircle, Flame
} from "lucide-react";
import { Link } from "wouter";

// ─── Cuisine Category Card ────────────────────────────────────────────────────
const CUISINES = [
  { name: "Japonesa", emoji: "🍣", color: "from-red-900/80 to-red-700/60", bg: "bg-red-950" },
  { name: "Italiana", emoji: "🍝", color: "from-green-900/80 to-green-700/60", bg: "bg-green-950" },
  { name: "Brasileira", emoji: "🥩", color: "from-yellow-900/80 to-yellow-700/60", bg: "bg-yellow-950" },
  { name: "Hambúrguer", emoji: "🍔", color: "from-orange-900/80 to-orange-700/60", bg: "bg-orange-950" },
  { name: "Pizza", emoji: "🍕", color: "from-amber-900/80 to-amber-700/60", bg: "bg-amber-950" },
  { name: "Mexicana", emoji: "🌮", color: "from-rose-900/80 to-rose-700/60", bg: "bg-rose-950" },
  { name: "Frutos do Mar", emoji: "🦞", color: "from-blue-900/80 to-blue-700/60", bg: "bg-blue-950" },
  { name: "Vegana", emoji: "🥗", color: "from-emerald-900/80 to-emerald-700/60", bg: "bg-emerald-950" },
];

// ─── SP Neighborhoods ─────────────────────────────────────────────────────────
const NEIGHBORHOODS = [
  { name: "Vila Madalena", count: "120+ restaurantes", gradient: "from-purple-600 to-pink-600" },
  { name: "Itaim Bibi", count: "95+ restaurantes", gradient: "from-amber-600 to-orange-600" },
  { name: "Pinheiros", count: "110+ restaurantes", gradient: "from-teal-600 to-cyan-600" },
  { name: "Jardins", count: "85+ restaurantes", gradient: "from-rose-600 to-red-600" },
  { name: "Moema", count: "70+ restaurantes", gradient: "from-indigo-600 to-blue-600" },
  { name: "Bela Vista", count: "60+ restaurantes", gradient: "from-green-600 to-emerald-600" },
];

// ─── Star Rating ──────────────────────────────────────────────────────────────
function StarRating({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" }) {
  const sz = size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4";
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`${sz} ${i <= Math.round(rating) ? "text-amber-400 fill-amber-400" : "text-muted-foreground/30"}`}
        />
      ))}
    </div>
  );
}

// ─── Horizontal Scroll Carousel ───────────────────────────────────────────────
function HorizontalCarousel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const scroll = (dir: "left" | "right") => {
    if (!ref.current) return;
    ref.current.scrollBy({ left: dir === "right" ? 340 : -340, behavior: "smooth" });
  };
  return (
    <div className={`relative group ${className}`}>
      <button
        onClick={() => scroll("left")}
        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-10 h-10 rounded-full bg-background border border-border shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-muted"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <div
        ref={ref}
        className="flex gap-4 overflow-x-auto scrollbar-hide pb-2"
        style={{ scrollSnapType: "x mandatory" }}
      >
        {children}
      </div>
      <button
        onClick={() => scroll("right")}
        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-10 h-10 rounded-full bg-background border border-border shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-muted"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [, navigate] = useState<string>("");
  const { data: restaurants } = trpc.restaurants.list.useQuery({ limit: 12 });
  const { data: feedVideos } = trpc.videos.feed.useQuery({ limit: 6, offset: 0 });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/explore?q=${encodeURIComponent(searchQuery)}`;
    }
  };

  const topRestaurants = restaurants?.slice(0, 8) ?? [];
  const featuredRestaurant = restaurants?.[0];
  const sideRestaurants = restaurants?.slice(1, 5) ?? [];

  return (
    <div className="min-h-screen bg-background">
      {/* ─── Navigation ─────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/50">
        <div className="container flex items-center justify-between h-16">
          <Link href="/">
            <span className="font-display text-2xl font-bold text-gradient cursor-pointer">Tastee</span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <Link href="/explore">
              <span className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer">Explorar</span>
            </Link>
            <Link href="/feed">
              <span className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer">Feed</span>
            </Link>
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <Link href="/social">
                  <span className="text-sm font-medium text-muted-foreground hover:text-foreground cursor-pointer">Amigos</span>
                </Link>
                <Link href="/profile">
                  <span className="text-sm font-medium text-muted-foreground hover:text-foreground cursor-pointer">Meu Perfil</span>
                </Link>
                {user?.role === "admin" && (
                  <Link href="/admin">
                    <span className="text-sm font-medium text-primary cursor-pointer">Admin</span>
                  </Link>
                )}
              </div>
            ) : (
              <a href={getLoginUrl()} className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">
                Entrar
              </a>
            )}
          </div>
          <div className="flex md:hidden items-center gap-3">
            {isAuthenticated ? (
              <Link href="/profile">
                <span className="text-sm font-medium text-primary cursor-pointer">Perfil</span>
              </Link>
            ) : (
              <a href={getLoginUrl()} className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium">
                Entrar
              </a>
            )}
          </div>
        </div>
      </nav>

      {/* ─── Hero com imagem de fundo ─────────────────────────────────────── */}
      <section className="relative h-[85vh] min-h-[560px] flex items-center justify-center overflow-hidden">
        {/* Imagem de fundo premium de gastronomia */}
        <img
          src="/manus-storage/hero_food_a65c8935.jpg"
          alt="Fine dining experience"
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Overlay gradiente */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/80" />

        {/* Conteúdo centralizado */}
        <div className="relative z-10 text-center px-4 w-full max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/15 backdrop-blur-sm text-white rounded-full text-sm font-medium mb-6 border border-white/20">
            <Flame className="w-4 h-4 text-orange-400" />
            São Paulo · Avaliações Reais de Consumidores
          </div>

          <h1 className="font-display text-5xl md:text-7xl font-bold text-white mb-6 leading-tight drop-shadow-2xl">
            Descubra onde{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400 italic">comer bem</span>{" "}
            em SP
          </h1>

          <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto mb-10 leading-relaxed">
            Vídeos reais de consumidores, avaliações verificadas e benefícios exclusivos para quem compartilha sua experiência.
          </p>

          {/* Barra de busca estilo TripAdvisor */}
          <form onSubmit={handleSearch} className="flex items-center max-w-2xl mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden p-1.5 gap-2">
            <div className="flex items-center gap-3 flex-1 px-4">
              <Search className="w-5 h-5 text-muted-foreground shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar restaurante, culinária ou bairro..."
                className="flex-1 text-foreground placeholder:text-muted-foreground bg-transparent outline-none text-base py-2"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity shrink-0"
            >
              Buscar
            </button>
          </form>

          {/* Quick links */}
          <div className="flex items-center justify-center gap-3 mt-6 flex-wrap">
            {["Hambúrguer", "Sushi", "Pizza", "Churrasco", "Vegano"].map((tag) => (
              <Link key={tag} href={`/explore?cuisine=${tag}`}>
                <span className="px-4 py-1.5 bg-white/15 backdrop-blur-sm text-white text-sm rounded-full border border-white/20 hover:bg-white/25 transition-colors cursor-pointer">
                  {tag}
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/50 animate-bounce">
          <div className="w-6 h-10 rounded-full border-2 border-white/30 flex items-start justify-center pt-2">
            <div className="w-1 h-2 bg-white/50 rounded-full" />
          </div>
        </div>
      </section>

      {/* ─── Stats Bar ───────────────────────────────────────────────────── */}
      <section className="py-10 border-b border-border bg-muted/30">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { value: "500+", label: "Restaurantes Parceiros", icon: Utensils },
              { value: "12K+", label: "Avaliações em Vídeo", icon: Video },
              { value: "98%", label: "Taxa de Satisfação", icon: Heart },
              { value: "São Paulo", label: "Foco Geográfico", icon: MapPin },
            ].map((stat) => (
              <div key={stat.label} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <stat.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="font-display text-2xl font-bold text-gradient leading-none">{stat.value}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Escolhas da Semana (TripAdvisor-style ranking) ──────────────── */}
      <section className="py-16">
        <div className="container">
          <div className="flex items-end justify-between mb-8">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Award className="w-5 h-5 text-amber-500" />
                <span className="text-sm font-semibold text-amber-600 uppercase tracking-wide">Escolhas da Semana</span>
              </div>
              <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground">
                Os mais bem avaliados de SP
              </h2>
              <p className="text-muted-foreground mt-1">Selecionados com base em avaliações reais de consumidores</p>
            </div>
            <Link href="/explore">
              <button className="hidden md:inline-flex items-center gap-2 text-sm font-medium text-primary hover:opacity-80 transition-opacity cursor-pointer">
                Ver todos <ChevronRight className="w-4 h-4" />
              </button>
            </Link>
          </div>

          <HorizontalCarousel>
            {topRestaurants.map((restaurant, index) => (
              <Link key={restaurant.id} href={`/restaurant/${restaurant.slug}`}>
                <div
                  className="shrink-0 w-72 card-premium overflow-hidden cursor-pointer group"
                  style={{ scrollSnapAlign: "start" }}
                >
                  {/* Imagem */}
                  <div className="relative h-44 bg-gradient-to-br from-primary/10 to-accent/10 overflow-hidden">
                    {restaurant.coverUrl ? (
                      <img
                        src={restaurant.coverUrl}
                        alt={restaurant.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Utensils className="w-10 h-10 text-primary/30" />
                      </div>
                    )}
                    {/* Ranking badge */}
                    <div className="absolute top-3 left-3 w-9 h-9 rounded-full bg-background/95 backdrop-blur-sm flex items-center justify-center shadow-lg">
                      <span className="font-display text-sm font-bold text-foreground">{index + 1}</span>
                    </div>
                    {/* Verificado */}
                    {restaurant.isVerified && (
                      <div className="absolute top-3 right-3 px-2 py-1 bg-emerald-500/90 backdrop-blur-sm text-white text-xs font-semibold rounded-full flex items-center gap-1">
                        <Shield className="w-3 h-3" /> Verificado
                      </div>
                    )}
                    {/* Coração */}
                    <button className="absolute bottom-3 right-3 w-8 h-8 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background">
                      <Heart className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                      <MapPin className="w-3 h-3" />
                      <span>{restaurant.neighborhood || restaurant.city}</span>
                    </div>
                    <h3 className="font-display text-base font-semibold text-foreground leading-tight mb-2 line-clamp-1">
                      {restaurant.name}
                    </h3>
                    <div className="flex items-center gap-2 mb-3">
                      <StarRating rating={Number(restaurant.averageRating)} />
                      <span className="text-sm font-bold text-foreground">{Number(restaurant.averageRating).toFixed(1)}</span>
                      <span className="text-xs text-muted-foreground">({restaurant.totalReviews})</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground pt-3 border-t border-border">
                      <span className="flex items-center gap-1"><Video className="w-3 h-3" /> {restaurant.totalVideos} vídeos</span>
                      <span className="px-2 py-0.5 bg-muted rounded-full">{restaurant.cuisine}</span>
                      <span className="font-medium text-foreground">{restaurant.priceRange}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </HorizontalCarousel>
        </div>
      </section>

      {/* ─── UGC em Destaque (foto grande + grid lateral) ────────────────── */}
      {feedVideos && feedVideos.length > 0 && (
        <section className="py-16 bg-muted/20">
          <div className="container">
            <div className="flex items-end justify-between mb-8">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  <span className="text-sm font-semibold text-primary uppercase tracking-wide">Em Alta Agora</span>
                </div>
                <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground">
                  Vídeos reais de quem foi lá
                </h2>
                <p className="text-muted-foreground mt-1">Avaliações autênticas de consumidores reais</p>
              </div>
              <Link href="/feed">
                <button className="hidden md:inline-flex items-center gap-2 text-sm font-medium text-primary hover:opacity-80 transition-opacity cursor-pointer">
                  Ver feed completo <ChevronRight className="w-4 h-4" />
                </button>
              </Link>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {/* Vídeo destaque grande */}
              {feedVideos[0] && (
                <Link href="/feed">
                  <div className="relative rounded-2xl overflow-hidden cursor-pointer group h-full min-h-[360px]">
                    <img
                      src={(feedVideos[0] as any).thumbnailUrl || "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80"}
                      alt={(feedVideos[0] as any).title || "Vídeo em destaque"}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                    {/* Play button */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border-2 border-white/50">
                        <Play className="w-7 h-7 text-white fill-white ml-1" />
                      </div>
                    </div>

                    {/* Info */}
                    <div className="absolute bottom-0 left-0 right-0 p-5">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-white">
                          {((feedVideos[0] as any).user?.name || "U")[0]}
                        </div>
                        <span className="text-white/80 text-sm">@{((feedVideos[0] as any).user?.name || "usuario").toLowerCase().replace(/\s/g, "")}</span>
                      </div>
                      <h3 className="font-display text-xl font-bold text-white mb-1 line-clamp-2">
                        {(feedVideos[0] as any).title || "Experiência incrível no restaurante"}
                      </h3>
                      <div className="flex items-center gap-4 text-white/70 text-sm">
                        <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> {(feedVideos[0] as any).views || 0}</span>
                        <span className="flex items-center gap-1"><Heart className="w-3.5 h-3.5" /> {(feedVideos[0] as any).likesCount || 0}</span>
                        <span className="flex items-center gap-1"><MessageCircle className="w-3.5 h-3.5" /> {(feedVideos[0] as any).commentsCount || 0}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              )}

              {/* Grid lateral de vídeos menores */}
              <div className="grid grid-cols-2 gap-4">
                {feedVideos.slice(1, 5).map((video) => (
                  <Link key={(video as any).id} href="/feed">
                    <div className="relative rounded-xl overflow-hidden cursor-pointer group aspect-square">
                      <img
                        src={(video as any).thumbnailUrl || "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&q=80"}
                        alt={(video as any).title || "Vídeo"}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />

                      {/* Play overlay */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                          <Play className="w-4 h-4 text-white fill-white ml-0.5" />
                        </div>
                      </div>

                      <div className="absolute bottom-0 left-0 right-0 p-3">
                        <p className="text-white text-xs font-medium line-clamp-2 leading-tight">
                          {(video as any).title || "Avaliação em vídeo"}
                        </p>
                        <div className="flex items-center gap-2 mt-1 text-white/60 text-xs">
                          <span className="flex items-center gap-0.5"><Eye className="w-3 h-3" /> {(video as any).views || 0}</span>
                          <span className="flex items-center gap-0.5"><Heart className="w-3 h-3" /> {(video as any).likesCount || 0}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ─── Categorias de Culinária ──────────────────────────────────────── */}
      <section className="py-16">
        <div className="container">
          <div className="mb-8">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
              Explore por culinária
            </h2>
            <p className="text-muted-foreground">Encontre exatamente o que você está com vontade</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-3">
            {CUISINES.map((cuisine) => (
              <Link key={cuisine.name} href={`/explore?cuisine=${cuisine.name}`}>
                <div className={`${cuisine.bg} rounded-2xl p-4 text-center cursor-pointer hover:scale-105 transition-transform group aspect-square flex flex-col items-center justify-center gap-2`}>
                  <span className="text-3xl group-hover:scale-110 transition-transform">{cuisine.emoji}</span>
                  <span className="text-white text-xs font-semibold leading-tight text-center">{cuisine.name}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Restaurantes em Destaque (grid TripAdvisor-style) ───────────── */}
      {restaurants && restaurants.length > 0 && (
        <section className="py-16 bg-muted/20">
          <div className="container">
            <div className="flex items-end justify-between mb-8">
              <div>
                <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
                  Restaurantes em Destaque
                </h2>
                <p className="text-muted-foreground">Os favoritos dos nossos usuários esta semana</p>
              </div>
              <Link href="/explore">
                <button className="hidden md:inline-flex items-center gap-2 text-sm font-medium text-primary hover:opacity-80 transition-opacity cursor-pointer">
                  Ver todos <ChevronRight className="w-4 h-4" />
                </button>
              </Link>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {restaurants.slice(0, 6).map((restaurant) => (
                <Link key={restaurant.id} href={`/restaurant/${restaurant.slug}`}>
                  <div className="card-premium overflow-hidden cursor-pointer group flex gap-4 p-4">
                    {/* Thumbnail quadrado */}
                    <div className="w-24 h-24 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 overflow-hidden shrink-0">
                      {restaurant.coverUrl ? (
                        <img
                          src={restaurant.coverUrl}
                          alt={restaurant.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Utensils className="w-8 h-8 text-primary/30" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="font-display text-base font-semibold text-foreground leading-tight line-clamp-1">
                          {restaurant.name}
                        </h3>
                        {restaurant.isVerified && (
                          <Shield className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 mb-2">
                        <StarRating rating={Number(restaurant.averageRating)} />
                        <span className="text-sm font-bold text-foreground">{Number(restaurant.averageRating).toFixed(1)}</span>
                        <span className="text-xs text-muted-foreground">({restaurant.totalReviews})</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
                        <MapPin className="w-3 h-3" />
                        <span>{restaurant.neighborhood || restaurant.city}</span>
                        <span>·</span>
                        <span>{restaurant.cuisine}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Video className="w-3 h-3" /> {restaurant.totalVideos}</span>
                        <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {restaurant.totalReviews}</span>
                        <span className="ml-auto font-semibold text-foreground">{restaurant.priceRange}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── Bairros Populares ────────────────────────────────────────────── */}
      <section className="py-16">
        <div className="container">
          <div className="mb-8">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
              Bairros gastronômicos de SP
            </h2>
            <p className="text-muted-foreground">Explore os melhores destinos culinários da cidade</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {NEIGHBORHOODS.map((hood) => (
              <Link key={hood.name} href={`/explore?neighborhood=${encodeURIComponent(hood.name)}`}>
                <div className={`relative rounded-2xl overflow-hidden cursor-pointer group h-32 bg-gradient-to-br ${hood.gradient}`}>
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-3">
                    <span className="text-white font-display font-bold text-base leading-tight mb-1">{hood.name}</span>
                    <span className="text-white/70 text-xs">{hood.count}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Como Funciona ────────────────────────────────────────────────── */}
      <section className="py-16 bg-muted/20">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3">
              Como a Tastee funciona
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Simples para consumidores, poderoso para restaurantes
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                icon: MapPin,
                title: "Vá ao restaurante",
                description: "Escolha um restaurante parceiro da Tastee em São Paulo e viva a experiência.",
              },
              {
                step: "02",
                icon: Video,
                title: "Grave e avalie",
                description: "Filme sua experiência com o smartphone e publique sua avaliação em vídeo na plataforma.",
              },
              {
                step: "03",
                icon: Award,
                title: "Ganhe benefícios",
                description: "Receba descontos exclusivos, pratos grátis e até refeições remuneradas pelo seu conteúdo.",
              },
            ].map((step) => (
              <div key={step.step} className="text-center group">
                <div className="relative inline-flex mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/15 transition-colors">
                    <step.icon className="w-8 h-8 text-primary" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                    {step.step}
                  </div>
                </div>
                <h3 className="font-display text-xl font-semibold text-foreground mb-3">{step.title}</h3>
                <p className="text-muted-foreground leading-relaxed text-sm">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA Restaurantes ─────────────────────────────────────────────── */}
      <section className="py-16">
        <div className="container">
          <div className="bg-brand-gradient rounded-3xl p-10 md:p-16 relative overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-72 h-72 rounded-full bg-white blur-3xl" />
              <div className="absolute bottom-0 left-0 w-56 h-56 rounded-full bg-white blur-3xl" />
            </div>

            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="text-center md:text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/20 text-white rounded-full text-sm font-medium mb-4">
                  <Utensils className="w-4 h-4" />
                  Para Restaurantes
                </div>
                <h2 className="font-display text-3xl md:text-4xl font-bold text-white mb-3">
                  Seu restaurante merece<br />prova social real
                </h2>
                <p className="text-white/80 text-base max-w-lg leading-relaxed">
                  Cadastre gratuitamente e comece a receber avaliações em vídeo de consumidores reais. Aumente sua visibilidade e conquiste novos clientes com conteúdo autêntico.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row md:flex-col gap-3 shrink-0">
                <Link href="/restaurant/register">
                  <button className="w-full sm:w-auto px-8 py-4 bg-white text-primary rounded-xl font-semibold hover:bg-white/90 transition-colors shadow-lg whitespace-nowrap">
                    Cadastrar Restaurante
                  </button>
                </Link>
                <Link href="/explore">
                  <button className="w-full sm:w-auto px-8 py-4 bg-white/15 text-white rounded-xl font-semibold hover:bg-white/25 transition-colors border border-white/30 whitespace-nowrap">
                    Explorar Plataforma
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Footer ──────────────────────────────────────────────────────── */}
      <footer className="border-t border-border py-12 bg-muted/20">
        <div className="container">
          <div className="grid md:grid-cols-4 gap-8 mb-10">
            <div className="md:col-span-2">
              <span className="font-display text-2xl font-bold text-gradient">Tastee</span>
              <p className="text-sm text-muted-foreground mt-2 max-w-xs leading-relaxed">
                A rede social gastronômica de São Paulo. Avaliações reais em vídeo de consumidores que foram lá.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-3 text-sm">Plataforma</h4>
              <div className="flex flex-col gap-2">
                {[
                  { label: "Explorar", href: "/explore" },
                  { label: "Feed de Vídeos", href: "/feed" },
                  { label: "Amigos", href: "/social" },
                  { label: "Meu Perfil", href: "/profile" },
                ].map((link) => (
                  <Link key={link.href} href={link.href}>
                    <span className="text-sm text-muted-foreground hover:text-foreground cursor-pointer transition-colors">{link.label}</span>
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-3 text-sm">Restaurantes</h4>
              <div className="flex flex-col gap-2">
                {[
                  { label: "Cadastrar Restaurante", href: "/restaurant/register" },
                  { label: "Dashboard", href: "/restaurant/dashboard" },
                  { label: "Como Funciona", href: "/" },
                ].map((link) => (
                  <Link key={link.href} href={link.href}>
                    <span className="text-sm text-muted-foreground hover:text-foreground cursor-pointer transition-colors">{link.label}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
          <div className="border-t border-border pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-muted-foreground">© 2025 Tastee. Todos os direitos reservados.</p>
            <p className="text-xs text-muted-foreground">São Paulo, Brasil · Avaliações reais de consumidores reais</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
