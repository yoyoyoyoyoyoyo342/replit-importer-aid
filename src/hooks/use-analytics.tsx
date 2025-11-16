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

// Check if we've already asked for geolocation permission
const hasAskedForLocation = () => {
  return localStorage.getItem('analytics_location_asked') === 'true';
};

// Mark that we've asked for location permission
const setLocationAsked = () => {
  localStorage.setItem('analytics_location_asked', 'true');
};

// Get cached location data
const getCachedLocation = () => {
  const cached = localStorage.getItem('analytics_location_data');
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch {
      return null;
    }
  }
  return null;
};

// Cache location data
const setCachedLocation = (data: { city: string | null; country: string | null }) => {
  localStorage.setItem('analytics_location_data', JSON.stringify(data));
};

// Get location data from browser geolocation
const getLocationData = async (): Promise<{ city: string | null; country: string | null }> => {
  // Check if we have cached data
  const cached = getCachedLocation();
  if (cached) {
    return cached;
  }

  // Check if we've already asked
  if (hasAskedForLocation()) {
    return { city: null, country: null };
  }

  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      setLocationAsked();
      resolve({ city: null, country: null });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        setLocationAsked();
        try {
          // Use BigDataCloud reverse geocoding API (free, no API key required)
          const response = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${position.coords.latitude}&longitude=${position.coords.longitude}&localityLanguage=en`
          );
          
          if (response.ok) {
            const data = await response.json();
            const locationData = {
              city: data.city || data.locality || null,
              country: data.countryName || null,
            };
            setCachedLocation(locationData);
            resolve(locationData);
          } else {
            resolve({ city: null, country: null });
          }
        } catch (error) {
          console.error('Error getting location data:', error);
          resolve({ city: null, country: null });
        }
      },
      () => {
        // User denied permission
        setLocationAsked();
        resolve({ city: null, country: null });
      },
      {
        timeout: 10000,
        maximumAge: 3600000, // Cache for 1 hour
      }
    );
  });
};

export function useAnalytics() {
  const location = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    const trackPageView = async () => {
      try {
        const sessionId = getSessionId();
        const locationData = await getLocationData();
        
        await supabase.from('analytics_events').insert({
          user_id: user?.id || null,
          event_type: 'pageview',
          page_path: location.pathname,
          user_agent: navigator.userAgent,
          referrer: document.referrer,
          session_id: sessionId,
          city: locationData.city,
          country: locationData.country,
        });
      } catch (error) {
        console.error('Error tracking pageview:', error);
      }
    };

    trackPageView();
  }, [location.pathname, user?.id]);
}
