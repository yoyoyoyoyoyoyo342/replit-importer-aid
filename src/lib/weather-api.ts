import {
  WeatherResponse,
  Location,
  WeatherSource,
  HourlyForecast,
  DailyForecast,
  CurrentWeather,
} from "../types/weather";

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

  getWeatherData: async (lat: number, lon: number): Promise<WeatherResponse> => {
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
      location: "Selected Location",
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
