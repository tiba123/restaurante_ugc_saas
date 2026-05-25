import { useState, useCallback } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { VideoCamera } from "@/components/VideoCamera";
import { toast } from "sonner";
import {
  Video, Camera, Upload, CheckCircle2, ArrowLeft,
  MapPin, Star, ChevronDown, Loader2, X, Play, Sparkles
} from "lucide-react";
import { Link, useLocation } from "wouter";

type UploadStep = "choose" | "camera" | "details" | "uploading" | "done";

export default function VideoUpload() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  const [step, setStep] = useState<UploadStep>("choose");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedVideoId, setUploadedVideoId] = useState<number | null>(null);

  // Detalhes do vídeo
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<number | null>(null);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);

  // Busca de restaurantes
  const [restaurantSearch, setRestaurantSearch] = useState("");
  const [showRestaurantList, setShowRestaurantList] = useState(false);

  const { data: restaurantsData } = trpc.restaurants.list.useQuery({
    search: restaurantSearch,
    limit: 10,
  });

  // listRestaurants retorna array direto (sem wrapper .restaurants)
  const restaurants: Array<{ id: number; name: string; cuisine: string | null; neighborhood: string | null }> =
    Array.isArray(restaurantsData) ? restaurantsData : [];
  const selectedRestaurant = restaurants.find((r) => r.id === selectedRestaurantId);

  // Contexto de missão (passado via URL params ou estado global)
  const [missionContext] = useState<{ sessionId?: number; missionId?: number }>(() => {
    try {
      const stored = sessionStorage.getItem("tastee_mission_context");
      return stored ? JSON.parse(stored) : {};
    } catch { return {}; }
  });
  const [missionResult, setMissionResult] = useState<{ pointsEarned: number; totalPoints: number } | null>(null);

  // Upload mutation
  const uploadMutation = trpc.videos.upload.useMutation({
    onSuccess: (data) => {
      setUploadedVideoId(data.videoId);
      if (data.missionCompleted) {
        setMissionResult(data.missionCompleted);
        toast.success(`+${data.missionCompleted.pointsEarned} pontos ganhos! Missão de vídeo concluída!`);
        sessionStorage.removeItem("tastee_mission_context");
      } else {
        toast.success("Vídeo enviado com sucesso! Aguardando aprovação do restaurante.");
      }
      setStep("done");
    },
    onError: (err) => {
      toast.error(err.message || "Erro ao enviar vídeo. Tente novamente.");
      setStep("details");
    },
  });

  // Callback quando câmera entrega o vídeo
  const handleVideoReady = useCallback((file: File, previewUrl: string) => {
    setVideoFile(file);
    setVideoPreviewUrl(previewUrl);
    setStep("details");
  }, []);

  // Enviar vídeo para o servidor
  const handleUpload = useCallback(async () => {
    if (!videoFile || !selectedRestaurantId || !title.trim()) {
      toast.error("Preencha o título e selecione um restaurante.");
      return;
    }

    setStep("uploading");
    setUploadProgress(0);

    try {
      // Converter arquivo para base64 para envio via tRPC
      const arrayBuffer = await videoFile.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      const base64 = btoa(
        uint8Array.reduce((data, byte) => data + String.fromCharCode(byte), "")
      );

      // Simular progresso enquanto processa
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 85) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + Math.random() * 12;
        });
      }, 300);

      await uploadMutation.mutateAsync({
        restaurantId: selectedRestaurantId,
        title: title.trim(),
        description: description.trim(),
        rating: rating > 0 ? rating : undefined,
        videoData: base64,
        videoMimeType: videoFile.type,
        videoFileName: videoFile.name,
        videoSize: videoFile.size,
        // Integração com missões
        sessionId: missionContext.sessionId,
        missionId: missionContext.missionId,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);
    } catch {
      // Erro tratado pelo onError da mutation
    }
  }, [videoFile, selectedRestaurantId, title, description, rating, uploadMutation]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-6">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
          <Video className="w-10 h-10 text-primary" />
        </div>
        <div className="text-center">
          <h2 className="font-display text-2xl font-bold mb-2">Faça login para enviar</h2>
          <p className="text-muted-foreground">Você precisa estar logado para gravar e enviar vídeos.</p>
        </div>
        <a
          href={getLoginUrl()}
          className="px-8 py-3 rounded-2xl bg-primary text-primary-foreground font-bold hover:opacity-90 transition-opacity"
        >
          Entrar na Tastee
        </a>
      </div>
    );
  }

  // ─── Tela de escolha ─────────────────────────────────────────────────────────
  if (step === "choose") {
    return (
      <div className="min-h-screen bg-background">
        <div className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-xl">
          <div className="container flex items-center gap-4 h-16">
            <Link href="/feed">
              <button className="w-9 h-9 rounded-full border border-border flex items-center justify-center hover:bg-muted/50 transition-colors">
                <ArrowLeft className="w-4 h-4" />
              </button>
            </Link>
            <h1 className="font-display text-lg font-bold">Enviar Vídeo</h1>
          </div>
        </div>

        <div className="container py-10 max-w-lg mx-auto">
          <div className="text-center mb-10">
            <div className="w-20 h-20 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center mx-auto mb-4">
              <Video className="w-10 h-10 text-primary" />
            </div>
            <h2 className="font-display text-2xl font-bold mb-2">Compartilhe sua experiência</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Grave um vídeo autêntico da sua visita e ganhe recompensas exclusivas
            </p>
          </div>

          <div className="space-y-4">
            {/* Opção: Câmera */}
            <button
              onClick={() => setStep("camera")}
              className="w-full p-6 rounded-3xl border-2 border-primary/30 bg-primary/5 hover:bg-primary/10 hover:border-primary/50 transition-all text-left group"
            >
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Camera className="w-7 h-7 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-lg">Gravar agora</h3>
                    <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-xs font-bold">Recomendado</span>
                  </div>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Use a câmera do dispositivo para gravar diretamente no app. Máximo 60 segundos.
                  </p>
                  <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Sparkles className="w-3 h-3 text-amber-400" /> +30 pts na missão</span>
                    <span>· Upload automático</span>
                  </div>
                </div>
              </div>
            </button>

            {/* Opção: Arquivo */}
            <label className="w-full p-6 rounded-3xl border-2 border-border hover:border-primary/30 hover:bg-muted/30 transition-all text-left cursor-pointer group block">
              <input
                type="file"
                accept="video/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    if (file.size > 200 * 1024 * 1024) {
                      toast.error("Vídeo muito grande. Máximo 200MB.");
                      return;
                    }
                    const url = URL.createObjectURL(file);
                    handleVideoReady(file, url);
                  }
                }}
              />
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Upload className="w-7 h-7 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-1">Enviar da galeria</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Selecione um vídeo já gravado do seu dispositivo. Máximo 200MB.
                  </p>
                  <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                    <span>MP4, MOV, WEBM</span>
                    <span>· Até 200MB</span>
                  </div>
                </div>
              </div>
            </label>
          </div>
        </div>
      </div>
    );
  }

  // ─── Câmera ──────────────────────────────────────────────────────────────────
  if (step === "camera") {
    return (
      <div className="min-h-screen bg-black">
        <div className="sticky top-0 z-40 bg-black/80 backdrop-blur-xl">
          <div className="container flex items-center gap-4 h-14">
            <button
              onClick={() => setStep("choose")}
              className="w-9 h-9 rounded-full border border-white/20 flex items-center justify-center text-white hover:bg-white/10 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h1 className="font-display text-base font-bold text-white">Gravar Vídeo</h1>
          </div>
        </div>
        <div className="container max-w-lg mx-auto py-4">
          <VideoCamera
            onVideoReady={handleVideoReady}
            onCancel={() => setStep("choose")}
            maxDurationSeconds={60}
          />
        </div>
      </div>
    );
  }

  // ─── Detalhes do vídeo ───────────────────────────────────────────────────────
  if (step === "details") {
    return (
      <div className="min-h-screen bg-background">
        <div className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-xl">
          <div className="container flex items-center gap-4 h-16">
            <button
              onClick={() => setStep("choose")}
              className="w-9 h-9 rounded-full border border-border flex items-center justify-center hover:bg-muted/50 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h1 className="font-display text-lg font-bold">Detalhes do Vídeo</h1>
          </div>
        </div>

        <div className="container max-w-lg mx-auto py-6 space-y-6">
          {/* Preview do vídeo */}
          {videoPreviewUrl && (
            <div className="relative rounded-2xl overflow-hidden bg-black aspect-video">
              <video
                src={videoPreviewUrl}
                className="w-full h-full object-cover"
                controls
                playsInline
              />
              <button
                onClick={() => setStep("choose")}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/80 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Restaurante */}
          <div className="space-y-2">
            <label className="text-sm font-semibold flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              Restaurante <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar restaurante..."
                value={selectedRestaurant ? selectedRestaurant.name : restaurantSearch}
                onChange={(e) => {
                  setRestaurantSearch(e.target.value);
                  setSelectedRestaurantId(null);
                  setShowRestaurantList(true);
                }}
                onFocus={() => setShowRestaurantList(true)}
                className="w-full px-4 py-3 rounded-2xl border border-border bg-muted/30 focus:outline-none focus:border-primary/50 focus:bg-background transition-colors pr-10"
              />
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />

              {showRestaurantList && restaurants.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-2xl shadow-xl z-50 overflow-hidden max-h-60 overflow-y-auto">
                    {restaurants.map((r: { id: number; name: string; cuisine: string | null; neighborhood: string | null }) => (
                    <button
                      key={r.id}
                      onClick={() => {
                        setSelectedRestaurantId(r.id);
                        setRestaurantSearch(r.name);
                        setShowRestaurantList(false);
                      }}
                      className="w-full px-4 py-3 flex items-center gap-3 hover:bg-muted/50 transition-colors text-left"
                    >
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-sm">
                        {r.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{r.name}</p>
                        <p className="text-xs text-muted-foreground">{r.cuisine} · {r.neighborhood}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Título */}
          <div className="space-y-2">
            <label className="text-sm font-semibold">
              Título <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              placeholder="Ex: Melhor hambúrguer de SP!"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
              className="w-full px-4 py-3 rounded-2xl border border-border bg-muted/30 focus:outline-none focus:border-primary/50 focus:bg-background transition-colors"
            />
            <p className="text-xs text-muted-foreground text-right">{title.length}/100</p>
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <label className="text-sm font-semibold">Descrição</label>
            <textarea
              placeholder="Conte mais sobre sua experiência..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
              rows={3}
              className="w-full px-4 py-3 rounded-2xl border border-border bg-muted/30 focus:outline-none focus:border-primary/50 focus:bg-background transition-colors resize-none"
            />
            <p className="text-xs text-muted-foreground text-right">{description.length}/500</p>
          </div>

          {/* Avaliação */}
          <div className="space-y-2">
            <label className="text-sm font-semibold flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-400" />
              Avaliação do restaurante
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="transition-transform hover:scale-110 active:scale-95"
                >
                  <Star
                    className={`w-8 h-8 transition-colors ${
                      star <= (hoverRating || rating)
                        ? "text-amber-400 fill-amber-400"
                        : "text-muted-foreground/30"
                    }`}
                  />
                </button>
              ))}
              {rating > 0 && (
                <span className="ml-2 text-sm text-muted-foreground">
                  {["", "Péssimo", "Ruim", "Regular", "Bom", "Excelente"][rating]}
                </span>
              )}
            </div>
          </div>

          {/* Botão enviar */}
          <button
            onClick={handleUpload}
            disabled={!videoFile || !selectedRestaurantId || !title.trim()}
            className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-bold text-lg hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          >
            <Upload className="w-5 h-5" />
            Enviar Vídeo
          </button>
        </div>
      </div>
    );
  }

  // ─── Upload em andamento ─────────────────────────────────────────────────────
  if (step === "uploading") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-8 p-6">
        <div className="w-24 h-24 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin" />
        </div>

        <div className="text-center">
          <h2 className="font-display text-2xl font-bold mb-2">Enviando vídeo...</h2>
          <p className="text-muted-foreground text-sm">
            {uploadProgress < 50 ? "Processando vídeo..." :
             uploadProgress < 85 ? "Fazendo upload..." :
             "Finalizando..."}
          </p>
        </div>

        <div className="w-full max-w-sm">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">Progresso</span>
            <span className="font-bold text-primary">{Math.round(uploadProgress)}%</span>
          </div>
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>

        <p className="text-xs text-muted-foreground text-center max-w-xs">
          Não feche esta página. Seu vídeo está sendo enviado com segurança.
        </p>
      </div>
    );
  }

  // ─── Sucesso ─────────────────────────────────────────────────────────────────
  if (step === "done") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-8 p-6">
        <div className="w-24 h-24 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center">
          <CheckCircle2 className="w-12 h-12 text-emerald-500" />
        </div>

        <div className="text-center">
          <h2 className="font-display text-2xl font-bold mb-2">Vídeo enviado! 🎉</h2>
          <p className="text-muted-foreground text-sm leading-relaxed max-w-xs">
            Seu vídeo foi enviado com sucesso e está aguardando aprovação do restaurante. Você será notificado quando for publicado.
          </p>
        </div>

        {missionResult ? (
          <div className="w-full max-w-sm p-5 rounded-3xl bg-amber-500/10 border border-amber-500/20">
            <div className="flex items-center gap-3 mb-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <span className="font-bold text-amber-400">+{missionResult.pointsEarned} pontos ganhos!</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Missão de vídeo concluída! Total acumulado: <strong>{missionResult.totalPoints} pts</strong>. Continue as outras missões para ganhar mais recompensas!
            </p>
          </div>
        ) : (
          <div className="w-full max-w-sm p-5 rounded-3xl bg-emerald-500/10 border border-emerald-500/20">
            <div className="flex items-center gap-3 mb-2">
              <Sparkles className="w-5 h-5 text-emerald-400" />
              <span className="font-bold text-emerald-400">Vídeo em análise</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Seu vídeo será publicado após aprovação do restaurante. Inicie uma missão para ganhar pontos e recompensas!
            </p>
          </div>
        )}

        <div className="flex flex-col gap-3 w-full max-w-sm">
          <Link href="/missions">
            <button className="w-full py-3 rounded-2xl bg-primary text-primary-foreground font-bold hover:opacity-90 transition-opacity">
              Ver Missões e Recompensas
            </button>
          </Link>
          <Link href="/feed">
            <button className="w-full py-3 rounded-2xl border border-border text-muted-foreground font-medium hover:bg-muted/50 transition-colors">
              Voltar ao Feed
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return null;
}
