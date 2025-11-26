import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface EnsembleForecast {
  hourly: {
    temperature: {
      median: number[];
      p10: number[];
      p90: number[];
    };
    precipitation: {
      median: number[];
      p10: number[];
      p90: number[];
    };
    time: string[];
  };
  confidence: "high" | "medium" | "low";
}

export function useEnsembleForecast(latitude: number | null, longitude: number | null) {
  return useQuery({
    queryKey: ["ensemble-forecast", latitude, longitude],
    queryFn: async () => {
      if (!latitude || !longitude) return null;

      const { data, error } = await supabase.functions.invoke("fetch-ensemble-forecast", {
        body: { lat: latitude, lon: longitude },
      });

      if (error) {
        console.error("Ensemble forecast error:", error);
        throw error;
      }

      return data as EnsembleForecast;
    },
    enabled: !!latitude && !!longitude,
    staleTime: 1000 * 60 * 30, // 30 minutes
    retry: 1,
  });
}
