import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "rainz_use_experimental_data";

export function useExperimentalData() {
  const [useExperimental, setUseExperimentalState] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === "true";
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(useExperimental));
  }, [useExperimental]);

  const setUseExperimental = useCallback((value: boolean) => {
    setUseExperimentalState(value);
    // Dispatch event so other components can react
    window.dispatchEvent(new CustomEvent("experimental-data-change", { detail: value }));
  }, []);

  // Listen for changes from other tabs/components
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

  return { useExperimental, setUseExperimental };
}
