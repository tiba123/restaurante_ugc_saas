import { trpc } from "@/lib/trpc";
import { Search, MapPin, Star, Filter, Utensils, Video, Users, ChevronRight, SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";

const CATEGORIES = [
  { value: "", label: "Todos" },
  { value: "fine_dining", label: "Fine Dining" },
  { value: "casual", label: "Casual" },
  { value: "bar", label: "Bar" },
  { value: "cafe", label: "Café" },
  { value: "pizzeria", label: "Pizzaria" },
  { value: "sushi", label: "Sushi" },
  { value: "churrascaria", label: "Churrascaria" },
  { value: "vegano", label: "Vegano" },
  { value: "fast_food", label: "Fast Food" },
  { value: "internacional", label: "Internacional" },
];

const NEIGHBORHOODS = [
  "Pinheiros", "Vila Madalena", "Itaim Bibi", "Jardins", "Moema",
  "Vila Olímpia", "Brooklin", "Perdizes", "Higienópolis", "Bela Vista",
  "Liberdade", "Consolação", "Lapa", "Santana", "Tatuapé",
];

export default function ExplorePage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const { data: restaurants, isLoading } = trpc.restaurants.list.useQuery({
    search: debouncedSearch || undefined,
    category: category || undefined,
    neighborhood: neighborhood || undefined,
    limit: 24,
  });

  const handleSearch = (value: string) => {
    setSearch(value);
    clearTimeout((window as any)._searchTimeout);
    (window as any)._searchTimeout = setTimeout(() => setDebouncedSearch(value), 400);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="container py-4">
          <div className="flex items-center gap-3 mb-4">
            <Link href="/">
              <span className="font-display text-xl font-bold text-gradient cursor-pointer">Tastee</span>
            </Link>
            <span className="text-muted-foreground">/</span>
            <span className="text-sm font-medium text-foreground">Explorar</span>
          </div>
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Buscar restaurantes, bairros, culinária..."
                className="w-full pl-10 pr-4 py-2.5 bg-muted rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 border border-transparent focus:border-primary/30 transition-all"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-all ${showFilters ? "bg-primary text-primary-foreground border-primary" : "bg-muted text-foreground border-transparent hover:border-border"}`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span className="hidden sm:inline">Filtros</span>
            </button>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="mt-4 space-y-3 animate-fade-in">
              {/* Categories */}
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.value}
                    onClick={() => setCategory(cat.value)}
                    className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${category === cat.value ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
              {/* Neighborhoods */}
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Bairro</label>
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                  <button
                    onClick={() => setNeighborhood("")}
                    className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${!neighborhood ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}
                  >
                    Todos
                  </button>
                  {NEIGHBORHOODS.map((n) => (
                    <button
                      key={n}
                      onClick={() => setNeighborhood(n)}
                      className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${neighborhood === n ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="container py-8">
        {/* Results header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">
              {debouncedSearch ? `Resultados para "${debouncedSearch}"` : "Restaurantes em São Paulo"}
            </h1>
            {restaurants && (
              <p className="text-sm text-muted-foreground mt-1">{restaurants.length} restaurantes encontrados</p>
            )}
          </div>
          <Link href="/feed">
            <button className="hidden md:flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium">
              <Video className="w-4 h-4" /> Ver Feed
            </button>
          </Link>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="card-premium overflow-hidden animate-pulse">
                <div className="h-44 bg-muted" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && restaurants?.length === 0 && (
          <div className="text-center py-20">
            <Utensils className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="font-display text-xl font-semibold text-foreground mb-2">Nenhum restaurante encontrado</h3>
            <p className="text-muted-foreground mb-6">Tente ajustar os filtros ou buscar por outro termo.</p>
            <button onClick={() => { setSearch(""); setDebouncedSearch(""); setCategory(""); setNeighborhood(""); }} className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium">
              Limpar filtros
            </button>
          </div>
        )}

        {/* Grid */}
        {!isLoading && restaurants && restaurants.length > 0 && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {restaurants.map((restaurant) => (
              <Link key={restaurant.id} href={`/restaurant/${restaurant.slug}`}>
                <div className="card-premium overflow-hidden cursor-pointer group h-full">
                  <div className="h-44 bg-gradient-to-br from-primary/10 to-accent/10 relative overflow-hidden">
                    {restaurant.coverUrl ? (
                      <img src={restaurant.coverUrl} alt={restaurant.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Utensils className="w-10 h-10 text-primary/20" />
                      </div>
                    )}
                    <div className="absolute top-2 left-2 flex gap-1">
                      {restaurant.isVerified && (
                        <span className="px-2 py-0.5 bg-green-500/90 text-white text-xs font-medium rounded-full">✓ Verificado</span>
                      )}
                    </div>
                    <div className="absolute top-2 right-2">
                      <span className="px-2 py-0.5 bg-black/50 text-white text-xs font-medium rounded-full">{restaurant.priceRange}</span>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <h3 className="font-display text-base font-semibold text-foreground leading-tight line-clamp-1">{restaurant.name}</h3>
                      <div className="flex items-center gap-1 shrink-0">
                        <Star className="w-3.5 h-3.5 star-filled fill-current" />
                        <span className="text-sm font-semibold text-foreground">{Number(restaurant.averageRating).toFixed(1)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                      {restaurant.neighborhood && (
                        <span className="flex items-center gap-0.5">
                          <MapPin className="w-3 h-3" /> {restaurant.neighborhood}
                        </span>
                      )}
                      {restaurant.cuisine && <span>· {restaurant.cuisine}</span>}
                    </div>
                    {restaurant.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{restaurant.description}</p>
                    )}
                    <div className="flex items-center justify-between pt-3 border-t border-border text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Video className="w-3 h-3" /> {restaurant.totalVideos} vídeos</span>
                      <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {restaurant.totalReviews} avaliações</span>
                      <ChevronRight className="w-3.5 h-3.5 text-primary" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
