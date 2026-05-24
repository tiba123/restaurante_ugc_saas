import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import {
  LayoutDashboard, Video, Building2, Users, Shield,
  Eye, Heart, MessageSquare, Star, CheckCircle, XCircle,
  Clock, TrendingUp, AlertTriangle, Check, X, Search,
  BarChart2, Activity, ChevronRight, Play, Flag
} from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { toast } from "sonner";

type AdminTab = "overview" | "videos" | "restaurants" | "users";

function StatCard({ icon: Icon, label, value, sub, trend }: {
  icon: React.ElementType; label: string; value: string | number; sub?: string; trend?: string;
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className="font-display text-2xl font-bold text-foreground">{value}</div>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      {trend && <p className="text-xs text-green-600 mt-1 font-medium">{trend}</p>}
    </div>
  );
}

export default function AdminDashboardPage() {
  const { isAuthenticated, user } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [videoSearch, setVideoSearch] = useState("");
  const [restaurantSearch, setRestaurantSearch] = useState("");
  const utils = trpc.useUtils();

  const { data: adminData, isLoading } = trpc.admin.overview.useQuery(undefined, { enabled: isAuthenticated });
  const { data: allVideos = [] } = trpc.admin.allVideos.useQuery({ search: videoSearch || undefined }, { enabled: isAuthenticated && activeTab === "videos" });
  const { data: allRestaurants = [] } = trpc.admin.allRestaurants.useQuery({ search: restaurantSearch || undefined }, { enabled: isAuthenticated && activeTab === "restaurants" });
  const { data: allUsers = [] } = trpc.admin.allUsers.useQuery(undefined, { enabled: isAuthenticated && activeTab === "users" });

  const approveVideoMutation = trpc.admin.approveVideo.useMutation({
    onSuccess: () => { toast.success("Vídeo aprovado!"); utils.admin.allVideos.invalidate(); utils.admin.overview.invalidate(); },
  });
  const rejectVideoMutation = trpc.admin.rejectVideo.useMutation({
    onSuccess: () => { toast.success("Vídeo removido."); utils.admin.allVideos.invalidate(); utils.admin.overview.invalidate(); },
  });
  const verifyRestaurantMutation = trpc.admin.verifyRestaurant.useMutation({
    onSuccess: () => { toast.success("Restaurante verificado!"); utils.admin.allRestaurants.invalidate(); },
  });
  const promoteUserMutation = trpc.admin.promoteUser.useMutation({
    onSuccess: () => { toast.success("Usuário promovido a admin!"); utils.admin.allUsers.invalidate(); },
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <h2 className="font-display text-2xl font-bold text-foreground mb-2">Acesso Restrito</h2>
          <p className="text-muted-foreground">Esta área é exclusiva para administradores.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (adminData?.isAdmin === false) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-red-500/30 mx-auto mb-4" />
          <h2 className="font-display text-2xl font-bold text-foreground mb-2">Acesso Negado</h2>
          <p className="text-muted-foreground mb-4">Você não tem permissão para acessar o painel administrativo.</p>
          <Link href="/"><button className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium">Voltar ao Início</button></Link>
        </div>
      </div>
    );
  }

  const tabs = [
    { key: "overview", label: "Visão Geral", icon: LayoutDashboard },
    { key: "videos", label: "Vídeos", icon: Video, badge: adminData?.pendingVideos },
    { key: "restaurants", label: "Restaurantes", icon: Building2 },
    { key: "users", label: "Usuários", icon: Users },
  ];

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
    <div className="min-h-screen bg-background">
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 shrink-0 bg-card border-r border-border flex-col hidden md:flex">
          <div className="p-5 border-b border-border">
            <Link href="/">
              <span className="font-display text-xl font-bold text-gradient cursor-pointer">Tastee</span>
            </Link>
            <div className="flex items-center gap-2 mt-1">
              <Shield className="w-3.5 h-3.5 text-primary" />
              <p className="text-xs text-muted-foreground font-medium">Painel Administrativo</p>
            </div>
          </div>
          <div className="p-3 border-b border-border">
            <div className="flex items-center gap-3 p-2">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                {user?.name?.charAt(0) || "A"}
              </div>
              <div className="min-w-0">
                <p className="font-medium text-foreground text-sm truncate">{user?.name || "Admin"}</p>
                <p className="text-xs text-primary font-medium">Administrador</p>
              </div>
            </div>
          </div>
          <nav className="flex-1 p-3 space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as AdminTab)}
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
          <div className="p-3 border-t border-border space-y-1">
            <Link href="/explore">
              <button className="w-full flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-all">
                <Eye className="w-3.5 h-3.5" /> Ver Plataforma
              </button>
            </Link>
          </div>
        </aside>

        {/* Mobile bottom nav */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-card border-t border-border flex">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as AdminTab)}
              className={`flex-1 flex flex-col items-center gap-1 py-2.5 text-xs font-medium relative ${activeTab === tab.key ? "text-primary" : "text-muted-foreground"}`}
            >
              <tab.icon className="w-5 h-5" />
              {tab.label}
              {tab.badge ? (
                <span className="absolute top-1 right-1/4 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">{tab.badge}</span>
              ) : null}
            </button>
          ))}
        </div>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
          <div className="p-6 max-w-5xl mx-auto">

            {/* Overview */}
            {activeTab === "overview" && adminData && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <h1 className="font-display text-2xl font-bold text-foreground">Visão Geral da Plataforma</h1>
                  <p className="text-muted-foreground text-sm mt-1">Métricas e status em tempo real</p>
                </div>

                {adminData.pendingVideos > 0 && (
                  <div className="flex items-center gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-yellow-800">{adminData.pendingVideos} vídeos aguardando moderação</p>
                      <p className="text-xs text-yellow-700">Revise e modere o conteúdo da plataforma.</p>
                    </div>
                    <button onClick={() => setActiveTab("videos")} className="text-xs font-medium text-yellow-700 flex items-center gap-1">
                      Moderar <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard icon={Video} label="Total de Vídeos" value={adminData.totalVideos} sub={`${adminData.approvedVideos} aprovados`} />
                  <StatCard icon={Building2} label="Restaurantes" value={adminData.totalRestaurants} sub={`${adminData.verifiedRestaurants} verificados`} />
                  <StatCard icon={Users} label="Usuários" value={adminData.totalUsers} sub="Cadastrados" />
                  <StatCard icon={Eye} label="Visualizações" value={(adminData.totalViews || 0).toLocaleString()} sub="Total acumulado" />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-card border border-border rounded-xl p-5">
                    <h3 className="font-semibold text-foreground text-sm mb-4 flex items-center gap-2">
                      <Activity className="w-4 h-4 text-primary" /> Status dos Vídeos
                    </h3>
                    <div className="space-y-3">
                      {[
                        { label: "Aprovados", value: adminData.approvedVideos, color: "bg-green-500", icon: CheckCircle, textColor: "text-green-600" },
                        { label: "Pendentes", value: adminData.pendingVideos, color: "bg-yellow-500", icon: Clock, textColor: "text-yellow-600" },
                        { label: "Rejeitados", value: adminData.rejectedVideos, color: "bg-red-500", icon: XCircle, textColor: "text-red-500" },
                      ].map((item) => (
                        <div key={item.label} className="flex items-center gap-3">
                          <item.icon className={`w-4 h-4 ${item.textColor} shrink-0`} />
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm text-muted-foreground">{item.label}</span>
                              <span className="text-sm font-semibold text-foreground">{item.value}</span>
                            </div>
                            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                              <div
                                className={`h-full ${item.color} rounded-full`}
                                style={{ width: `${adminData.totalVideos > 0 ? (item.value / adminData.totalVideos) * 100 : 0}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-card border border-border rounded-xl p-5">
                    <h3 className="font-semibold text-foreground text-sm mb-4 flex items-center gap-2">
                      <BarChart2 className="w-4 h-4 text-primary" /> Engajamento Total
                    </h3>
                    <div className="space-y-4">
                      {[
                        { icon: Eye, label: "Visualizações", value: (adminData.totalViews || 0).toLocaleString() },
                        { icon: Heart, label: "Curtidas", value: (adminData.totalLikes || 0).toLocaleString() },
                        { icon: MessageSquare, label: "Comentários", value: (adminData.totalComments || 0).toLocaleString() },
                        { icon: Star, label: "Avaliações", value: (adminData.totalReviews || 0).toLocaleString() },
                      ].map((item) => (
                        <div key={item.label} className="flex items-center justify-between">
                          <span className="flex items-center gap-2 text-sm text-muted-foreground">
                            <item.icon className="w-4 h-4 text-primary" /> {item.label}
                          </span>
                          <span className="font-semibold text-foreground">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Videos moderation */}
            {activeTab === "videos" && (
              <div className="space-y-4 animate-fade-in">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="font-display text-2xl font-bold text-foreground">Moderação de Vídeos</h1>
                    <p className="text-muted-foreground text-sm mt-1">{allVideos.length} vídeos encontrados</p>
                  </div>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    value={videoSearch}
                    onChange={(e) => setVideoSearch(e.target.value)}
                    placeholder="Buscar vídeos..."
                    className="w-full pl-10 pr-4 py-2.5 bg-muted rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div className="space-y-3">
                  {allVideos.map((video) => (
                    <div key={video.id} className="bg-card border border-border rounded-xl p-4 flex gap-4">
                      <div className="w-16 h-24 bg-muted rounded-lg overflow-hidden shrink-0 relative">
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
                        <p className="text-xs text-muted-foreground mb-1">
                          por <span className="text-foreground">{video.user?.name || "Usuário"}</span> em <span className="text-foreground">{video.restaurant?.name || "Restaurante"}</span>
                        </p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                          <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{video.views}</span>
                          <span className="flex items-center gap-1"><Heart className="w-3 h-3" />{video.likes}</span>
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(video.createdAt).toLocaleDateString("pt-BR")}</span>
                        </div>
                        {video.status === "pending" && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => approveVideoMutation.mutate({ videoId: video.id })}
                              disabled={approveVideoMutation.isPending}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500 text-white rounded-lg text-xs font-semibold hover:bg-green-600 transition-colors disabled:opacity-50"
                            >
                              <Check className="w-3 h-3" /> Aprovar
                            </button>
                            <button
                              onClick={() => rejectVideoMutation.mutate({ videoId: video.id })}
                              disabled={rejectVideoMutation.isPending}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 border border-red-200 rounded-lg text-xs font-semibold hover:bg-red-100 transition-colors disabled:opacity-50"
                            >
                              <X className="w-3 h-3" /> Rejeitar
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {allVideos.length === 0 && (
                    <div className="text-center py-16">
                      <Video className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                      <p className="text-muted-foreground">Nenhum vídeo encontrado.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Restaurants */}
            {activeTab === "restaurants" && (
              <div className="space-y-4 animate-fade-in">
                <div>
                  <h1 className="font-display text-2xl font-bold text-foreground">Gestão de Restaurantes</h1>
                  <p className="text-muted-foreground text-sm mt-1">{allRestaurants.length} restaurantes cadastrados</p>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    value={restaurantSearch}
                    onChange={(e) => setRestaurantSearch(e.target.value)}
                    placeholder="Buscar restaurantes..."
                    className="w-full pl-10 pr-4 py-2.5 bg-muted rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div className="space-y-3">
                  {allRestaurants.map((restaurant) => (
                    <div key={restaurant.id} className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-lg shrink-0">
                        {restaurant.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <h3 className="font-medium text-foreground text-sm">{restaurant.name}</h3>
                          {restaurant.isVerified && (
                            <span className="text-xs px-1.5 py-0.5 bg-green-50 text-green-600 rounded-full font-medium flex items-center gap-0.5">
                              <Shield className="w-2.5 h-2.5" /> Verificado
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>{restaurant.neighborhood || restaurant.city}</span>
                          <span className="flex items-center gap-1"><Video className="w-3 h-3" />{restaurant.totalVideos} vídeos</span>
                          <span className="flex items-center gap-1"><Star className="w-3 h-3" />{Number(restaurant.averageRating).toFixed(1)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {!restaurant.isVerified && (
                          <button
                            onClick={() => verifyRestaurantMutation.mutate({ restaurantId: restaurant.id })}
                            disabled={verifyRestaurantMutation.isPending}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-semibold disabled:opacity-50"
                          >
                            <Shield className="w-3 h-3" /> Verificar
                          </button>
                        )}
                        <Link href={`/restaurant/${restaurant.slug}`}>
                          <button className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-all">
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </Link>
                      </div>
                    </div>
                  ))}
                  {allRestaurants.length === 0 && (
                    <div className="text-center py-16">
                      <Building2 className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                      <p className="text-muted-foreground">Nenhum restaurante encontrado.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Users */}
            {activeTab === "users" && (
              <div className="space-y-4 animate-fade-in">
                <div>
                  <h1 className="font-display text-2xl font-bold text-foreground">Gestão de Usuários</h1>
                  <p className="text-muted-foreground text-sm mt-1">{allUsers.length} usuários cadastrados</p>
                </div>
                <div className="space-y-3">
                  {allUsers.map((u) => (
                    <div key={u.id} className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                        {u.name?.charAt(0) || "U"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <h3 className="font-medium text-foreground text-sm">{u.name || "Usuário"}</h3>
                          {u.role === "admin" && (
                            <span className="text-xs px-1.5 py-0.5 bg-primary/10 text-primary rounded-full font-medium">Admin</span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{u.email}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Desde {new Date(u.createdAt).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                      {u.role !== "admin" && (
                        <button
                          onClick={() => promoteUserMutation.mutate({ userId: u.id })}
                          disabled={promoteUserMutation.isPending}
                          className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-muted text-muted-foreground rounded-lg text-xs font-medium hover:bg-primary/10 hover:text-primary transition-all disabled:opacity-50"
                        >
                          <Shield className="w-3 h-3" /> Promover
                        </button>
                      )}
                    </div>
                  ))}
                  {allUsers.length === 0 && (
                    <div className="text-center py-16">
                      <Users className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                      <p className="text-muted-foreground">Nenhum usuário encontrado.</p>
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
