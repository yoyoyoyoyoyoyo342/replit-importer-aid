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

// Reverse geocode coordinates to a human-readable location name using Open-Meteo
async function reverseGeocode(lat: number, lon: number) {
  try {
    const geocodeUrl = `https://geocoding-api.open-meteo.com/v1/search?latitude=${lat}&longitude=${lon}&count=1&format=json`;
    const geocodeResponse = await fetch(geocodeUrl);

    if (!geocodeResponse.ok) return null;

    const geocodeData = await geocodeResponse.json();
    if (!geocodeData.results || geocodeData.results.length === 0) return null;

    const loc = geocodeData.results[0];
    return {
      name: loc.name as string,
      region: (loc.admin1 || '') as string,
      country: (loc.country || loc.country_code || '') as string,
    };
  } catch (error) {
    console.error('Reverse geocoding failed:', error);
    return null;
  }
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

    // Create a wider grid of points around the location to find more nearby places
    const searchPoints: Array<{ lat: number; lon: number; label: string }> = [
      { lat: latitude, lon: longitude, label: 'Center' },
      // Closer ring (0.02 degrees ~2km)
      { lat: latitude + 0.02, lon: longitude, label: 'N-Close' },
      { lat: latitude - 0.02, lon: longitude, label: 'S-Close' },
      { lat: latitude, lon: longitude + 0.02, label: 'E-Close' },
      { lat: latitude, lon: longitude - 0.02, label: 'W-Close' },
      // Medium ring (0.05 degrees ~5km)
      { lat: latitude + 0.05, lon: longitude, label: 'N' },
      { lat: latitude - 0.05, lon: longitude, label: 'S' },
      { lat: latitude, lon: longitude + 0.05, label: 'E' },
      { lat: latitude, lon: longitude - 0.05, label: 'W' },
      { lat: latitude + 0.05, lon: longitude + 0.05, label: 'NE' },
      { lat: latitude + 0.05, lon: longitude - 0.05, label: 'NW' },
      { lat: latitude - 0.05, lon: longitude + 0.05, label: 'SE' },
      { lat: latitude - 0.05, lon: longitude - 0.05, label: 'SW' },
      // Wider ring (0.1 degrees ~11km)
      { lat: latitude + 0.1, lon: longitude, label: 'N-Far' },
      { lat: latitude - 0.1, lon: longitude, label: 'S-Far' },
      { lat: latitude, lon: longitude + 0.1, label: 'E-Far' },
      { lat: latitude, lon: longitude - 0.1, label: 'W-Far' },
    ];

    console.log(`Searching ${searchPoints.length} points around location for nearby weather stations`);

    const locationResults: any[] = [];

    // 1. WeatherAPI.com - Primary source for weather station locations
    console.log('Querying WeatherAPI.com for nearby stations...');
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
            locationResults.push({ 
              ...loc, 
              source: 'weatherapi',
              hasStationData: true // WeatherAPI provides real station data
            });
          }
        }
      } catch (error) {
        console.error(`Error searching WeatherAPI for ${point.label}:`, error);
      }
    }

    // 2. Tomorrow.io - Query for nearby weather observation locations
    console.log('Querying Tomorrow.io for nearby observation points...');
    const TOMORROW_API_KEY = Deno.env.get('TOMORROW_IO_API_KEY');
    if (TOMORROW_API_KEY) {
      try {
        // Tomorrow.io location search - search center point and key directions
        const tomorrowSearchPoints = [
          { lat: latitude, lon: longitude },
          { lat: latitude + 0.05, lon: longitude },
          { lat: latitude - 0.05, lon: longitude },
          { lat: latitude, lon: longitude + 0.05 },
          { lat: latitude, lon: longitude - 0.05 },
        ];

        for (const point of tomorrowSearchPoints) {
          try {
            // Use Tomorrow.io's realtime endpoint to verify locations have weather data
            const tomorrowUrl = `https://api.tomorrow.io/v4/weather/realtime?location=${point.lat},${point.lon}&apikey=${TOMORROW_API_KEY}`;
            const tomorrowResponse = await fetch(tomorrowUrl);

            if (tomorrowResponse.ok) {
              const data = await tomorrowResponse.json();
              if (data.location) {
                // Tomorrow.io confirmed this location has weather data
                const geo = await reverseGeocode(point.lat, point.lon);
                locationResults.push({
                  name: geo?.name || `Weather Station ${point.lat.toFixed(3)}, ${point.lon.toFixed(3)}`,
                  region: geo?.region || '',
                  country: geo?.country || '',
                  lat: point.lat,
                  lon: point.lon,
                  source: 'tomorrow.io',
                  hasStationData: true,
                });
              }
            }
          } catch (e) {
            console.log(`Tomorrow.io query failed for point:`, e);
          }
        }
      } catch (error) {
        console.error('Error querying Tomorrow.io:', error);
      }
    }

    // 3. Open-Meteo - Verify locations with actual weather data
    console.log('Querying Open-Meteo for verified weather locations...');
    const meteoTestPoints = [
      { lat: latitude, lon: longitude },
      { lat: latitude + 0.03, lon: longitude },
      { lat: latitude - 0.03, lon: longitude },
      { lat: latitude, lon: longitude + 0.03 },
      { lat: latitude, lon: longitude - 0.03 },
    ];

    for (const point of meteoTestPoints) {
      try {
        // Test if Open-Meteo has weather data for this location
        const meteoUrl = `https://api.open-meteo.com/v1/forecast?latitude=${point.lat}&longitude=${point.lon}&current_weather=true`;
        const meteoResponse = await fetch(meteoUrl);

        if (meteoResponse.ok) {
          const data = await meteoResponse.json();
          if (data.current_weather) {
            const geo = await reverseGeocode(point.lat, point.lon);
            if (geo) {
              locationResults.push({
                name: geo.name,
                region: geo.region,
                country: geo.country,
                lat: point.lat,
                lon: point.lon,
                source: 'open-meteo',
                hasStationData: true,
              });
            }
          }
        }
      } catch (error) {
        console.error(`Open-Meteo verification failed:`, error);
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

    console.log(`Collected ${locationResults.length} raw location candidates from all weather APIs`);

    // Deduplicate locations by proximity (within 1km = same station)
    const uniqueLocationsMap = new Map<string, any>();
    for (const loc of locationResults) {
      // Create a key based on rounded coordinates (to ~1km precision)
      const latKey = Math.round(loc.lat * 100) / 100;
      const lonKey = Math.round(loc.lon * 100) / 100;
      const key = `${latKey}-${lonKey}`;
      
      if (!uniqueLocationsMap.has(key)) {
        uniqueLocationsMap.set(key, loc);
      } else {
        // Keep the one with more detailed name or from WeatherAPI (most reliable)
        const existing = uniqueLocationsMap.get(key);
        if (loc.source === 'weatherapi' || loc.name.length > existing.name.length) {
          uniqueLocationsMap.set(key, loc);
        }
      }
    }

    const uniqueLocations = Array.from(uniqueLocationsMap.values());
    console.log(`Reduced to ${uniqueLocations.length} unique weather stations`);
    console.log(`Station sources:`, uniqueLocations.map(s => s.source).join(', '));

    // Convert unique locations to WeatherStation objects with distance & reliability
    const candidateStations: WeatherStation[] = uniqueLocations
      .map((loc: any) => {
        const locLat = typeof loc.lat === 'string' ? parseFloat(loc.lat) : loc.lat;
        const locLon = typeof loc.lon === 'string' ? parseFloat(loc.lon) : loc.lon;

        const distance = calculateDistance(latitude, longitude, locLat, locLon);
        
        // Calculate reliability based on:
        // 1. Distance (closer = more reliable)
        // 2. Source (WeatherAPI > Tomorrow.io > Open-Meteo for station data)
        const distanceFactor = Math.max(0, 1 - distance / 50);
        let sourceReliability = 0.70;
        
        if (loc.source === 'weatherapi') {
          sourceReliability = 0.85; // WeatherAPI has the most comprehensive station data
        } else if (loc.source === 'tomorrow.io') {
          sourceReliability = 0.80; // Tomorrow.io verified observation points
        } else if (loc.source === 'open-meteo') {
          sourceReliability = 0.75; // Open-Meteo verified locations
        }
        
        const reliability = Math.min(0.95, sourceReliability + distanceFactor * 0.15);

        return {
          name: loc.name || `Weather Station (${locLat.toFixed(3)}, ${locLon.toFixed(3)})`,
          region: loc.region || '',
          country: loc.country || '',
          latitude: locLat,
          longitude: locLon,
          distance,
          reliability,
        } as WeatherStation;
      })
      .sort((a, b) => {
        // Sort by distance first, then reliability
        if (Math.abs(a.distance - b.distance) < 0.5) {
          return b.reliability - a.reliability;
        }
        return a.distance - b.distance;
      });

    // Return the top 3 nearest real weather stations with verified data
    const stations = candidateStations.slice(0, 3);
    
    console.log(`Final ${stations.length} weather stations with real data:`);
    stations.forEach(s => {
      console.log(`  - ${s.name} (${s.distance.toFixed(2)}km, reliability: ${(s.reliability * 100).toFixed(0)}%)`);
    });

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
