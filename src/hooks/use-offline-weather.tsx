import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface OfflineWeatherData {
  location: string;
  latitude: number;
  longitude: number;
  currentWeather: any;
  hourlyForecast: any[];
  dailyForecast: any[];
  savedAt: string;
  expiresAt: string;
}

const OFFLINE_STORAGE_KEY = 'rainz_offline_weather';
const MAX_DAYS_STORED = 3;

export function useOfflineWeather() {
  const [offlineData, setOfflineData] = useState<OfflineWeatherData | null>(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const { toast } = useToast();

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      toast({
        title: "Back online",
        description: "You're connected to the internet again."
      });
    };
    
    const handleOffline = () => {
      setIsOffline(true);
      toast({
        title: "You're offline",
        description: "Using cached weather data.",
        variant: "destructive"
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [toast]);

  // Load saved offline data on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(OFFLINE_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as OfflineWeatherData;
        // Check if data is still valid (not expired)
        if (new Date(parsed.expiresAt) > new Date()) {
          setOfflineData(parsed);
        } else {
          localStorage.removeItem(OFFLINE_STORAGE_KEY);
        }
      }
    } catch (error) {
      console.error('Error loading offline weather data:', error);
    }
  }, []);

  // Save weather data for offline use
  const saveForOffline = useCallback((
    location: string,
    latitude: number,
    longitude: number,
    currentWeather: any,
    hourlyForecast: any[],
    dailyForecast: any[]
  ) => {
    try {
      const now = new Date();
      const expiresAt = new Date(now.getTime() + MAX_DAYS_STORED * 24 * 60 * 60 * 1000);
      
      // Only keep 3 days of hourly (72 hours) and daily forecast
      const trimmedHourly = hourlyForecast?.slice(0, 72) || [];
      const trimmedDaily = dailyForecast?.slice(0, MAX_DAYS_STORED) || [];
      
      const data: OfflineWeatherData = {
        location,
        latitude,
        longitude,
        currentWeather,
        hourlyForecast: trimmedHourly,
        dailyForecast: trimmedDaily,
        savedAt: now.toISOString(),
        expiresAt: expiresAt.toISOString()
      };
      
      localStorage.setItem(OFFLINE_STORAGE_KEY, JSON.stringify(data));
      setOfflineData(data);
      
      return true;
    } catch (error) {
      console.error('Error saving offline weather data:', error);
      return false;
    }
  }, []);

  // Download weather for offline use
  const downloadForOffline = useCallback(async (
    location: string,
    latitude: number,
    longitude: number,
    currentWeather: any,
    hourlyForecast: any[],
    dailyForecast: any[]
  ) => {
    const success = saveForOffline(location, latitude, longitude, currentWeather, hourlyForecast, dailyForecast);
    
    if (success) {
      toast({
        title: "Weather saved for offline",
        description: `3-day forecast for ${location} is now available offline.`
      });
    } else {
      toast({
        title: "Failed to save",
        description: "Could not save weather data for offline use.",
        variant: "destructive"
      });
    }
    
    return success;
  }, [saveForOffline, toast]);

  // Clear offline data
  const clearOfflineData = useCallback(() => {
    localStorage.removeItem(OFFLINE_STORAGE_KEY);
    setOfflineData(null);
    toast({
      title: "Offline data cleared",
      description: "Cached weather data has been removed."
    });
  }, [toast]);

  // Check if we have valid offline data
  const hasOfflineData = offlineData !== null && new Date(offlineData.expiresAt) > new Date();

  // Get time since last save
  const getTimeSinceSave = useCallback(() => {
    if (!offlineData) return null;
    const savedAt = new Date(offlineData.savedAt);
    const now = new Date();
    const diffMs = now.getTime() - savedAt.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    
    if (diffMins < 60) {
      return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    }
    return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  }, [offlineData]);

  return {
    isOffline,
    offlineData,
    hasOfflineData,
    downloadForOffline,
    clearOfflineData,
    getTimeSinceSave
  };
}
