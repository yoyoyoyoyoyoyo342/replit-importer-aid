export interface WeatherSource {
  source: string;
  location: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  currentWeather: CurrentWeather;
  hourlyForecast: HourlyForecast[];
  dailyForecast: DailyForecast[];
}

export interface CurrentWeather {
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
  // Optional enriched fields
  sunrise?: string;
  sunset?: string;
  daylight?: string;
  moonrise?: string;
  moonset?: string;
  moonPhase?: string;
  aqi?: number;
  aqiCategory?: string;
  pollenData?: {
    alder: number;
    birch: number;
    grass: number;
    mugwort: number;
    olive: number;
    ragweed: number;
  };
  // Enhanced precipitation and weather fields
  precipitation?: number;
  precipitationProbability?: number;
  cloudCover?: number;
  windGusts?: number;
}

export interface HourlyForecast {
  time: string;
  temperature: number;
  condition: string;
  precipitation: number;
  icon?: string;
}

export interface DailyForecast {
  day: string;
  condition: string;
  description: string;
  highTemp: number;
  lowTemp: number;
  precipitation: number;
  icon?: string;
}

export interface WeatherResponse {
  sources: WeatherSource[];
  mostAccurate: WeatherSource;
  aggregated: WeatherSource;
  demo?: boolean;
  message?: string;
}

export interface Location {
  name: string;
  latitude: number;
  longitude: number;
  country: string;
  state?: string;
}
