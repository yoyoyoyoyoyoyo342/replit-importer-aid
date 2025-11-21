import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { z } from "npm:zod@3.22.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Input validation schema
const RequestSchema = z.object({
  lat: z.number().min(-90, "Latitude must be between -90 and 90").max(90, "Latitude must be between -90 and 90"),
  lon: z.number().min(-180, "Longitude must be between -180 and 180").max(180, "Longitude must be between -180 and 180"),
  locationName: z.string().max(200).optional(),
});

interface WeatherSource {
  source: string;
  location: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  stationInfo?: {
    name: string;
    region: string;
    country: string;
    localtime: string;
  };
  currentWeather: {
    temperature: number;
    condition: string;
    description: string;
    humidity: number;
    windSpeed: number;
    windDirection: number;
    visibility: number;
    feelsLike: number;
    uvIndex: number;
    pressure: number;
    sunrise?: string;
    sunset?: string;
    daylight?: string;
    aqi?: number;
    aqiCategory?: string;
  };
  hourlyForecast: Array<{
    time: string;
    temperature: number;
    condition: string;
    precipitation: number;
    icon?: string;
  }>;
  dailyForecast: Array<{
    day: string;
    condition: string;
    description: string;
    highTemp: number;
    lowTemp: number;
    precipitation: number;
    icon?: string;
  }>;
}

// Utility to parse 12h time like "07:15 AM" into minutes since midnight
function parse12hToMinutes(t: string): number | null {
  try {
    const [time, ap] = t.split(" ");
    const [hStr, mStr] = time.split(":");
    let h = parseInt(hStr, 10);
    const m = parseInt(mStr, 10);
    if (ap.toUpperCase() === "PM" && h !== 12) h += 12;
    if (ap.toUpperCase() === "AM" && h === 12) h = 0;
    return h * 60 + m;
  } catch {
    return null;
  }
}

function minutesToDuration(startMin: number, endMin: number): string | undefined {
  if (startMin == null || endMin == null) return undefined;
  let diff = endMin - startMin;
  if (diff < 0) diff += 24 * 60;
  const h = Math.floor(diff / 60);
  const m = diff % 60;
  return `${h}h ${m}m`;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    
    // Validate input
    const validationResult = RequestSchema.safeParse(body);
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({ 
          error: "Invalid input parameters",
          details: validationResult.error.errors[0].message 
        }),
        {
          headers: { "Content-Type": "application/json", ...corsHeaders },
          status: 400,
        }
      );
    }

    const { lat, lon, locationName } = validationResult.data;

    const weatherApiKey =
      Deno.env.get("WEATHERAPI_KEY") ||
      Deno.env.get("WEATHER_API_KEY") ||
      Deno.env.get("WEATHER_API") ||
      Deno.env.get("Weather Api"); // try multiple names

    const sources: WeatherSource[] = [];

    // WeatherAPI.com
    if (weatherApiKey) {
      try {
        const url = new URL("https://api.weatherapi.com/v1/forecast.json");
        url.searchParams.set("key", weatherApiKey);
        url.searchParams.set("q", `${lat},${lon}`);
        url.searchParams.set("days", "10");
        url.searchParams.set("aqi", "yes");
        url.searchParams.set("alerts", "no");

        const res = await fetch(url.toString());
        if (!res.ok) throw new Error(`WeatherAPI HTTP ${res.status}`);
        const data = await res.json();

        const astro = data?.forecast?.forecastday?.[0]?.astro;
        const sunrise = astro?.sunrise as string | undefined;
        const sunset = astro?.sunset as string | undefined;
        const daylight = sunrise && sunset
          ? minutesToDuration(parse12hToMinutes(sunrise)!, parse12hToMinutes(sunset)!)
          : undefined;

        const current = data?.current;
        const hrs = data?.forecast?.forecastday?.[0]?.hour || [];
        const days = data?.forecast?.forecastday || [];

        const source: WeatherSource = {
          source: "WeatherAPI",
          location: locationName || data?.location?.name || "Selected Location",
          latitude: lat,
          longitude: lon,
          accuracy: 0.9,
          stationInfo: {
            name: data?.location?.name || "Unknown Station",
            region: data?.location?.region || "",
            country: data?.location?.country || "",
            localtime: data?.location?.localtime || "",
          },
          currentWeather: {
            temperature: Math.round(current?.temp_f ?? 0),
            condition: current?.condition?.text ?? "Unknown",
            description: current?.condition?.text ?? "Unknown",
            humidity: Math.round(current?.humidity ?? 0),
            windSpeed: Math.round(current?.wind_mph ?? 0),
            windDirection: Math.round(current?.wind_degree ?? 0),
            visibility: Math.round(current?.vis_miles ?? 0),
            feelsLike: Math.round(current?.feelslike_f ?? 0),
            uvIndex: Math.round(current?.uv ?? 0),
            pressure: Math.round(current?.pressure_mb ?? 0),
            sunrise,
            sunset,
            daylight,
            aqi: typeof current?.air_quality?.["us-epa-index"] === "number" ? current.air_quality["us-epa-index"] : undefined,
            aqiCategory: undefined,
          },
          hourlyForecast: hrs.slice(0, 24).map((h: any) => ({
            time: new Date(h?.time ?? Date.now()).toLocaleTimeString([], { hour: "2-digit" }),
            temperature: Math.round(h?.temp_f ?? 0),
            condition: h?.condition?.text ?? "Unknown",
            precipitation: Math.round(h?.chance_of_rain ?? 0),
            icon: "",
          })),
          dailyForecast: days.slice(0, 10).map((d: any) => ({
            day: new Date(d?.date ?? Date.now()).toLocaleDateString([], { weekday: "short" }),
            condition: d?.day?.condition?.text ?? "Unknown",
            description: d?.day?.condition?.text ?? "Unknown",
            highTemp: Math.round(d?.day?.maxtemp_f ?? 0),
            lowTemp: Math.round(d?.day?.mintemp_f ?? 0),
            precipitation: Math.round(d?.day?.daily_chance_of_rain ?? 0),
            icon: "",
          })),
        };

        sources.push(source);
      } catch (err) {
        console.error("WeatherAPI fetch failed", err);
      }
    } else {
      console.warn("WEATHERAPI key missing; skipping WeatherAPI provider");
    }

    // TODO: Rebase provider - awaiting details about API and response shape
    const rebaseKey = Deno.env.get("REBASE_API_KEY") || Deno.env.get("REBASE");
    if (rebaseKey) {
      console.log("Rebase key detected; provider not yet implemented. Skipping for now.");
    }

    return new Response(JSON.stringify({ sources }), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
      status: 200,
    });
  } catch (e) {
    console.error("aggregate-weather error", e);
    return new Response(
      JSON.stringify({ error: "Service temporarily unavailable. Please try again." }),
      {
        headers: { "Content-Type": "application/json", ...corsHeaders },
        status: 500,
      }
    );
  }
});
