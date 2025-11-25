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

    const WEATHERAPI_KEY = Deno.env.get('WEATHER_API_KEY');
    if (!WEATHERAPI_KEY) {
      throw new Error('WEATHER_API_KEY is not configured');
    }

    // Create a grid of points around the location to find different weather stations
    // This ensures we get multiple nearby locations instead of just one
    const searchPoints: Array<{lat: number, lon: number, label: string}> = [
      { lat: latitude, lon: longitude, label: 'Center' },
      { lat: latitude + 0.1, lon: longitude, label: 'North' },
      { lat: latitude - 0.1, lon: longitude, label: 'South' },
      { lat: latitude, lon: longitude + 0.1, label: 'East' },
      { lat: latitude, lon: longitude - 0.1, label: 'West' },
      { lat: latitude + 0.07, lon: longitude + 0.07, label: 'NE' },
      { lat: latitude + 0.07, lon: longitude - 0.07, label: 'NW' },
      { lat: latitude - 0.07, lon: longitude + 0.07, label: 'SE' },
      { lat: latitude - 0.07, lon: longitude - 0.07, label: 'SW' },
    ];

    console.log(`Searching ${searchPoints.length} points around location`);

    // Fetch weather data for each search point to discover different weather stations
    const stationPromises = searchPoints.map(async (point) => {
      try {
        const weatherUrl = `https://api.weatherapi.com/v1/current.json?key=${WEATHERAPI_KEY}&q=${point.lat},${point.lon}&aqi=no`;
        const weatherResponse = await fetch(weatherUrl);
        
        if (!weatherResponse.ok) {
          console.log(`Failed to fetch weather for point ${point.label}`);
          return null;
        }

        const weatherData = await weatherResponse.json();
        const stationLat = weatherData.location.lat;
        const stationLon = weatherData.location.lon;
        const distance = calculateDistance(latitude, longitude, stationLat, stationLon);
        
        // Calculate reliability based on distance
        const distanceFactor = Math.max(0, 1 - (distance / 100));
        const reliability = Math.min(0.95, 0.7 + (distanceFactor * 0.25));

        return {
          name: weatherData.location.name,
          region: weatherData.location.region,
          country: weatherData.location.country,
          latitude: stationLat,
          longitude: stationLon,
          distance: distance,
          reliability: reliability,
          // Create unique key for deduplication
          key: `${weatherData.location.name}-${weatherData.location.region}`
        };
      } catch (error) {
        console.error(`Error fetching station data for ${point.label}:`, error);
        return null;
      }
    });

    const allStations = (await Promise.all(stationPromises))
      .filter((station): station is WeatherStation & { key: string } => station !== null);

    // Deduplicate stations by location name and region, keeping the closest one
    const uniqueStations = new Map<string, WeatherStation>();
    for (const station of allStations) {
      const existing = uniqueStations.get(station.key);
      if (!existing || station.distance < existing.distance) {
        const { key, ...stationWithoutKey } = station;
        uniqueStations.set(station.key, stationWithoutKey);
      }
    }

    // Sort by distance and return top 3
    const stations = Array.from(uniqueStations.values())
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 3);

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
