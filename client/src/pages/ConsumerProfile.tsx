import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import {
  Video, Star, Award, Gift, Camera, Upload, X, Check,
  Clock, Eye, Heart, MessageSquare, ChevronRight, Play
} from "lucide-react";
import { useRef, useState } from "react";
import { Link } from "wouter";
import { toast } from "sonner";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: "Aguardando aprovação", color: "text-yellow-600 bg-yellow-50" },
  approved: { label: "Aprovado", color: "text-green-600 bg-green-50" },
  rejected: { label: "Rejeitado", color: "text-red-600 bg-red-50" },
  processing: { label: "Processando", color: "text-blue-600 bg-blue-50" },
};

function UploadVideoModal({
  onClose,
  restaurants,
}: {
  onClose: () => void;
  restaurants: { id: number; name: string }[];
}) {
  const [file, setFile] = useState<File | null>(null);
  const [restaurantId, setRestaurantId] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [rating, setRating] = useState(0);
  const [tags, setTags] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const utils = trpc.useUtils();

  const uploadMutation = trpc.videos.upload.useMutation({
    onSuccess: () => {
      toast.success("Vídeo enviado! Aguardando aprovação do restaurante.");
      utils.consumer.profile.invalidate();
      onClose();
    },
    onError: (e) => toast.error(e.message || "Erro ao enviar vídeo."),
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 100 * 1024 * 1024) { toast.error("Arquivo muito grande. Máximo 100MB."); return; }
    setFile(f);
  };

  const handleUpload = async () => {
    if (!file || !restaurantId) { toast.error("Selecione um vídeo e um restaurante."); return; }
    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(",")[1];
        await uploadMutation.mutateAsync({
          restaurantId,
          title: title || undefined,
          description: description || undefined,
          rating: rating || undefined,
          tags: tags ? tags.split(",").map((t) => t.trim()).filter(Boolean) : undefined,
          videoBase64: base64,
          videoMimeType: file.type,
        });
      };
      reader.readAsDataURL(file);
    } catch {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-card rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="font-display text-lg font-semibold text-foreground">Enviar Vídeo</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>
        <div className="p-5 space-y-4">
          {/* File upload */}
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Vídeo *</label>
            {file ? (
              <div className="flex items-center gap-3 p-3 bg-muted rounded-xl">
                <Video className="w-5 h-5 text-primary shrink-0" />
                <span className="text-sm text-foreground truncate flex-1">{file.name}</span>
                <button onClick={() => setFile(null)}><X className="w-4 h-4 text-muted-foreground" /></button>
              </div>
            ) : (
              <button
                onClick={() => fileRef.current?.click()}
                className="w-full h-32 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-2 hover:border-primary/50 hover:bg-primary/5 transition-all"
              >
                <Upload className="w-8 h-8 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Clique para selecionar (máx. 100MB)</span>
                <span className="text-xs text-muted-foreground">MP4, MOV, WebM</span>
              </button>
            )}
            <input ref={fileRef} type="file" accept="video/*" className="hidden" onChange={handleFileChange} />
          </div>

          {/* Restaurant */}
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Restaurante *</label>
            <select
              value={restaurantId || ""}
              onChange={(e) => setRestaurantId(Number(e.target.value) || null)}
              className="w-full px-4 py-2.5 bg-muted rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">Selecione o restaurante</option>
              {restaurants.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>

          {/* Rating */}
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Sua nota</label>
            <div className="flex gap-2">
              {[1,2,3,4,5].map((s) => (
                <button key={s} type="button" onClick={() => setRating(s)} className="transition-transform hover:scale-110">
                  <Star className={`w-7 h-7 ${s <= rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`} />
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Título</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Melhor hambúrguer de SP!"
              className="w-full px-4 py-2.5 bg-muted rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Descrição</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Conte sobre sua experiência..."
              rows={3}
              className="w-full px-4 py-2.5 bg-muted rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 resize-none"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Tags (separadas por vírgula)</label>
            <input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="Ex: hambúrguer, artesanal, delicioso"
              className="w-full px-4 py-2.5 bg-muted rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <button
            onClick={handleUpload}
            disabled={!file || !restaurantId || uploading}
            className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-semibold text-sm disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {uploading ? (
              <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Enviando...</>
            ) : (
              <><Upload className="w-4 h-4" /> Enviar Vídeo</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ConsumerProfilePage() {
  const { isAuthenticated, user: authUser } = useAuth();
  const [showUpload, setShowUpload] = useState(false);
  const [activeTab, setActiveTab] = useState<"videos" | "reviews" | "benefits">("videos");

  const { data: profile, isLoading } = trpc.consumer.profile.useQuery(undefined, { enabled: isAuthenticated });
  const { data: allRestaurants } = trpc.restaurants.list.useQuery({ limit: 100 });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-sm px-6">
          <Camera className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <h2 className="font-display text-2xl font-bold text-foreground mb-3">Faça login para ver seu perfil</h2>
          <p className="text-muted-foreground mb-6">Entre para acompanhar seus vídeos, avaliações e benefícios.</p>
          <a href={getLoginUrl()} className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium">
            Entrar
          </a>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const videos = profile?.videos || [];
  const reviews = profile?.reviews || [];
  const benefits = profile?.benefits || [];
  const achievements = profile?.achievements || [];

  const approvedVideos = videos.filter((v) => v.status === "approved");
  const totalViews = approvedVideos.reduce((sum, v) => sum + v.views, 0);
  const totalLikes = approvedVideos.reduce((sum, v) => sum + v.likes, 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Header nav */}
      <div className="sticky top-0 z-30 glass border-b border-border/50">
        <div className="container flex items-center justify-between h-14">
          <Link href="/">
            <span className="font-display text-lg font-bold text-gradient cursor-pointer">Tastee</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/explore"><span className="text-sm text-muted-foreground hover:text-foreground cursor-pointer">Explorar</span></Link>
            <Link href="/feed"><span className="text-sm text-muted-foreground hover:text-foreground cursor-pointer">Feed</span></Link>
          </div>
        </div>
      </div>

      <div className="container py-8 max-w-3xl mx-auto">
        {/* Profile header */}
        <div className="flex items-center gap-5 mb-8">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-3xl font-display font-bold text-primary shrink-0">
            {profile?.name?.charAt(0) || authUser?.name?.charAt(0) || "U"}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-display text-2xl font-bold text-foreground">{profile?.name || authUser?.name || "Usuário"}</h1>
            <p className="text-muted-foreground text-sm">{profile?.email || authUser?.email}</p>
            {profile?.bio && <p className="text-sm text-muted-foreground mt-1">{profile.bio}</p>}
          </div>
          <button
            onClick={() => setShowUpload(true)}
            className="shrink-0 flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium"
          >
            <Upload className="w-4 h-4" />
            <span className="hidden sm:inline">Enviar Vídeo</span>
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3 mb-8">
          <div className="bg-card border border-border rounded-xl p-3 text-center">
            <div className="font-bold text-foreground text-xl">{videos.length}</div>
            <div className="text-xs text-muted-foreground">Vídeos</div>
          </div>
          <div className="bg-card border border-border rounded-xl p-3 text-center">
            <div className="font-bold text-foreground text-xl">{totalViews.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">Views</div>
          </div>
          <div className="bg-card border border-border rounded-xl p-3 text-center">
            <div className="font-bold text-foreground text-xl">{totalLikes}</div>
            <div className="text-xs text-muted-foreground">Curtidas</div>
          </div>
          <div className="bg-card border border-border rounded-xl p-3 text-center">
            <div className="font-bold text-foreground text-xl">{reviews.length}</div>
            <div className="text-xs text-muted-foreground">Avaliações</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-muted rounded-xl mb-6 w-fit">
          {[
            { key: "videos", label: "Vídeos", icon: Video, count: videos.length },
            { key: "reviews", label: "Avaliações", icon: Star, count: reviews.length },
            { key: "benefits", label: "Benefícios", icon: Gift, count: benefits.length },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${activeTab === tab.key ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
              <span className="text-xs opacity-60">({tab.count})</span>
            </button>
          ))}
        </div>

        {/* Videos tab */}
        {activeTab === "videos" && (
          <div className="space-y-3">
            {videos.length === 0 ? (
              <div className="text-center py-16">
                <Video className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground mb-4">Você ainda não enviou nenhum vídeo.</p>
                <button onClick={() => setShowUpload(true)} className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium">
                  Enviar Primeiro Vídeo
                </button>
              </div>
            ) : (
              videos.map((video) => {
                const statusInfo = STATUS_LABELS[video.status] || { label: video.status, color: "text-muted-foreground bg-muted" };
                return (
                  <div key={video.id} className="bg-card border border-border rounded-xl p-4 flex gap-4">
                    <div className="w-20 h-28 bg-muted rounded-lg overflow-hidden shrink-0 relative">
                      {video.thumbnailUrl ? (
                        <img src={video.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Play className="w-6 h-6 text-muted-foreground/50" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="font-medium text-foreground text-sm line-clamp-1">{video.title || "Sem título"}</h3>
                        <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${statusInfo.color}`}>
                          {statusInfo.label}
                        </span>
                      </div>
                      {video.rating && (
                        <div className="flex gap-0.5 mb-2">
                          {[1,2,3,4,5].map((s) => (
                            <Star key={s} className={`w-3 h-3 ${s <= video.rating! ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`} />
                          ))}
                        </div>
                      )}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{video.views}</span>
                        <span className="flex items-center gap-1"><Heart className="w-3 h-3" />{video.likes}</span>
                        <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" />{video.comments}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(video.createdAt).toLocaleDateString("pt-BR")}</span>
                      </div>
                      {video.status === "rejected" && video.rejectionReason && (
                        <p className="text-xs text-red-600 mt-2 bg-red-50 px-2 py-1 rounded">
                          Motivo: {video.rejectionReason}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Reviews tab */}
        {activeTab === "reviews" && (
          <div className="space-y-3">
            {reviews.length === 0 ? (
              <div className="text-center py-16">
                <Star className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground mb-4">Você ainda não fez nenhuma avaliação.</p>
                <Link href="/explore">
                  <button className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium">Explorar Restaurantes</button>
                </Link>
              </div>
            ) : (
              reviews.map((review) => (
                <div key={review.id} className="bg-card border border-border rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex gap-0.5">
                      {[1,2,3,4,5].map((s) => (
                        <Star key={s} className={`w-4 h-4 ${s <= review.rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`} />
                      ))}
                    </div>
                    <span className="text-xs text-muted-foreground">{new Date(review.createdAt).toLocaleDateString("pt-BR")}</span>
                  </div>
                  {review.title && <h4 className="font-medium text-foreground text-sm mb-1">{review.title}</h4>}
                  {review.content && <p className="text-sm text-muted-foreground">{review.content}</p>}
                </div>
              ))
            )}
          </div>
        )}

        {/* Benefits tab */}
        {activeTab === "benefits" && (
          <div className="space-y-3">
            {benefits.length === 0 ? (
              <div className="text-center py-16">
                <Gift className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground mb-2">Nenhum benefício ainda.</p>
                <p className="text-sm text-muted-foreground">Envie vídeos aprovados para ganhar descontos e pratos grátis!</p>
              </div>
            ) : (
              benefits.map((benefit) => (
                <div key={benefit.id} className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Gift className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-foreground text-sm">Benefício #{benefit.benefitId}</div>
                    <div className={`text-xs mt-0.5 ${benefit.status === "active" ? "text-green-600" : "text-muted-foreground"}`}>
                      {benefit.status === "active" ? "Ativo" : benefit.status === "used" ? "Utilizado" : "Expirado"}
                    </div>
                  </div>
                  {benefit.status === "active" && (
                    <button className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium">
                      Usar
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {showUpload && allRestaurants && (
        <UploadVideoModal
          onClose={() => setShowUpload(false)}
          restaurants={allRestaurants.map((r) => ({ id: r.id, name: r.name }))}
        />
      )}
    </div>
  );
}
