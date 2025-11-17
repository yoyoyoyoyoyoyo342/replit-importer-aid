import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { HyperlocalWeatherData } from "@/types/hyperlocal-weather";

export function useHyperlocalWeather(latitude?: number, longitude?: number) {
  return useQuery<HyperlocalWeatherData>({
    queryKey: ["hyperlocal-weather", latitude, longitude],
    enabled: !!latitude && !!longitude,
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('fetch-hyperlocal-weather', {
        body: { latitude, longitude }
      });

      if (error) {
        console.error('Error fetching hyperlocal weather:', error);
        throw error;
      }

      return data as HyperlocalWeatherData;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
}
