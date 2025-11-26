import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { z } from "npm:zod@3.22.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const RequestSchema = z.object({
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
});

interface EnsembleMember {
  temperature: number[];
  precipitation: number[];
}

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

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const validationResult = RequestSchema.safeParse(body);
    
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({ error: "Invalid parameters", details: validationResult.error }),
        { headers: { "Content-Type": "application/json", ...corsHeaders }, status: 400 }
      );
    }

    const { lat, lon } = validationResult.data;

    // Fetch ensemble data from Open-Meteo (uses 31 ensemble members)
    const ensembleUrl = new URL("https://ensemble-api.open-meteo.com/v1/ensemble");
    ensembleUrl.searchParams.set("latitude", lat.toString());
    ensembleUrl.searchParams.set("longitude", lon.toString());
    ensembleUrl.searchParams.set("hourly", "temperature_2m,precipitation");
    ensembleUrl.searchParams.set("temperature_unit", "fahrenheit");
    ensembleUrl.searchParams.set("models", "icon_seamless,gfs_seamless,ecmwf_ifs04");
    ensembleUrl.searchParams.set("forecast_days", "3");

    console.log("Fetching ensemble forecast from:", ensembleUrl.toString());

    const response = await fetch(ensembleUrl.toString());
    if (!response.ok) {
      throw new Error(`Ensemble API error: ${response.status}`);
    }

    const data = await response.json();
    const hourly = data.hourly;

    if (!hourly || !hourly.time) {
      throw new Error("Invalid ensemble data structure");
    }

    // Calculate statistics across ensemble members
    const calculateStats = (values: number[][]) => {
      const stats = values[0].map((_, hourIdx) => {
        const hourValues = values.map(member => member[hourIdx]).sort((a, b) => a - b);
        return {
          median: hourValues[Math.floor(hourValues.length / 2)],
          p10: hourValues[Math.floor(hourValues.length * 0.1)],
          p90: hourValues[Math.floor(hourValues.length * 0.9)],
          spread: hourValues[Math.floor(hourValues.length * 0.9)] - hourValues[Math.floor(hourValues.length * 0.1)],
        };
      });
      return stats;
    };

    // Group temperature and precipitation by ensemble members
    const tempMembers: number[][] = [];
    const precipMembers: number[][] = [];
    
    for (let i = 0; i < 31; i++) {
      const tempKey = `temperature_2m_member${i.toString().padStart(2, '0')}`;
      const precipKey = `precipitation_member${i.toString().padStart(2, '0')}`;
      
      if (hourly[tempKey]) tempMembers.push(hourly[tempKey]);
      if (hourly[precipKey]) precipMembers.push(hourly[precipKey]);
    }

    const tempStats = calculateStats(tempMembers);
    const precipStats = calculateStats(precipMembers);

    // Calculate confidence based on ensemble spread
    const avgTempSpread = tempStats.reduce((sum, s) => sum + s.spread, 0) / tempStats.length;
    const confidence: "high" | "medium" | "low" = 
      avgTempSpread < 5 ? "high" : avgTempSpread < 10 ? "medium" : "low";

    const result: EnsembleForecast = {
      hourly: {
        temperature: {
          median: tempStats.map(s => Math.round(s.median)),
          p10: tempStats.map(s => Math.round(s.p10)),
          p90: tempStats.map(s => Math.round(s.p90)),
        },
        precipitation: {
          median: precipStats.map(s => Math.round(s.median * 100) / 100),
          p10: precipStats.map(s => Math.round(s.p10 * 100) / 100),
          p90: precipStats.map(s => Math.round(s.p90 * 100) / 100),
        },
        time: hourly.time.slice(0, 72),
      },
      confidence,
    };

    console.log(`Ensemble forecast calculated with ${confidence} confidence`);

    return new Response(
      JSON.stringify(result),
      { headers: { "Content-Type": "application/json", ...corsHeaders }, status: 200 }
    );
  } catch (error) {
    console.error("Ensemble forecast error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch ensemble forecast", details: String(error) }),
      { headers: { "Content-Type": "application/json", ...corsHeaders }, status: 500 }
    );
  }
});
