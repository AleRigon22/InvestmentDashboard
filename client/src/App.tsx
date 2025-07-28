import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import Holdings from "@/pages/holdings";
import Transactions from "@/pages/transactions";
import Dividends from "@/pages/dividends";
import Cash from "@/pages/cash";
import History from "@/pages/history";
import AssetDetail from "@/pages/asset-detail";
import BottomNav from "@/components/bottom-nav";
import NotFound from "@/pages/not-found";

function AuthenticatedApp() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/holdings" component={Holdings} />
        <Route path="/transactions" component={Transactions} />
        <Route path="/dividends" component={Dividends} />
        <Route path="/cash" component={Cash} />
        <Route path="/history" component={History} />
        <Route path="/asset/:ticker" component={AssetDetail} />
        <Route component={NotFound} />
      </Switch>
      <BottomNav />
    </div>
  );
}

function AppContent() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return <AuthenticatedApp />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <AppContent />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
