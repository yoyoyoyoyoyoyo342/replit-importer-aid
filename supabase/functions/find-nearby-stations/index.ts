import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WeatherStation {
  name: string;
  region: string;
  country: string;
  latitude: number;
  longitude: number;
  distance: number; // in kilometers
  reliability: number; // 0-1 scale
}

// Calculate distance between two coordinates using Haversine formula
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { latitude, longitude } = await req.json();

    if (!latitude || !longitude) {
      return new Response(
        JSON.stringify({ error: "Latitude and longitude are required" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Finding nearby weather stations for: ${latitude}, ${longitude}`);

    const WEATHERAPI_KEY = Deno.env.get('WEATHERAPI_KEY');
    if (!WEATHERAPI_KEY) {
      throw new Error('WEATHERAPI_KEY is not configured');
    }

    // Search for nearby locations using WeatherAPI search
    const searchRadius = 50; // km
    const searchUrl = `https://api.weatherapi.com/v1/search.json?key=${WEATHERAPI_KEY}&q=${latitude},${longitude}`;
    
    const searchResponse = await fetch(searchUrl);
    if (!searchResponse.ok) {
      throw new Error(`WeatherAPI search failed: ${searchResponse.status}`);
    }

    const searchResults = await searchResponse.json();
    console.log(`Found ${searchResults.length} locations from WeatherAPI search`);

    // Fetch weather data for each location to get station info
    const stationPromises = searchResults.slice(0, 10).map(async (location: any) => {
      try {
        const weatherUrl = `https://api.weatherapi.com/v1/current.json?key=${WEATHERAPI_KEY}&q=${location.lat},${location.lon}&aqi=no`;
        const weatherResponse = await fetch(weatherUrl);
        
        if (!weatherResponse.ok) {
          console.log(`Failed to fetch weather for ${location.name}`);
          return null;
        }

        const weatherData = await weatherResponse.json();
        const distance = calculateDistance(latitude, longitude, location.lat, location.lon);
        
        // Calculate reliability based on distance and data freshness
        // Closer stations and more recent data = higher reliability
        const distanceFactor = Math.max(0, 1 - (distance / 100)); // Decreases with distance
        const reliability = Math.min(0.95, 0.7 + (distanceFactor * 0.25)); // Range: 0.7-0.95

        return {
          name: weatherData.location.name,
          region: weatherData.location.region,
          country: weatherData.location.country,
          latitude: location.lat,
          longitude: location.lon,
          distance: distance,
          reliability: reliability
        };
      } catch (error) {
        console.error(`Error fetching station data for ${location.name}:`, error);
        return null;
      }
    });

    const stations = (await Promise.all(stationPromises))
      .filter((station): station is WeatherStation => station !== null)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 3); // Return top 3 nearest stations

    console.log(`Returning ${stations.length} nearby weather stations`);

    return new Response(
      JSON.stringify({ stations }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in find-nearby-stations function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "Failed to find nearby weather stations",
        stations: []
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
