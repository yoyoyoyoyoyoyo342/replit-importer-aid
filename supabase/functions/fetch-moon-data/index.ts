import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { lat, lon } = await req.json();
    const MOON_API_KEY = Deno.env.get("MOON_API_KEY");

    if (!MOON_API_KEY) {
      console.error("MOON_API_KEY not configured");
      return new Response(
        JSON.stringify({ 
          error: "Moon API key not configured",
          moonrise: null,
          moonset: null,
          moonPhase: null
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    console.log(`Fetching moon data for lat: ${lat}, lon: ${lon}`);

    // Using ipgeolocation.io Moon API
    const response = await fetch(
      `https://api.ipgeolocation.io/astronomy?apiKey=${MOON_API_KEY}&lat=${lat}&long=${lon}`,
      {
        headers: {
          'Accept': 'application/json',
        }
      }
    );

    if (!response.ok) {
      console.error("Moon API error:", response.status, await response.text());
      return new Response(
        JSON.stringify({ 
          error: "Failed to fetch moon data",
          moonrise: null,
          moonset: null,
          moonPhase: null
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    const data = await response.json();
    console.log("Moon API response:", data);

    return new Response(
      JSON.stringify({
        moonrise: data.moonrise || null,
        moonset: data.moonset || null,
        moonPhase: data.moon_phase || null,
        moonIllumination: data.moon_illumination || null
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );

  } catch (error) {
    console.error("Error in fetch-moon-data:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error",
        moonrise: null,
        moonset: null,
        moonPhase: null
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
