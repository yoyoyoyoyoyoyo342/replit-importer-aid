import {
  WeatherResponse,
  Location,
  WeatherSource,
  HourlyForecast,
  DailyForecast,
  CurrentWeather,
} from "../types/weather";
import { supabase } from "@/integrations/supabase/client";

function buildDemoWeatherResponse(lat: number, lon: number): WeatherResponse {
  const now = new Date();

  const makeHourly = (): HourlyForecast[] =>
    Array.from({ length: 24 }).map((_, i) => {
      const t = new Date(now.getTime() + i * 3600 * 1000);
      const label = t.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      return {
        time: label,
        temperature: 70 + Math.round(Math.sin(i / 3) * 5),
        condition: "Partly Cloudy",
        precipitation: Math.max(0, Math.round(Math.cos(i / 2) * 20)),
        icon: "",
      };
    });

  const makeDaily = (): DailyForecast[] =>
    Array.from({ length: 10 }).map((_, i) => {
      const d = new Date(now.getTime() + i * 86400000);
      const day = d.toLocaleDateString([], { weekday: "short" });
      const high = 78 + (i % 3) * 2;
      const low = high - 10;
      return {
        day,
        condition: "Partly Cloudy",
        description: "Mix of sun and clouds",
        highTemp: high,
        lowTemp: low,
        precipitation: (i % 3) * 10,
        icon: "",
      };
    });

  const current: CurrentWeather = {
    temperature: 75,
    condition: "Partly Cloudy",
    description: "Partly cloudy",
    humidity: 55,
    windSpeed: 8,
    windDirection: 210,
    visibility: 10,
    feelsLike: 76,
    uvIndex: 5,
    pressure: 1015,
  };

  const baseSource = (source: string): WeatherSource => ({
    source,
    location: "Selected Location",
    latitude: lat,
    longitude: lon,
    accuracy: 0.9,
    currentWeather: current,
    hourlyForecast: makeHourly(),
    dailyForecast: makeDaily(),
  });

  const sources: WeatherSource[] = [
    baseSource("OpenWeatherMap"),
    baseSource("AccuWeather"),
    baseSource("WeatherAPI"),
  ];
  const mostAccurate = sources[0];

  return {
    sources,
    mostAccurate,
    aggregated: mostAccurate,
    demo: true,
    message: "Using demo data. Backend /api/weather is not available.",
  };
}

export const weatherApi = {
  searchLocations: async (query: string): Promise<Location[]> => {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=en&format=json`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Failed to search locations: ${res.status}`);
    }
    const data: any = await res.json();
    const results = Array.isArray(data?.results) ? data.results : [];
    return results.map((r: any) => ({
      name: [r.name, r.admin1, r.country_code || r.country].filter(Boolean).join(", "),
      latitude: r.latitude,
      longitude: r.longitude,
      country: r.country || r.country_code || "",
      state: r.admin1 || undefined,
    }));
  },

  getWeatherData: async (lat: number, lon: number, locationName?: string): Promise<WeatherResponse> => {
    // Fetch directly from Open-Meteo (no API key required)
    const params = new URLSearchParams({
      latitude: String(lat),
      longitude: String(lon),
      current_weather: "true",
      hourly: [
        "temperature_2m",
        "precipitation_probability",
        "relative_humidity_2m",
        "visibility",
        "pressure_msl",
        "uv_index",
        "weathercode",
      ].join(","),
      daily: [
        "weathercode",
        "temperature_2m_max",
        "temperature_2m_min",
        "precipitation_probability_max",
        "sunrise",
        "sunset",
        "moonrise",
        "moonset",
        "moon_phase",
      ].join(","),
      timezone: "auto",
      temperature_unit: "fahrenheit",
    });

    const url = `https://api.open-meteo.com/v1/forecast?${params.toString()}`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Failed to fetch weather: ${res.status}`);
    }
    const data: any = await res.json();

    const weatherCodeToText = (code?: number): string => {
      switch (code) {
        case 0: return "Clear";
        case 1:
        case 2: return "Partly Cloudy";
        case 3: return "Cloudy";
        case 45:
        case 48: return "Fog";
        case 51:
        case 53:
        case 55: return "Drizzle";
        case 61:
        case 63:
        case 65: return "Rain";
        case 71:
        case 73:
        case 75: return "Snow";
        case 80:
        case 81:
        case 82: return "Showers";
        case 95:
        case 96:
        case 99: return "Thunderstorm";
        default: return "Unknown";
      }
    };

    const hourlyTimes: string[] = data?.hourly?.time || [];
    const currentTime: string | undefined = data?.current_weather?.time;
    // Find the nearest hourly index to current time (handles 30-min offsets like 11:30 vs 11:00)
    let idx = 0;
    if (hourlyTimes.length) {
      const parseTs = (s: string) => new Date(s).getTime();
      const target = currentTime ? parseTs(currentTime) : Date.now();
      idx = hourlyTimes.reduce((bestIdx, t, i) => {
        const d = parseTs(t);
        const best = parseTs(hourlyTimes[bestIdx]);
        return Math.abs(d - target) < Math.abs(best - target) ? i : bestIdx;
      }, 0);
    }

    // Sun times (today)
    const sunriseIso = data?.daily?.sunrise?.[0];
    const sunsetIso = data?.daily?.sunset?.[0];
    const sunriseStr = sunriseIso
      ? new Date(sunriseIso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
      : undefined;
    const sunsetStr = sunsetIso
      ? new Date(sunsetIso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
      : undefined;
    let daylightStr: string | undefined = undefined;
    if (sunriseIso && sunsetIso) {
      const diffMs = new Date(sunsetIso).getTime() - new Date(sunriseIso).getTime();
      const h = Math.floor(diffMs / (1000 * 60 * 60));
      const m = Math.round((diffMs - h * 3600000) / 60000);
      daylightStr = `${h}h ${m}m`;
    }

    // Moon data (today)
    const moonriseIso = data?.daily?.moonrise?.[0];
    const moonsetIso = data?.daily?.moonset?.[0];
    const moonPhase = data?.daily?.moon_phase?.[0];
    
    const moonriseStr = moonriseIso
      ? new Date(moonriseIso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
      : undefined;
    const moonsetStr = moonsetIso
      ? new Date(moonsetIso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
      : undefined;
    
    const getMoonPhaseText = (phase: number): string => {
      if (phase === 0 || phase === 1) return "New Moon";
      if (phase > 0 && phase < 0.25) return "Waxing Crescent";
      if (phase === 0.25) return "First Quarter";
      if (phase > 0.25 && phase < 0.5) return "Waxing Gibbous";
      if (phase === 0.5) return "Full Moon";
      if (phase > 0.5 && phase < 0.75) return "Waning Gibbous";
      if (phase === 0.75) return "Last Quarter";
      if (phase > 0.75 && phase < 1) return "Waning Crescent";
      return "—";
    };
    
    const moonPhaseStr = moonPhase !== undefined ? getMoonPhaseText(moonPhase) : undefined;

    // Air Quality (US AQI) - fetch nearest hour
    const aqiParams = new URLSearchParams({
      latitude: String(lat),
      longitude: String(lon),
      hourly: "us_aqi",
      timezone: "auto",
    });
    const aqiUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?${aqiParams.toString()}`;
    let currentAqi: number | undefined = undefined;
    let currentAqiCategory: string | undefined = undefined;
    try {
      const aqiRes = await fetch(aqiUrl);
      if (aqiRes.ok) {
        const aqiData: any = await aqiRes.json();
        const aqiTimes: string[] = aqiData?.hourly?.time || [];
        const parseTs = (s: string) => new Date(s).getTime();
        const target = currentTime ? parseTs(currentTime) : Date.now();
        let aqiIdx = 0;
        if (aqiTimes.length) {
          aqiIdx = aqiTimes.reduce((bestIdx, t, i) => {
            const d = parseTs(t);
            const best = parseTs(aqiTimes[bestIdx]);
            return Math.abs(d - target) < Math.abs(best - target) ? i : bestIdx;
          }, 0);
        }
        const aqiVal = aqiData?.hourly?.us_aqi?.[aqiIdx];
        if (typeof aqiVal === "number") {
          currentAqi = Math.round(aqiVal);
          const n = currentAqi;
          currentAqiCategory =
            n <= 50 ? "Good" :
            n <= 100 ? "Moderate" :
            n <= 150 ? "Unhealthy for Sensitive Groups" :
            n <= 200 ? "Unhealthy" :
            n <= 300 ? "Very Unhealthy" : "Hazardous";
        }
      }
    } catch {}

    // Fetch pollen data
    const pollenParams = new URLSearchParams({
      latitude: lat.toString(),
      longitude: lon.toString(),
      hourly: "alder_pollen,birch_pollen,grass_pollen,mugwort_pollen,olive_pollen,ragweed_pollen",
      timezone: "auto",
      forecast_days: "1"
    });
    const pollenUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?${pollenParams.toString()}`;
    let pollenData: any = undefined;
    try {
      const pollenRes = await fetch(pollenUrl);
      if (pollenRes.ok) {
        const pollen: any = await pollenRes.json();
        const pollenTimes: string[] = pollen?.hourly?.time || [];
        const parseTs = (s: string) => new Date(s).getTime();
        const target = currentTime ? parseTs(currentTime) : Date.now();
        let pollenIdx = 0;
        if (pollenTimes.length) {
          pollenIdx = pollenTimes.reduce((bestIdx, t, i) => {
            const d = parseTs(t);
            const best = parseTs(pollenTimes[bestIdx]);
            return Math.abs(d - target) < Math.abs(best - target) ? i : bestIdx;
          }, 0);
        }
        pollenData = {
          alder: Math.round(pollen?.hourly?.alder_pollen?.[pollenIdx] ?? 0),
          birch: Math.round(pollen?.hourly?.birch_pollen?.[pollenIdx] ?? 0),
          grass: Math.round(pollen?.hourly?.grass_pollen?.[pollenIdx] ?? 0),
          mugwort: Math.round(pollen?.hourly?.mugwort_pollen?.[pollenIdx] ?? 0),
          olive: Math.round(pollen?.hourly?.olive_pollen?.[pollenIdx] ?? 0),
          ragweed: Math.round(pollen?.hourly?.ragweed_pollen?.[pollenIdx] ?? 0),
        };
      }
    } catch {}

    const current: CurrentWeather = {
      temperature: Math.round(data?.current_weather?.temperature ?? 0),
      condition: weatherCodeToText(data?.current_weather?.weathercode),
      description: weatherCodeToText(data?.current_weather?.weathercode),
      humidity: Math.round(data?.hourly?.relative_humidity_2m?.[idx] ?? 0),
      windSpeed: Math.round((data?.current_weather?.windspeed ?? 0) * 0.621371),
      windDirection: Math.round(data?.current_weather?.winddirection ?? 0),
      visibility: Math.round((data?.hourly?.visibility?.[idx] ?? 0) / 1609.34),
      feelsLike: Math.round(data?.hourly?.temperature_2m?.[idx] ?? data?.current_weather?.temperature ?? 0),
      uvIndex: Math.round(data?.hourly?.uv_index?.[idx] ?? 0),
      pressure: Math.round(data?.hourly?.pressure_msl?.[idx] ?? 0),
      sunrise: sunriseStr,
      sunset: sunsetStr,
      daylight: daylightStr,
      moonrise: moonriseStr,
      moonset: moonsetStr,
      moonPhase: moonPhaseStr,
      aqi: currentAqi,
      aqiCategory: currentAqiCategory,
      pollenData: pollenData,
    };

    const hourly: HourlyForecast[] = hourlyTimes.slice(idx, idx + 24).map((t: string, i: number) => {
      const j = idx + i;
      return {
        time: new Date(t).toLocaleTimeString([], { hour: "2-digit" }),
        temperature: Math.round(data?.hourly?.temperature_2m?.[j] ?? 0),
        condition: weatherCodeToText(data?.hourly?.weathercode?.[j]),
        precipitation: Math.round(data?.hourly?.precipitation_probability?.[j] ?? 0),
        icon: "",
      };
    });

    const daily: DailyForecast[] = (data?.daily?.time || []).slice(0, 10).map((d: string, i: number) => ({
      day: new Date(d).toLocaleDateString([], { weekday: "short" }),
      condition: weatherCodeToText(data?.daily?.weathercode?.[i]),
      description: weatherCodeToText(data?.daily?.weathercode?.[i]),
      highTemp: Math.round(data?.daily?.temperature_2m_max?.[i] ?? 0),
      lowTemp: Math.round(data?.daily?.temperature_2m_min?.[i] ?? 0),
      precipitation: Math.round(data?.daily?.precipitation_probability_max?.[i] ?? 0),
      icon: "",
    }));

    const source: WeatherSource = {
      source: "Open-Meteo",
      location: locationName || "Selected Location",
      latitude: lat,
      longitude: lon,
      accuracy: 0.95,
      currentWeather: current,
      hourlyForecast: hourly,
      dailyForecast: daily,
    };

    const response: WeatherResponse = {
      sources: [source],
      mostAccurate: source,
      aggregated: source,
    };

    // Try to fetch additional sources from Supabase Edge Function
    try {
      const { data, error } = await supabase.functions.invoke("aggregate-weather", {
        body: { lat, lon, locationName }
      });
      if (!error && data && Array.isArray((data as any).sources)) {
        const extraSources = (data as any).sources as WeatherSource[];
        response.sources = [...response.sources, ...extraSources];
      }
    } catch (e) {
      // Silently ignore to keep core functionality working
      console.warn("Additional sources unavailable:", (e as Error).message);
    }

    return response;
  },

  getCurrentLocation: (): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported by this browser."));
        return;
      }

      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes
      });
    });
  },
};
