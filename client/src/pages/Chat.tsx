import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Sparkles, Send, Plus, MapPin, Star, ExternalLink, ChevronRight,
  MessageSquare, User, Clock, ThumbsUp, ThumbsDown, Utensils,
  Phone, Globe, ChevronLeft, Building2, Navigation, Trophy,
  Zap, Flame, Heart, BookOpen, ChevronDown, ChevronUp,
} from "lucide-react";
import { Streamdown } from "streamdown";

// ─── Tipos ─────────────────────────────────────────────────────────────────────
interface PlaceReview {
  authorName: string;
  authorPhoto?: string;
  rating: number;
  text: string;
  timeDescription: string;
  isPositive: boolean;
}

interface PlaceInfo {
  placeId: string;
  name: string;
  category: string;
  address: string;
  neighborhood: string;
  city: string;
  rating: number;
  totalRatings: number;
  priceLevel: number;
  types: string[];
  reviews: PlaceReview[];
  positiveReviews: string[];
  negativeReviews: string[];
  aiSummary: string;
  highlights: string[];
  mapsUrl: string;
  googleBusinessUrl: string;
  website?: string;
  phone?: string;
  openNow?: boolean;
  weekdayHours?: string[];
  photoUrl?: string;
  photoUrls: string[];
  lat: number;
  lng: number;
}

interface Message {
  id?: number;
  role: "user" | "assistant";
  content: string;
  recommendedPlaces?: PlaceInfo[];
  createdAt?: Date;
  isLoading?: boolean;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────
function generateSessionKey(): string {
  return `session_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function getPriceLevelSymbol(level: number): string {
  return ["", "$", "$$", "$$$", "$$$$"][level] || "";
}

function getRatingColor(rating: number): string {
  if (rating >= 4.5) return "text-emerald-400";
  if (rating >= 4.0) return "text-green-400";
  if (rating >= 3.5) return "text-yellow-400";
  return "text-orange-400";
}

function getRatingEmoji(rating: number): string {
  if (rating >= 4.5) return "🏆";
  if (rating >= 4.0) return "⭐";
  if (rating >= 3.5) return "👍";
  return "😐";
}

// ─── Carrossel de Fotos ────────────────────────────────────────────────────────
function PhotoCarousel({ photos, name }: { photos: string[]; name: string }) {
  const [current, setCurrent] = useState(0);

  if (!photos || photos.length === 0) {
    return (
      <div className="w-full h-48 bg-gradient-to-br from-amber-900/30 to-orange-900/20 flex items-center justify-center">
        <Utensils className="w-12 h-12 text-amber-500/30" />
      </div>
    );
  }

  return (
    <div className="relative w-full h-48 overflow-hidden bg-black/40">
      <img
        src={photos[current]}
        alt={`${name} - foto ${current + 1}`}
        className="w-full h-full object-cover transition-opacity duration-300"
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = "none";
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

      {photos.length > 1 && (
        <>
          <button
            onClick={() => setCurrent((c) => (c - 1 + photos.length) % photos.length)}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setCurrent((c) => (c + 1) % photos.length)}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
            {photos.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`w-1.5 h-1.5 rounded-full transition-all ${i === current ? "bg-white w-3" : "bg-white/40"}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Carrossel de Reviews ──────────────────────────────────────────────────────
function ReviewsCarousel({ reviews }: { reviews: PlaceReview[] }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [showAll, setShowAll] = useState(false);

  // Garantir pelo menos os reviews disponíveis
  const displayReviews = reviews.slice(0, Math.max(reviews.length, 3));
  if (displayReviews.length === 0) return null;

  const visibleReviews = showAll ? displayReviews : displayReviews.slice(0, 3);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-xs text-white/80 font-medium uppercase tracking-wide">
        <BookOpen className="w-3 h-3" />
        O que dizem os clientes
      </div>

      <div className="space-y-2">
        {visibleReviews.map((review, i) => (
          <div
            key={i}
            className={`rounded-xl p-3 border text-xs leading-relaxed ${
              review.isPositive
                ? "bg-emerald-500/10 border-emerald-500/25"
                : "bg-red-500/10 border-red-500/25"
            }`}
          >
            <div className="flex items-center gap-2 mb-1.5">
              {review.authorPhoto ? (
                <img
                  src={review.authorPhoto}
                  alt={review.authorName}
                  className="w-6 h-6 rounded-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center">
                  <User className="w-3 h-3 text-white/40" />
                </div>
              )}
              <span className="text-white/95 font-semibold">{review.authorName}</span>
              <div className="flex items-center gap-0.5 ml-auto">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`w-2.5 h-2.5 ${s <= review.rating ? "text-amber-400 fill-amber-400" : "text-white/20"}`}
                  />
                ))}
              </div>
              <span className="text-white/60 text-[10px]">{review.timeDescription}</span>
            </div>
            <p className="text-white/85 line-clamp-3 leading-relaxed">{review.text}</p>
          </div>
        ))}
      </div>

      {displayReviews.length > 3 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="w-full text-xs text-amber-400 hover:text-amber-300 flex items-center justify-center gap-1 py-1 transition-colors font-medium"
        >
          {showAll ? (
            <><ChevronUp className="w-3 h-3" /> Mostrar menos</>
          ) : (
            <><ChevronDown className="w-3 h-3" /> Ver mais {displayReviews.length - 3} avaliações</>
          )}
        </button>
      )}
    </div>
  );
}

// ─── Card de Lugar Gamificado ──────────────────────────────────────────────────
function PlaceCard({ place, rank }: { place: PlaceInfo; rank: number }) {
  const [expanded, setExpanded] = useState(false);

  const rankColors = [
    "from-amber-500 to-yellow-400",    // 1º - ouro
    "from-slate-400 to-slate-300",     // 2º - prata
    "from-amber-700 to-amber-600",     // 3º - bronze
    "from-purple-500 to-purple-400",   // 4º+
  ];
  const rankColor = rankColors[Math.min(rank - 1, 3)];
  const rankEmoji = ["🥇", "🥈", "🥉", "✨"][Math.min(rank - 1, 3)];

  return (
    <div className={`relative rounded-2xl overflow-hidden border transition-all duration-300 ${
      expanded ? "border-amber-500/40 shadow-lg shadow-amber-500/10" : "border-white/10 hover:border-amber-500/20"
    } bg-[#1a1817]`}>

      {/* Badge de ranking */}
      <div className={`absolute top-3 left-3 z-10 w-8 h-8 rounded-full bg-gradient-to-br ${rankColor} flex items-center justify-center text-sm font-bold shadow-lg`}>
        {rankEmoji}
      </div>

      {/* Status badge */}
      {place.openNow !== undefined && (
        <div className={`absolute top-3 right-3 z-10 text-[10px] px-2 py-0.5 rounded-full font-semibold ${
          place.openNow ? "bg-emerald-500/80 text-white" : "bg-red-500/80 text-white"
        }`}>
          {place.openNow ? "● Aberto" : "● Fechado"}
        </div>
      )}

      {/* Carrossel de fotos */}
      <PhotoCarousel photos={place.photoUrls || (place.photoUrl ? [place.photoUrl] : [])} name={place.name} />

      {/* Conteúdo principal */}
      <div className="p-4 space-y-3">
        {/* Nome + categoria */}
        <div>
          <div className="flex items-start justify-between gap-2">
            <h4 className="text-white font-bold text-base leading-tight">{place.name}</h4>
            <span className="text-[10px] bg-white/15 text-white/85 px-2 py-0.5 rounded-full shrink-0 mt-0.5">
              {place.category}
            </span>
          </div>

          {/* Rating + avaliações */}
          <div className="flex items-center gap-3 mt-1.5">
            <div className="flex items-center gap-1">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`w-3 h-3 ${s <= Math.round(place.rating) ? "text-amber-400 fill-amber-400" : "text-white/20"}`}
                  />
                ))}
              </div>
              <span className={`text-sm font-bold ${getRatingColor(place.rating)}`}>
                {place.rating.toFixed(1)}
              </span>
            </div>
            <span className="text-white/70 text-xs">
              {place.totalRatings.toLocaleString("pt-BR")} avaliações
            </span>
            {place.priceLevel > 0 && (
              <span className="text-amber-400/70 text-xs font-medium">
                {getPriceLevelSymbol(place.priceLevel)}
              </span>
            )}
          </div>
        </div>

        {/* Localização */}
        <div className="flex items-center gap-1.5 text-xs text-white/75">
          <MapPin className="w-3 h-3 text-amber-400/60 shrink-0" />
          <span className="truncate">{place.neighborhood} · {place.address.split(",")[0]}</span>
        </div>

        {/* Resumo IA */}
        {place.aiSummary && (
          <p className="text-white/90 text-sm leading-relaxed">{place.aiSummary}</p>
        )}

        {/* Destaques */}
        {place.highlights.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {place.highlights.map((h, i) => (
              <span key={i} className="text-xs bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 px-2.5 py-1 rounded-full flex items-center gap-1">
                <ThumbsUp className="w-2.5 h-2.5" />
                {h}
              </span>
            ))}
          </div>
        )}

        {/* Ponto negativo (se houver) */}
        {place.negativeReviews.length > 0 && (
          <div className="flex items-start gap-2 text-xs text-red-300 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
            <ThumbsDown className="w-3 h-3 mt-0.5 shrink-0" />
            <span className="line-clamp-2">{place.negativeReviews[0]?.slice(0, 80)}...</span>
          </div>
        )}

        {/* Botão expandir/recolher */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 py-1 transition-colors font-medium"
        >
          {expanded ? (
            <><ChevronUp className="w-3.5 h-3.5" /> Mostrar menos</>
          ) : (
            <><ChevronDown className="w-3.5 h-3.5" /> Ver avaliações e detalhes</>
          )}
        </button>

        {/* Seção expandida: reviews + horários + contato */}
        {expanded && (
            <div className="space-y-4 pt-2 border-t border-white/20">
            {/* Reviews */}
            <ReviewsCarousel reviews={place.reviews || []} />

            {/* Horários */}
            {place.weekdayHours && place.weekdayHours.length > 0 && (
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-xs text-white/80 font-medium uppercase tracking-wide">
                  <Clock className="w-3 h-3" />
                  Horários
                </div>
                <div className="space-y-0.5">
                  {place.weekdayHours.map((h, i) => (
                    <p key={i} className="text-xs text-white/75">{h}</p>
                  ))}
                </div>
              </div>
            )}

            {/* Contato */}
            {(place.phone || place.website) && (
              <div className="flex gap-2">
                {place.phone && (
                  <a
                    href={`tel:${place.phone}`}
                    className="flex items-center gap-1.5 text-xs bg-white/10 hover:bg-white/15 text-white/85 px-3 py-1.5 rounded-xl transition-colors"
                  >
                    <Phone className="w-3 h-3" />
                    {place.phone}
                  </a>
                )}
                {place.website && (
                  <a
                    href={place.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs bg-white/10 hover:bg-white/15 text-white/85 px-3 py-1.5 rounded-xl transition-colors"
                  >
                    <Globe className="w-3 h-3" />
                    Site oficial
                  </a>
                )}
              </div>
            )}
          </div>
        )}

        {/* CTAs principais */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <a
            href={place.googleBusinessUrl || place.mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 text-xs bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 border border-amber-500/20 text-amber-300 py-2.5 rounded-xl transition-all font-medium"
          >
            <Building2 className="w-3.5 h-3.5" />
            Google Meu Negócio
          </a>
          <a
            href={place.mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 text-xs bg-white/10 hover:bg-white/15 border border-white/20 text-white/90 py-2.5 rounded-xl transition-all"
          >
            <Navigation className="w-3.5 h-3.5" />
            Ver no Maps
          </a>
        </div>
      </div>
    </div>
  );
}

// ─── Mensagem de Chat ──────────────────────────────────────────────────────────
function ChatMessage({ message }: { message: Message }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      {/* Avatar */}
      <div className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 mt-1 shadow-lg ${
        isUser
          ? "bg-gradient-to-br from-amber-500 to-orange-500"
          : "bg-gradient-to-br from-purple-600 to-indigo-600"
      }`}>
        {isUser ? (
          <User className="w-4 h-4 text-white" />
        ) : (
          <Sparkles className="w-4 h-4 text-white" />
        )}
      </div>

      {/* Conteúdo */}
      <div className={`flex-1 max-w-[88%] space-y-4 flex flex-col ${isUser ? "items-end" : "items-start"}`}>
        {/* Bubble */}
        <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
          isUser
            ? "bg-gradient-to-br from-amber-500 to-orange-500 text-white rounded-tr-sm font-medium shadow-lg shadow-amber-500/20"
            : "bg-[#1e1c1b] text-white rounded-tl-sm border border-white/15"
        }`}>
          {message.isLoading ? (
            <div className="flex items-center gap-3">
              <div className="flex gap-1">
                {[0, 150, 300].map((delay) => (
                  <div
                    key={delay}
                    className="w-2 h-2 bg-amber-400/60 rounded-full animate-bounce"
                    style={{ animationDelay: `${delay}ms` }}
                  />
                ))}
              </div>
              <span className="text-white/70 text-xs">O Indicador está pesquisando...</span>
            </div>
          ) : isUser ? (
            <span>{message.content}</span>
          ) : (
            <div className="prose prose-invert prose-sm max-w-none text-white [&>p]:mb-2 [&>p:last-child]:mb-0 [&>p]:text-white [&>ul]:mb-2 [&>ul>li]:mb-1 [&>ul>li]:text-white [&>ol>li]:text-white [&>h1]:text-white [&>h2]:text-amber-300 [&>h3]:text-amber-300 [&>strong]:text-amber-300 [&>strong]:font-bold">
              <Streamdown>{message.content}</Streamdown>
            </div>
          )}
        </div>

        {/* Cards de lugares */}
        {!message.isLoading && message.recommendedPlaces && message.recommendedPlaces.length > 0 && (
          <div className="w-full space-y-3">
            {/* Header dos resultados */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 rounded-full px-3 py-1">
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-xs text-amber-300 font-semibold">
                  {message.recommendedPlaces.length} lugar{message.recommendedPlaces.length > 1 ? "es" : ""} indicado{message.recommendedPlaces.length > 1 ? "s" : ""}
                </span>
              </div>
              <div className="flex items-center gap-1 text-xs text-white/65">
                <Zap className="w-3 h-3" />
                Baseado em avaliações reais do Google
              </div>
            </div>

            {/* Grid de cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {message.recommendedPlaces.map((place, i) => (
                <PlaceCard key={place.placeId} place={place} rank={i + 1} />
              ))}
            </div>
          </div>
        )}

        {/* Timestamp */}
        {message.createdAt && !message.isLoading && (
          <div className={`flex items-center gap-1 text-xs text-white/50 ${isUser ? "flex-row-reverse" : ""}`}>
            <Clock className="w-3 h-3" />
            {new Date(message.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Sugestões Rápidas ─────────────────────────────────────────────────────────
const QUICK_SUGGESTIONS = [
  { icon: "🍣", text: "Melhor sushi em SP?" },
  { icon: "🌙", text: "Onde jantar hoje à noite?" },
  { icon: "💑", text: "Restaurante romântico no Itaim?" },
  { icon: "🛍️", text: "Shopping perto da Vila Madalena?" },
  { icon: "🍔", text: "Melhor hambúrguer artesanal?" },
  { icon: "☕", text: "Café para trabalhar em Pinheiros?" },
  { icon: "⛽", text: "Posto 24h no centro de SP?" },
  { icon: "🥩", text: "Churrascaria premium em SP?" },
];

// ─── Tela de Boas-vindas ───────────────────────────────────────────────────────
function WelcomeScreen({ quizCompleted, quizLoading, onSend, disabled }: {
  quizCompleted?: boolean;
  quizLoading: boolean;
  onSend: (text: string) => void;
  disabled: boolean;
}) {
  return (
    <div className="flex flex-col items-center text-center space-y-8 py-6 px-4">
      {/* Logo animado */}
      <div className="relative">
        <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 flex items-center justify-center shadow-2xl shadow-amber-500/30">
          <Sparkles className="w-12 h-12 text-white" />
        </div>
        <div className="absolute -top-1 -right-1 w-7 h-7 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg">
          <Flame className="w-4 h-4 text-white" />
        </div>
      </div>

      {/* Título */}
      <div className="space-y-2">
        <h2 className="text-3xl font-bold text-white font-['Playfair_Display']">
          O Indicador 🗺️
        </h2>
        <p className="text-white/80 max-w-sm mx-auto text-sm leading-relaxed">
          Seu guia gastronômico com IA para São Paulo. Recomendações baseadas em <strong className="text-amber-400">avaliações reais do Google</strong>, personalizadas para o seu gosto.
        </p>
      </div>

      {/* Stats gamificados */}
      <div className="flex gap-4">
        {[
          { icon: "⭐", label: "Avaliações reais", value: "Google" },
          { icon: "🤖", label: "Powered by", value: "IA" },
          { icon: "📍", label: "Foco em", value: "São Paulo" },
        ].map((stat) => (
          <div key={stat.label} className="flex flex-col items-center gap-1 bg-white/8 border border-white/20 rounded-2xl px-4 py-3">
            <span className="text-xl">{stat.icon}</span>
            <span className="text-white font-bold text-sm">{stat.value}</span>
            <span className="text-white/65 text-[10px]">{stat.label}</span>
          </div>
        ))}
      </div>

      {/* Quiz CTA */}
      {!quizCompleted && !quizLoading && (
        <div className="bg-gradient-to-r from-purple-500/10 to-indigo-500/10 border border-purple-500/20 rounded-2xl p-4 max-w-sm w-full">
          <div className="flex items-center gap-2 mb-2">
            <Heart className="w-4 h-4 text-purple-400" />
            <p className="text-purple-300 text-sm font-semibold">Personalize suas indicações!</p>
          </div>
          <p className="text-white/80 text-xs mb-3 leading-relaxed">
            Responda 7 perguntas rápidas e receba recomendações ainda mais precisas para o seu perfil.
          </p>
          <Link href="/quiz">
            <Button size="sm" className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white text-xs w-full border-0">
              Fazer Quiz de Perfil
              <ChevronRight className="w-3 h-3 ml-1" />
            </Button>
          </Link>
        </div>
      )}

      {/* Sugestões rápidas */}
      <div className="w-full max-w-lg space-y-3">
        <p className="text-xs text-white/65 flex items-center justify-center gap-1.5">
          <MessageSquare className="w-3 h-3" />
          Experimente perguntar:
        </p>
        <div className="grid grid-cols-2 gap-2">
          {QUICK_SUGGESTIONS.map((s, i) => (
            <button
              key={i}
              onClick={() => onSend(s.text)}
              disabled={disabled}
              className="flex items-center gap-2 text-left text-xs bg-white/8 hover:bg-white/15 border border-white/20 hover:border-amber-500/50 text-white/85 hover:text-white px-3 py-2.5 rounded-xl transition-all duration-200 disabled:opacity-40 group"
            >
              <span className="text-base group-hover:scale-110 transition-transform">{s.icon}</span>
              <span>{s.text}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Componente Principal ──────────────────────────────────────────────────────
export default function Chat() {
  const { user, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [sessionKey] = useState(generateSessionKey);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const quizProfile = trpc.chat.quiz.getProfile.useQuery(undefined, { enabled: !!user });
  const createSession = trpc.chat.createSession.useMutation();
  const sendMessageMutation = trpc.chat.sendMessage.useMutation();

  useEffect(() => {
    if (!authLoading && !user) {
      window.location.href = getLoginUrl();
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (!user) return;
    createSession.mutateAsync({ sessionKey }).then((session) => {
      if (session) setSessionId(session.id);
    });
  }, [user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = useCallback(async (text?: string) => {
    const messageText = (text || input).trim();
    if (!messageText || !sessionId || isSending) return;

    setInput("");
    setIsSending(true);

    const userMsg: Message = { role: "user", content: messageText, createdAt: new Date() };
    const loadingMsg: Message = { role: "assistant", content: "", isLoading: true };
    setMessages((prev) => [...prev, userMsg, loadingMsg]);

    try {
      const result = await sendMessageMutation.mutateAsync({ sessionId, message: messageText });
      setMessages((prev) => {
        const withoutLoading = prev.filter((m) => !m.isLoading);
        return [
          ...withoutLoading,
          {
            id: result.message?.id,
            role: "assistant" as const,
            content: result.message?.content || "Desculpe, não consegui processar sua mensagem.",
            recommendedPlaces: result.recommendedPlaces as PlaceInfo[],
            createdAt: result.message?.createdAt,
          },
        ];
      });
    } catch {
      setMessages((prev) => prev.filter((m) => !m.isLoading));
      toast.error("Erro ao enviar mensagem. Tente novamente.");
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  }, [input, sessionId, isSending, sendMessageMutation]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#111010] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const hasMessages = messages.length > 0;

  return (
    <div className="min-h-screen bg-[#111010] flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#111010]/95 backdrop-blur-md border-b border-white/15 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-white font-bold text-sm font-['Playfair_Display']">O Indicador</h1>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                <p className="text-white/70 text-xs">Guia gastronômico com IA · São Paulo</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!quizProfile.data?.quizCompleted && (
              <Link href="/quiz">
                <Button variant="outline" size="sm" className="text-xs border-purple-500/30 text-purple-300 hover:bg-purple-500/10 bg-transparent">
                  <Heart className="w-3 h-3 mr-1" />
                  Meu Perfil
                </Button>
              </Link>
            )}
            {hasMessages && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.location.reload()}
                className="text-white/70 hover:text-white hover:bg-white/10 text-xs"
              >
                <Plus className="w-4 h-4 mr-1" />
                Novo
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Área de mensagens */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-6">
          {!hasMessages ? (
            <WelcomeScreen
              quizCompleted={quizProfile.data?.quizCompleted}
              quizLoading={quizProfile.isLoading}
              onSend={handleSend}
              disabled={isSending || !sessionId}
            />
          ) : (
            <div className="space-y-6">
              {messages.map((msg, i) => (
                <ChatMessage key={i} message={msg} />
              ))}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="sticky bottom-0 bg-[#111010]/95 backdrop-blur-md border-t border-white/15 px-4 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-3 items-end">
            <div className="flex-1 bg-white/5 border border-white/10 rounded-2xl overflow-hidden focus-within:border-amber-500/40 focus-within:bg-white/8 transition-all">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Pergunte sobre restaurantes, bares, shoppings em SP..."
                rows={1}
                disabled={isSending || !sessionId}
                className="w-full bg-transparent text-white placeholder-white/50 text-sm px-4 py-3 resize-none outline-none min-h-[44px] max-h-32 disabled:opacity-50"
                onInput={(e) => {
                  const t = e.target as HTMLTextAreaElement;
                  t.style.height = "auto";
                  t.style.height = Math.min(t.scrollHeight, 128) + "px";
                }}
              />
            </div>
            <Button
              onClick={() => handleSend()}
              disabled={!input.trim() || isSending || !sessionId}
              className="w-12 h-12 p-0 bg-gradient-to-br from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white rounded-2xl shrink-0 disabled:opacity-40 shadow-lg shadow-amber-500/20 border-0"
            >
              {isSending ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-white/50 text-center mt-2">
            Enter para enviar · Shift+Enter para nova linha
          </p>
        </div>
      </div>
    </div>
  );
}
