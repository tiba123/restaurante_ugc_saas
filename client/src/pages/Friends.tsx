import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import {
  Search, UserPlus, UserCheck, UserX, Users, Check, X, ChevronRight,
  UtensilsCrossed, Video, Star, Clock, MessageSquare
} from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Link } from "wouter";

type SearchUser = {
  id: number;
  name: string | null;
  username: string | null;
  avatarUrl: string | null;
  bio: string | null;
  city: string | null;
  totalVideos: number;
  totalFriends: number;
  friendshipStatus: string | null;
  friendshipId: number | null;
  isRequester: boolean;
};

function UserCard({ user, onAction }: { user: SearchUser; onAction: () => void }) {
  const utils = trpc.useUtils();

  const sendRequest = trpc.social.sendRequest.useMutation({
    onSuccess: () => { toast.success(`Solicitação enviada para ${user.name}!`); onAction(); utils.social.searchUsers.invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  const removeFriend = trpc.social.removeFriend.useMutation({
    onSuccess: () => { toast.success("Amizade removida."); onAction(); utils.social.listFriends.invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  const getStatusBadge = () => {
    if (user.friendshipStatus === "accepted") {
      return (
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-xs text-green-600 font-medium bg-green-50 px-2 py-1 rounded-full">
            <UserCheck className="w-3 h-3" /> Amigos
          </span>
          <button
            onClick={() => removeFriend.mutate({ friendId: user.id })}
            className="text-xs text-muted-foreground hover:text-destructive transition-colors px-2 py-1 rounded-full border border-border hover:border-destructive/30"
          >
            Remover
          </button>
        </div>
      );
    }
    if (user.friendshipStatus === "pending" && user.isRequester) {
      return (
        <span className="flex items-center gap-1 text-xs text-muted-foreground font-medium bg-muted px-2 py-1 rounded-full">
          <Clock className="w-3 h-3" /> Pendente
        </span>
      );
    }
    if (user.friendshipStatus === "pending" && !user.isRequester) {
      return (
        <span className="flex items-center gap-1 text-xs text-amber-600 font-medium bg-amber-50 px-2 py-1 rounded-full">
          <UserPlus className="w-3 h-3" /> Quer ser amigo
        </span>
      );
    }
    return (
      <button
        onClick={() => sendRequest.mutate({ addresseeId: user.id })}
        disabled={sendRequest.isPending}
        className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors disabled:opacity-50"
      >
        {sendRequest.isPending ? <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" /> : <UserPlus className="w-3 h-3" />}
        Adicionar
      </button>
    );
  };

  return (
    <div className="flex items-center gap-3 p-4 bg-card border border-border rounded-xl hover:border-primary/20 transition-colors">
      <Link href={`/u/${user.id}`}>
        <div className="w-12 h-12 rounded-xl bg-muted overflow-hidden shrink-0 cursor-pointer">
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt={user.name ?? ""} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-primary/10">
              <span className="font-bold text-primary">{(user.name ?? "U")[0].toUpperCase()}</span>
            </div>
          )}
        </div>
      </Link>
      <div className="flex-1 min-w-0">
        <Link href={`/u/${user.id}`}>
          <p className="font-semibold text-sm text-foreground hover:text-primary transition-colors cursor-pointer line-clamp-1">{user.name}</p>
        </Link>
        {user.username && <p className="text-xs text-muted-foreground">@{user.username}</p>}
        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
          {user.totalVideos > 0 && <span className="flex items-center gap-0.5"><Video className="w-3 h-3" />{user.totalVideos}</span>}
          {user.totalFriends > 0 && <span className="flex items-center gap-0.5"><Users className="w-3 h-3" />{user.totalFriends}</span>}
          {user.city && <span>{user.city}</span>}
        </div>
      </div>
      <div className="shrink-0">{getStatusBadge()}</div>
    </div>
  );
}

function PendingRequestCard({ request, onAction }: {
  request: { id: number; requester?: { id: number; name: string | null; username: string | null; avatarUrl: string | null; totalVideos: number; totalFriends: number } | null; createdAt: Date };
  onAction: () => void;
}) {
  const utils = trpc.useUtils();
  const respond = trpc.social.respondRequest.useMutation({
    onSuccess: (_, vars) => {
      toast.success(vars.action === "accepted" ? "Solicitação aceita!" : "Solicitação recusada.");
      onAction();
      utils.social.pendingRequests.invalidate();
      utils.social.listFriends.invalidate();
      utils.social.getMyProfile.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const req = request.requester;
  if (!req) return null;

  return (
    <div className="flex items-center gap-3 p-4 bg-card border border-border rounded-xl">
      <Link href={`/u/${req.id}`}>
        <div className="w-12 h-12 rounded-xl bg-muted overflow-hidden shrink-0 cursor-pointer">
          {req.avatarUrl ? (
            <img src={req.avatarUrl} alt={req.name ?? ""} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-primary/10">
              <span className="font-bold text-primary">{(req.name ?? "U")[0].toUpperCase()}</span>
            </div>
          )}
        </div>
      </Link>
      <div className="flex-1 min-w-0">
        <Link href={`/u/${req.id}`}>
          <p className="font-semibold text-sm text-foreground hover:text-primary transition-colors cursor-pointer">{req.name}</p>
        </Link>
        {req.username && <p className="text-xs text-muted-foreground">@{req.username}</p>}
        <p className="text-xs text-muted-foreground mt-0.5">
          {new Date(request.createdAt).toLocaleDateString("pt-BR")}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={() => respond.mutate({ friendshipId: request.id, action: "declined" })}
          disabled={respond.isPending}
          className="w-9 h-9 flex items-center justify-center rounded-full border border-border hover:bg-destructive/10 hover:border-destructive/30 transition-colors"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
        <button
          onClick={() => respond.mutate({ friendshipId: request.id, action: "accepted" })}
          disabled={respond.isPending}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          {respond.isPending ? <div className="w-4 h-4 border border-white/30 border-t-white rounded-full animate-spin" /> : <Check className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

export default function Friends() {
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<"friends" | "requests" | "search">("friends");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data: friends, refetch: refetchFriends } = trpc.social.listFriends.useQuery(undefined, { enabled: isAuthenticated });
  const { data: pendingRequests, refetch: refetchPending } = trpc.social.pendingRequests.useQuery(undefined, { enabled: isAuthenticated });
  const { data: searchResults, isFetching: searching } = trpc.social.searchUsers.useQuery(
    { query: debouncedQuery },
    { enabled: isAuthenticated && debouncedQuery.length >= 2 }
  );

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-sm px-6">
          <Users className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <h2 className="font-display text-2xl font-bold text-foreground mb-3">Amigos</h2>
          <p className="text-muted-foreground mb-6">Entre para conectar-se com outros amantes de gastronomia.</p>
          <a href={getLoginUrl()} className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium">Entrar</a>
        </div>
      </div>
    );
  }

  const pendingCount = pendingRequests?.length ?? 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="font-display text-2xl font-bold text-foreground mb-1">Amigos</h1>
          <p className="text-muted-foreground text-sm">Conecte-se com outros amantes de gastronomia</p>
        </div>

        {/* Search bar */}
        <div className="relative mb-5">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); if (e.target.value.length >= 2) setActiveTab("search"); }}
            placeholder="Buscar pessoas pelo nome ou @username..."
            className="w-full pl-10 pr-4 py-3 bg-card border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          {searching && (
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          )}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border mb-5 gap-1">
          {([
            { id: "friends", label: "Meus Amigos", count: friends?.length },
            { id: "requests", label: "Solicitações", count: pendingCount },
            { id: "search", label: "Buscar" },
          ] as const).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
              {'count' in tab && tab.count !== undefined && tab.count > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                  tab.id === "requests" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Friends list */}
        {activeTab === "friends" && (
          <div className="space-y-2">
            {!friends || friends.length === 0 ? (
              <div className="text-center py-16">
                <Users className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="font-semibold text-foreground mb-1">Nenhum amigo ainda</p>
                <p className="text-sm text-muted-foreground mb-5">Use a busca para encontrar pessoas que compartilham seu amor por gastronomia.</p>
                <button onClick={() => setActiveTab("search")} className="px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium">
                  Buscar Pessoas
                </button>
              </div>
            ) : (
              friends.map((f) => (
                <UserCard
                  key={f.id}
                  user={{ ...f, friendshipStatus: "accepted", friendshipId: null, isRequester: false, bio: null }}
                  onAction={refetchFriends}
                />
              ))
            )}
          </div>
        )}

        {/* Pending requests */}
        {activeTab === "requests" && (
          <div className="space-y-2">
            {pendingCount === 0 ? (
              <div className="text-center py-16">
                <UserPlus className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="font-semibold text-foreground mb-1">Nenhuma solicitação pendente</p>
                <p className="text-sm text-muted-foreground">Quando alguém quiser ser seu amigo, aparecerá aqui.</p>
              </div>
            ) : (
              <>
                <p className="text-sm text-muted-foreground mb-3">{pendingCount} solicitação{pendingCount > 1 ? "ões" : ""} aguardando resposta</p>
                {pendingRequests?.map((req) => (
                  <PendingRequestCard key={req.id} request={req as any} onAction={refetchPending} />
                ))}
              </>
            )}
          </div>
        )}

        {/* Search results */}
        {activeTab === "search" && (
          <div>
            {debouncedQuery.length < 2 ? (
              <div className="text-center py-16">
                <Search className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground">Digite pelo menos 2 caracteres para buscar</p>
              </div>
            ) : !searchResults || searchResults.length === 0 ? (
              <div className="text-center py-16">
                <p className="font-semibold text-foreground mb-1">Nenhum resultado</p>
                <p className="text-sm text-muted-foreground">Tente buscar por outro nome ou username.</p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground mb-3">{searchResults.length} resultado{searchResults.length !== 1 ? "s" : ""}</p>
                {searchResults.map((u) => (
                  <UserCard key={u.id} user={u as SearchUser} onAction={() => {}} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
