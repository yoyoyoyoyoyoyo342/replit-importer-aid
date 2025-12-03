import { useState, useEffect } from "react";
import { Download, X, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { IOSInstallGuide } from "./ios-install-guide";
import { isIOS, isPWAInstalled } from "@/lib/pwa-utils";

const POPUP_DISMISSED_KEY = "pwa-popup-dismissed";
const POPUP_SHOWN_COUNT_KEY = "pwa-popup-shown-count";
const POPUP_LAST_SHOWN_KEY = "pwa-popup-last-shown";
const MAX_SHOWS = 5;
const MIN_HOURS_BETWEEN_SHOWS = 24;

export function PWAInstallPopup() {
  const [showPopup, setShowPopup] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // Don't show if already installed as PWA
    if (isPWAInstalled()) return;

    // Check if permanently dismissed
    const dismissed = localStorage.getItem(POPUP_DISMISSED_KEY);
    if (dismissed === "true") return;

    // Check show count
    const showCount = parseInt(localStorage.getItem(POPUP_SHOWN_COUNT_KEY) || "0");
    if (showCount >= MAX_SHOWS) return;

    // Check last shown time
    const lastShown = localStorage.getItem(POPUP_LAST_SHOWN_KEY);
    if (lastShown) {
      const hoursSinceLastShow = (Date.now() - parseInt(lastShown)) / (1000 * 60 * 60);
      if (hoursSinceLastShow < MIN_HOURS_BETWEEN_SHOWS) return;
    }

    // Listen for beforeinstallprompt (Android/desktop)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Show popup after a delay (3 seconds)
    const timer = setTimeout(() => {
      setShowPopup(true);
      localStorage.setItem(POPUP_SHOWN_COUNT_KEY, String(showCount + 1));
      localStorage.setItem(POPUP_LAST_SHOWN_KEY, String(Date.now()));
    }, 3000);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (isIOS()) {
      setShowIOSGuide(true);
      setShowPopup(false);
    } else if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setShowPopup(false);
        localStorage.setItem(POPUP_DISMISSED_KEY, "true");
      }
      setDeferredPrompt(null);
    } else {
      // Fallback for browsers that don't support beforeinstallprompt
      setShowIOSGuide(true);
      setShowPopup(false);
    }
  };

  const handleDismiss = () => {
    setShowPopup(false);
  };

  const handleNeverShow = () => {
    localStorage.setItem(POPUP_DISMISSED_KEY, "true");
    setShowPopup(false);
  };

  if (!showPopup) {
    return <IOSInstallGuide open={showIOSGuide} onOpenChange={setShowIOSGuide} />;
  }

  return (
    <>
      <div className="fixed bottom-24 left-4 right-4 z-[60] xl:bottom-6 xl:left-auto xl:right-6 xl:w-80 animate-in slide-in-from-bottom-4 duration-300">
        <Card className="p-4 shadow-lg border-primary/20 bg-background/95 backdrop-blur-sm">
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 flex-shrink-0">
              <Smartphone className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm">Install Rainz Weather</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Add to your home screen for the best experience with push notifications
              </p>
              <div className="flex gap-2 mt-3">
                <Button size="sm" onClick={handleInstall} className="flex-1">
                  <Download className="w-4 h-4 mr-1" />
                  Install
                </Button>
                <Button size="sm" variant="outline" onClick={handleDismiss}>
                  Later
                </Button>
              </div>
              <button
                onClick={handleNeverShow}
                className="text-xs text-muted-foreground hover:text-foreground mt-2 underline"
              >
                Don't show again
              </button>
            </div>
            <button
              onClick={handleDismiss}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </Card>
      </div>
      <IOSInstallGuide open={showIOSGuide} onOpenChange={setShowIOSGuide} />
    </>
  );
}
