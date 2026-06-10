import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, Link, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import FeedPage from "./pages/Feed";
import ExplorePage from "./pages/Explore";
import RestaurantProfilePage from "./pages/RestaurantProfile";
import ConsumerProfilePage from "./pages/ConsumerProfile";
import RestaurantDashboardPage from "./pages/RestaurantDashboard";
import RestaurantRegisterPage from "./pages/RestaurantRegister";
import AdminDashboardPage from "./pages/AdminDashboard";
import UserProfilePage from "./pages/UserProfile";
import FriendsPage from "./pages/Friends";
import SocialFeedPage from "./pages/SocialFeed";
import PublicUserProfilePage from "./pages/PublicUserProfile";
import MissionsPage from "./pages/Missions";
import VideoUploadPage from "./pages/VideoUpload";
import ChatPage from "./pages/Chat";
import QuizPage from "./pages/Quiz";
import { useAuth } from "./_core/hooks/useAuth";
import { getLoginUrl } from "./const";
import { trpc } from "./lib/trpc";
import {
  Home as HomeIcon, Play, Search, Users, User,
  LayoutDashboard, Shield, UtensilsCrossed, Bell, LogOut, Target, PlusCircle, MessageCircle
} from "lucide-react";
import { useState } from "react";

function GlobalNav() {
  const [location] = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  // Don't show nav on admin, restaurant dashboard, or landing page
  const hideNav = location === "/" || location.startsWith("/admin") || location.startsWith("/restaurant/dashboard");

  if (hideNav) return null;

  const navItems = [
    { href: "/feed", icon: Play, label: "Feed" },
    { href: "/explore", icon: Search, label: "Explorar" },
    { href: "/upload", icon: PlusCircle, label: "Gravar" },
    { href: "/missions", icon: Target, label: "Missões" },
    { href: "/chat", icon: MessageCircle, label: "Chat IA" },
    { href: "/social", icon: Users, label: "Amigos" },
    { href: "/profile", icon: User, label: "Perfil" },
  ];

  const isActive = (href: string) => location === href || (href !== "/" && location.startsWith(href));

  return (
    <>
      {/* Top bar */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-background/90 backdrop-blur-md border-b border-border">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/">
            <span className="font-display text-xl font-bold text-primary cursor-pointer">Tastee</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navItems.map(({ href, icon: Icon, label }) => (
              <Link key={href} href={href}>
                <button className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive(href) ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}>
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-muted transition-colors"
                >
                  <div className="w-7 h-7 rounded-lg bg-primary/10 overflow-hidden">
                    {user?.name ? (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-xs font-bold text-primary">{user.name[0].toUpperCase()}</span>
                      </div>
                    ) : null}
                  </div>
                  <span className="text-sm font-medium text-foreground hidden md:block">{user?.name?.split(" ")[0]}</span>
                </button>
                {menuOpen && (
                  <div className="absolute right-0 top-full mt-1 w-48 bg-card border border-border rounded-xl shadow-lg py-1 z-50">
                    <Link href="/profile">
                      <button onClick={() => setMenuOpen(false)} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors">
                        <User className="w-4 h-4" /> Meu Perfil
                      </button>
                    </Link>
                    <Link href="/friends">
                      <button onClick={() => setMenuOpen(false)} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors">
                        <Users className="w-4 h-4" /> Amigos
                      </button>
                    </Link>
                    {user?.role === "admin" && (
                      <Link href="/admin">
                        <button onClick={() => setMenuOpen(false)} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors">
                          <Shield className="w-4 h-4" /> Admin
                        </button>
                      </Link>
                    )}
                    <Link href="/restaurant/dashboard">
                      <button onClick={() => setMenuOpen(false)} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors">
                        <LayoutDashboard className="w-4 h-4" /> Dashboard Restaurante
                      </button>
                    </Link>
                    <div className="border-t border-border my-1" />
                    <button
                      onClick={() => { setMenuOpen(false); logout(); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <LogOut className="w-4 h-4" /> Sair
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <a href={getLoginUrl()} className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors">
                Entrar
              </a>
            )}
          </div>
        </div>
      </header>

      {/* Bottom nav (mobile) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-md border-t border-border">
        <div className="flex items-center justify-around py-2 px-4">
          {navItems.map(({ href, icon: Icon, label }) => (
            <Link key={href} href={href}>
              <button className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors ${
                isActive(href) ? "text-primary" : "text-muted-foreground"
              }`}>
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{label}</span>
              </button>
            </Link>
          ))}
        </div>
      </nav>

      {/* Spacer for fixed header */}
      <div className="h-14" />
    </>
  );
}

function Router() {
  return (
    <Switch>
      {/* Public routes */}
      <Route path="/" component={Home} />
      <Route path="/feed" component={FeedPage} />
      <Route path="/explore" component={ExplorePage} />
      <Route path="/restaurant/:slug" component={RestaurantProfilePage} />

      {/* Consumer / social routes */}
      <Route path="/profile" component={UserProfilePage} />
      <Route path="/profile/legacy" component={ConsumerProfilePage} />
      <Route path="/friends" component={FriendsPage} />
      <Route path="/social" component={SocialFeedPage} />
      <Route path="/u/:userId" component={(params) => <PublicUserProfilePage params={params.params as { userId: string }} />} />

      {/* Restaurant routes */}
      <Route path="/restaurant/register" component={RestaurantRegisterPage} />
      <Route path="/restaurant/dashboard" component={RestaurantDashboardPage} />

      {/* Video Upload / Camera */}
      <Route path="/upload" component={VideoUploadPage} />

      {/* Missions / Gamification */}
      <Route path="/missions" component={MissionsPage} />

      {/* Chat IA + Quiz de Perfil */}
      <Route path="/chat" component={ChatPage} />
      <Route path="/quiz" component={QuizPage} />

      {/* Admin routes */}
      <Route path="/admin" component={AdminDashboardPage} />

      {/* Fallback */}
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster position="top-center" richColors />
          <GlobalNav />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
