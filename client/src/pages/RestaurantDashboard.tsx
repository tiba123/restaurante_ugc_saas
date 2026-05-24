import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import {
  LayoutDashboard, Video, CheckCircle, XCircle, Eye, Heart,
  MessageSquare, Star, TrendingUp, Clock, Users, BarChart2,
  Settings, Play, Check, X, ChevronRight, AlertCircle,
  Building2, Camera, Upload
} from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { toast } from "sonner";

type Tab = "overview" | "pending" | "videos" | "settings";

function MetricCard({ icon: Icon, label, value, sub, color = "text-primary" }: {
  icon: React.ElementType; label: string; value: string | number; sub?: string; color?: string;
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        <div className={`w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center ${color}`}>
          <Icon className="w-4.5 h-4.5" />
        </div>
      </div>
      <div className="font-display text-2xl font-bold text-foreground">{value}</div>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </div>
  );
}

function VideoApprovalCard({ video, onApprove, onReject, isPending }: {
  video: any; onApprove: () => void; onReject: (reason?: string) => void; isPending: boolean;
}) {
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [reason, setReason] = useState("");

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="flex gap-4 p-4">
        <div className="w-24 h-32 bg-muted rounded-lg overflow-hidden shrink-0 relative">
          {video.thumbnailUrl ? (
            <img src={video.thumbnailUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10">
              <Play className="w-8 h-8 text-primary/30" />
            </div>
          )}
          <div className="absolute inset-0 flex items-center justify-center">
            <a href={video.videoUrl} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-black/50 flex items-center justify-center">
              <Play className="w-5 h-5 text-white fill-white ml-0.5" />
            </a>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div>
              <h3 className="font-medium text-foreground text-sm">{video.title || "Sem título"}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">por {video.user?.name || "Usuário"}</p>
            </div>
            <span className="shrink-0 text-xs px-2 py-0.5 bg-yellow-50 text-yellow-700 rounded-full font-medium flex items-center gap-1">
              <Clock className="w-3 h-3" /> Pendente
            </span>
          </div>
          {video.rating && (
            <div className="flex gap-0.5 mb-2">
              {[1,2,3,4,5].map((s) => (
                <Star key={s} className={`w-3.5 h-3.5 ${s <= video.rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`} />
              ))}
            </div>
          )}
          {video.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{video.description}</p>
          )}
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
            <Clock className="w-3 h-3" />
            {new Date(video.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
          </div>
          {!showRejectForm ? (
            <div className="flex gap-2">
              <button
                onClick={onApprove}
                disabled={isPending}
                className="flex-1 py-2 bg-green-500 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-green-600 transition-colors disabled:opacity-50"
              >
                <Check className="w-3.5 h-3.5" /> Aprovar
              </button>
              <button
                onClick={() => setShowRejectForm(true)}
                disabled={isPending}
                className="flex-1 py-2 bg-red-50 text-red-600 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-red-100 transition-colors disabled:opacity-50 border border-red-200"
              >
                <X className="w-3.5 h-3.5" /> Rejeitar
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Motivo da rejeição (opcional)"
                className="w-full px-3 py-2 bg-muted rounded-lg text-xs outline-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => { onReject(reason); setShowRejectForm(false); }}
                  className="flex-1 py-2 bg-red-500 text-white rounded-lg text-xs font-semibold"
                >
                  Confirmar Rejeição
                </button>
                <button onClick={() => setShowRejectForm(false)} className="px-3 py-2 bg-muted text-muted-foreground rounded-lg text-xs">
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function RestaurantDashboardPage() {
  const { isAuthenticated, user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const utils = trpc.useUtils();

  const { data: restaurant, isLoading: loadingRestaurant } = trpc.restaurantDashboard.myRestaurant.useQuery(
    undefined, { enabled: isAuthenticated }
  );
  const { data: metrics } = trpc.restaurantDashboard.metrics.useQuery(
    undefined, { enabled: isAuthenticated && !!restaurant }
  );
  const { data: pendingVideos = [] } = trpc.restaurantDashboard.pendingVideos.useQuery(
    undefined, { enabled: isAuthenticated && !!restaurant }
  );
  const { data: allVideos = [] } = trpc.restaurantDashboard.allVideos.useQuery(
    undefined, { enabled: isAuthenticated && !!restaurant && activeTab === "videos" }
  );

  const approveMutation = trpc.restaurantDashboard.approveVideo.useMutation({
    onSuccess: () => {
      toast.success("Vídeo aprovado e publicado!");
      utils.restaurantDashboard.pendingVideos.invalidate();
      utils.restaurantDashboard.metrics.invalidate();
    },
    onError: () => toast.error("Erro ao aprovar vídeo."),
  });

  const rejectMutation = trpc.restaurantDashboard.rejectVideo.useMutation({
    onSuccess: () => {
      toast.success("Vídeo rejeitado.");
      utils.restaurantDashboard.pendingVideos.invalidate();
    },
    onError: () => toast.error("Erro ao rejeitar vídeo."),
  });

  // Profile update
  const [editMode, setEditMode] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: "", description: "", cuisine: "", address: "", neighborhood: "", phone: "", website: "", instagramHandle: "", priceRange: "$$",
  });
  const updateProfile = trpc.restaurantDashboard.updateProfile.useMutation({
    onSuccess: () => { toast.success("Perfil atualizado!"); setEditMode(false); utils.restaurantDashboard.myRestaurant.invalidate(); },
    onError: () => toast.error("Erro ao atualizar perfil."),
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-sm px-6">
          <Building2 className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <h2 className="font-display text-2xl font-bold text-foreground mb-3">Acesso ao Dashboard</h2>
          <p className="text-muted-foreground mb-6">Entre com sua conta de restaurante para acessar o painel.</p>
          <a href={getLoginUrl()} className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium">Entrar</a>
        </div>
      </div>
    );
  }

  if (loadingRestaurant) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-sm px-6">
          <Building2 className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <h2 className="font-display text-2xl font-bold text-foreground mb-3">Restaurante não cadastrado</h2>
          <p className="text-muted-foreground mb-6">Cadastre seu restaurante para começar a receber avaliações em vídeo.</p>
          <Link href="/restaurant/register">
            <button className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium">Cadastrar Restaurante</button>
          </Link>
        </div>
      </div>
    );
  }

  const tabs = [
    { key: "overview", label: "Visão Geral", icon: LayoutDashboard },
    { key: "pending", label: "Aprovações", icon: Clock, badge: pendingVideos.length },
    { key: "videos", label: "Vídeos", icon: Video },
    { key: "settings", label: "Configurações", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar layout */}
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 shrink-0 bg-card border-r border-border flex flex-col hidden md:flex">
          <div className="p-5 border-b border-border">
            <Link href="/">
              <span className="font-display text-xl font-bold text-gradient cursor-pointer">Tastee</span>
            </Link>
            <p className="text-xs text-muted-foreground mt-0.5">Dashboard do Restaurante</p>
          </div>
          <div className="p-3 border-b border-border">
            <div className="flex items-center gap-3 p-2">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                {restaurant.name.charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="font-medium text-foreground text-sm truncate">{restaurant.name}</p>
                <p className="text-xs text-muted-foreground truncate">{restaurant.neighborhood || restaurant.city}</p>
              </div>
            </div>
          </div>
          <nav className="flex-1 p-3 space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as Tab)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === tab.key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}
              >
                <tab.icon className="w-4 h-4 shrink-0" />
                {tab.label}
                {tab.badge ? (
                  <span className={`ml-auto text-xs px-1.5 py-0.5 rounded-full font-bold ${activeTab === tab.key ? "bg-white/20 text-white" : "bg-red-500 text-white"}`}>
                    {tab.badge}
                  </span>
                ) : null}
              </button>
            ))}
          </nav>
          <div className="p-3 border-t border-border">
            <Link href={`/restaurant/${restaurant.slug}`}>
              <button className="w-full flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-all">
                <Eye className="w-3.5 h-3.5" /> Ver Perfil Público
              </button>
            </Link>
          </div>
        </aside>

        {/* Mobile tab bar */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-card border-t border-border flex">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as Tab)}
              className={`flex-1 flex flex-col items-center gap-1 py-2.5 text-xs font-medium transition-colors relative ${activeTab === tab.key ? "text-primary" : "text-muted-foreground"}`}
            >
              <tab.icon className="w-5 h-5" />
              {tab.label}
              {tab.badge ? (
                <span className="absolute top-1 right-1/4 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                  {tab.badge}
                </span>
              ) : null}
            </button>
          ))}
        </div>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
          <div className="p-6 max-w-4xl mx-auto">
            {/* Overview */}
            {activeTab === "overview" && metrics && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <h1 className="font-display text-2xl font-bold text-foreground">Visão Geral</h1>
                  <p className="text-muted-foreground text-sm mt-1">Métricas do seu restaurante</p>
                </div>

                {pendingVideos.length > 0 && (
                  <div className="flex items-center gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                    <AlertCircle className="w-5 h-5 text-yellow-600 shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-yellow-800">
                        {pendingVideos.length} vídeo{pendingVideos.length > 1 ? "s" : ""} aguardando aprovação
                      </p>
                      <p className="text-xs text-yellow-700">Revise e aprove para publicar no feed.</p>
                    </div>
                    <button onClick={() => setActiveTab("pending")} className="text-xs font-medium text-yellow-700 flex items-center gap-1">
                      Ver <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <MetricCard icon={Video} label="Total de Vídeos" value={metrics.totalVideos} sub={`${metrics.approvedVideos} aprovados`} />
                  <MetricCard icon={Eye} label="Visualizações" value={metrics.totalViews.toLocaleString()} sub="Total acumulado" />
                  <MetricCard icon={Heart} label="Curtidas" value={metrics.totalLikes} sub="Em vídeos aprovados" />
                  <MetricCard icon={Star} label="Avaliação Média" value={Number(metrics.averageRating).toFixed(1)} sub={`${metrics.totalReviews} avaliações`} />
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div className="bg-card border border-border rounded-xl p-5">
                    <h3 className="font-semibold text-foreground text-sm mb-3">Status dos Vídeos</h3>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2 text-green-600"><CheckCircle className="w-4 h-4" />Aprovados</span>
                        <span className="font-semibold text-foreground">{metrics.approvedVideos}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2 text-yellow-600"><Clock className="w-4 h-4" />Pendentes</span>
                        <span className="font-semibold text-foreground">{metrics.pendingVideos}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2 text-red-500"><XCircle className="w-4 h-4" />Rejeitados</span>
                        <span className="font-semibold text-foreground">{metrics.rejectedVideos}</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-card border border-border rounded-xl p-5 md:col-span-2">
                    <h3 className="font-semibold text-foreground text-sm mb-3">Engajamento</h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="font-display text-2xl font-bold text-foreground">{metrics.totalViews.toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1"><Eye className="w-3 h-3" />Views</div>
                      </div>
                      <div className="text-center">
                        <div className="font-display text-2xl font-bold text-foreground">{metrics.totalLikes}</div>
                        <div className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1"><Heart className="w-3 h-3" />Curtidas</div>
                      </div>
                      <div className="text-center">
                        <div className="font-display text-2xl font-bold text-foreground">{metrics.totalComments}</div>
                        <div className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1"><MessageSquare className="w-3 h-3" />Comentários</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Pending approvals */}
            {activeTab === "pending" && (
              <div className="space-y-4 animate-fade-in">
                <div>
                  <h1 className="font-display text-2xl font-bold text-foreground">Aprovações Pendentes</h1>
                  <p className="text-muted-foreground text-sm mt-1">{pendingVideos.length} vídeo{pendingVideos.length !== 1 ? "s" : ""} aguardando revisão</p>
                </div>
                {pendingVideos.length === 0 ? (
                  <div className="text-center py-20">
                    <CheckCircle className="w-16 h-16 text-green-500/30 mx-auto mb-4" />
                    <h3 className="font-display text-xl font-semibold text-foreground mb-2">Tudo em dia!</h3>
                    <p className="text-muted-foreground">Nenhum vídeo aguardando aprovação no momento.</p>
                  </div>
                ) : (
                  pendingVideos.map((video) => (
                    <VideoApprovalCard
                      key={video.id}
                      video={video}
                      onApprove={() => approveMutation.mutate({ videoId: video.id })}
                      onReject={(reason) => rejectMutation.mutate({ videoId: video.id, reason })}
                      isPending={approveMutation.isPending || rejectMutation.isPending}
                    />
                  ))
                )}
              </div>
            )}

            {/* All videos */}
            {activeTab === "videos" && (
              <div className="space-y-4 animate-fade-in">
                <div>
                  <h1 className="font-display text-2xl font-bold text-foreground">Todos os Vídeos</h1>
                  <p className="text-muted-foreground text-sm mt-1">{allVideos.length} vídeos no total</p>
                </div>
                {allVideos.length === 0 ? (
                  <div className="text-center py-20">
                    <Video className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                    <p className="text-muted-foreground">Nenhum vídeo recebido ainda.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {allVideos.map((video) => {
                      const statusColors: Record<string, string> = {
                        approved: "text-green-600 bg-green-50",
                        pending: "text-yellow-600 bg-yellow-50",
                        rejected: "text-red-600 bg-red-50",
                        processing: "text-blue-600 bg-blue-50",
                      };
                      const statusLabels: Record<string, string> = {
                        approved: "Aprovado", pending: "Pendente", rejected: "Rejeitado", processing: "Processando",
                      };
                      return (
                        <div key={video.id} className="bg-card border border-border rounded-xl p-4 flex gap-4">
                          <div className="w-16 h-24 bg-muted rounded-lg overflow-hidden shrink-0">
                            {video.thumbnailUrl ? (
                              <img src={video.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center"><Play className="w-5 h-5 text-muted-foreground/50" /></div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <h3 className="font-medium text-foreground text-sm line-clamp-1">{video.title || "Sem título"}</h3>
                              <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[video.status] || "text-muted-foreground bg-muted"}`}>
                                {statusLabels[video.status] || video.status}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground mb-2">por {video.user?.name || "Usuário"}</p>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{video.views}</span>
                              <span className="flex items-center gap-1"><Heart className="w-3 h-3" />{video.likes}</span>
                              <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(video.createdAt).toLocaleDateString("pt-BR")}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Settings */}
            {activeTab === "settings" && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <h1 className="font-display text-2xl font-bold text-foreground">Configurações do Restaurante</h1>
                  <p className="text-muted-foreground text-sm mt-1">Gerencie as informações do seu restaurante</p>
                </div>
                <div className="bg-card border border-border rounded-xl p-6">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="font-semibold text-foreground">Informações Gerais</h3>
                    <button
                      onClick={() => {
                        if (!editMode) {
                          setProfileForm({
                            name: restaurant.name || "",
                            description: restaurant.description || "",
                            cuisine: restaurant.cuisine || "",
                            address: restaurant.address || "",
                            neighborhood: restaurant.neighborhood || "",
                            phone: restaurant.phone || "",
                            website: restaurant.website || "",
                            instagramHandle: restaurant.instagramHandle || "",
                            priceRange: restaurant.priceRange || "$$",
                          });
                        }
                        setEditMode(!editMode);
                      }}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${editMode ? "bg-muted text-muted-foreground" : "bg-primary text-primary-foreground"}`}
                    >
                      {editMode ? "Cancelar" : "Editar"}
                    </button>
                  </div>
                  {editMode ? (
                    <div className="space-y-4">
                      {[
                        { key: "name", label: "Nome do Restaurante", placeholder: "Ex: Restaurante do João" },
                        { key: "description", label: "Descrição", placeholder: "Descreva seu restaurante..." },
                        { key: "cuisine", label: "Tipo de Culinária", placeholder: "Ex: Italiana, Brasileira..." },
                        { key: "address", label: "Endereço", placeholder: "Rua, número, bairro" },
                        { key: "neighborhood", label: "Bairro", placeholder: "Ex: Pinheiros" },
                        { key: "phone", label: "Telefone", placeholder: "(11) 99999-9999" },
                        { key: "website", label: "Website", placeholder: "https://..." },
                        { key: "instagramHandle", label: "Instagram", placeholder: "@seurestaurante" },
                      ].map((field) => (
                        <div key={field.key}>
                          <label className="text-sm font-medium text-foreground mb-1.5 block">{field.label}</label>
                          <input
                            value={(profileForm as any)[field.key]}
                            onChange={(e) => setProfileForm((p) => ({ ...p, [field.key]: e.target.value }))}
                            placeholder={field.placeholder}
                            className="w-full px-4 py-2.5 bg-muted rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20"
                          />
                        </div>
                      ))}
                      <button
                        onClick={() => updateProfile.mutate(profileForm as any)}
                        disabled={updateProfile.isPending}
                        className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-semibold text-sm disabled:opacity-50"
                      >
                        {updateProfile.isPending ? "Salvando..." : "Salvar Alterações"}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {[
                        { label: "Nome", value: restaurant.name },
                        { label: "Descrição", value: restaurant.description },
                        { label: "Culinária", value: restaurant.cuisine },
                        { label: "Endereço", value: restaurant.address },
                        { label: "Bairro", value: restaurant.neighborhood },
                        { label: "Telefone", value: restaurant.phone },
                        { label: "Website", value: restaurant.website },
                        { label: "Instagram", value: restaurant.instagramHandle ? `@${restaurant.instagramHandle}` : null },
                      ].filter((f) => f.value).map((field) => (
                        <div key={field.label} className="flex items-start gap-4 py-2 border-b border-border last:border-0">
                          <span className="text-sm text-muted-foreground w-28 shrink-0">{field.label}</span>
                          <span className="text-sm text-foreground">{field.value}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
