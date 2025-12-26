import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ConnectorProvider } from "@/context/ConnectorContext";
import LandingPage from "./pages/LandingPage";
import ConnectorsPage from "./pages/ConnectorsPage";
import ConnectorDetailPage from "./pages/ConnectorDetailPage";
import DashboardPage from "./pages/DashboardPage";
import SecuritySettingsPage from "./pages/SecuritySettingsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ConnectorProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/connectors" element={<ConnectorsPage />} />
            <Route path="/connectors/:slug" element={<ConnectorDetailPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/settings/security" element={<SecuritySettingsPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </ConnectorProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
