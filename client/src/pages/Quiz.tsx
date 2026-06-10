import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Sparkles, CheckCircle2 } from "lucide-react";

// ─── Tipos ─────────────────────────────────────────────────────────────────────
interface QuizOption {
  value: string;
  label: string;
  emoji: string;
  color: string;
}

interface QuizQuestion {
  id: string;
  title: string;
  subtitle: string;
  type: "single" | "multi";
  options: QuizOption[];
  field: string;
}

// ─── Perguntas do Quiz ─────────────────────────────────────────────────────────
const QUESTIONS: QuizQuestion[] = [
  {
    id: "cuisine",
    title: "Qual é a sua culinária favorita?",
    subtitle: "Selecione quantas quiser — vamos personalizar suas recomendações!",
    type: "multi",
    field: "cuisinePrefs",
    options: [
      { value: "brasileira", label: "Brasileira", emoji: "🇧🇷", color: "bg-green-500/20 border-green-500/40 hover:bg-green-500/30" },
      { value: "italiana", label: "Italiana", emoji: "🍝", color: "bg-red-500/20 border-red-500/40 hover:bg-red-500/30" },
      { value: "japonesa", label: "Japonesa", emoji: "🍣", color: "bg-pink-500/20 border-pink-500/40 hover:bg-pink-500/30" },
      { value: "mexicana", label: "Mexicana", emoji: "🌮", color: "bg-orange-500/20 border-orange-500/40 hover:bg-orange-500/30" },
      { value: "americana", label: "Americana", emoji: "🍔", color: "bg-yellow-500/20 border-yellow-500/40 hover:bg-yellow-500/30" },
      { value: "francesa", label: "Francesa", emoji: "🥐", color: "bg-blue-500/20 border-blue-500/40 hover:bg-blue-500/30" },
      { value: "arabe", label: "Árabe", emoji: "🧆", color: "bg-amber-500/20 border-amber-500/40 hover:bg-amber-500/30" },
      { value: "vegana", label: "Vegana/Vegetariana", emoji: "🥗", color: "bg-emerald-500/20 border-emerald-500/40 hover:bg-emerald-500/30" },
      { value: "frutos_do_mar", label: "Frutos do Mar", emoji: "🦞", color: "bg-cyan-500/20 border-cyan-500/40 hover:bg-cyan-500/30" },
      { value: "churrasco", label: "Churrasco", emoji: "🥩", color: "bg-rose-500/20 border-rose-500/40 hover:bg-rose-500/30" },
      { value: "pizza", label: "Pizza", emoji: "🍕", color: "bg-orange-400/20 border-orange-400/40 hover:bg-orange-400/30" },
      { value: "qualquer", label: "Qualquer uma!", emoji: "🌍", color: "bg-purple-500/20 border-purple-500/40 hover:bg-purple-500/30" },
    ],
  },
  {
    id: "budget",
    title: "Qual é o seu orçamento por pessoa?",
    subtitle: "Isso nos ajuda a recomendar lugares dentro do seu perfil.",
    type: "single",
    field: "budgetRange",
    options: [
      { value: "economico", label: "Econômico", emoji: "💰", color: "bg-green-500/20 border-green-500/40 hover:bg-green-500/30" },
      { value: "moderado", label: "Moderado", emoji: "💳", color: "bg-blue-500/20 border-blue-500/40 hover:bg-blue-500/30" },
      { value: "premium", label: "Premium", emoji: "✨", color: "bg-purple-500/20 border-purple-500/40 hover:bg-purple-500/30" },
      { value: "luxo", label: "Luxo", emoji: "💎", color: "bg-amber-500/20 border-amber-500/40 hover:bg-amber-500/30" },
    ],
  },
  {
    id: "ambience",
    title: "Que tipo de ambiente você prefere?",
    subtitle: "Selecione todos que combinam com você.",
    type: "multi",
    field: "ambience",
    options: [
      { value: "romantico", label: "Romântico", emoji: "🕯️", color: "bg-rose-500/20 border-rose-500/40 hover:bg-rose-500/30" },
      { value: "descontraido", label: "Descontraído", emoji: "😎", color: "bg-yellow-500/20 border-yellow-500/40 hover:bg-yellow-500/30" },
      { value: "familiar", label: "Familiar", emoji: "👨‍👩‍👧", color: "bg-green-500/20 border-green-500/40 hover:bg-green-500/30" },
      { value: "sofisticado", label: "Sofisticado", emoji: "🎩", color: "bg-slate-500/20 border-slate-500/40 hover:bg-slate-500/30" },
      { value: "ao_ar_livre", label: "Ao Ar Livre", emoji: "🌿", color: "bg-emerald-500/20 border-emerald-500/40 hover:bg-emerald-500/30" },
      { value: "bar_balada", label: "Bar / Balada", emoji: "🍻", color: "bg-purple-500/20 border-purple-500/40 hover:bg-purple-500/30" },
      { value: "cafe_trabalho", label: "Café p/ Trabalhar", emoji: "💻", color: "bg-blue-500/20 border-blue-500/40 hover:bg-blue-500/30" },
      { value: "fast_casual", label: "Fast Casual", emoji: "⚡", color: "bg-orange-500/20 border-orange-500/40 hover:bg-orange-500/30" },
    ],
  },
  {
    id: "companion",
    title: "Com quem você costuma sair?",
    subtitle: "Vamos adaptar as recomendações para o seu grupo.",
    type: "single",
    field: "companionType",
    options: [
      { value: "sozinho", label: "Sozinho(a)", emoji: "🧘", color: "bg-blue-500/20 border-blue-500/40 hover:bg-blue-500/30" },
      { value: "casal", label: "Em Casal", emoji: "💑", color: "bg-rose-500/20 border-rose-500/40 hover:bg-rose-500/30" },
      { value: "amigos", label: "Com Amigos", emoji: "🎉", color: "bg-yellow-500/20 border-yellow-500/40 hover:bg-yellow-500/30" },
      { value: "familia", label: "Com a Família", emoji: "👨‍👩‍👧‍👦", color: "bg-green-500/20 border-green-500/40 hover:bg-green-500/30" },
      { value: "negocios", label: "Negócios", emoji: "💼", color: "bg-slate-500/20 border-slate-500/40 hover:bg-slate-500/30" },
    ],
  },
  {
    id: "neighborhoods",
    title: "Quais bairros de SP você frequenta?",
    subtitle: "Selecione seus bairros favoritos ou onde você costuma estar.",
    type: "multi",
    field: "preferredNeighborhoods",
    options: [
      { value: "Vila Madalena", label: "Vila Madalena", emoji: "🎨", color: "bg-purple-500/20 border-purple-500/40 hover:bg-purple-500/30" },
      { value: "Itaim Bibi", label: "Itaim Bibi", emoji: "🏙️", color: "bg-blue-500/20 border-blue-500/40 hover:bg-blue-500/30" },
      { value: "Pinheiros", label: "Pinheiros", emoji: "🌳", color: "bg-green-500/20 border-green-500/40 hover:bg-green-500/30" },
      { value: "Jardins", label: "Jardins", emoji: "🌸", color: "bg-pink-500/20 border-pink-500/40 hover:bg-pink-500/30" },
      { value: "Moema", label: "Moema", emoji: "☕", color: "bg-amber-500/20 border-amber-500/40 hover:bg-amber-500/30" },
      { value: "Centro", label: "Centro", emoji: "🏛️", color: "bg-slate-500/20 border-slate-500/40 hover:bg-slate-500/30" },
      { value: "Brooklin", label: "Brooklin", emoji: "🏢", color: "bg-cyan-500/20 border-cyan-500/40 hover:bg-cyan-500/30" },
      { value: "Liberdade", label: "Liberdade", emoji: "🏮", color: "bg-red-500/20 border-red-500/40 hover:bg-red-500/30" },
      { value: "Santana", label: "Santana", emoji: "🌆", color: "bg-orange-500/20 border-orange-500/40 hover:bg-orange-500/30" },
      { value: "Santo Andre", label: "Santo André / ABC", emoji: "🏭", color: "bg-gray-500/20 border-gray-500/40 hover:bg-gray-500/30" },
      { value: "qualquer", label: "Qualquer bairro", emoji: "🗺️", color: "bg-emerald-500/20 border-emerald-500/40 hover:bg-emerald-500/30" },
    ],
  },
  {
    id: "interests",
    title: "O que você gosta de fazer além de comer?",
    subtitle: "Vamos recomendar shoppings, passeios e muito mais!",
    type: "multi",
    field: "interests",
    options: [
      { value: "shopping", label: "Shopping", emoji: "🛍️", color: "bg-pink-500/20 border-pink-500/40 hover:bg-pink-500/30" },
      { value: "cultura", label: "Museus e Cultura", emoji: "🎭", color: "bg-purple-500/20 border-purple-500/40 hover:bg-purple-500/30" },
      { value: "natureza", label: "Parques e Natureza", emoji: "🌿", color: "bg-green-500/20 border-green-500/40 hover:bg-green-500/30" },
      { value: "balada", label: "Baladas e Bares", emoji: "🎵", color: "bg-blue-500/20 border-blue-500/40 hover:bg-blue-500/30" },
      { value: "esportes", label: "Esportes", emoji: "⚽", color: "bg-orange-500/20 border-orange-500/40 hover:bg-orange-500/30" },
      { value: "beleza", label: "Salão / Spa", emoji: "💅", color: "bg-rose-500/20 border-rose-500/40 hover:bg-rose-500/30" },
      { value: "cinema", label: "Cinema", emoji: "🎬", color: "bg-slate-500/20 border-slate-500/40 hover:bg-slate-500/30" },
      { value: "gastronomia", label: "Gastronomia", emoji: "👨‍🍳", color: "bg-amber-500/20 border-amber-500/40 hover:bg-amber-500/30" },
    ],
  },
  {
    id: "dietary",
    title: "Você tem alguma restrição alimentar?",
    subtitle: "Vamos garantir que as recomendações sejam adequadas para você.",
    type: "multi",
    field: "dietaryRestrictions",
    options: [
      { value: "nenhuma", label: "Nenhuma", emoji: "✅", color: "bg-green-500/20 border-green-500/40 hover:bg-green-500/30" },
      { value: "vegetariano", label: "Vegetariano", emoji: "🥦", color: "bg-emerald-500/20 border-emerald-500/40 hover:bg-emerald-500/30" },
      { value: "vegano", label: "Vegano", emoji: "🌱", color: "bg-lime-500/20 border-lime-500/40 hover:bg-lime-500/30" },
      { value: "sem_gluten", label: "Sem Glúten", emoji: "🌾", color: "bg-yellow-500/20 border-yellow-500/40 hover:bg-yellow-500/30" },
      { value: "sem_lactose", label: "Sem Lactose", emoji: "🥛", color: "bg-blue-500/20 border-blue-500/40 hover:bg-blue-500/30" },
      { value: "halal", label: "Halal", emoji: "☪️", color: "bg-teal-500/20 border-teal-500/40 hover:bg-teal-500/30" },
      { value: "kosher", label: "Kosher", emoji: "✡️", color: "bg-indigo-500/20 border-indigo-500/40 hover:bg-indigo-500/30" },
      { value: "frutos_do_mar", label: "Sem Frutos do Mar", emoji: "🦐", color: "bg-orange-500/20 border-orange-500/40 hover:bg-orange-500/30" },
    ],
  },
];

// ─── Componente Principal ──────────────────────────────────────────────────────
export default function Quiz() {
  const { user, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [isCompleted, setIsCompleted] = useState(false);
  const [animating, setAnimating] = useState(false);

  const saveQuiz = trpc.chat.quiz.save.useMutation();

  useEffect(() => {
    if (!authLoading && !user) {
      window.location.href = getLoginUrl();
    }
  }, [user, authLoading]);

  const question = QUESTIONS[currentStep];
  const progress = ((currentStep) / QUESTIONS.length) * 100;

  const getCurrentAnswer = (): string[] => {
    const val = answers[question.field];
    if (!val) return [];
    return Array.isArray(val) ? val : [val];
  };

  const handleSelect = (value: string) => {
    const current = getCurrentAnswer();
    if (question.type === "single") {
      setAnswers((prev) => ({ ...prev, [question.field]: value }));
    } else {
      if (current.includes(value)) {
        setAnswers((prev) => ({ ...prev, [question.field]: current.filter((v) => v !== value) }));
      } else {
        setAnswers((prev) => ({ ...prev, [question.field]: [...current, value] }));
      }
    }
  };

  const isSelected = (value: string) => getCurrentAnswer().includes(value);

  const canProceed = () => {
    const current = getCurrentAnswer();
    return current.length > 0;
  };

  const handleNext = () => {
    if (!canProceed()) {
      toast.error("Selecione pelo menos uma opção para continuar.");
      return;
    }
    if (currentStep < QUESTIONS.length - 1) {
      setAnimating(true);
      setTimeout(() => {
        setCurrentStep((s) => s + 1);
        setAnimating(false);
      }, 200);
    } else {
      handleFinish();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setAnimating(true);
      setTimeout(() => {
        setCurrentStep((s) => s - 1);
        setAnimating(false);
      }, 200);
    }
  };

  const handleFinish = async () => {
    try {
      const payload: Record<string, unknown> = { quizCompleted: true };
      for (const q of QUESTIONS) {
        const val = answers[q.field];
        if (val) {
          if (q.type === "multi") {
            payload[q.field] = Array.isArray(val) ? val : [val];
          } else {
            payload[q.field] = Array.isArray(val) ? val[0] : val;
          }
        }
      }
      await saveQuiz.mutateAsync(payload as Parameters<typeof saveQuiz.mutateAsync>[0]);
      setIsCompleted(true);
      setTimeout(() => navigate("/chat"), 2000);
    } catch (e) {
      toast.error("Erro ao salvar seu perfil. Tente novamente.");
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0f0d0b] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#c9a84c] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isCompleted) {
    return (
      <div className="min-h-screen bg-[#0f0d0b] flex items-center justify-center">
        <div className="text-center space-y-6 animate-in fade-in zoom-in duration-500">
          <div className="w-24 h-24 bg-[#c9a84c]/20 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-12 h-12 text-[#c9a84c]" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-white font-['Playfair_Display']">Perfil Criado!</h2>
            <p className="text-white/60 mt-2">Redirecionando para o chat...</p>
          </div>
          <div className="w-8 h-8 border-2 border-[#c9a84c] border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0d0b] flex flex-col">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 border-b border-white/10">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-[#c9a84c]/20 rounded-full flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-[#c9a84c]" />
            </div>
            <span className="text-white/60 text-sm font-medium">Tastee AI · Configuração de Perfil</span>
            <span className="ml-auto text-white/40 text-sm">{currentStep + 1} / {QUESTIONS.length}</span>
          </div>
          <Progress value={progress} className="h-1.5 bg-white/10 [&>div]:bg-[#c9a84c]" />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-6 py-8">
        <div
          className="max-w-2xl w-full space-y-8"
          style={{
            opacity: animating ? 0 : 1,
            transform: animating ? "translateY(10px)" : "translateY(0)",
            transition: "opacity 0.2s ease, transform 0.2s ease",
          }}
        >
          {/* Question */}
          <div className="text-center space-y-3">
            <h1 className="text-2xl md:text-3xl font-bold text-white font-['Playfair_Display'] leading-tight">
              {question.title}
            </h1>
            <p className="text-white/50 text-sm md:text-base">{question.subtitle}</p>
            {question.type === "multi" && (
              <span className="inline-block text-xs text-[#c9a84c]/80 bg-[#c9a84c]/10 px-3 py-1 rounded-full">
                Múltipla escolha
              </span>
            )}
          </div>

          {/* Options Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {question.options.map((option) => {
              const selected = isSelected(option.value);
              return (
                <button
                  key={option.value}
                  onClick={() => handleSelect(option.value)}
                  className={`
                    relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 text-center
                    transition-all duration-200 cursor-pointer
                    ${option.color}
                    ${selected
                      ? "border-[#c9a84c] shadow-lg shadow-[#c9a84c]/20 scale-[1.02]"
                      : "border-white/10"
                    }
                  `}
                >
                  {selected && (
                    <div className="absolute top-2 right-2 w-5 h-5 bg-[#c9a84c] rounded-full flex items-center justify-center">
                      <CheckCircle2 className="w-3 h-3 text-black" />
                    </div>
                  )}
                  <span className="text-2xl">{option.emoji}</span>
                  <span className={`text-sm font-medium leading-tight ${selected ? "text-white" : "text-white/70"}`}>
                    {option.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="px-6 pb-8 pt-4 border-t border-white/10">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
          <Button
            variant="ghost"
            onClick={handleBack}
            disabled={currentStep === 0}
            className="text-white/50 hover:text-white hover:bg-white/10 disabled:opacity-30"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Voltar
          </Button>

          <div className="flex gap-1.5">
            {QUESTIONS.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === currentStep ? "w-6 bg-[#c9a84c]" : i < currentStep ? "w-3 bg-[#c9a84c]/60" : "w-3 bg-white/20"
                }`}
              />
            ))}
          </div>

          <Button
            onClick={handleNext}
            disabled={!canProceed() || saveQuiz.isPending}
            className="bg-[#c9a84c] hover:bg-[#b8973b] text-black font-semibold disabled:opacity-40"
          >
            {currentStep === QUESTIONS.length - 1 ? (
              <>
                <Sparkles className="w-4 h-4 mr-1" />
                {saveQuiz.isPending ? "Salvando..." : "Concluir"}
              </>
            ) : (
              <>
                Próxima
                <ChevronRight className="w-4 h-4 ml-1" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
