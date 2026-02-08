import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ConnectorProvider } from "@/context/ConnectorContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { lazy, Suspense } from "react";
import { PageLoader } from "@/components/ui/loading-spinner";

// Lazy load pages for code splitting
const LandingPage = lazy(() => import("./pages/LandingPage"));
const ConnectorsPage = lazy(() => import("./pages/ConnectorsPage"));
const ConnectorDetailPage = lazy(() => import("./pages/ConnectorDetailPage"));
const ConnectionsPage = lazy(() => import("./pages/ConnectionsPage"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const SchedulerPage = lazy(() => import("./pages/SchedulerPage"));
const WebhooksPage = lazy(() => import("./pages/WebhooksPage"));
const NotificationPreferencesPage = lazy(() => import("./pages/NotificationPreferencesPage"));
const SecuritySettingsPage = lazy(() => import("./pages/SecuritySettingsPage"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Configure React Query with sensible defaults
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes
      retry: 2,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});

/**
 * Root application component.
 * Sets up providers, routing, and lazy loading for all pages.
 */
const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider delayDuration={300}>
        <BrowserRouter>
          <ConnectorProvider>
            <Toaster />
            <Sonner position="bottom-right" />
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/connectors" element={<ConnectorsPage />} />
                <Route path="/connectors/:slug" element={<ConnectorDetailPage />} />
                <Route path="/connections" element={<ConnectionsPage />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/scheduler" element={<SchedulerPage />} />
                <Route path="/webhooks" element={<WebhooksPage />} />
                <Route path="/settings/notifications" element={<NotificationPreferencesPage />} />
                <Route path="/settings/security" element={<SecuritySettingsPage />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </ConnectorProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
