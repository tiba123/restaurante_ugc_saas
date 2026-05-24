import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import {
  Users, Video, Star, UtensilsCrossed, Award, UserPlus,
  Heart, Play, MessageSquare, Clock, ChevronRight, Sparkles
} from "lucide-react";
import { Link } from "wouter";

type ActivityType = "video_posted" | "video_approved" | "review_posted" | "restaurant_visited" | "achievement_earned" | "friendship_started";

type Activity = {
  id: number;
  userId: number;
  type: ActivityType;
  restaurantId?: number | null;
  videoId?: number | null;
  reviewId?: number | null;
  achievementId?: number | null;
  friendId?: number | null;
  createdAt: Date;
  user?: { id: number; name: string | null; username: string | null; avatarUrl: string | null } | null;
  restaurant?: { id: number; name: string; slug: string; logoUrl?: string | null; neighborhood?: string | null; averageRating: string | number } | null;
  video?: { id: number; title?: string | null; thumbnailUrl?: string | null; views: number; likes: number } | null;
};

const ACTIVITY_CONFIG: Record<ActivityType, { icon: React.ElementType; color: string; bgColor: string; verb: string }> = {
  video_posted: { icon: Video, color: "text-blue-600", bgColor: "bg-blue-50", verb: "publicou um vídeo" },
  video_approved: { icon: Video, color: "text-green-600", bgColor: "bg-green-50", verb: "teve vídeo aprovado em" },
  review_posted: { icon: Star, color: "text-amber-600", bgColor: "bg-amber-50", verb: "avaliou" },
  restaurant_visited: { icon: UtensilsCrossed, color: "text-primary", bgColor: "bg-primary/10", verb: "visitou" },
  achievement_earned: { icon: Award, color: "text-purple-600", bgColor: "bg-purple-50", verb: "conquistou" },
  friendship_started: { icon: UserPlus, color: "text-pink-600", bgColor: "bg-pink-50", verb: "fez amizade com" },
};

function timeAgo(date: Date): string {
  const now = new Date();
  const diff = Math.floor((now.getTime() - new Date(date).getTime()) / 1000);
  if (diff < 60) return "agora mesmo";
  if (diff < 3600) return `${Math.floor(diff / 60)}min atrás`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h atrás`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d atrás`;
  return new Date(date).toLocaleDateString("pt-BR");
}

function ActivityCard({ activity }: { activity: Activity }) {
  const config = ACTIVITY_CONFIG[activity.type];
  const Icon = config.icon;
  const user = activity.user;
  const restaurant = activity.restaurant;
  const video = activity.video;

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/20 transition-colors">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 pb-3">
        <Link href={`/u/${user?.id}`}>
          <div className="w-10 h-10 rounded-xl bg-muted overflow-hidden shrink-0 cursor-pointer">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.name ?? ""} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-primary/10">
                <span className="font-bold text-primary text-sm">{(user?.name ?? "U")[0].toUpperCase()}</span>
              </div>
            )}
          </div>
        </Link>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-foreground">
            <Link href={`/u/${user?.id}`}>
              <span className="font-semibold hover:text-primary transition-colors cursor-pointer">{user?.name}</span>
            </Link>
            {" "}
            <span className="text-muted-foreground">{config.verb}</span>
            {restaurant && (
              <>
                {" "}
                <Link href={`/restaurant/${restaurant.slug}`}>
                  <span className="font-semibold hover:text-primary transition-colors cursor-pointer">{restaurant.name}</span>
                </Link>
              </>
            )}
          </p>
          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
            <Clock className="w-3 h-3" />
            {timeAgo(activity.createdAt)}
          </p>
        </div>
        <div className={`w-8 h-8 rounded-full ${config.bgColor} flex items-center justify-center shrink-0`}>
          <Icon className={`w-4 h-4 ${config.color}`} />
        </div>
      </div>

      {/* Video preview */}
      {video && (
        <div className="px-4 pb-3">
          <Link href="/feed">
            <div className="relative rounded-xl overflow-hidden bg-muted cursor-pointer group">
              <div className="aspect-video">
                {video.thumbnailUrl ? (
                  <img src={video.thumbnailUrl} alt={video.title ?? ""} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Play className="w-10 h-10 text-muted-foreground/30" />
                  </div>
                )}
              </div>
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                  <Play className="w-5 h-5 text-white fill-white" />
                </div>
              </div>
              {video.title && (
                <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/70 to-transparent">
                  <p className="text-white text-sm font-medium line-clamp-1">{video.title}</p>
                </div>
              )}
            </div>
          </Link>
          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Play className="w-3 h-3" />{video.views.toLocaleString()} views</span>
            <span className="flex items-center gap-1"><Heart className="w-3 h-3" />{video.likes} curtidas</span>
          </div>
        </div>
      )}

      {/* Restaurant card */}
      {restaurant && !video && (
        <div className="px-4 pb-3">
          <Link href={`/restaurant/${restaurant.slug}`}>
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl cursor-pointer hover:bg-muted transition-colors">
              <div className="w-12 h-12 rounded-xl bg-muted overflow-hidden shrink-0">
                {restaurant.logoUrl ? (
                  <img src={restaurant.logoUrl} alt={restaurant.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <UtensilsCrossed className="w-5 h-5 text-muted-foreground/40" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-foreground">{restaurant.name}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  <span className="text-xs text-muted-foreground">{Number(restaurant.averageRating).toFixed(1)}</span>
                  {restaurant.neighborhood && <span className="text-xs text-muted-foreground">· {restaurant.neighborhood}</span>}
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
            </div>
          </Link>
        </div>
      )}
    </div>
  );
}

function EmptyFeed() {
  return (
    <div className="text-center py-20 px-6">
      <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
        <Sparkles className="w-10 h-10 text-primary" />
      </div>
      <h3 className="font-display text-xl font-bold text-foreground mb-2">Seu feed está vazio</h3>
      <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
        Adicione amigos para ver o que eles estão comendo, onde estão indo e quais restaurantes estão recomendando!
      </p>
      <Link href="/friends">
        <button className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium">
          <UserPlus className="w-4 h-4" /> Encontrar Amigos
        </button>
      </Link>
    </div>
  );
}

export default function SocialFeed() {
  const { isAuthenticated } = useAuth();

  const { data: activities, isLoading } = trpc.social.friendsFeed.useQuery(
    { limit: 30, offset: 0 },
    { enabled: isAuthenticated }
  );

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-sm px-6">
          <Users className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <h2 className="font-display text-2xl font-bold text-foreground mb-3">Feed Social</h2>
          <p className="text-muted-foreground mb-6">Entre para ver o que seus amigos estão comendo e onde estão indo.</p>
          <a href={getLoginUrl()} className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium">Entrar</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground mb-1">Feed dos Amigos</h1>
            <p className="text-muted-foreground text-sm">O que seus amigos estão comendo e visitando</p>
          </div>
          <Link href="/friends">
            <button className="flex items-center gap-1.5 text-sm text-primary font-medium hover:text-primary/80 transition-colors">
              <UserPlus className="w-4 h-4" /> Amigos
            </button>
          </Link>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-card border border-border rounded-2xl p-4 animate-pulse">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-muted" />
                  <div className="flex-1">
                    <div className="h-4 bg-muted rounded w-40 mb-1.5" />
                    <div className="h-3 bg-muted rounded w-20" />
                  </div>
                </div>
                <div className="aspect-video bg-muted rounded-xl" />
              </div>
            ))}
          </div>
        ) : !activities || activities.length === 0 ? (
          <EmptyFeed />
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => (
              <ActivityCard key={activity.id} activity={activity as Activity} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
