import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from './use-auth';
import { supabase } from '@/integrations/supabase/client';

// Rainz+ product info
export const RAINZ_PLUS = {
  product_id: "prod_TdxeVWiNtskwEP",
  price_id: "price_1Sgfiw8mRhH1c6KOVIlDcgRe",
  name: "Rainz+",
  price: "€2",
  interval: "month",
};

interface SubscriptionContextType {
  isSubscribed: boolean;
  isLoading: boolean;
  subscriptionEnd: string | null;
  productId: string | null;
  checkSubscription: () => Promise<void>;
  openCheckout: () => Promise<void>;
  openPortal: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { user, session } = useAuth();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [subscriptionEnd, setSubscriptionEnd] = useState<string | null>(null);
  const [productId, setProductId] = useState<string | null>(null);

  const checkSubscription = useCallback(async () => {
    if (!session?.access_token) {
      setIsSubscribed(false);
      setSubscriptionEnd(null);
      setProductId(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const { data, error } = await supabase.functions.invoke('check-subscription', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error('Error checking subscription:', error);
        setIsSubscribed(false);
        return;
      }

      setIsSubscribed(data?.subscribed ?? false);
      setSubscriptionEnd(data?.subscription_end ?? null);
      setProductId(data?.product_id ?? null);
    } catch (error) {
      console.error('Error checking subscription:', error);
      setIsSubscribed(false);
    } finally {
      setIsLoading(false);
    }
  }, [session?.access_token]);

  const openCheckout = useCallback(async () => {
    if (!session?.access_token) {
      console.error('User must be logged in to subscribe');
      return;
    }

    try {
      console.log('Creating checkout session...');
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      console.log('Checkout response:', { data, error });

      if (error) {
        console.error('Error creating checkout session:', error);
        return;
      }

      if (data?.url) {
        console.log('Opening checkout URL:', data.url);
        window.location.href = data.url;
      } else {
        console.error('No checkout URL returned:', data);
      }
    } catch (error) {
      console.error('Error opening checkout:', error);
    }
  }, [session?.access_token]);

  const openPortal = useCallback(async () => {
    if (!session?.access_token) {
      console.error('User must be logged in to manage subscription');
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('customer-portal', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error('Error creating portal session:', error);
        return;
      }

      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error opening portal:', error);
    }
  }, [session?.access_token]);

  // Check subscription on auth change
  useEffect(() => {
    checkSubscription();
  }, [checkSubscription]);

  // Periodic refresh every 60 seconds
  useEffect(() => {
    if (!user) return;
    
    const interval = setInterval(() => {
      checkSubscription();
    }, 60000);

    return () => clearInterval(interval);
  }, [user, checkSubscription]);

  return (
    <SubscriptionContext.Provider
      value={{
        isSubscribed,
        isLoading,
        subscriptionEnd,
        productId,
        checkSubscription,
        openCheckout,
        openPortal,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
}
