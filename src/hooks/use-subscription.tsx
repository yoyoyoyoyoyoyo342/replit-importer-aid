import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from './use-auth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Rainz+ product info
export const RAINZ_PLUS = {
  product_id: "prod_TdzVEL9ACxncTQ",
  price_id: "price_1SghW18mRhH1c6KOK1yEPelt",
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
  const { toast } = useToast();
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
      toast({
        title: 'Sign in required',
        description: 'Please sign in to subscribe to Rainz+.',
        variant: 'destructive',
      });
      throw new Error('No active session');
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
        toast({
          title: 'Checkout failed',
          description: error.message || 'Unable to start checkout. Please try again.',
          variant: 'destructive',
        });
        throw new Error(error.message);
      }

      if (!data?.url) {
        toast({
          title: 'Checkout unavailable',
          description: 'No checkout link was returned. Please try again.',
          variant: 'destructive',
        });
        throw new Error('No checkout URL returned');
      }

      console.log('Opening checkout URL:', data.url);
      window.location.href = data.url;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Error opening checkout:', error);

      // If we already toasted above, this is harmless; if not, still show a user-facing error.
      toast({
        title: 'Could not open checkout',
        description: message || 'Please try again in a moment.',
        variant: 'destructive',
      });

      throw error;
    }
  }, [session?.access_token, toast]);

  const openPortal = useCallback(async () => {
    if (!session?.access_token) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to manage your subscription.',
        variant: 'destructive',
      });
      throw new Error('No active session');
    }

    try {
      toast({
        title: 'Opening subscription portal...',
        description: 'Please wait while we redirect you to Stripe.',
      });
      
      const { data, error } = await supabase.functions.invoke('customer-portal', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error('Error creating portal session:', error);
        toast({
          title: 'Portal unavailable',
          description: error.message || 'Unable to open the customer portal. Please try again.',
          variant: 'destructive',
        });
        throw new Error(error.message);
      }

      if (data?.url) {
        // Use same-window redirect to avoid popup blockers
        window.location.href = data.url;
      } else {
        toast({
          title: 'Portal unavailable',
          description: 'No portal URL was returned. Please try again.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error opening portal:', error);
      throw error;
    }
  }, [session?.access_token, toast]);

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
