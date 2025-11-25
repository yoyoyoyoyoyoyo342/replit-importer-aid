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

    if (latitude === undefined || longitude === undefined || latitude === null || longitude === null) {
      return new Response(
        JSON.stringify({ error: "Latitude and longitude are required" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Finding nearby weather stations for: ${latitude}, ${longitude}`);

    const WEATHER_API_KEY = Deno.env.get('WEATHER_API_KEY');
    if (!WEATHER_API_KEY) {
      throw new Error('WEATHER_API_KEY is not configured');
    }

    // Create a grid of points around the location to find different nearby places
    const searchPoints: Array<{ lat: number; lon: number; label: string }> = [
      { lat: latitude, lon: longitude, label: 'Center' },
      { lat: latitude + 0.05, lon: longitude, label: 'North' },
      { lat: latitude - 0.05, lon: longitude, label: 'South' },
      { lat: latitude, lon: longitude + 0.05, label: 'East' },
      { lat: latitude, lon: longitude - 0.05, label: 'West' },
      { lat: latitude + 0.05, lon: longitude + 0.05, label: 'NE' },
      { lat: latitude + 0.05, lon: longitude - 0.05, label: 'NW' },
      { lat: latitude - 0.05, lon: longitude + 0.05, label: 'SE' },
      { lat: latitude - 0.05, lon: longitude - 0.05, label: 'SW' },
    ];

    console.log(`Searching locations around ${searchPoints.length} nearby points`);

    // Collect location candidates from WeatherAPI search
    const locationResults: any[] = [];

    for (const point of searchPoints) {
      try {
        const searchUrl = `https://api.weatherapi.com/v1/search.json?key=${WEATHER_API_KEY}&q=${point.lat},${point.lon}`;
        const searchResponse = await fetch(searchUrl);

        if (!searchResponse.ok) {
          console.log(`WeatherAPI search failed for ${point.label}: ${searchResponse.status}`);
          continue;
        }

        const results = await searchResponse.json();
        if (Array.isArray(results)) {
          for (const loc of results) {
            locationResults.push(loc);
          }
        }
      } catch (error) {
        console.error(`Error searching locations for ${point.label}:`, error);
      }
    }

    // If nothing came back from the grid search, do a fallback single search
    if (locationResults.length === 0) {
      try {
        const fallbackUrl = `https://api.weatherapi.com/v1/search.json?key=${WEATHER_API_KEY}&q=${latitude},${longitude}`;
        const fallbackResponse = await fetch(fallbackUrl);
        if (fallbackResponse.ok) {
          const results = await fallbackResponse.json();
          if (Array.isArray(results)) {
            for (const loc of results) {
              locationResults.push(loc);
            }
          }
        } else {
          console.log(`Fallback WeatherAPI search failed: ${fallbackResponse.status}`);
        }
      } catch (error) {
        console.error('Error during fallback search:', error);
      }
    }

    console.log(`Collected ${locationResults.length} raw location candidates`);

    // Deduplicate locations by name/region/country
    const uniqueLocationsMap = new Map<string, any>();
    for (const loc of locationResults) {
      const key = `${loc.name}-${loc.region}-${loc.country}`;
      if (!uniqueLocationsMap.has(key)) {
        uniqueLocationsMap.set(key, loc);
      }
    }

    const uniqueLocations = Array.from(uniqueLocationsMap.values());
    console.log(`Reduced to ${uniqueLocations.length} unique locations`);

    // Convert unique locations to WeatherStation objects with distance & reliability
    const candidateStations: WeatherStation[] = uniqueLocations
      .map((loc: any) => {
        const locLat = typeof loc.lat === 'string' ? parseFloat(loc.lat) : loc.lat;
        const locLon = typeof loc.lon === 'string' ? parseFloat(loc.lon) : loc.lon;

        const distance = calculateDistance(latitude, longitude, locLat, locLon);
        const distanceFactor = Math.max(0, 1 - distance / 100);
        const reliability = Math.min(0.95, 0.7 + distanceFactor * 0.25);

        return {
          name: loc.name,
          region: loc.region || '',
          country: loc.country || '',
          latitude: locLat,
          longitude: locLon,
          distance,
          reliability,
        } as WeatherStation;
      })
      .sort((a, b) => a.distance - b.distance);

    const exactLocationStation: WeatherStation = {
      name: 'Exact location',
      region: '',
      country: '',
      latitude,
      longitude,
      distance: 0,
      reliability: 0.9,
    };

    const hasVeryCloseStation = candidateStations.some((s) => s.distance < 0.3);

    let stations: WeatherStation[] = [];

    // Always include the exact address location if no station is extremely close
    if (!hasVeryCloseStation) {
      stations.push(exactLocationStation);
    }

    stations.push(...candidateStations);

    // Sort again by distance (exact location will naturally be first if included)
    stations = stations.sort((a, b) => a.distance - b.distance).slice(0, 3);

    console.log(`Returning ${stations.length} nearby weather stations`);

    return new Response(
      JSON.stringify({ stations }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in find-nearby-stations function:', error);
    return new Response(
      JSON.stringify({
        error: error?.message || 'Failed to find nearby weather stations',
        stations: [],
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
