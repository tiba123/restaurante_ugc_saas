import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Sparkles,
  Send,
  Plus,
  MapPin,
  Star,
  ExternalLink,
  ChevronRight,
  MessageSquare,
  User,
  Clock,
  ThumbsUp,
  ThumbsDown,
  Utensils,
} from "lucide-react";
import { Streamdown } from "streamdown";

// ─── Tipos ─────────────────────────────────────────────────────────────────────
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
  positiveReviews: string[];
  negativeReviews: string[];
  aiSummary: string;
  highlights: string[];
  mapsUrl: string;
  website?: string;
  phone?: string;
  openNow?: boolean;
  photoUrl?: string;
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
  const symbols = ["", "$", "$$", "$$$", "$$$$"];
  return symbols[level] || "";
}

// ─── Componente de Card de Lugar ───────────────────────────────────────────────
function PlaceCard({ place }: { place: PlaceInfo }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:border-[#c9a84c]/30 transition-all duration-200 group">
      {/* Header com foto ou gradiente */}
      <div className="relative h-28 bg-gradient-to-br from-[#c9a84c]/20 to-[#8b4513]/20 flex items-center justify-center overflow-hidden">
        {place.photoUrl ? (
          <img
            src={place.photoUrl}
            alt={place.name}
            className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity"
          />
        ) : (
          <Utensils className="w-10 h-10 text-[#c9a84c]/40" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

        {/* Open Now badge */}
        {place.openNow !== undefined && (
          <div className={`absolute top-2 right-2 text-xs px-2 py-0.5 rounded-full font-medium ${
            place.openNow ? "bg-green-500/80 text-white" : "bg-red-500/80 text-white"
          }`}>
            {place.openNow ? "Aberto" : "Fechado"}
          </div>
        )}

        {/* Category badge */}
        <div className="absolute bottom-2 left-2 text-xs bg-black/60 text-white/80 px-2 py-0.5 rounded-full">
          {place.category}
        </div>
      </div>

      {/* Content */}
      <div className="p-3 space-y-2">
        {/* Name + Rating */}
        <div className="flex items-start justify-between gap-2">
          <h4 className="text-white font-semibold text-sm leading-tight line-clamp-2">{place.name}</h4>
          <div className="flex items-center gap-1 shrink-0">
            <Star className="w-3 h-3 text-[#c9a84c] fill-[#c9a84c]" />
            <span className="text-[#c9a84c] text-xs font-bold">{place.rating.toFixed(1)}</span>
          </div>
        </div>

        {/* Location + Price */}
        <div className="flex items-center gap-2 text-xs text-white/50">
          <MapPin className="w-3 h-3 shrink-0" />
          <span className="truncate">{place.neighborhood}</span>
          {place.priceLevel > 0 && (
            <>
              <span>·</span>
              <span className="text-[#c9a84c]/70">{getPriceLevelSymbol(place.priceLevel)}</span>
            </>
          )}
        </div>

        {/* AI Summary */}
        {place.aiSummary && (
          <p className="text-white/60 text-xs leading-relaxed line-clamp-2">{place.aiSummary}</p>
        )}

        {/* Highlights */}
        {place.highlights.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {place.highlights.slice(0, 3).map((h, i) => (
              <span key={i} className="text-xs bg-[#c9a84c]/10 text-[#c9a84c]/80 px-2 py-0.5 rounded-full flex items-center gap-1">
                <ThumbsUp className="w-2.5 h-2.5" />
                {h}
              </span>
            ))}
          </div>
        )}

        {/* Negative review snippet */}
        {place.negativeReviews.length > 0 && (
          <div className="flex items-start gap-1.5 text-xs text-red-400/60">
            <ThumbsDown className="w-3 h-3 mt-0.5 shrink-0" />
            <span className="line-clamp-1">{place.negativeReviews[0]?.slice(0, 60)}...</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <a
            href={place.mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-1.5 text-xs bg-[#c9a84c]/15 hover:bg-[#c9a84c]/25 text-[#c9a84c] py-1.5 rounded-lg transition-colors"
          >
            <MapPin className="w-3 h-3" />
            Ver no Maps
          </a>
          {place.website && (
            <a
              href={place.website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1 text-xs bg-white/5 hover:bg-white/10 text-white/60 px-3 py-1.5 rounded-lg transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Componente de Mensagem ────────────────────────────────────────────────────
function ChatMessage({ message }: { message: Message }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      {/* Avatar */}
      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1 ${
        isUser ? "bg-[#c9a84c]/20" : "bg-[#8b4513]/30"
      }`}>
        {isUser ? (
          <User className="w-4 h-4 text-[#c9a84c]" />
        ) : (
          <Sparkles className="w-4 h-4 text-[#c9a84c]" />
        )}
      </div>

      {/* Content */}
      <div className={`flex-1 max-w-[85%] space-y-3 ${isUser ? "items-end" : "items-start"} flex flex-col`}>
        {/* Bubble */}
        <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
          isUser
            ? "bg-[#c9a84c] text-black rounded-tr-sm font-medium"
            : "bg-white/8 text-white/90 rounded-tl-sm border border-white/10"
        }`}>
          {message.isLoading ? (
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-[#c9a84c]/60 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-2 h-2 bg-[#c9a84c]/60 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-2 h-2 bg-[#c9a84c]/60 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
              <span className="text-white/40 text-xs">Buscando recomendações...</span>
            </div>
          ) : isUser ? (
            <span>{message.content}</span>
          ) : (
            <div className="prose prose-invert prose-sm max-w-none [&>p]:mb-2 [&>p:last-child]:mb-0 [&>ul]:mb-2 [&>ul>li]:mb-1 [&>strong]:text-[#c9a84c]">
              <Streamdown>{message.content}</Streamdown>
            </div>
          )}
        </div>

        {/* Place Cards */}
        {!message.isLoading && message.recommendedPlaces && message.recommendedPlaces.length > 0 && (
          <div className="w-full">
            <p className="text-xs text-white/40 mb-2 flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {message.recommendedPlaces.length} lugar{message.recommendedPlaces.length > 1 ? "es" : ""} encontrado{message.recommendedPlaces.length > 1 ? "s" : ""}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {message.recommendedPlaces.map((place) => (
                <PlaceCard key={place.placeId} place={place} />
              ))}
            </div>
          </div>
        )}

        {/* Timestamp */}
        {message.createdAt && (
          <div className={`flex items-center gap-1 text-xs text-white/30 ${isUser ? "flex-row-reverse" : ""}`}>
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
  "Onde jantar hoje à noite?",
  "Melhor sushi em São Paulo?",
  "Restaurante romântico no Itaim?",
  "Shopping perto da Vila Madalena?",
  "Melhor hambúrguer artesanal?",
  "Café para trabalhar em Pinheiros?",
  "Posto de gasolina 24h no centro?",
  "Churrascaria premium em SP?",
];

// ─── Componente Principal ──────────────────────────────────────────────────────
export default function Chat() {
  const { user, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [sessionKey] = useState(generateSessionKey);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const utils = trpc.useUtils();
  const quizProfile = trpc.chat.quiz.getProfile.useQuery(undefined, { enabled: !!user });
  const existingSessions = trpc.chat.getSessions.useQuery(undefined, { enabled: !!user });
  const createSession = trpc.chat.createSession.useMutation();
  const sendMessage = trpc.chat.sendMessage.useMutation();

  useEffect(() => {
    if (!authLoading && !user) {
      window.location.href = getLoginUrl();
    }
  }, [user, authLoading]);

  // Criar nova sessão ao montar
  useEffect(() => {
    if (!user) return;
    createSession.mutateAsync({ sessionKey }).then((session) => {
      if (session) setSessionId(session.id);
    });
  }, [user]);

  // Scroll para o final
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = useCallback(async (text?: string) => {
    const messageText = (text || input).trim();
    if (!messageText || !sessionId || isSending) return;

    setInput("");
    setShowSuggestions(false);
    setIsSending(true);

    // Adicionar mensagem do usuário imediatamente
    const userMsg: Message = { role: "user", content: messageText, createdAt: new Date() };
    const loadingMsg: Message = { role: "assistant", content: "", isLoading: true };
    setMessages((prev) => [...prev, userMsg, loadingMsg]);

    try {
      const result = await sendMessage.mutateAsync({ sessionId, message: messageText });

      // Substituir loading pela resposta real
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
    } catch (e) {
      setMessages((prev) => prev.filter((m) => !m.isLoading));
      toast.error("Erro ao enviar mensagem. Tente novamente.");
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  }, [input, sessionId, isSending, sendMessage]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    setShowSuggestions(true);
    setInput("");
    window.location.reload();
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0f0d0b] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#c9a84c] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const quizCompleted = quizProfile.data?.quizCompleted;

  return (
    <div className="min-h-screen bg-[#0f0d0b] flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#0f0d0b]/95 backdrop-blur-sm border-b border-white/10 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-[#c9a84c] to-[#8b4513] rounded-xl flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-white font-semibold text-sm font-['Playfair_Display']">Tastee AI</h1>
              <p className="text-white/40 text-xs">Seu guia gastronômico em SP</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!quizCompleted && (
              <Link href="/quiz">
                <Button variant="outline" size="sm" className="text-xs border-[#c9a84c]/30 text-[#c9a84c] hover:bg-[#c9a84c]/10 bg-transparent">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Configurar Perfil
                </Button>
              </Link>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleNewChat}
              className="text-white/50 hover:text-white hover:bg-white/10 text-xs"
            >
              <Plus className="w-4 h-4 mr-1" />
              Novo Chat
            </Button>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
          {/* Welcome / Empty State */}
          {messages.length === 0 && (
            <div className="text-center space-y-6 py-8">
              <div className="w-20 h-20 bg-gradient-to-br from-[#c9a84c]/20 to-[#8b4513]/20 rounded-2xl flex items-center justify-center mx-auto">
                <Sparkles className="w-10 h-10 text-[#c9a84c]" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-white font-['Playfair_Display']">
                  Olá! Sou o Tastee AI 👋
                </h2>
                <p className="text-white/50 max-w-md mx-auto text-sm leading-relaxed">
                  Seu assistente gastronômico especializado em São Paulo. Posso recomendar restaurantes, bares, shoppings, postos de gasolina e muito mais — com base nas avaliações reais do Google!
                </p>
              </div>

              {/* Quiz CTA */}
              {!quizCompleted && !quizProfile.isLoading && (
                <div className="bg-[#c9a84c]/10 border border-[#c9a84c]/20 rounded-xl p-4 max-w-sm mx-auto">
                  <p className="text-[#c9a84c] text-sm font-medium mb-2">✨ Personalize suas recomendações</p>
                  <p className="text-white/50 text-xs mb-3">Faça o quiz de perfil para receber sugestões ainda mais precisas para o seu gosto!</p>
                  <Link href="/quiz">
                    <Button size="sm" className="bg-[#c9a84c] hover:bg-[#b8973b] text-black text-xs w-full">
                      Fazer Quiz Agora
                      <ChevronRight className="w-3 h-3 ml-1" />
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Messages */}
          {messages.map((msg, i) => (
            <ChatMessage key={i} message={msg} />
          ))}

          {/* Scroll anchor */}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Quick Suggestions */}
      {showSuggestions && messages.length === 0 && (
        <div className="px-4 pb-2">
          <div className="max-w-4xl mx-auto">
            <p className="text-xs text-white/30 mb-2 flex items-center gap-1">
              <MessageSquare className="w-3 h-3" />
              Sugestões de perguntas
            </p>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {QUICK_SUGGESTIONS.map((suggestion, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(suggestion)}
                  disabled={isSending || !sessionId}
                  className="shrink-0 text-xs bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#c9a84c]/30 text-white/60 hover:text-white px-3 py-2 rounded-xl transition-all duration-200 disabled:opacity-40"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="sticky bottom-0 bg-[#0f0d0b]/95 backdrop-blur-sm border-t border-white/10 px-4 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-3 items-end">
            <div className="flex-1 bg-white/5 border border-white/10 rounded-2xl overflow-hidden focus-within:border-[#c9a84c]/40 transition-colors">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Pergunte sobre restaurantes, bares, shoppings em SP..."
                rows={1}
                disabled={isSending || !sessionId}
                className="w-full bg-transparent text-white placeholder-white/30 text-sm px-4 py-3 resize-none outline-none min-h-[44px] max-h-32 disabled:opacity-50"
                style={{ height: "auto" }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = "auto";
                  target.style.height = Math.min(target.scrollHeight, 128) + "px";
                }}
              />
            </div>
            <Button
              onClick={() => handleSend()}
              disabled={!input.trim() || isSending || !sessionId}
              className="w-11 h-11 p-0 bg-[#c9a84c] hover:bg-[#b8973b] text-black rounded-2xl shrink-0 disabled:opacity-40"
            >
              {isSending ? (
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-white/20 text-center mt-2">
            Pressione Enter para enviar · Shift+Enter para nova linha
          </p>
        </div>
      </div>
    </div>
  );
}
