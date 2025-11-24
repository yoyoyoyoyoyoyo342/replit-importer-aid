import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/hooks/use-auth";
import { LanguageProvider } from "@/contexts/language-context";
import { TimeOfDayProvider, useTimeOfDayContext } from "@/contexts/time-of-day-context";
import { CookieConsentProvider } from "@/hooks/use-cookie-consent";
import { CookieConsentBanner } from "@/components/ui/cookie-consent-banner";
import { Footer } from "@/components/ui/footer";
import Index from "./pages/Index";
import Weather from "./pages/Weather";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import AdminPanel from "./pages/AdminPanel";
import TermsOfService from "./pages/TermsOfService";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import DataSettings from "./pages/DataSettings";
import { useAnalytics } from "@/hooks/use-analytics";
import { useBroadcastListener } from "@/hooks/use-broadcast-listener";

const queryClient = new QueryClient();

function AnalyticsTracker() {
  useAnalytics();
  return null;
}

function BroadcastListener() {
  useBroadcastListener();
  return null;
}

function AppContent() {
  const { isNightTime } = useTimeOfDayContext();

  return (
    <ThemeProvider defaultTheme="light" storageKey="weather-app-theme" isNightTime={isNightTime}>
      <LanguageProvider>
        <AuthProvider>
          <CookieConsentProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <CookieConsentBanner />
              <BrowserRouter>
                <div className="flex flex-col min-h-screen">
                  <div className="flex-1">
                    <AnalyticsTracker />
                    <BroadcastListener />
                    <Routes>
                      <Route path="/" element={<Weather />} />
                      <Route path="/auth" element={<Auth />} />
                      <Route path="/admin" element={<AdminPanel />} />
                      <Route path="/terms" element={<TermsOfService />} />
                      <Route path="/privacy" element={<PrivacyPolicy />} />
                      <Route path="/data-settings" element={<DataSettings />} />
                      <Route path="/weather" element={<Navigate to="/" replace />} />
                      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </div>
                  <Footer />
                </div>
              </BrowserRouter>
            </TooltipProvider>
          </CookieConsentProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TimeOfDayProvider>
      <AppContent />
    </TimeOfDayProvider>
  </QueryClientProvider>
);

export default App;
