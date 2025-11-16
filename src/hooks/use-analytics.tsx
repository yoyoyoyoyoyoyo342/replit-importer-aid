import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './use-auth';

// Generate a session ID that persists for the browser session
const getSessionId = () => {
  let sessionId = sessionStorage.getItem('analytics_session_id');
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem('analytics_session_id', sessionId);
  }
  return sessionId;
};

export function useAnalytics() {
  const location = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    const trackPageView = async () => {
      try {
        const sessionId = getSessionId();
        
        // Get auth token for server-side user identification
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;

        // Call server-side analytics edge function
        // Server will extract IP, user-agent, referrer, and geolocation
        await supabase.functions.invoke('track-analytics', {
          body: {
            event_type: 'pageview',
            page_path: location.pathname,
            session_id: sessionId,
          },
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
      } catch (error) {
        console.error('Error tracking pageview:', error);
      }
    };

    trackPageView();
  }, [location.pathname, user?.id]);
}
