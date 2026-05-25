import { useState, useRef, useEffect, useCallback } from "react";
import {
  Video, VideoOff, Mic, MicOff, RotateCcw, Square,
  Circle, Upload, CheckCircle2, AlertCircle, X, FlipHorizontal,
  Loader2, Play, Trash2
} from "lucide-react";
import { toast } from "sonner";

interface VideoCameraProps {
  onVideoReady: (file: File, previewUrl: string) => void;
  onCancel: () => void;
  maxDurationSeconds?: number;
  restaurantId?: number;
}

type CameraState = "idle" | "requesting" | "preview" | "recording" | "recorded" | "uploading";

export function VideoCamera({
  onVideoReady,
  onCancel,
  maxDurationSeconds = 60,
}: VideoCameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const previewRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [state, setState] = useState<CameraState>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);

  // Detectar se há múltiplas câmeras disponíveis
  useEffect(() => {
    navigator.mediaDevices.enumerateDevices().then((devices) => {
      const videoDevices = devices.filter((d) => d.kind === "videoinput");
      setHasMultipleCameras(videoDevices.length > 1);
    }).catch(() => {});
  }, []);

  // Iniciar câmera
  const startCamera = useCallback(async () => {
    setState("requesting");
    setError(null);

    try {
      // Parar stream anterior se existir
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: audioEnabled,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      setState("preview");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao acessar câmera";
      if (msg.includes("NotAllowedError") || msg.includes("Permission denied")) {
        setError("Permissão de câmera negada. Permita o acesso à câmera nas configurações do navegador.");
      } else if (msg.includes("NotFoundError")) {
        setError("Nenhuma câmera encontrada neste dispositivo.");
      } else {
        setError("Não foi possível acessar a câmera. Tente novamente.");
      }
      setState("idle");
    }
  }, [facingMode, audioEnabled]);

  // Parar câmera ao desmontar
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (timerRef.current) clearInterval(timerRef.current);
      if (recordedUrl) URL.revokeObjectURL(recordedUrl);
    };
  }, [recordedUrl]);

  // Iniciar gravação
  const startRecording = useCallback(() => {
    if (!streamRef.current) return;

    chunksRef.current = [];
    setElapsed(0);

    // Escolher o melhor formato suportado
    const mimeType = [
      "video/webm;codecs=vp9,opus",
      "video/webm;codecs=vp8,opus",
      "video/webm",
      "video/mp4",
    ].find((type) => MediaRecorder.isTypeSupported(type)) ?? "";

    const recorder = new MediaRecorder(streamRef.current, {
      mimeType: mimeType || undefined,
      videoBitsPerSecond: 2_500_000,
    });

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, {
        type: mimeType || "video/webm",
      });
      const url = URL.createObjectURL(blob);
      setRecordedBlob(blob);
      setRecordedUrl(url);
      setState("recorded");

      // Parar stream da câmera
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };

    mediaRecorderRef.current = recorder;
    recorder.start(100); // chunk a cada 100ms
    setState("recording");

    // Timer
    timerRef.current = setInterval(() => {
      setElapsed((prev) => {
        const next = prev + 1;
        if (next >= maxDurationSeconds) {
          stopRecording();
        }
        return next;
      });
    }, 1000);
  }, [maxDurationSeconds]);

  // Parar gravação
  const stopRecording = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
  }, []);

  // Flipar câmera
  const flipCamera = useCallback(async () => {
    const newFacing = facingMode === "user" ? "environment" : "user";
    setFacingMode(newFacing);

    if (state === "preview" && streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: newFacing, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: audioEnabled,
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      } catch {
        toast.error("Não foi possível trocar de câmera.");
      }
    }
  }, [facingMode, state, audioEnabled]);

  // Confirmar vídeo gravado
  const confirmVideo = useCallback(() => {
    if (!recordedBlob || !recordedUrl) return;
    const ext = recordedBlob.type.includes("mp4") ? "mp4" : "webm";
    const file = new File([recordedBlob], `video_${Date.now()}.${ext}`, {
      type: recordedBlob.type,
    });
    onVideoReady(file, recordedUrl);
  }, [recordedBlob, recordedUrl, onVideoReady]);

  // Regravar
  const retake = useCallback(() => {
    if (recordedUrl) URL.revokeObjectURL(recordedUrl);
    setRecordedBlob(null);
    setRecordedUrl(null);
    setElapsed(0);
    startCamera();
  }, [recordedUrl, startCamera]);

  // Formatar tempo
  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const progressPercent = (elapsed / maxDurationSeconds) * 100;

  // ─── Tela inicial ────────────────────────────────────────────────────────────
  if (state === "idle") {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-12 px-6">
        {error && (
          <div className="w-full max-w-sm flex items-start gap-3 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400">
            <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
            <p className="text-sm leading-relaxed">{error}</p>
          </div>
        )}

        <div className="w-24 h-24 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center">
          <Video className="w-10 h-10 text-primary" />
        </div>

        <div className="text-center">
          <h3 className="font-display text-xl font-bold mb-1">Grave seu vídeo</h3>
          <p className="text-muted-foreground text-sm">
            Máximo de {maxDurationSeconds}s · Câmera e microfone necessários
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setAudioEnabled((v) => !v)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-colors ${
              audioEnabled
                ? "bg-primary/10 border-primary/30 text-primary"
                : "bg-muted/50 border-border text-muted-foreground"
            }`}
          >
            {audioEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
            {audioEnabled ? "Áudio ativo" : "Sem áudio"}
          </button>
        </div>

        <div className="flex gap-3 w-full max-w-sm">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-2xl border border-border text-muted-foreground font-medium hover:bg-muted/50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={startCamera}
            className="flex-1 py-3 rounded-2xl bg-primary text-primary-foreground font-bold hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <Video className="w-4 h-4" />
            Abrir câmera
          </button>
        </div>

        {/* Fallback: selecionar arquivo */}
        <div className="text-center">
          <p className="text-xs text-muted-foreground mb-2">Ou selecione um vídeo do dispositivo</p>
          <label className="cursor-pointer text-sm text-primary underline underline-offset-2 hover:opacity-80">
            Escolher arquivo
            <input
              type="file"
              accept="video/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const url = URL.createObjectURL(file);
                  onVideoReady(file, url);
                }
              }}
            />
          </label>
        </div>
      </div>
    );
  }

  // ─── Solicitando permissão ───────────────────────────────────────────────────
  if (state === "requesting") {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-muted-foreground text-sm">Solicitando acesso à câmera...</p>
      </div>
    );
  }

  // ─── Vídeo gravado — preview para confirmar ──────────────────────────────────
  if (state === "recorded" && recordedUrl) {
    return (
      <div className="flex flex-col gap-4">
        <div className="relative rounded-2xl overflow-hidden bg-black aspect-[9/16] max-h-[60vh]">
          <video
            ref={previewRef}
            src={recordedUrl}
            className="w-full h-full object-cover"
            controls
            playsInline
          />
          <div className="absolute top-3 left-3 flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 backdrop-blur-sm text-white text-xs font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            {formatTime(elapsed)} gravados
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={retake}
            className="flex-1 py-3 rounded-2xl border border-border text-muted-foreground font-medium hover:bg-muted/50 transition-colors flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Regravar
          </button>
          <button
            onClick={confirmVideo}
            className="flex-1 py-3 rounded-2xl bg-primary text-primary-foreground font-bold hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <Upload className="w-4 h-4" />
            Usar este vídeo
          </button>
        </div>

        <button
          onClick={onCancel}
          className="w-full py-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-1.5"
        >
          <X className="w-4 h-4" />
          Cancelar
        </button>
      </div>
    );
  }

  // ─── Preview da câmera + gravação ────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-4">
      {/* Viewfinder */}
      <div className="relative rounded-2xl overflow-hidden bg-black aspect-[9/16] max-h-[60vh]">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          autoPlay
          playsInline
          muted
          style={{ transform: facingMode === "user" ? "scaleX(-1)" : "none" }}
        />

        {/* Barra de progresso de gravação */}
        {state === "recording" && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-white/20">
            <div
              className="h-full bg-red-500 transition-all duration-1000"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        )}

        {/* Timer */}
        {state === "recording" && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/70 backdrop-blur-sm">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-white font-mono text-sm font-bold">{formatTime(elapsed)}</span>
            <span className="text-white/50 font-mono text-xs">/ {formatTime(maxDurationSeconds)}</span>
          </div>
        )}

        {/* Controles flutuantes */}
        <div className="absolute top-4 right-4 flex flex-col gap-2">
          {hasMultipleCameras && state !== "recording" && (
            <button
              onClick={flipCamera}
              className="w-10 h-10 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/80 transition-colors"
            >
              <FlipHorizontal className="w-5 h-5" />
            </button>
          )}
          {state !== "recording" && (
            <button
              onClick={() => {
                setAudioEnabled((v) => !v);
                // Atualizar stream
                if (streamRef.current) {
                  streamRef.current.getAudioTracks().forEach((t) => {
                    t.enabled = !audioEnabled;
                  });
                }
              }}
              className={`w-10 h-10 rounded-full backdrop-blur-sm flex items-center justify-center transition-colors ${
                audioEnabled ? "bg-black/60 text-white hover:bg-black/80" : "bg-red-500/80 text-white"
              }`}
            >
              {audioEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
            </button>
          )}
        </div>

        {/* Botão cancelar flutuante */}
        {state !== "recording" && (
          <button
            onClick={() => {
              if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
              onCancel();
            }}
            className="absolute top-4 left-4 w-10 h-10 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Controles principais */}
      <div className="flex items-center justify-center gap-6 py-2">
        {state === "preview" && (
          <>
            <button
              onClick={onCancel}
              className="w-12 h-12 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:bg-muted/50 transition-colors"
            >
              <Trash2 className="w-5 h-5" />
            </button>

            {/* Botão gravar */}
            <button
              onClick={startRecording}
              className="w-20 h-20 rounded-full bg-red-500 border-4 border-white/30 flex items-center justify-center hover:bg-red-600 active:scale-95 transition-all shadow-lg shadow-red-500/40"
            >
              <Circle className="w-8 h-8 text-white fill-white" />
            </button>

            <div className="w-12 h-12" />
          </>
        )}

        {state === "recording" && (
          <button
            onClick={stopRecording}
            className="w-20 h-20 rounded-full bg-red-500 border-4 border-white/30 flex items-center justify-center hover:bg-red-600 active:scale-95 transition-all shadow-lg shadow-red-500/40 animate-pulse"
          >
            <Square className="w-8 h-8 text-white fill-white" />
          </button>
        )}
      </div>

      {state === "preview" && (
        <p className="text-center text-xs text-muted-foreground">
          Pressione o botão vermelho para iniciar a gravação · Máx. {maxDurationSeconds}s
        </p>
      )}
    </div>
  );
}
