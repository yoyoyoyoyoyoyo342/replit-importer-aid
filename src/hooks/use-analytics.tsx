import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './use-auth';

// Generate a session ID that persists for the browser session
const getSessionId = () => {
  let sessionId = sessionStorage.getItem('analytics_session_id');
  if (!sessionId) {
    sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
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
        
        await supabase.from('analytics_events').insert({
          user_id: user?.id || null,
          event_type: 'pageview',
          page_path: location.pathname,
          user_agent: navigator.userAgent,
          referrer: document.referrer,
          session_id: sessionId,
        });
      } catch (error) {
        console.error('Error tracking pageview:', error);
      }
    };

    trackPageView();
  }, [location.pathname, user?.id]);
}
