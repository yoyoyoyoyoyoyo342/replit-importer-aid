import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type CookiePreferences = {
  necessary: boolean;
  analytics: boolean;
  functional: boolean;
};

type CookieConsentContextType = {
  preferences: CookiePreferences | null;
  hasConsented: boolean;
  acceptAll: () => void;
  declineAll: () => void;
  savePreferences: (prefs: CookiePreferences) => void;
  resetConsent: () => void;
};

const CookieConsentContext = createContext<CookieConsentContextType | undefined>(undefined);

const DEFAULT_PREFERENCES: CookiePreferences = {
  necessary: true, // Always true
  analytics: false,
  functional: false,
};

export function CookieConsentProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState<CookiePreferences | null>(null);
  const [hasConsented, setHasConsented] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('cookie_consent');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setPreferences(parsed);
        setHasConsented(true);
      } catch (e) {
        console.error('Failed to parse cookie consent', e);
      }
    }
  }, []);

  const savePreferences = (prefs: CookiePreferences) => {
    const finalPrefs = { ...prefs, necessary: true }; // Necessary always true
    localStorage.setItem('cookie_consent', JSON.stringify(finalPrefs));
    setPreferences(finalPrefs);
    setHasConsented(true);
  };

  const acceptAll = () => {
    savePreferences({
      necessary: true,
      analytics: true,
      functional: true,
    });
  };

  const declineAll = () => {
    savePreferences({
      necessary: true,
      analytics: false,
      functional: false,
    });
  };

  const resetConsent = () => {
    localStorage.removeItem('cookie_consent');
    setPreferences(null);
    setHasConsented(false);
  };

  return (
    <CookieConsentContext.Provider
      value={{
        preferences: preferences || DEFAULT_PREFERENCES,
        hasConsented,
        acceptAll,
        declineAll,
        savePreferences,
        resetConsent,
      }}
    >
      {children}
    </CookieConsentContext.Provider>
  );
}

export function useCookieConsent() {
  const context = useContext(CookieConsentContext);
  if (!context) {
    throw new Error('useCookieConsent must be used within CookieConsentProvider');
  }
  return context;
}
