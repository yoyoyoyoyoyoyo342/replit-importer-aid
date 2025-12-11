import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface LLMForecast {
  current: {
    temperature: number;
    feelsLike: number;
    condition: string;
    description: string;
    humidity: number;
    windSpeed: number;
    pressure: number;
    confidence: number;
  };
  hourly: Array<{
    time: string;
    temperature: number;
    condition: string;
    precipitation: number;
    confidence: number;
  }>;
  daily: Array<{
    day: string;
    condition: string;
    description: string;
    highTemp: number;
    lowTemp: number;
    precipitation: number;
    confidence: number;
  }>;
  summary: string;
  modelAgreement: number;
  insights: string[];
}

interface WeatherSource {
  source: string;
  currentWeather: {
    temperature: number;
    condition: string;
    humidity: number;
    windSpeed: number;
    feelsLike: number;
    pressure: number;
  };
  hourlyForecast: Array<{
    time: string;
    temperature: number;
    condition: string;
    precipitation: number;
  }>;
  dailyForecast: Array<{
    day: string;
    condition: string;
    highTemp: number;
    lowTemp: number;
    precipitation: number;
  }>;
}

export function useLLMWeatherForecast(
  sources: WeatherSource[] | undefined,
  location: string | undefined,
  enabled: boolean = true
) {
  return useQuery<LLMForecast>({
    queryKey: ["llm-weather-forecast", location, sources?.length],
    enabled: enabled && !!sources && sources.length > 0 && !!location,
    queryFn: async () => {
      console.log(`Fetching LLM forecast for ${location} with ${sources?.length} sources`);
      
      const { data, error } = await supabase.functions.invoke('llm-weather-forecast', {
        body: { sources, location }
      });

      if (error) {
        console.error('Error fetching LLM weather forecast:', error);
        throw error;
      }

      return data as LLMForecast;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - LLM analysis is expensive
    gcTime: 30 * 60 * 1000, // 30 minutes cache
    refetchOnWindowFocus: false,
    retry: 1,
  });
}
