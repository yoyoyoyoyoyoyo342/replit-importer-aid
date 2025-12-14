import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useExperimentalData } from "./use-experimental-data";

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
  rawApiData?: boolean;
  source?: string;
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

// Convert raw weather source to LLMForecast format (for non-experimental mode)
function convertSourceToForecast(source: WeatherSource): LLMForecast {
  return {
    current: {
      temperature: source.currentWeather?.temperature || 0,
      feelsLike: source.currentWeather?.feelsLike || 0,
      condition: source.currentWeather?.condition || "Unknown",
      description: source.currentWeather?.condition || "Weather data from API",
      humidity: source.currentWeather?.humidity || 0,
      windSpeed: source.currentWeather?.windSpeed || 0,
      pressure: source.currentWeather?.pressure || 1013,
      confidence: 100
    },
    hourly: source.hourlyForecast?.slice(0, 24).map(h => ({
      time: h.time,
      temperature: h.temperature,
      condition: h.condition,
      precipitation: h.precipitation || 0,
      confidence: 100
    })) || [],
    daily: source.dailyForecast?.slice(0, 7).map(d => ({
      day: d.day,
      condition: d.condition,
      description: d.condition,
      highTemp: d.highTemp,
      lowTemp: d.lowTemp,
      precipitation: d.precipitation || 0,
      confidence: 100
    })) || [],
    summary: `Current: ${source.currentWeather?.condition || 'Unknown'}, ${source.currentWeather?.temperature || 0}°F`,
    modelAgreement: 100,
    insights: [],
    rawApiData: true,
    source: source.source
  };
}

export function useLLMWeatherForecast(
  sources: WeatherSource[] | undefined,
  location: string | undefined,
  enabled: boolean = true
) {
  const { useExperimental } = useExperimentalData();
  
  return useQuery<LLMForecast>({
    queryKey: ["llm-weather-forecast", location, sources?.length, useExperimental],
    enabled: enabled && !!sources && sources.length > 0 && !!location,
    queryFn: async () => {
      // If experimental is off, return raw API data directly
      if (!useExperimental && sources && sources.length > 0) {
        console.log(`Using raw API data for ${location} (experimental mode off)`);
        return convertSourceToForecast(sources[0]);
      }
      
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
