import { apiRequest } from "./queryClient";
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
    try {
      const response = await apiRequest(
        "GET",
        `/api/locations/search?q=${encodeURIComponent(query)}`
      );
      const contentType = response.headers.get("content-type") || "";
      if (!contentType.includes("application/json"))
        throw new Error("Non-JSON response");
      return response.json();
    } catch {
      const q = query.toLowerCase();
      const demo: Location[] = [
        { name: "New York, US", latitude: 40.7128, longitude: -74.006, country: "US", state: "NY" },
        { name: "London, GB", latitude: 51.5072, longitude: -0.1276, country: "GB" },
        { name: "Tokyo, JP", latitude: 35.6762, longitude: 139.6503, country: "JP" },
      ].filter((l) => l.name.toLowerCase().includes(q));
      return demo.length
        ? demo
        : [{ name: "San Francisco, US", latitude: 37.7749, longitude: -122.4194, country: "US", state: "CA" }];
    }
  },

  getWeatherData: async (lat: number, lon: number): Promise<WeatherResponse> => {
    try {
      const response = await apiRequest("GET", `/api/weather?lat=${lat}&lon=${lon}`);
      const contentType = response.headers.get("content-type") || "";
      if (!contentType.includes("application/json"))
        throw new Error("Non-JSON response");
      return await response.json();
    } catch (err) {
      console.warn("Falling back to demo weather data:", err);
      return buildDemoWeatherResponse(lat, lon);
    }
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
