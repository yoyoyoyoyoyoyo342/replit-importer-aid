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

    // Fetch from multiple Open-Meteo models for ensemble averaging
    const openMeteoModels = [
      { name: "ECMWF", model: "ecmwf_ifs04", accuracy: 0.95 },
      { name: "GFS", model: "gfs_seamless", accuracy: 0.90 },
      { name: "DWD ICON", model: "icon_seamless", accuracy: 0.92 },
      { name: "UKMO", model: "ukmo_seamless", accuracy: 0.93 },
      { name: "METEOFRANCE", model: "meteofrance_seamless", accuracy: 0.91 },
      { name: "JMA", model: "jma_seamless", accuracy: 0.89 },
      { name: "GEM", model: "gem_seamless", accuracy: 0.88 },
    ];

    for (const modelConfig of openMeteoModels) {
      try {
        const url = new URL("https://api.open-meteo.com/v1/forecast");
        url.searchParams.set("latitude", lat.toString());
        url.searchParams.set("longitude", lon.toString());
        url.searchParams.set("current_weather", "true");
        url.searchParams.set("hourly", "temperature_2m,precipitation_probability,weathercode,relative_humidity_2m,apparent_temperature,visibility,pressure_msl,uv_index,wind_speed_10m,wind_direction_10m");
        url.searchParams.set("daily", "weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset");
        url.searchParams.set("temperature_unit", "fahrenheit");
        url.searchParams.set("timezone", "auto");
        url.searchParams.set("forecast_days", "10");
        url.searchParams.set("models", modelConfig.model);

        const res = await fetch(url.toString());
        if (!res.ok) throw new Error(`Open-Meteo ${modelConfig.name} HTTP ${res.status}`);
        const data = await res.json();

        const current = data.current_weather;
        const hourly = data.hourly;
        const daily = data.daily;

        const conditionMap: Record<number, string> = {
          0: "Clear", 1: "Partly Cloudy", 2: "Partly Cloudy", 3: "Overcast",
          45: "Foggy", 48: "Foggy", 51: "Light Drizzle", 53: "Drizzle", 55: "Heavy Drizzle",
          61: "Light Rain", 63: "Rain", 65: "Heavy Rain", 71: "Light Snow", 73: "Snow", 75: "Heavy Snow",
          80: "Light Showers", 81: "Showers", 82: "Heavy Showers", 95: "Thunderstorm", 96: "Thunderstorm", 99: "Heavy Thunderstorm"
        };

        const getCondition = (code: number) => conditionMap[code] || "Unknown";

        const source: WeatherSource = {
          source: modelConfig.name,
          location: locationName || "Selected Location",
          latitude: lat,
          longitude: lon,
          accuracy: modelConfig.accuracy,
          currentWeather: {
            temperature: Math.round(current.temperature ?? 0),
            condition: getCondition(current.weathercode ?? 0),
            description: getCondition(current.weathercode ?? 0),
            humidity: Math.round(hourly.relative_humidity_2m?.[0] ?? 0),
            windSpeed: Math.round(current.windspeed ?? 0),
            windDirection: Math.round(current.winddirection ?? 0),
            visibility: Math.round((hourly.visibility?.[0] ?? 10000) / 1609.34),
            feelsLike: Math.round(hourly.apparent_temperature?.[0] ?? current.temperature ?? 0),
            uvIndex: Math.round(hourly.uv_index?.[0] ?? 0),
            pressure: Math.round(hourly.pressure_msl?.[0] ?? 1013),
            sunrise: daily.sunrise?.[0],
            sunset: daily.sunset?.[0],
          },
          hourlyForecast: hourly.time.slice(0, 24).map((time: string, i: number) => ({
            time: new Date(time).toLocaleTimeString([], { hour: "2-digit" }),
            temperature: Math.round(hourly.temperature_2m?.[i] ?? 0),
            condition: getCondition(hourly.weathercode?.[i] ?? 0),
            precipitation: Math.round(hourly.precipitation_probability?.[i] ?? 0),
            icon: "",
          })),
          dailyForecast: daily.time.slice(0, 10).map((time: string, i: number) => ({
            day: new Date(time).toLocaleDateString([], { weekday: "short" }),
            condition: getCondition(daily.weathercode?.[i] ?? 0),
            description: getCondition(daily.weathercode?.[i] ?? 0),
            highTemp: Math.round(daily.temperature_2m_max?.[i] ?? 0),
            lowTemp: Math.round(daily.temperature_2m_min?.[i] ?? 0),
            precipitation: Math.round(daily.precipitation_probability_max?.[i] ?? 0),
            icon: "",
          })),
        };

        sources.push(source);
        console.log(`Successfully fetched ${modelConfig.name} model data`);
      } catch (err) {
        console.error(`${modelConfig.name} model fetch failed:`, err);
      }
    }

    // WeatherAPI.com (keep as additional source)
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
          accuracy: 0.88,
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
        console.log("Successfully fetched WeatherAPI data");
      } catch (err) {
        console.error("WeatherAPI fetch failed", err);
      }
    } else {
      console.warn("WEATHERAPI key missing; skipping WeatherAPI provider");
    }

    // Met.no (Norwegian Meteorological Institute) - completely free, no key needed
    try {
      const url = new URL("https://api.met.no/weatherapi/locationforecast/2.0/compact");
      url.searchParams.set("lat", lat.toString());
      url.searchParams.set("lon", lon.toString());

      const res = await fetch(url.toString(), {
        headers: {
          "User-Agent": "Rainz Weather App (contact@rainz.app)",
        },
      });
      if (!res.ok) throw new Error(`Met.no HTTP ${res.status}`);
      const data = await res.json();

      const current = data?.properties?.timeseries?.[0];
      const hourlyData = data?.properties?.timeseries || [];
      
      // Met.no uses symbol codes for conditions
      const symbolToCondition = (code: string) => {
        if (!code) return "Unknown";
        if (code.includes("clearsky")) return "Clear";
        if (code.includes("fair")) return "Partly Cloudy";
        if (code.includes("cloudy")) return "Cloudy";
        if (code.includes("rain")) return "Rain";
        if (code.includes("snow")) return "Snow";
        if (code.includes("thunder")) return "Thunderstorm";
        if (code.includes("fog")) return "Foggy";
        return "Partly Cloudy";
      };

      const source: WeatherSource = {
        source: "Met.no",
        location: locationName || "Selected Location",
        latitude: lat,
        longitude: lon,
        accuracy: 0.94,
        currentWeather: {
          temperature: Math.round((current?.data?.instant?.details?.air_temperature ?? 0) * 9/5 + 32),
          condition: symbolToCondition(current?.data?.next_1_hours?.summary?.symbol_code),
          description: symbolToCondition(current?.data?.next_1_hours?.summary?.symbol_code),
          humidity: Math.round(current?.data?.instant?.details?.relative_humidity ?? 0),
          windSpeed: Math.round((current?.data?.instant?.details?.wind_speed ?? 0) * 2.237),
          windDirection: Math.round(current?.data?.instant?.details?.wind_from_direction ?? 0),
          visibility: 10,
          feelsLike: Math.round((current?.data?.instant?.details?.air_temperature ?? 0) * 9/5 + 32),
          uvIndex: 0,
          pressure: Math.round(current?.data?.instant?.details?.air_pressure_at_sea_level ?? 1013),
        },
        hourlyForecast: hourlyData.slice(0, 24).map((h: any) => ({
          time: new Date(h?.time ?? Date.now()).toLocaleTimeString([], { hour: "2-digit" }),
          temperature: Math.round((h?.data?.instant?.details?.air_temperature ?? 0) * 9/5 + 32),
          condition: symbolToCondition(h?.data?.next_1_hours?.summary?.symbol_code),
          precipitation: Math.round((h?.data?.next_1_hours?.details?.precipitation_amount ?? 0) * 0.0393701),
          icon: "",
        })),
        dailyForecast: [],
      };

      sources.push(source);
      console.log("Successfully fetched Met.no data");
    } catch (err) {
      console.error("Met.no fetch failed:", err);
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
