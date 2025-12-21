import { useState, useEffect, useCallback } from "react";
import { useSubscription } from "@/hooks/use-subscription";

const STORAGE_KEY = "rainz_use_experimental_data";

export function useExperimentalData() {
  const { isSubscribed } = useSubscription();
  
  // Experimental data is always on for subscribers, off for non-subscribers
  const [useExperimental, setUseExperimentalState] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    // Check subscription status from localStorage as fallback for initial render
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === "true";
  });

  // Sync with subscription status - always on for subscribers
  useEffect(() => {
    if (isSubscribed) {
      setUseExperimentalState(true);
      localStorage.setItem(STORAGE_KEY, "true");
    } else {
      setUseExperimentalState(false);
      localStorage.setItem(STORAGE_KEY, "false");
    }
  }, [isSubscribed]);

  // Dispatch event so other components can react
  useEffect(() => {
    window.dispatchEvent(new CustomEvent("experimental-data-change", { detail: useExperimental }));
  }, [useExperimental]);

  // No-op setter since it's controlled by subscription
  const setUseExperimental = useCallback((value: boolean) => {
    // Can't manually change - controlled by subscription
    console.log('Experimental data is controlled by Rainz+ subscription');
  }, []);

  // Listen for changes from other tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        setUseExperimentalState(e.newValue === "true");
      }
    };
    
    const handleCustomEvent = (e: CustomEvent) => {
      setUseExperimentalState(e.detail);
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("experimental-data-change", handleCustomEvent as EventListener);
    
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("experimental-data-change", handleCustomEvent as EventListener);
    };
  }, []);

  return { useExperimental, setUseExperimental, isSubscribed };
}
