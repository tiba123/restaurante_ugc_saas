import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { useState, useEffect } from "react";
import {
  Camera, Video, Star, MessageSquare, CheckCircle2, Lock,
  Trophy, Zap, Gift, ChevronRight, Flame, Crown, Sparkles,
  ArrowLeft, Timer, Target, Award
} from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";

// ─── Tipos ────────────────────────────────────────────────────────────────────
type MissionType = "photo" | "video" | "review" | "questions" | "checkin" | "share";
type MissionStatus = "locked" | "available" | "in_progress" | "completed";

interface MissionDef {
  id: number;
  key: string;
  title: string;
  description: string | null;
  instructions: string | null;
  type: MissionType;
  points: number;
  isOptional: boolean;
  order: number;
  iconEmoji: string | null;
}

interface RewardDef {
  id: number;
  title: string;
  description: string | null;
  type: "free_item" | "discount" | "credits" | "priority";
  pointsRequired: number;
  discountPercent: number | null;
  freeItemDescription: string | null;
  creditsValue: string | null;
  iconEmoji: string | null;
  badgeColor: string | null;
}

// ─── Missões padrão (fallback quando banco está vazio) ────────────────────────
const DEFAULT_MISSIONS: MissionDef[] = [
  {
    id: 1, key: "photo_dish", title: "Fotografe o Prato",
    description: "Tire uma foto de quando o prato chegou na mesa",
    instructions: "Capture o momento em que seu prato é servido. Mostre a apresentação, as cores e o apetite que ele desperta!",
    type: "photo", points: 10, isOptional: false, order: 1, iconEmoji: "📸",
  },
  {
    id: 2, key: "answer_questions", title: "Compartilhe sua Opinião",
    description: "Responda 3 perguntas sobre sua experiência no restaurante",
    instructions: "O que achou do restaurante? Do que você mais gostou? Do que você menos gostou?",
    type: "questions", points: 10, isOptional: false, order: 2, iconEmoji: "💬",
  },
  {
    id: 3, key: "video_tasting", title: "Grave Provando a Comida",
    description: "Grave um vídeo curto provando o prato e dando sua reação",
    instructions: "Mostre sua reação genuína ao provar a comida! Pode ser um vídeo de 15 a 60 segundos. Seja autêntico!",
    type: "video", points: 30, isOptional: false, order: 3, iconEmoji: "🎬",
  },
  {
    id: 4, key: "leave_review", title: "Deixe uma Avaliação",
    description: "Avalie o restaurante com estrelas e um comentário sincero",
    instructions: "Sua avaliação ajuda outros consumidores a descobrirem ótimos restaurantes. Seja honesto e detalhado!",
    type: "review", points: 10, isOptional: false, order: 4, iconEmoji: "⭐",
  },
];

const DEFAULT_REWARDS: RewardDef[] = [
  {
    id: 1, title: "Bebida Grátis", type: "free_item", pointsRequired: 10,
    description: "Você ganhou uma bebida de até R$8 grátis!",
    freeItemDescription: "Bebida de até R$8", discountPercent: null, creditsValue: null,
    iconEmoji: "🥤", badgeColor: "emerald",
  },
  {
    id: 2, title: "10% de Desconto", type: "discount", pointsRequired: 30,
    description: "Você ganhou 10% de desconto em sua refeição!",
    freeItemDescription: null, discountPercent: 10, creditsValue: null,
    iconEmoji: "🏷️", badgeColor: "blue",
  },
  {
    id: 3, title: "50% de Desconto", type: "discount", pointsRequired: 60,
    description: "Você ganhou 50% de desconto em sua refeição!",
    freeItemDescription: null, discountPercent: 50, creditsValue: null,
    iconEmoji: "🎉", badgeColor: "purple",
  },
];

// ─── Ícone por tipo de missão ─────────────────────────────────────────────────
function MissionIcon({ type, size = 24 }: { type: MissionType; size?: number }) {
  const cls = `w-${size === 24 ? 6 : 8} h-${size === 24 ? 6 : 8}`;
  switch (type) {
    case "photo": return <Camera className={cls} />;
    case "video": return <Video className={cls} />;
    case "review": return <Star className={cls} />;
    case "questions": return <MessageSquare className={cls} />;
    case "checkin": return <Target className={cls} />;
    case "share": return <Zap className={cls} />;
    default: return <Trophy className={cls} />;
  }
}

// ─── Cor por tipo de missão ───────────────────────────────────────────────────
function missionColor(type: MissionType) {
  switch (type) {
    case "photo": return { bg: "bg-pink-500/15", border: "border-pink-500/30", text: "text-pink-400", glow: "shadow-pink-500/20" };
    case "video": return { bg: "bg-red-500/15", border: "border-red-500/30", text: "text-red-400", glow: "shadow-red-500/20" };
    case "review": return { bg: "bg-amber-500/15", border: "border-amber-500/30", text: "text-amber-400", glow: "shadow-amber-500/20" };
    case "questions": return { bg: "bg-blue-500/15", border: "border-blue-500/30", text: "text-blue-400", glow: "shadow-blue-500/20" };
    default: return { bg: "bg-purple-500/15", border: "border-purple-500/30", text: "text-purple-400", glow: "shadow-purple-500/20" };
  }
}

// ─── Cor por tier de recompensa ───────────────────────────────────────────────
function rewardTierStyle(badgeColor: string | null) {
  switch (badgeColor) {
    case "emerald": return { gradient: "from-emerald-600 to-teal-600", glow: "shadow-emerald-500/30", ring: "ring-emerald-500/40", text: "text-emerald-300" };
    case "blue": return { gradient: "from-blue-600 to-indigo-600", glow: "shadow-blue-500/30", ring: "ring-blue-500/40", text: "text-blue-300" };
    case "purple": return { gradient: "from-purple-600 to-pink-600", glow: "shadow-purple-500/30", ring: "ring-purple-500/40", text: "text-purple-300" };
    default: return { gradient: "from-amber-600 to-orange-600", glow: "shadow-amber-500/30", ring: "ring-amber-500/40", text: "text-amber-300" };
  }
}

// ─── Componente de Card de Missão ─────────────────────────────────────────────
function MissionCard({
  mission, status, onComplete, sessionId, totalPoints
}: {
  mission: MissionDef;
  status: MissionStatus;
  onComplete: (missionId: number, data?: Record<string, string>) => void;
  sessionId: number | null;
  totalPoints: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const [answers, setAnswers] = useState({ q1: "", q2: "", q3: "" });
  const colors = missionColor(mission.type);
  const isCompleted = status === "completed";
  const isLocked = status === "locked";

  const handleComplete = () => {
    if (mission.type === "questions") {
      if (!answers.q1 || !answers.q2 || !answers.q3) {
        toast.error("Responda todas as perguntas antes de continuar");
        return;
      }
      onComplete(mission.id, { q1: answers.q1, q2: answers.q2, q3: answers.q3 });
    } else {
      onComplete(mission.id);
    }
  };

  return (
    <div
      className={`relative rounded-2xl border transition-all duration-300 overflow-hidden
        ${isCompleted ? "border-emerald-500/40 bg-emerald-500/5" : isLocked ? "border-white/5 bg-white/2 opacity-50" : `${colors.border} ${colors.bg} cursor-pointer hover:shadow-lg ${colors.glow}`}
      `}
      onClick={() => !isLocked && !isCompleted && setExpanded(!expanded)}
    >
      {/* Brilho de fundo decorativo */}
      {!isLocked && !isCompleted && (
        <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-10 ${colors.bg.replace("/15", "")}`} />
      )}

      <div className="relative p-5">
        <div className="flex items-start gap-4">
          {/* Ícone */}
          <div className={`flex-shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center text-2xl
            ${isCompleted ? "bg-emerald-500/20 border border-emerald-500/30" : isLocked ? "bg-white/5 border border-white/10" : `${colors.bg} border ${colors.border}`}
          `}>
            {isCompleted ? "✅" : isLocked ? "🔒" : mission.iconEmoji || "🎯"}
          </div>

          {/* Conteúdo */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h3 className={`font-bold text-base ${isCompleted ? "text-emerald-400" : isLocked ? "text-muted-foreground" : "text-foreground"}`}>
                {mission.title}
              </h3>
              <div className={`flex-shrink-0 flex items-center gap-1 px-3 py-1 rounded-full text-sm font-bold
                ${isCompleted ? "bg-emerald-500/20 text-emerald-400" : isLocked ? "bg-white/5 text-muted-foreground" : `${colors.bg} ${colors.text}`}
              `}>
                <Zap className="w-3.5 h-3.5" />
                +{mission.points} pts
              </div>
            </div>
            <p className={`text-sm mt-1 ${isCompleted ? "text-emerald-400/70" : "text-muted-foreground"}`}>
              {mission.description}
            </p>
          </div>
        </div>

        {/* Status badge */}
        {isCompleted && (
          <div className="mt-3 flex items-center gap-2 text-emerald-400 text-sm font-medium">
            <CheckCircle2 className="w-4 h-4" />
            Missão concluída! +{mission.points} pontos ganhos
          </div>
        )}

        {/* Expandido: instruções e ação */}
        {expanded && !isCompleted && !isLocked && (
          <div className="mt-4 pt-4 border-t border-white/10">
            <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
              {mission.instructions}
            </p>

            {/* Perguntas para o tipo "questions" */}
            {mission.type === "questions" && (
              <div className="space-y-3 mb-4">
                {[
                  { key: "q1" as const, label: "O que achou do restaurante?" },
                  { key: "q2" as const, label: "Do que você mais gostou?" },
                  { key: "q3" as const, label: "Do que você menos gostou?" },
                ].map(({ key, label }) => (
                  <div key={key}>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">{label}</label>
                    <textarea
                      value={answers[key]}
                      onChange={(e) => setAnswers((prev) => ({ ...prev, [key]: e.target.value }))}
                      onClick={(e) => e.stopPropagation()}
                      placeholder="Escreva sua resposta..."
                      rows={2}
                      className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-foreground placeholder:text-muted-foreground/50 resize-none focus:outline-none focus:border-white/30 transition-colors"
                    />
                  </div>
                ))}
              </div>
            )}

            {sessionId ? (
              <button
                onClick={(e) => { e.stopPropagation(); handleComplete(); }}
                className={`w-full py-3 rounded-xl font-bold text-sm text-white bg-gradient-to-r ${colors.text.replace("text-", "from-").replace("-400", "-600")} to-purple-600 hover:opacity-90 transition-opacity flex items-center justify-center gap-2`}
              >
                <CheckCircle2 className="w-4 h-4" />
                Concluir Missão
              </button>
            ) : (
              <p className="text-xs text-center text-muted-foreground">Aceite a missão primeiro para completar esta etapa</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Card de Recompensa ───────────────────────────────────────────────────────
function RewardCard({ reward, currentPoints, unlocked }: { reward: RewardDef; currentPoints: number; unlocked: boolean }) {
  const style = rewardTierStyle(reward.badgeColor);
  const progress = Math.min((currentPoints / reward.pointsRequired) * 100, 100);

  return (
    <div className={`relative rounded-2xl overflow-hidden border transition-all duration-500
      ${unlocked ? `ring-2 ${style.ring} border-transparent shadow-xl ${style.glow}` : "border-white/10"}
    `}>
      {/* Fundo gradiente quando desbloqueado */}
      {unlocked && (
        <div className={`absolute inset-0 bg-gradient-to-br ${style.gradient} opacity-10`} />
      )}

      <div className="relative p-5">
        <div className="flex items-start gap-3 mb-4">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0
            ${unlocked ? `bg-gradient-to-br ${style.gradient} shadow-lg ${style.glow}` : "bg-white/5 border border-white/10"}
          `}>
            {reward.iconEmoji}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              {unlocked && <Sparkles className={`w-4 h-4 ${style.text}`} />}
              <h3 className={`font-bold text-base ${unlocked ? style.text : "text-muted-foreground"}`}>
                {reward.title}
              </h3>
            </div>
            <p className="text-sm text-muted-foreground">{reward.description}</p>
          </div>
          <div className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold
            ${unlocked ? `bg-gradient-to-r ${style.gradient} text-white` : "bg-white/5 text-muted-foreground"}
          `}>
            {reward.pointsRequired} pts
          </div>
        </div>

        {/* Barra de progresso */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{currentPoints} / {reward.pointsRequired} pts</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-2 bg-white/5 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 bg-gradient-to-r ${unlocked ? style.gradient : "from-white/20 to-white/30"}`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {unlocked && (
          <div className={`mt-3 flex items-center gap-2 text-sm font-bold ${style.text}`}>
            <Trophy className="w-4 h-4" />
            Recompensa Desbloqueada! 🎉
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Página Principal ─────────────────────────────────────────────────────────
export default function Missions() {
  const { user, isAuthenticated } = useAuth();
  const [selectedRestaurantId] = useState(1); // Demo: primeiro restaurante
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [totalPoints, setTotalPoints] = useState(0);
  const [completedMissions, setCompletedMissions] = useState<Set<number>>(new Set());
  const [showCelebration, setShowCelebration] = useState(false);
  const [newRewardTitle, setNewRewardTitle] = useState("");
  const [missionAccepted, setMissionAccepted] = useState(false);

  const { data: missionsData } = trpc.missions.list.useQuery();
  const { data: rewardsData } = trpc.missions.rewards.useQuery();
  const { data: activeSession } = trpc.missions.activeSession.useQuery(
    { restaurantId: selectedRestaurantId },
    { enabled: isAuthenticated }
  );

  const acceptMutation = trpc.missions.accept.useMutation({
    onSuccess: (data) => {
      setSessionId(data.sessionId);
      setMissionAccepted(true);
      toast.success("🎯 Missão aceita! Boa sorte!", { duration: 3000 });
    },
    onError: () => toast.error("Erro ao aceitar missão. Tente novamente."),
  });

  const completeMutation = trpc.missions.complete.useMutation({
    onSuccess: (data) => {
      setTotalPoints(data.totalPoints);
      if (data.newlyUnlocked.length > 0) {
        setNewRewardTitle(data.newlyUnlocked[0].title);
        setShowCelebration(true);
        setTimeout(() => setShowCelebration(false), 4000);
      }
      toast.success(`+${data.pointsEarned} pontos! Total: ${data.totalPoints} pts 🔥`);
    },
    onError: () => toast.error("Erro ao completar missão."),
  });

  // Sincronizar sessão ativa
  useEffect(() => {
    if (activeSession) {
      setSessionId(activeSession.session.id);
      setTotalPoints(activeSession.session.totalPoints);
      setMissionAccepted(true);
      const completed = new Set<number>();
      activeSession.progress.forEach(({ progress }) => {
        if (progress.status === "completed") completed.add(progress.missionId);
      });
      setCompletedMissions(completed);
    }
  }, [activeSession]);

  const missions = (missionsData && missionsData.length > 0 ? missionsData : DEFAULT_MISSIONS) as MissionDef[];
  const rewards = (rewardsData && rewardsData.length > 0 ? rewardsData : DEFAULT_REWARDS) as RewardDef[];

  const maxPoints = missions.reduce((sum, m) => sum + m.points, 0);
  const progressPercent = Math.min((totalPoints / maxPoints) * 100, 100);
  const completedCount = completedMissions.size;

  const getMissionStatus = (mission: MissionDef): MissionStatus => {
    if (completedMissions.has(mission.id)) return "completed";
    if (!missionAccepted) return "locked";
    return "available";
  };

  const handleCompleteMission = (missionId: number, data?: Record<string, string>) => {
    if (!sessionId) return;
    setCompletedMissions((prev) => new Set(Array.from(prev).concat(missionId)));
    completeMutation.mutate({ sessionId, missionId, data });
  };

  const handleAcceptMission = () => {
    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
      return;
    }
    acceptMutation.mutate({ restaurantId: selectedRestaurantId });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ─── Header ──────────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-40 border-b border-white/5 bg-background/80 backdrop-blur-xl">
        <div className="container flex items-center justify-between h-16">
          <Link href="/">
            <button className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-5 h-5" />
              <span className="font-display text-xl font-bold text-gradient">Tastee</span>
            </button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20">
              <Flame className="w-4 h-4 text-amber-400" />
              <span className="text-sm font-bold text-amber-400">{totalPoints} pts</span>
            </div>
            {isAuthenticated && (
              <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-xs font-bold text-primary">
                {user?.name?.charAt(0) ?? "U"}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="container py-8 max-w-2xl mx-auto">

        {/* ─── Missão Principal ────────────────────────────────────────────── */}
        <div className="relative rounded-3xl overflow-hidden mb-8 border border-amber-500/20">
          {/* Fundo com gradiente animado */}
          <div className="absolute inset-0 bg-gradient-to-br from-amber-950/80 via-orange-950/60 to-red-950/80" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-500/10 via-transparent to-transparent" />

          <div className="relative p-7">
            {/* Badge de missão */}
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-wider">
                <Crown className="w-3.5 h-3.5" />
                Missão Principal
              </div>
              {missionAccepted && (
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
                  <Zap className="w-3.5 h-3.5" />
                  Ativa
                </div>
              )}
            </div>

            <h1 className="font-display text-3xl font-bold text-white mb-2">
              Experiência Completa
            </h1>
            <p className="text-white/60 text-sm mb-6 leading-relaxed">
              Complete todas as missões durante sua visita e ganhe recompensas exclusivas. Quanto mais você compartilha, mais você ganha!
            </p>

            {/* Barra de progresso principal */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white/70 text-sm font-medium">{completedCount} de {missions.length} missões</span>
                <span className="text-amber-400 font-bold text-lg">{totalPoints} / {maxPoints} pts</span>
              </div>
              <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all duration-1000 relative"
                  style={{ width: `${progressPercent}%` }}
                >
                  {progressPercent > 5 && (
                    <div className="absolute right-0 top-0 bottom-0 w-4 bg-white/30 rounded-full blur-sm" />
                  )}
                </div>
              </div>
              <div className="flex justify-between mt-1.5">
                {rewards.map((r) => (
                  <div key={r.id} className="flex flex-col items-center gap-1">
                    <div
                      className={`w-0.5 h-2 rounded-full transition-colors ${totalPoints >= r.pointsRequired ? "bg-amber-400" : "bg-white/20"}`}
                      style={{ marginLeft: `${(r.pointsRequired / maxPoints) * 100}%` }}
                    />
                    <span className="text-xs text-white/40">{r.pointsRequired}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Botão CTA */}
            {!missionAccepted ? (
              <button
                onClick={handleAcceptMission}
                disabled={acceptMutation.isPending}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-lg hover:opacity-90 active:scale-[0.98] transition-all duration-150 flex items-center justify-center gap-3 shadow-lg shadow-amber-500/30"
              >
                {acceptMutation.isPending ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Target className="w-5 h-5" />
                    Aceitar Missão
                    <ChevronRight className="w-5 h-5" />
                  </>
                )}
              </button>
            ) : completedCount === missions.length ? (
              <div className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-lg flex items-center justify-center gap-3 shadow-lg shadow-emerald-500/30">
                <Trophy className="w-5 h-5" />
                Missão Completa! Parabéns! 🏆
              </div>
            ) : (
              <div className="flex items-center justify-between px-4 py-3 rounded-2xl bg-white/5 border border-white/10">
                <div className="flex items-center gap-2 text-white/60 text-sm">
                  <Timer className="w-4 h-4" />
                  Missão em andamento
                </div>
                <div className="flex items-center gap-1 text-amber-400 text-sm font-bold">
                  <Zap className="w-4 h-4" />
                  {missions.length - completedCount} restantes
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ─── Missões Secundárias ──────────────────────────────────────────── */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-5">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-primary" />
              <h2 className="font-display text-xl font-bold">Missões</h2>
            </div>
            <div className="flex-1 h-px bg-white/5" />
            <span className="text-sm text-muted-foreground">{completedCount}/{missions.length} concluídas</span>
          </div>

          <div className="space-y-3">
            {missions.map((mission) => (
              <MissionCard
                key={mission.id}
                mission={mission}
                status={getMissionStatus(mission)}
                onComplete={handleCompleteMission}
                sessionId={sessionId}
                totalPoints={totalPoints}
              />
            ))}
          </div>
        </div>

        {/* ─── Recompensas ──────────────────────────────────────────────────── */}
        <div>
          <div className="flex items-center gap-3 mb-5">
            <div className="flex items-center gap-2">
              <Gift className="w-5 h-5 text-primary" />
              <h2 className="font-display text-xl font-bold">Recompensas</h2>
            </div>
            <div className="flex-1 h-px bg-white/5" />
            <span className="text-sm text-muted-foreground">
              {rewards.filter((r) => totalPoints >= r.pointsRequired).length}/{rewards.length} desbloqueadas
            </span>
          </div>

          <div className="space-y-3">
            {rewards.map((reward) => (
              <RewardCard
                key={reward.id}
                reward={reward}
                currentPoints={totalPoints}
                unlocked={totalPoints >= reward.pointsRequired}
              />
            ))}
          </div>
        </div>

        {/* ─── Rodapé informativo ───────────────────────────────────────────── */}
        <div className="mt-8 p-5 rounded-2xl bg-white/3 border border-white/5 text-center">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Os pontos são válidos durante sua visita. As recompensas desbloqueadas ficam disponíveis por 30 dias e podem ser usadas em qualquer restaurante parceiro Tastee.
          </p>
        </div>
      </div>

      {/* ─── Celebração de recompensa desbloqueada ────────────────────────── */}
      {showCelebration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div className="bg-gradient-to-br from-amber-500 to-orange-600 text-white rounded-3xl p-8 shadow-2xl shadow-amber-500/40 text-center animate-bounce max-w-xs mx-4">
            <div className="text-5xl mb-3">🎉</div>
            <h3 className="font-display text-2xl font-bold mb-2">Recompensa Desbloqueada!</h3>
            <p className="text-white/80 font-medium">{newRewardTitle}</p>
          </div>
        </div>
      )}
    </div>
  );
}
