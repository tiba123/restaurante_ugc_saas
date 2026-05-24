import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Star, Play, ChevronRight, MapPin, TrendingUp, Shield, Award, Users, Utensils, Video } from "lucide-react";
import { Link } from "wouter";

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const { data: restaurants } = trpc.restaurants.list.useQuery({ limit: 6 });

  const features = [
    {
      icon: Video,
      title: "Vídeos Reais",
      description: "Assista avaliações autênticas de consumidores reais em bares e restaurantes de São Paulo.",
    },
    {
      icon: Award,
      title: "Ganhe Benefícios",
      description: "Grave sua experiência e receba descontos exclusivos, pratos grátis e refeições remuneradas.",
    },
    {
      icon: Shield,
      title: "Prova Social Verificada",
      description: "Conteúdo aprovado pelos próprios restaurantes, garantindo autenticidade em cada avaliação.",
    },
    {
      icon: TrendingUp,
      title: "Descubra Tendências",
      description: "Feed infinito com os melhores restaurantes em alta, curado por IA e engajamento real.",
    },
  ];

  const stats = [
    { value: "500+", label: "Restaurantes" },
    { value: "12K+", label: "Avaliações em Vídeo" },
    { value: "98%", label: "Satisfação" },
    { value: "São Paulo", label: "Foco Geográfico" },
  ];

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
          {/* Mobile menu */}
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

      {/* ─── Hero ────────────────────────────────────────────────────────── */}
      <section className="relative pt-32 pb-24 overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-primary/5 blur-3xl translate-x-1/3 -translate-y-1/4" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-accent/8 blur-3xl -translate-x-1/3 translate-y-1/4" />
        </div>

        <div className="container">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/8 text-primary rounded-full text-sm font-medium mb-8 animate-fade-in">
              <MapPin className="w-4 h-4" />
              São Paulo · Avaliações Reais
            </div>

            <h1 className="font-display text-5xl md:text-7xl font-bold text-foreground mb-6 animate-slide-up" style={{ animationDelay: "0.1s" }}>
              Descubra restaurantes{" "}
              <span className="text-gradient italic">incríveis</span>{" "}
              através de vídeos reais
            </h1>

            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed animate-slide-up" style={{ animationDelay: "0.2s" }}>
              Assista avaliações autênticas de consumidores reais, ganhe benefícios exclusivos ao compartilhar sua experiência e descubra os melhores lugares de São Paulo.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up" style={{ animationDelay: "0.3s" }}>
              <Link href="/feed">
                <button className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-xl font-semibold text-base hover:opacity-90 transition-all shadow-lg shadow-primary/25">
                  <Play className="w-5 h-5 fill-current" />
                  Ver Feed de Vídeos
                </button>
              </Link>
              {!isAuthenticated && (
                <a href={getLoginUrl()} className="inline-flex items-center gap-2 px-8 py-4 bg-secondary text-secondary-foreground rounded-xl font-semibold text-base hover:bg-secondary/80 transition-all border border-border">
                  Criar Conta Grátis
                  <ChevronRight className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Stats ───────────────────────────────────────────────────────── */}
      <section className="py-16 border-y border-border bg-muted/30">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="font-display text-4xl font-bold text-gradient mb-2">{stat.value}</div>
                <div className="text-sm text-muted-foreground font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Features ────────────────────────────────────────────────────── */}
      <section className="py-24">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl font-bold text-foreground mb-4">
              Uma nova forma de descobrir restaurantes
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Combinamos o melhor das redes sociais com avaliações verificadas para criar a experiência mais autêntica do mercado.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature) => (
              <div key={feature.title} className="card-premium p-6 group">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/15 transition-colors">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-display text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Featured Restaurants ────────────────────────────────────────── */}
      {restaurants && restaurants.length > 0 && (
        <section className="py-24 bg-muted/20">
          <div className="container">
            <div className="flex items-end justify-between mb-12">
              <div>
                <h2 className="font-display text-4xl font-bold text-foreground mb-3">
                  Restaurantes em Destaque
                </h2>
                <p className="text-muted-foreground">Os mais avaliados pelos nossos usuários</p>
              </div>
              <Link href="/explore">
                <button className="hidden md:inline-flex items-center gap-2 text-sm font-medium text-primary hover:opacity-80 transition-opacity cursor-pointer">
                  Ver todos <ChevronRight className="w-4 h-4" />
                </button>
              </Link>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {restaurants.map((restaurant) => (
                <Link key={restaurant.id} href={`/restaurant/${restaurant.slug}`}>
                  <div className="card-premium overflow-hidden cursor-pointer group">
                    <div className="h-48 bg-gradient-to-br from-primary/10 to-accent/10 relative overflow-hidden">
                      {restaurant.coverUrl ? (
                        <img src={restaurant.coverUrl} alt={restaurant.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Utensils className="w-12 h-12 text-primary/30" />
                        </div>
                      )}
                      {restaurant.isVerified && (
                        <div className="absolute top-3 right-3 badge-verified">
                          <Shield className="w-3 h-3" /> Verificado
                        </div>
                      )}
                    </div>
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <h3 className="font-display text-lg font-semibold text-foreground leading-tight">{restaurant.name}</h3>
                        <div className="flex items-center gap-1 shrink-0">
                          <Star className="w-4 h-4 star-filled fill-current" />
                          <span className="text-sm font-semibold text-foreground">{Number(restaurant.averageRating).toFixed(1)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {restaurant.neighborhood || restaurant.city}
                        </span>
                        <span>{restaurant.cuisine}</span>
                        <span>{restaurant.priceRange}</span>
                      </div>
                      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Video className="w-3 h-3" /> {restaurant.totalVideos} vídeos
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" /> {restaurant.totalReviews} avaliações
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── CTA Section ─────────────────────────────────────────────────── */}
      <section className="py-24">
        <div className="container">
          <div className="bg-brand-gradient rounded-2xl p-12 text-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white blur-3xl" />
              <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-white blur-3xl" />
            </div>
            <div className="relative z-10">
              <h2 className="font-display text-4xl font-bold text-white mb-4">
                Você tem um restaurante?
              </h2>
              <p className="text-white/80 text-lg max-w-2xl mx-auto mb-8">
                Cadastre seu restaurante gratuitamente e comece a receber avaliações em vídeo de consumidores reais. Aumente sua visibilidade e conquiste novos clientes.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/restaurant/register">
                  <button className="px-8 py-4 bg-white text-primary rounded-xl font-semibold hover:bg-white/90 transition-colors shadow-lg">
                    Cadastrar Restaurante
                  </button>
                </Link>
                <Link href="/explore">
                  <button className="px-8 py-4 bg-white/15 text-white rounded-xl font-semibold hover:bg-white/25 transition-colors border border-white/30">
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
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <span className="font-display text-2xl font-bold text-gradient">Tastee</span>
              <p className="text-sm text-muted-foreground mt-1">Avaliações reais de restaurantes em São Paulo</p>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link href="/explore"><span className="hover:text-foreground cursor-pointer transition-colors">Explorar</span></Link>
              <Link href="/feed"><span className="hover:text-foreground cursor-pointer transition-colors">Feed</span></Link>
              <Link href="/restaurant/register"><span className="hover:text-foreground cursor-pointer transition-colors">Para Restaurantes</span></Link>
            </div>
            <p className="text-xs text-muted-foreground">© 2025 Tastee. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
