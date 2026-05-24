import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import {
  Camera, Edit3, MapPin, Heart, Video, Star, Users, UtensilsCrossed,
  Instagram, Globe, Check, X, Save, ChevronRight, Play, MessageSquare,
  UserPlus, UserCheck, Clock, Award
} from "lucide-react";
import { useState, useRef } from "react";
import { toast } from "sonner";
import { Link } from "wouter";

const CUISINE_OPTIONS = [
  "Italiana", "Japonesa", "Brasileira", "Mexicana", "Francesa",
  "Indiana", "Árabe", "Americana", "Mediterrânea", "Vegana",
  "Churrascaria", "Frutos do Mar", "Fusion", "Outra"
];

function StatCard({ icon: Icon, value, label }: { icon: React.ElementType; value: number | string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1 px-4 py-3">
      <Icon className="w-4 h-4 text-primary/70 mb-0.5" />
      <span className="font-display text-xl font-bold text-foreground">{value}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

function VideoThumb({ video }: { video: { id: number; thumbnailUrl?: string | null; title?: string | null; views: number; likes: number } }) {
  return (
    <div className="relative aspect-[9/16] bg-muted rounded-xl overflow-hidden group cursor-pointer">
      {video.thumbnailUrl ? (
        <img src={video.thumbnailUrl} alt={video.title ?? ""} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-muted">
          <Play className="w-8 h-8 text-muted-foreground/30" />
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-end p-2">
        <div className="flex items-center gap-2 text-white text-xs">
          <span className="flex items-center gap-1"><Heart className="w-3 h-3" />{video.likes}</span>
          <span className="flex items-center gap-1"><Play className="w-3 h-3" />{video.views}</span>
        </div>
      </div>
    </div>
  );
}

function EditProfileModal({ profile, onClose }: {
  profile: { name?: string | null; username?: string | null; bio?: string | null; city?: string | null; favoriteCuisine?: string | null; instagramHandle?: string | null; tiktokHandle?: string | null };
  onClose: () => void;
}) {
  const utils = trpc.useUtils();
  const [form, setForm] = useState({
    name: profile.name ?? "",
    username: profile.username ?? "",
    bio: profile.bio ?? "",
    city: profile.city ?? "São Paulo",
    favoriteCuisine: profile.favoriteCuisine ?? "",
    instagramHandle: profile.instagramHandle ?? "",
    tiktokHandle: profile.tiktokHandle ?? "",
  });

  const updateProfile = trpc.social.updateProfile.useMutation({
    onSuccess: () => {
      toast.success("Perfil atualizado!");
      utils.social.getMyProfile.invalidate();
      onClose();
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="font-display text-lg font-bold text-foreground">Editar Perfil</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Nome</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2.5 bg-background border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              placeholder="Seu nome"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Username</label>
            <div className="flex items-center gap-2 px-3 py-2.5 bg-background border border-border rounded-xl">
              <span className="text-muted-foreground text-sm">@</span>
              <input
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "") })}
                className="flex-1 bg-transparent text-sm text-foreground focus:outline-none"
                placeholder="seu_username"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Bio</label>
            <textarea
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              rows={3}
              maxLength={300}
              className="w-full px-3 py-2.5 bg-background border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
              placeholder="Conte um pouco sobre você e suas preferências gastronômicas..."
            />
            <p className="text-xs text-muted-foreground text-right mt-1">{form.bio.length}/300</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Cidade</label>
              <input
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                className="w-full px-3 py-2.5 bg-background border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="São Paulo"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Culinária Favorita</label>
              <select
                value={form.favoriteCuisine}
                onChange={(e) => setForm({ ...form, favoriteCuisine: e.target.value })}
                className="w-full px-3 py-2.5 bg-background border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="">Selecionar</option>
                {CUISINE_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block flex items-center gap-1">
                <Instagram className="w-3 h-3" /> Instagram
              </label>
              <div className="flex items-center gap-2 px-3 py-2.5 bg-background border border-border rounded-xl">
                <span className="text-muted-foreground text-sm">@</span>
                <input
                  value={form.instagramHandle}
                  onChange={(e) => setForm({ ...form, instagramHandle: e.target.value })}
                  className="flex-1 bg-transparent text-sm text-foreground focus:outline-none"
                  placeholder="seu_ig"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">TikTok</label>
              <div className="flex items-center gap-2 px-3 py-2.5 bg-background border border-border rounded-xl">
                <span className="text-muted-foreground text-sm">@</span>
                <input
                  value={form.tiktokHandle}
                  onChange={(e) => setForm({ ...form, tiktokHandle: e.target.value })}
                  className="flex-1 bg-transparent text-sm text-foreground focus:outline-none"
                  placeholder="seu_tiktok"
                />
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-3 p-5 border-t border-border">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 border border-border rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted transition-colors">
            Cancelar
          </button>
          <button
            onClick={() => updateProfile.mutate(form)}
            disabled={updateProfile.isPending}
            className="flex-1 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {updateProfile.isPending ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}

export default function UserProfile() {
  const { user, isAuthenticated } = useAuth();
  const utils = trpc.useUtils();
  const [editOpen, setEditOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"videos" | "reviews" | "visited" | "friends">("videos");
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const { data: profile, isLoading } = trpc.social.getMyProfile.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const uploadAvatar = trpc.social.uploadAvatar.useMutation({
    onSuccess: () => { toast.success("Avatar atualizado!"); utils.social.getMyProfile.invalidate(); },
    onError: () => toast.error("Erro ao atualizar avatar."),
  });

  const uploadCover = trpc.social.uploadCover.useMutation({
    onSuccess: () => { toast.success("Foto de capa atualizada!"); utils.social.getMyProfile.invalidate(); },
    onError: () => toast.error("Erro ao atualizar capa."),
  });

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1];
      uploadAvatar.mutate({ base64, mimeType: file.type });
    };
    reader.readAsDataURL(file);
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1];
      uploadCover.mutate({ base64, mimeType: file.type });
    };
    reader.readAsDataURL(file);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-sm px-6">
          <Users className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <h2 className="font-display text-2xl font-bold text-foreground mb-3">Seu Perfil</h2>
          <p className="text-muted-foreground mb-6">Entre para ver e personalizar seu perfil gastronômico.</p>
          <a href={getLoginUrl()} className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium">Entrar</a>
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

  const displayName = profile?.name ?? user?.name ?? "Usuário";
  const username = profile?.username;

  return (
    <div className="min-h-screen bg-background">
      {/* Cover Photo */}
      <div className="relative h-52 md:h-64 bg-gradient-to-br from-primary/20 via-primary/10 to-background overflow-hidden">
        {profile?.coverUrl ? (
          <img src={profile.coverUrl} alt="Capa" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/30 via-amber-500/10 to-background" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
        <button
          onClick={() => coverInputRef.current?.click()}
          className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 bg-black/40 hover:bg-black/60 text-white text-xs rounded-lg backdrop-blur-sm transition-colors"
        >
          <Camera className="w-3.5 h-3.5" /> Alterar capa
        </button>
        <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverChange} />
      </div>

      {/* Profile Header */}
      <div className="max-w-3xl mx-auto px-4">
        <div className="relative -mt-16 mb-4 flex items-end justify-between">
          {/* Avatar */}
          <div className="relative">
            <div className="w-28 h-28 rounded-2xl border-4 border-background bg-muted overflow-hidden shadow-xl">
              {profile?.avatarUrl ? (
                <img src={profile.avatarUrl} alt={displayName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-primary/10">
                  <span className="font-display text-3xl font-bold text-primary">{displayName[0]?.toUpperCase()}</span>
                </div>
              )}
            </div>
            <button
              onClick={() => avatarInputRef.current?.click()}
              className="absolute -bottom-1 -right-1 w-8 h-8 bg-primary text-primary-foreground rounded-lg flex items-center justify-center shadow-md hover:bg-primary/90 transition-colors"
            >
              <Camera className="w-3.5 h-3.5" />
            </button>
            <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </div>

          {/* Edit button */}
          <button
            onClick={() => setEditOpen(true)}
            className="flex items-center gap-2 px-4 py-2 border border-border rounded-xl text-sm font-medium text-foreground hover:bg-muted transition-colors"
          >
            <Edit3 className="w-4 h-4" /> Editar Perfil
          </button>
        </div>

        {/* Name & Bio */}
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-1">
            <h1 className="font-display text-2xl font-bold text-foreground">{displayName}</h1>
            {profile?.totalVideos && profile.totalVideos >= 5 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full font-medium">
                <Award className="w-3 h-3" /> Criador
              </span>
            )}
          </div>
          {username && <p className="text-sm text-muted-foreground mb-2">@{username}</p>}
          {profile?.bio && <p className="text-sm text-foreground/80 leading-relaxed mb-3">{profile.bio}</p>}
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            {profile?.city && (
              <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{profile.city}</span>
            )}
            {profile?.favoriteCuisine && (
              <span className="flex items-center gap-1"><UtensilsCrossed className="w-3.5 h-3.5" />{profile.favoriteCuisine}</span>
            )}
            {profile?.instagramHandle && (
              <a href={`https://instagram.com/${profile.instagramHandle}`} target="_blank" rel="noreferrer"
                className="flex items-center gap-1 hover:text-primary transition-colors">
                <Instagram className="w-3.5 h-3.5" />@{profile.instagramHandle}
              </a>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-5 border border-border rounded-2xl bg-card mb-6 divide-x divide-border overflow-hidden">
          <StatCard icon={Video} value={profile?.totalVideos ?? 0} label="Vídeos" />
          <StatCard icon={Star} value={profile?.totalReviews ?? 0} label="Avaliações" />
          <StatCard icon={UtensilsCrossed} value={profile?.totalRestaurantsVisited ?? 0} label="Visitados" />
          <StatCard icon={Heart} value={profile?.totalLikes ?? 0} label="Curtidas" />
          <StatCard icon={Users} value={profile?.totalFriends ?? 0} label="Amigos" />
        </div>

        {/* Pending friend requests banner */}
        {(profile?.pendingRequestsCount ?? 0) > 0 && (
          <Link href="/friends">
            <div className="flex items-center justify-between p-4 bg-primary/10 border border-primary/20 rounded-xl mb-5 cursor-pointer hover:bg-primary/15 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-primary/20 rounded-full flex items-center justify-center">
                  <UserPlus className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {profile?.pendingRequestsCount} solicitação{(profile?.pendingRequestsCount ?? 0) > 1 ? "ões" : ""} de amizade
                  </p>
                  <p className="text-xs text-muted-foreground">Clique para ver e responder</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </div>
          </Link>
        )}

        {/* Tabs */}
        <div className="flex border-b border-border mb-6 gap-1">
          {(["videos", "reviews", "visited", "friends"] as const).map((tab) => {
            const labels = { videos: "Vídeos", reviews: "Avaliações", visited: "Visitados", friends: "Amigos" };
            const icons = { videos: Video, reviews: Star, visited: UtensilsCrossed, friends: Users };
            const Icon = icons[tab];
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="w-4 h-4" />
                {labels[tab]}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="pb-16">
          {activeTab === "videos" && (
            <div>
              {(!profile?.videos || profile.videos.length === 0) ? (
                <div className="text-center py-16">
                  <Video className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground">Nenhum vídeo ainda. Compartilhe sua primeira experiência!</p>
                  <Link href="/feed">
                    <button className="mt-4 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium">Explorar Feed</button>
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {profile.videos.map((v) => <VideoThumb key={v.id} video={v} />)}
                </div>
              )}
            </div>
          )}

          {activeTab === "reviews" && (
            <div className="space-y-3">
              {(!profile?.reviews || profile.reviews.length === 0) ? (
                <div className="text-center py-16">
                  <Star className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground">Nenhuma avaliação ainda.</p>
                </div>
              ) : (
                profile.reviews.map((r) => (
                  <div key={r.id} className="p-4 bg-card border border-border rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={`w-3.5 h-3.5 ${i < r.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`} />
                        ))}
                      </div>
                      <span className="text-xs text-muted-foreground">{new Date(r.createdAt).toLocaleDateString("pt-BR")}</span>
                    </div>
                    {r.title && <p className="font-medium text-sm text-foreground mb-1">{r.title}</p>}
                    {r.content && <p className="text-sm text-muted-foreground line-clamp-3">{r.content}</p>}
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === "visited" && (
            <div>
              {(!profile?.visitedRestaurants || profile.visitedRestaurants.length === 0) ? (
                <div className="text-center py-16">
                  <UtensilsCrossed className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground">Nenhum restaurante visitado ainda.</p>
                  <Link href="/explore">
                    <button className="mt-4 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium">Explorar Restaurantes</button>
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {profile.visitedRestaurants.map((r) => (
                    <Link key={r.id} href={`/restaurant/${r.slug}`}>
                      <div className="bg-card border border-border rounded-xl overflow-hidden hover:border-primary/30 transition-colors cursor-pointer">
                        <div className="h-24 bg-muted relative">
                          {r.logoUrl ? (
                            <img src={r.logoUrl} alt={r.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <UtensilsCrossed className="w-8 h-8 text-muted-foreground/30" />
                            </div>
                          )}
                        </div>
                        <div className="p-3">
                          <p className="font-semibold text-sm text-foreground line-clamp-1">{r.name}</p>
                          <div className="flex items-center gap-1 mt-1">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                            <span className="text-xs text-muted-foreground">{Number(r.averageRating).toFixed(1)}</span>
                            {r.neighborhood && <span className="text-xs text-muted-foreground">· {r.neighborhood}</span>}
                          </div>
                          {r.lastVisit && (
                            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(r.lastVisit).toLocaleDateString("pt-BR")}
                            </p>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "friends" && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground">{profile?.totalFriends ?? 0} amigos</h3>
                <Link href="/friends">
                  <button className="flex items-center gap-1.5 text-sm text-primary font-medium">
                    <UserPlus className="w-4 h-4" /> Gerenciar
                  </button>
                </Link>
              </div>
              {(!profile?.friends || profile.friends.length === 0) ? (
                <div className="text-center py-16">
                  <Users className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground mb-4">Você ainda não tem amigos na plataforma.</p>
                  <Link href="/friends">
                    <button className="px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium">Encontrar Amigos</button>
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {profile.friends.map((f) => (
                    <Link key={f.id} href={`/u/${f.id}`}>
                      <div className="flex items-center gap-3 p-3 bg-card border border-border rounded-xl hover:border-primary/30 transition-colors cursor-pointer">
                        <div className="w-10 h-10 rounded-xl bg-muted overflow-hidden shrink-0">
                          {f.avatarUrl ? (
                            <img src={f.avatarUrl} alt={f.name ?? ""} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-primary/10">
                              <span className="font-bold text-primary text-sm">{(f.name ?? "U")[0].toUpperCase()}</span>
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-sm text-foreground line-clamp-1">{f.name}</p>
                          {f.username && <p className="text-xs text-muted-foreground">@{f.username}</p>}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {editOpen && profile && <EditProfileModal profile={profile} onClose={() => setEditOpen(false)} />}
    </div>
  );
}
