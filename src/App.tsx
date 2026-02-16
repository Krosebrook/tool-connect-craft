import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ConnectorProvider } from "@/context/ConnectorContext";
import { AuthProvider } from "@/context/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { lazy, Suspense } from "react";
import { PageLoader } from "@/components/ui/loading-spinner";

// Lazy load pages
const LandingPage = lazy(() => import("./pages/LandingPage"));
const AuthPage = lazy(() => import("./pages/AuthPage"));
const ResetPasswordPage = lazy(() => import("./pages/ResetPasswordPage"));
const ConnectorsPage = lazy(() => import("./pages/ConnectorsPage"));
const ConnectorDetailPage = lazy(() => import("./pages/ConnectorDetailPage"));
const AddMCPPage = lazy(() => import("./pages/AddMCPPage"));
const ConnectionsPage = lazy(() => import("./pages/ConnectionsPage"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const SchedulerPage = lazy(() => import("./pages/SchedulerPage"));
const WebhooksPage = lazy(() => import("./pages/WebhooksPage"));
const NotificationPreferencesPage = lazy(() => import("./pages/NotificationPreferencesPage"));
const SecuritySettingsPage = lazy(() => import("./pages/SecuritySettingsPage"));
const MCPEndpointPage = lazy(() => import("./pages/MCPEndpointPage"));
const MarketplacePage = lazy(() => import("./pages/MarketplacePage"));
const MarketplaceDetailPage = lazy(() => import("./pages/MarketplaceDetailPage"));
const QuickSetupGuidePage = lazy(() => import("./pages/QuickSetupGuidePage"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 30,
      retry: 2,
      refetchOnWindowFocus: false,
    },
    mutations: { retry: 1 },
  },
});

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider delayDuration={300}>
        <BrowserRouter>
          <AuthProvider>
            <ConnectorProvider>
              <Toaster />
              <Sonner position="bottom-right" />
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  {/* Public routes */}
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/auth" element={<AuthPage />} />
                  <Route path="/reset-password" element={<ResetPasswordPage />} />
                  <Route path="/guide" element={<QuickSetupGuidePage />} />

                  {/* Protected routes */}
                  <Route path="/connectors" element={<ProtectedRoute><ConnectorsPage /></ProtectedRoute>} />
                  <Route path="/connectors/add-mcp" element={<ProtectedRoute><AddMCPPage /></ProtectedRoute>} />
                  <Route path="/connectors/:slug" element={<ProtectedRoute><ConnectorDetailPage /></ProtectedRoute>} />
                  <Route path="/connections" element={<ProtectedRoute><ConnectionsPage /></ProtectedRoute>} />
                  <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
                  <Route path="/scheduler" element={<ProtectedRoute><SchedulerPage /></ProtectedRoute>} />
                  <Route path="/webhooks" element={<ProtectedRoute><WebhooksPage /></ProtectedRoute>} />
                  <Route path="/settings/notifications" element={<ProtectedRoute><NotificationPreferencesPage /></ProtectedRoute>} />
                  <Route path="/settings/security" element={<ProtectedRoute><SecuritySettingsPage /></ProtectedRoute>} />
                  <Route path="/settings/mcp-endpoint" element={<ProtectedRoute><MCPEndpointPage /></ProtectedRoute>} />
                  <Route path="/marketplace" element={<ProtectedRoute><MarketplacePage /></ProtectedRoute>} />
                  <Route path="/marketplace/:slug" element={<ProtectedRoute><MarketplaceDetailPage /></ProtectedRoute>} />

                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </ConnectorProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
