import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
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

function Router() {
  return (
    <Switch>
      {/* Public routes */}
      <Route path="/" component={Home} />
      <Route path="/feed" component={FeedPage} />
      <Route path="/explore" component={ExplorePage} />
      <Route path="/restaurant/:slug" component={RestaurantProfilePage} />

      {/* Consumer routes */}
      <Route path="/profile" component={ConsumerProfilePage} />

      {/* Restaurant routes */}
      <Route path="/restaurant/register" component={RestaurantRegisterPage} />
      <Route path="/restaurant/dashboard" component={RestaurantDashboardPage} />

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
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
