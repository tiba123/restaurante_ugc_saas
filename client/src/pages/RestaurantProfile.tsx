import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import {
  Star, MapPin, Phone, Globe, Instagram, Clock, Video,
  Users, Eye, ChevronLeft, Play, Shield, MessageSquare,
  ThumbsUp, Award
} from "lucide-react";
import { useState } from "react";
import { Link, useParams } from "wouter";
import { toast } from "sonner";

function StarInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          onMouseEnter={() => setHover(s)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(s)}
          className="transition-transform hover:scale-110"
        >
          <Star className={`w-7 h-7 ${s <= (hover || value) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`} />
        </button>
      ))}
    </div>
  );
}

export default function RestaurantProfilePage() {
  const { slug } = useParams<{ slug: string }>();
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<"videos" | "reviews">("videos");
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewContent, setReviewContent] = useState("");
  const [reviewTitle, setReviewTitle] = useState("");
  const utils = trpc.useUtils();

  const { data, isLoading } = trpc.restaurants.bySlug.useQuery({ slug: slug || "" }, { enabled: !!slug });

  const createReview = trpc.reviews.create.useMutation({
    onSuccess: () => {
      toast.success("Avaliação enviada com sucesso!");
      setShowReviewForm(false);
      setReviewRating(0);
      setReviewContent("");
      setReviewTitle("");
      utils.restaurants.bySlug.invalidate({ slug: slug || "" });
    },
    onError: () => toast.error("Erro ao enviar avaliação."),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="h-64 bg-muted animate-pulse" />
        <div className="container py-8 space-y-4">
          <div className="h-8 bg-muted rounded w-1/3 animate-pulse" />
          <div className="h-4 bg-muted rounded w-1/2 animate-pulse" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="font-display text-2xl font-bold text-foreground mb-2">Restaurante não encontrado</h2>
          <Link href="/explore"><button className="mt-4 px-6 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium">Explorar</button></Link>
        </div>
      </div>
    );
  }

  const videos = data.videos || [];
  const reviews = data.reviews || [];
  const rating = Number(data.averageRating) || 0;

  const handleSubmitReview = () => {
    if (!reviewRating) { toast.error("Selecione uma nota"); return; }
    createReview.mutate({ restaurantId: data.id, rating: reviewRating, title: reviewTitle || undefined, content: reviewContent || undefined });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Back nav */}
      <div className="sticky top-0 z-30 glass border-b border-border/50">
        <div className="container flex items-center justify-between h-14">
          <Link href="/explore">
            <button className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              <ChevronLeft className="w-4 h-4" /> Explorar
            </button>
          </Link>
          <Link href="/">
            <span className="font-display text-lg font-bold text-gradient cursor-pointer">Tastee</span>
          </Link>
          <div className="w-20" />
        </div>
      </div>

      {/* Cover */}
      <div className="h-64 md:h-80 bg-gradient-to-br from-primary/15 to-accent/15 relative overflow-hidden">
        {data.coverUrl ? (
          <img src={data.coverUrl} alt={data.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-8xl opacity-10 font-display font-bold text-foreground">{data.name.charAt(0)}</div>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
      </div>

      <div className="container -mt-16 relative z-10">
        {/* Profile header */}
        <div className="flex items-end gap-5 mb-6">
          <div className="w-24 h-24 rounded-2xl bg-card border-4 border-background shadow-lg overflow-hidden shrink-0">
            {data.logoUrl ? (
              <img src={data.logoUrl} alt={data.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                <span className="font-display text-3xl font-bold text-primary">{data.name.charAt(0)}</span>
              </div>
            )}
          </div>
          <div className="pb-2 flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">{data.name}</h1>
              {data.isVerified && (
                <span className="badge-verified"><Shield className="w-3 h-3" /> Verificado</span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              <div className="flex items-center gap-1">
                {[1,2,3,4,5].map((s) => (
                  <Star key={s} className={`w-4 h-4 ${s <= Math.round(rating) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`} />
                ))}
                <span className="text-sm font-semibold text-foreground ml-1">{rating.toFixed(1)}</span>
              </div>
              <span className="text-muted-foreground text-sm">({data.totalReviews} avaliações)</span>
            </div>
          </div>
        </div>

        {/* Info cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          <div className="bg-card border border-border rounded-xl p-4 text-center">
            <Video className="w-5 h-5 text-primary mx-auto mb-1" />
            <div className="font-bold text-foreground text-lg">{data.totalVideos}</div>
            <div className="text-xs text-muted-foreground">Vídeos</div>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 text-center">
            <Users className="w-5 h-5 text-primary mx-auto mb-1" />
            <div className="font-bold text-foreground text-lg">{data.totalReviews}</div>
            <div className="text-xs text-muted-foreground">Avaliações</div>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 text-center">
            <Eye className="w-5 h-5 text-primary mx-auto mb-1" />
            <div className="font-bold text-foreground text-lg">{(data.totalViews || 0).toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">Visualizações</div>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 text-center">
            <Award className="w-5 h-5 text-primary mx-auto mb-1" />
            <div className="font-bold text-foreground text-lg">{data.priceRange}</div>
            <div className="text-xs text-muted-foreground">Faixa de Preço</div>
          </div>
        </div>

        {/* Details */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="md:col-span-2">
            {data.description && (
              <p className="text-muted-foreground leading-relaxed mb-4">{data.description}</p>
            )}
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              {data.address && (
                <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-primary" />{data.address}</span>
              )}
              {data.phone && (
                <span className="flex items-center gap-1.5"><Phone className="w-4 h-4 text-primary" />{data.phone}</span>
              )}
              {data.website && (
                <a href={data.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-primary hover:underline">
                  <Globe className="w-4 h-4" />Site
                </a>
              )}
              {data.instagramHandle && (
                <a href={`https://instagram.com/${data.instagramHandle}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-primary hover:underline">
                  <Instagram className="w-4 h-4" />@{data.instagramHandle}
                </a>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-3">
            {isAuthenticated ? (
              <button
                onClick={() => setShowReviewForm(!showReviewForm)}
                className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-medium text-sm flex items-center justify-center gap-2"
              >
                <Star className="w-4 h-4" /> Avaliar Restaurante
              </button>
            ) : (
              <a href={getLoginUrl()} className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-medium text-sm flex items-center justify-center gap-2">
                <Star className="w-4 h-4" /> Entrar para Avaliar
              </a>
            )}
            <Link href="/feed">
              <button className="w-full py-3 bg-secondary text-secondary-foreground rounded-xl font-medium text-sm flex items-center justify-center gap-2 border border-border">
                <Play className="w-4 h-4" /> Ver Feed de Vídeos
              </button>
            </Link>
          </div>
        </div>

        {/* Review form */}
        {showReviewForm && (
          <div className="bg-card border border-border rounded-2xl p-6 mb-8 animate-fade-in">
            <h3 className="font-display text-lg font-semibold text-foreground mb-4">Sua Avaliação</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Nota Geral *</label>
                <StarInput value={reviewRating} onChange={setReviewRating} />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Título</label>
                <input
                  value={reviewTitle}
                  onChange={(e) => setReviewTitle(e.target.value)}
                  placeholder="Resumo da sua experiência"
                  className="w-full px-4 py-2.5 bg-muted rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Comentário</label>
                <textarea
                  value={reviewContent}
                  onChange={(e) => setReviewContent(e.target.value)}
                  placeholder="Conte sobre sua experiência..."
                  rows={4}
                  className="w-full px-4 py-2.5 bg-muted rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleSubmitReview}
                  disabled={!reviewRating || createReview.isPending}
                  className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium text-sm disabled:opacity-50"
                >
                  {createReview.isPending ? "Enviando..." : "Enviar Avaliação"}
                </button>
                <button onClick={() => setShowReviewForm(false)} className="px-6 py-2.5 bg-muted text-muted-foreground rounded-xl text-sm">
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-muted rounded-xl mb-6 w-fit">
          <button
            onClick={() => setActiveTab("videos")}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "videos" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          >
            <span className="flex items-center gap-2"><Video className="w-4 h-4" /> Vídeos ({videos.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("reviews")}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "reviews" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          >
            <span className="flex items-center gap-2"><MessageSquare className="w-4 h-4" /> Avaliações ({reviews.length})</span>
          </button>
        </div>

        {/* Videos grid */}
        {activeTab === "videos" && (
          <div>
            {videos.length === 0 ? (
              <div className="text-center py-16">
                <Video className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground">Nenhum vídeo aprovado ainda.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 pb-12">
                {videos.map((video) => (
                  <Link key={video.id} href="/feed">
                    <div className="aspect-[9/16] bg-muted rounded-xl overflow-hidden relative group cursor-pointer">
                      {video.thumbnailUrl ? (
                        <img src={video.thumbnailUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
                          <Play className="w-8 h-8 text-primary/40" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                        <Play className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity fill-white" />
                      </div>
                      <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          {video.rating && [1,2,3,4,5].slice(0, video.rating).map((s) => (
                            <Star key={s} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          ))}
                        </div>
                        <span className="text-white text-xs bg-black/40 px-1.5 py-0.5 rounded-full">{video.views} views</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Reviews list */}
        {activeTab === "reviews" && (
          <div className="space-y-4 pb-12">
            {reviews.length === 0 ? (
              <div className="text-center py-16">
                <MessageSquare className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground">Nenhuma avaliação ainda. Seja o primeiro!</p>
              </div>
            ) : (
              reviews.map((review) => (
                <div key={review.id} className="bg-card border border-border rounded-xl p-5">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                      {review.user?.name?.charAt(0) || "U"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-foreground text-sm">{review.user?.name || "Usuário"}</span>
                        <span className="text-xs text-muted-foreground">{new Date(review.createdAt).toLocaleDateString("pt-BR")}</span>
                      </div>
                      <div className="flex items-center gap-1 mt-0.5">
                        {[1,2,3,4,5].map((s) => (
                          <Star key={s} className={`w-3.5 h-3.5 ${s <= review.rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`} />
                        ))}
                      </div>
                    </div>
                  </div>
                  {review.title && <h4 className="font-semibold text-foreground text-sm mb-1">{review.title}</h4>}
                  {review.content && <p className="text-muted-foreground text-sm leading-relaxed">{review.content}</p>}
                  {review.isVerified && (
                    <div className="mt-3 flex items-center gap-1 text-xs text-green-600">
                      <Shield className="w-3 h-3" /> Visita verificada
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
