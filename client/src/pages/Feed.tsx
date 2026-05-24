import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import {
  Heart,
  MessageCircle,
  Share2,
  Star,
  MapPin,
  ChevronUp,
  ChevronDown,
  Play,
  Pause,
  Volume2,
  VolumeX,
  X,
  Send,
} from "lucide-react";
import { useEffect, useRef, useState, useCallback } from "react";
import { Link } from "wouter";
import { toast } from "sonner";

type FeedVideo = {
  id: number;
  videoUrl: string;
  thumbnailUrl?: string | null;
  title?: string | null;
  description?: string | null;
  rating?: number | null;
  views: number;
  likes: number;
  comments: number;
  tags?: unknown;
  restaurant?: { id: number; name: string; slug: string; neighborhood?: string | null; cuisine?: string | null; averageRating?: string | null } | null;
  user?: { id: number; name?: string | null; avatarUrl?: string | null } | null;
};

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star key={s} className={`w-3.5 h-3.5 ${s <= rating ? "fill-yellow-400 text-yellow-400" : "text-white/30"}`} />
      ))}
    </div>
  );
}

function VideoCard({
  video,
  isActive,
  likedIds,
  onLike,
  onComment,
}: {
  video: FeedVideo;
  isActive: boolean;
  likedIds: number[];
  onLike: (id: number) => void;
  onComment: (video: FeedVideo) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const isLiked = likedIds.includes(video.id);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    if (isActive) {
      el.play().then(() => setPlaying(true)).catch(() => {});
    } else {
      el.pause();
      setPlaying(false);
    }
  }, [isActive]);

  const togglePlay = () => {
    const el = videoRef.current;
    if (!el) return;
    if (playing) { el.pause(); setPlaying(false); }
    else { el.play().then(() => setPlaying(true)).catch(() => {}); }
  };

  const handleTimeUpdate = () => {
    const el = videoRef.current;
    if (!el || !el.duration) return;
    setProgress((el.currentTime / el.duration) * 100);
  };

  const rawTags = Array.isArray(video.tags) ? (video.tags as string[]) : [];

  // Parse serialized tags: "emoji Label|category" or plain string
  const tags = rawTags.map((item) => {
    if (typeof item !== "string") return { label: String(item), category: "food", emoji: "🍽️" };
    const pipeIdx = item.lastIndexOf("|");
    if (pipeIdx === -1) return { label: item.replace(/^[\s\S]{1,2}\s/, "").trim() || item, category: "food", emoji: "🍽️" };
    const labelWithEmoji = item.slice(0, pipeIdx);
    const category = item.slice(pipeIdx + 1);
    const spaceIdx = labelWithEmoji.indexOf(" ");
    const emoji = spaceIdx > -1 ? labelWithEmoji.slice(0, spaceIdx) : "🍽️";
    const label = spaceIdx > -1 ? labelWithEmoji.slice(spaceIdx + 1) : labelWithEmoji;
    return { label, category, emoji };
  });

  const TAG_COLORS: Record<string, { bg: string; text: string }> = {
    food:       { bg: "rgba(224,122,95,0.85)",  text: "#fff" },
    service:    { bg: "rgba(61,64,91,0.85)",    text: "#fff" },
    ambiance:   { bg: "rgba(129,178,154,0.85)", text: "#fff" },
    value:      { bg: "rgba(180,140,60,0.85)",  text: "#fff" },
    experience: { bg: "rgba(156,107,152,0.85)", text: "#fff" },
  };

  return (
    <div className="relative w-full h-full bg-black flex items-center justify-center">
      {/* Video */}
      {video.videoUrl ? (
        <video
          ref={videoRef}
          src={video.videoUrl}
          className="w-full h-full object-cover"
          loop
          muted={muted}
          playsInline
          poster={video.thumbnailUrl || undefined}
          onTimeUpdate={handleTimeUpdate}
          onClick={togglePlay}
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center" onClick={togglePlay}>
          <Play className="w-16 h-16 text-white/50" />
        </div>
      )}

      {/* Play/Pause overlay */}
      {!playing && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-16 h-16 rounded-full bg-black/40 flex items-center justify-center backdrop-blur-sm">
            <Play className="w-8 h-8 text-white fill-white ml-1" />
          </div>
        </div>
      )}

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/20">
        <div className="h-full bg-white transition-all duration-100" style={{ width: `${progress}%` }} />
      </div>

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 pointer-events-none" />

      {/* Top controls */}
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <button
          onClick={(e) => { e.stopPropagation(); setMuted(!muted); }}
          className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white"
        >
          {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>
      </div>

      {/* Bottom info */}
      <div className="absolute bottom-4 left-4 right-16 pointer-events-none">
        {video.restaurant && (
          <Link href={`/restaurant/${video.restaurant.slug}`}>
            <div className="inline-flex items-center gap-2 mb-3 pointer-events-auto cursor-pointer group">
              <div className="w-8 h-8 rounded-full bg-primary/80 flex items-center justify-center text-white text-xs font-bold">
                {video.restaurant.name.charAt(0)}
              </div>
              <div>
                <p className="text-white font-semibold text-sm leading-none group-hover:underline">{video.restaurant.name}</p>
                {video.restaurant.neighborhood && (
                  <p className="text-white/70 text-xs flex items-center gap-0.5 mt-0.5">
                    <MapPin className="w-3 h-3" /> {video.restaurant.neighborhood}
                  </p>
                )}
              </div>
            </div>
          </Link>
        )}

        {video.user && (
          <p className="text-white/80 text-xs mb-2">por {video.user.name || "Anônimo"}</p>
        )}

        {video.rating && (
          <div className="mb-2">
            <StarRating rating={video.rating} />
          </div>
        )}

        {video.title && (
          <p className="text-white text-sm font-medium mb-2 line-clamp-2">{video.title}</p>
        )}

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-1">
            {tags.slice(0, 4).map((tag, i) => {
              const colors = TAG_COLORS[tag.category] ?? TAG_COLORS.food;
              return (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full backdrop-blur-md"
                  style={{ backgroundColor: colors.bg, color: colors.text }}
                >
                  <span>{tag.emoji}</span>
                  <span>{tag.label}</span>
                </span>
              );
            })}
          </div>
        )}
      </div>

      {/* Right actions */}
      <div className="absolute right-3 bottom-20 flex flex-col items-center gap-5">
        <button
          onClick={(e) => { e.stopPropagation(); onLike(video.id); }}
          className="flex flex-col items-center gap-1"
        >
          <div className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${isLiked ? "bg-red-500" : "bg-black/40 backdrop-blur-sm"}`}>
            <Heart className={`w-5 h-5 ${isLiked ? "fill-white text-white" : "text-white"}`} />
          </div>
          <span className="text-white text-xs font-medium">{video.likes}</span>
        </button>

        <button
          onClick={(e) => { e.stopPropagation(); onComment(video); }}
          className="flex flex-col items-center gap-1"
        >
          <div className="w-11 h-11 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
            <MessageCircle className="w-5 h-5 text-white" />
          </div>
          <span className="text-white text-xs font-medium">{video.comments}</span>
        </button>

        <button
          onClick={(e) => { e.stopPropagation(); toast.info("Link copiado!"); }}
          className="flex flex-col items-center gap-1"
        >
          <div className="w-11 h-11 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
            <Share2 className="w-5 h-5 text-white" />
          </div>
          <span className="text-white text-xs font-medium">Compartilhar</span>
        </button>
      </div>
    </div>
  );
}

function CommentsPanel({ video, onClose }: { video: FeedVideo; onClose: () => void }) {
  const { isAuthenticated } = useAuth();
  const [text, setText] = useState("");
  const utils = trpc.useUtils();
  const { data: comments } = trpc.videos.comments.useQuery({ videoId: video.id });
  const addComment = trpc.videos.comment.useMutation({
    onSuccess: () => {
      setText("");
      utils.videos.comments.invalidate({ videoId: video.id });
      toast.success("Comentário adicionado!");
    },
  });

  return (
    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm z-20 flex items-end" onClick={onClose}>
      <div className="w-full bg-card rounded-t-2xl max-h-[70vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="font-semibold text-foreground">{video.comments} Comentários</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {comments?.map((c) => (
            <div key={c.id} className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold shrink-0">
                {c.user?.name?.charAt(0) || "U"}
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground">{c.user?.name || "Usuário"}</p>
                <p className="text-sm text-muted-foreground mt-0.5">{c.content}</p>
              </div>
            </div>
          ))}
          {(!comments || comments.length === 0) && (
            <p className="text-center text-muted-foreground text-sm py-8">Nenhum comentário ainda. Seja o primeiro!</p>
          )}
        </div>
        {isAuthenticated ? (
          <div className="p-4 border-t border-border flex gap-2">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Adicionar comentário..."
              className="flex-1 px-3 py-2 bg-muted rounded-lg text-sm outline-none"
              onKeyDown={(e) => { if (e.key === "Enter" && text.trim()) addComment.mutate({ videoId: video.id, content: text.trim() }); }}
            />
            <button
              onClick={() => text.trim() && addComment.mutate({ videoId: video.id, content: text.trim() })}
              disabled={!text.trim() || addComment.isPending}
              className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center disabled:opacity-50"
            >
              <Send className="w-4 h-4 text-white" />
            </button>
          </div>
        ) : (
          <div className="p-4 border-t border-border text-center">
            <a href={getLoginUrl()} className="text-sm text-primary font-medium">Entre para comentar</a>
          </div>
        )}
      </div>
    </div>
  );
}

export default function FeedPage() {
  const { isAuthenticated } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [offset, setOffset] = useState(0);
  const [allVideos, setAllVideos] = useState<FeedVideo[]>([]);
  const [commentVideo, setCommentVideo] = useState<FeedVideo | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const utils = trpc.useUtils();

  const { data: feedData, isLoading } = trpc.videos.feed.useQuery({ limit: 10, offset });
  const { data: likedIds = [] } = trpc.videos.likedVideoIds.useQuery(undefined, { enabled: isAuthenticated });

  const likeMutation = trpc.videos.like.useMutation({
    onSuccess: () => utils.videos.feed.invalidate(),
  });

  useEffect(() => {
    if (feedData) {
      setAllVideos((prev) => {
        const existingIds = new Set(prev.map((v) => v.id));
        const newOnes = feedData.filter((v) => !existingIds.has(v.id));
        return [...prev, ...newOnes];
      });
    }
  }, [feedData]);

  const handleLike = useCallback((videoId: number) => {
    if (!isAuthenticated) { toast.info("Entre para curtir vídeos"); return; }
    likeMutation.mutate({ videoId });
  }, [isAuthenticated, likeMutation]);

  const handleScroll = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY > 0) {
      setCurrentIndex((prev) => {
        const next = Math.min(prev + 1, allVideos.length - 1);
        if (next >= allVideos.length - 3) setOffset((o) => o + 10);
        return next;
      });
    } else {
      setCurrentIndex((prev) => Math.max(prev - 1, 0));
    }
  }, [allVideos.length]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "ArrowDown") setCurrentIndex((p) => Math.min(p + 1, allVideos.length - 1));
    if (e.key === "ArrowUp") setCurrentIndex((p) => Math.max(p - 1, 0));
  }, [allVideos.length]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Touch support
  const touchStartY = useRef(0);
  const handleTouchStart = (e: React.TouchEvent) => { touchStartY.current = e.touches[0].clientY; };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStartY.current - e.changedTouches[0].clientY;
    if (Math.abs(diff) > 50) {
      if (diff > 0) setCurrentIndex((p) => Math.min(p + 1, allVideos.length - 1));
      else setCurrentIndex((p) => Math.max(p - 1, 0));
    }
  };

  if (isLoading && allVideos.length === 0) {
    return (
      <div className="h-screen bg-black flex items-center justify-center">
        <div className="text-center text-white">
          <div className="w-12 h-12 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/70">Carregando feed...</p>
        </div>
      </div>
    );
  }

  if (allVideos.length === 0) {
    return (
      <div className="h-screen bg-black flex items-center justify-center">
        <div className="text-center text-white max-w-sm px-6">
          <Play className="w-16 h-16 text-white/30 mx-auto mb-4" />
          <h2 className="font-display text-2xl font-bold mb-3">Nenhum vídeo ainda</h2>
          <p className="text-white/60 mb-6">Seja o primeiro a compartilhar sua experiência em um restaurante!</p>
          <Link href="/">
            <button className="px-6 py-3 bg-primary text-white rounded-xl font-medium">Voltar ao Início</button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="h-screen bg-black overflow-hidden relative"
      onWheel={handleScroll}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Back to home */}
      <div className="absolute top-4 left-4 z-30">
        <Link href="/">
          <button className="px-4 py-2 bg-black/40 backdrop-blur-sm text-white rounded-lg text-sm font-medium flex items-center gap-2">
            <span className="font-display font-bold">Tastee</span>
          </button>
        </Link>
      </div>

      {/* Navigation arrows */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-2">
        <button
          onClick={() => setCurrentIndex((p) => Math.max(p - 1, 0))}
          disabled={currentIndex === 0}
          className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white disabled:opacity-30"
        >
          <ChevronUp className="w-5 h-5" />
        </button>
        <button
          onClick={() => setCurrentIndex((p) => Math.min(p + 1, allVideos.length - 1))}
          className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white"
        >
          <ChevronDown className="w-5 h-5" />
        </button>
      </div>

      {/* Video counter */}
      <div className="absolute top-4 right-16 z-20">
        <span className="text-white/60 text-xs">{currentIndex + 1} / {allVideos.length}</span>
      </div>

      {/* Videos */}
      <div
        className="h-full transition-transform duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]"
        style={{ transform: `translateY(-${currentIndex * 100}%)` }}
      >
        {allVideos.map((video, idx) => (
          <div key={video.id} className="h-screen w-full relative">
            <VideoCard
              video={video}
              isActive={idx === currentIndex}
              likedIds={likedIds}
              onLike={handleLike}
              onComment={setCommentVideo}
            />
          </div>
        ))}
      </div>

      {/* Comments panel */}
      {commentVideo && (
        <CommentsPanel video={commentVideo} onClose={() => setCommentVideo(null)} />
      )}
    </div>
  );
}
