import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query } = await req.json();

    if (!query || query.length < 3) {
      return new Response(
        JSON.stringify({ error: "Query must be at least 3 characters", results: [] }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`Geocoding address: ${query}`);

    // Call Nominatim API with proper headers
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("q", query);
    url.searchParams.set("format", "json");
    url.searchParams.set("addressdetails", "1");
    url.searchParams.set("limit", "5");

    const response = await fetch(url.toString(), {
      headers: {
        "User-Agent": "Rainz Weather App/1.0 (Supabase Edge Function)",
        "Accept": "application/json",
      },
    });

    if (!response.ok) {
      console.error(`Nominatim API error: ${response.status} ${response.statusText}`);
      throw new Error(`Nominatim API returned ${response.status}`);
    }

    const data = await response.json();
    console.log(`Found ${data.length} results for query: ${query}`);

    return new Response(
      JSON.stringify({ results: data }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in geocode-address function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "Failed to geocode address",
        results: []
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
