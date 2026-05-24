import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useEffect } from "react";
import {
  MapPin, Heart, Video, Star, Users, UtensilsCrossed,
  Instagram, UserPlus, UserCheck, Clock, Play, Award,
  ChevronLeft, UserX, Loader2
} from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { Link } from "wouter";

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
    <Link href="/feed">
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
    </Link>
  );
}

type ProfileData = {
  id: number;
  name: string | null;
  username: string | null;
  avatarUrl: string | null;
  coverUrl: string | null;
  bio: string | null;
  city: string | null;
  favoriteCuisine: string | null;
  instagramHandle: string | null;
  totalVideos: number;
  totalLikes: number;
  totalReviews: number;
  totalRestaurantsVisited: number;
  totalFriends: number;
  createdAt: Date;
  friendshipStatus: string | null;
  friendshipId: number | null;
  isRequester: boolean;
  videos: { id: number; thumbnailUrl?: string | null; title?: string | null; views: number; likes: number }[];
  reviews: { id: number; rating: number; title?: string | null; content?: string | null; createdAt: Date }[];
  visitedRestaurants: { id: number; name: string; slug: string; logoUrl?: string | null; neighborhood?: string | null; averageRating: string | number; lastVisit?: Date | null }[];
  friends: { id: number; name: string | null; username: string | null; avatarUrl: string | null }[];
};

function FriendshipButton({ profile, userId }: { profile: ProfileData; userId: number }) {
  const utils = trpc.useUtils();

  const sendRequest = trpc.social.sendRequest.useMutation({
    onSuccess: () => { toast.success("Solicitação enviada!"); utils.social.getProfile.invalidate({ userId }); },
    onError: (e) => toast.error(e.message),
  });

  const respondRequest = trpc.social.respondRequest.useMutation({
    onSuccess: () => { toast.success("Solicitação aceita!"); utils.social.getProfile.invalidate({ userId }); utils.social.listFriends.invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  const removeFriend = trpc.social.removeFriend.useMutation({
    onSuccess: () => { toast.success("Amizade removida."); utils.social.getProfile.invalidate({ userId }); utils.social.listFriends.invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  const isPending = sendRequest.isPending || respondRequest.isPending || removeFriend.isPending;

  if (profile.friendshipStatus === "accepted") {
    return (
      <div className="flex items-center gap-2">
        <span className="flex items-center gap-1.5 px-4 py-2 bg-green-50 text-green-700 border border-green-200 rounded-xl text-sm font-medium">
          <UserCheck className="w-4 h-4" /> Amigos
        </span>
        <button
          onClick={() => removeFriend.mutate({ friendId: userId })}
          disabled={isPending}
          className="px-3 py-2 border border-border rounded-xl text-sm text-muted-foreground hover:text-destructive hover:border-destructive/30 transition-colors"
        >
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserX className="w-4 h-4" />}
        </button>
      </div>
    );
  }

  if (profile.friendshipStatus === "pending" && profile.isRequester) {
    return (
      <span className="flex items-center gap-1.5 px-4 py-2 bg-muted text-muted-foreground border border-border rounded-xl text-sm font-medium">
        <Clock className="w-4 h-4" /> Solicitação enviada
      </span>
    );
  }

  if (profile.friendshipStatus === "pending" && !profile.isRequester) {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={() => respondRequest.mutate({ friendshipId: profile.friendshipId!, action: "accepted" })}
          disabled={isPending}
          className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}
          Aceitar
        </button>
        <button
          onClick={() => respondRequest.mutate({ friendshipId: profile.friendshipId!, action: "declined" })}
          disabled={isPending}
          className="px-3 py-2 border border-border rounded-xl text-sm text-muted-foreground hover:text-destructive transition-colors"
        >
          Recusar
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => sendRequest.mutate({ addresseeId: userId })}
      disabled={isPending}
      className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
    >
      {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
      Adicionar Amigo
    </button>
  );
}

export default function PublicUserProfile({ params }: { params: { userId: string } }) {
  const { user: currentUser, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const userId = parseInt(params.userId, 10);

  const { data: profile, isLoading } = trpc.social.getProfile.useQuery(
    { userId },
    { enabled: isAuthenticated && !isNaN(userId) }
  );

  // Redirect to own profile if viewing self — must be in useEffect to avoid render-phase navigation
  useEffect(() => {
    if (isAuthenticated && currentUser && currentUser.id === userId) {
      navigate("/profile");
    }
  }, [isAuthenticated, currentUser, userId, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Usuário não encontrado.</p>
          <button onClick={() => navigate(-1 as any)} className="mt-4 text-primary text-sm">Voltar</button>
        </div>
      </div>
    );
  }

  const displayName = profile.name ?? "Usuário";

  return (
    <div className="min-h-screen bg-background">
      {/* Back button */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1 as any)} className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="font-semibold text-foreground">{displayName}</span>
        </div>
      </div>

      {/* Cover Photo */}
      <div className="relative h-44 md:h-56 bg-gradient-to-br from-primary/20 via-primary/10 to-background overflow-hidden">
        {profile.coverUrl ? (
          <img src={profile.coverUrl} alt="Capa" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 via-amber-500/10 to-background" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
      </div>

      <div className="max-w-3xl mx-auto px-4">
        {/* Profile Header */}
        <div className="relative -mt-14 mb-4 flex items-end justify-between">
          <div className="w-24 h-24 rounded-2xl border-4 border-background bg-muted overflow-hidden shadow-xl">
            {profile.avatarUrl ? (
              <img src={profile.avatarUrl} alt={displayName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-primary/10">
                <span className="font-display text-2xl font-bold text-primary">{displayName[0]?.toUpperCase()}</span>
              </div>
            )}
          </div>
          {isAuthenticated && <FriendshipButton profile={profile as ProfileData} userId={userId} />}
        </div>

        {/* Name & Bio */}
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-1">
            <h1 className="font-display text-2xl font-bold text-foreground">{displayName}</h1>
            {profile.totalVideos >= 5 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full font-medium">
                <Award className="w-3 h-3" /> Criador
              </span>
            )}
          </div>
          {profile.username && <p className="text-sm text-muted-foreground mb-2">@{profile.username}</p>}
          {profile.bio && <p className="text-sm text-foreground/80 leading-relaxed mb-3">{profile.bio}</p>}
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            {profile.city && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{profile.city}</span>}
            {profile.favoriteCuisine && <span className="flex items-center gap-1"><UtensilsCrossed className="w-3.5 h-3.5" />{profile.favoriteCuisine}</span>}
            {profile.instagramHandle && (
              <a href={`https://instagram.com/${profile.instagramHandle}`} target="_blank" rel="noreferrer"
                className="flex items-center gap-1 hover:text-primary transition-colors">
                <Instagram className="w-3.5 h-3.5" />@{profile.instagramHandle}
              </a>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-5 border border-border rounded-2xl bg-card mb-6 divide-x divide-border overflow-hidden">
          <StatCard icon={Video} value={profile.totalVideos} label="Vídeos" />
          <StatCard icon={Star} value={profile.totalReviews} label="Avaliações" />
          <StatCard icon={UtensilsCrossed} value={profile.totalRestaurantsVisited} label="Visitados" />
          <StatCard icon={Heart} value={profile.totalLikes} label="Curtidas" />
          <StatCard icon={Users} value={profile.totalFriends} label="Amigos" />
        </div>

        {/* Friends in common teaser */}
        {profile.friends && profile.friends.length > 0 && (
          <div className="flex items-center gap-3 p-4 bg-card border border-border rounded-xl mb-5">
            <div className="flex -space-x-2">
              {profile.friends.slice(0, 4).map((f) => (
                <div key={f.id} className="w-8 h-8 rounded-full border-2 border-background bg-muted overflow-hidden">
                  {f.avatarUrl ? (
                    <img src={f.avatarUrl} alt={f.name ?? ""} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-primary/10">
                      <span className="text-xs font-bold text-primary">{(f.name ?? "U")[0].toUpperCase()}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{profile.totalFriends}</span> amigos na plataforma
            </p>
          </div>
        )}

        {/* Content sections */}
        <div className="space-y-8 pb-16">
          {/* Videos */}
          {profile.videos.length > 0 && (
            <div>
              <h2 className="font-display text-lg font-bold text-foreground mb-3 flex items-center gap-2">
                <Video className="w-5 h-5 text-primary" /> Vídeos de {displayName.split(" ")[0]}
              </h2>
              <div className="grid grid-cols-3 gap-2">
                {profile.videos.map((v) => <VideoThumb key={v.id} video={v} />)}
              </div>
            </div>
          )}

          {/* Visited restaurants */}
          {profile.visitedRestaurants.length > 0 && (
            <div>
              <h2 className="font-display text-lg font-bold text-foreground mb-3 flex items-center gap-2">
                <UtensilsCrossed className="w-5 h-5 text-primary" /> Restaurantes Visitados
              </h2>
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
            </div>
          )}

          {/* Reviews */}
          {profile.reviews.length > 0 && (
            <div>
              <h2 className="font-display text-lg font-bold text-foreground mb-3 flex items-center gap-2">
                <Star className="w-5 h-5 text-primary" /> Avaliações Recentes
              </h2>
              <div className="space-y-3">
                {profile.reviews.map((r) => (
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
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {profile.videos.length === 0 && profile.visitedRestaurants.length === 0 && profile.reviews.length === 0 && (
            <div className="text-center py-16">
              <UtensilsCrossed className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground">{displayName.split(" ")[0]} ainda não compartilhou nada.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
