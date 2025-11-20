import { CurrentWeather } from "@/types/weather";

export interface WeatherAlert {
  id: string;
  title: string;
  description: string;
  severity: "low" | "moderate" | "high" | "extreme";
  icon: string;
}

export function checkWeatherAlerts(weather: CurrentWeather): WeatherAlert[] {
  const alerts: WeatherAlert[] = [];

  // UV Index alerts
  if (weather.uvIndex >= 8) {
    alerts.push({
      id: "uv-extreme",
      title: "Extreme UV Warning",
      description: `UV Index is ${weather.uvIndex}. Avoid sun exposure between 10 AM and 4 PM.`,
      severity: "extreme",
      icon: "☀️"
    });
  } else if (weather.uvIndex >= 6) {
    alerts.push({
      id: "uv-high",
      title: "High UV Alert",
      description: `UV Index is ${weather.uvIndex}. Wear sunscreen and protective clothing.`,
      severity: "high",
      icon: "🌞"
    });
  }

  // Air Quality alerts
  if (weather.aqi && weather.aqi > 150) {
    alerts.push({
      id: "aqi-unhealthy",
      title: "Unhealthy Air Quality",
      description: `Air Quality Index is ${weather.aqi}. Limit outdoor activities.`,
      severity: "high",
      icon: "💨"
    });
  } else if (weather.aqi && weather.aqi > 100) {
    alerts.push({
      id: "aqi-moderate",
      title: "Moderate Air Quality",
      description: `Air Quality Index is ${weather.aqi}. Sensitive groups should limit prolonged outdoor exertion.`,
      severity: "moderate",
      icon: "🌫️"
    });
  }

  // Wind speed alerts
  if (weather.windSpeed >= 25) {
    alerts.push({
      id: "wind-high",
      title: "High Wind Warning",
      description: `Wind speed is ${weather.windSpeed} mph. Be cautious of falling debris.`,
      severity: "high",
      icon: "💨"
    });
  }

  // Visibility alerts
  if (weather.visibility <= 2) {
    alerts.push({
      id: "visibility-low",
      title: "Low Visibility Alert",
      description: `Visibility is only ${weather.visibility} miles. Drive with caution.`,
      severity: "moderate",
      icon: "🌫️"
    });
  }

  // Temperature extremes
  if (weather.temperature >= 95) {
    alerts.push({
      id: "heat-extreme",
      title: "Extreme Heat Warning",
      description: `Temperature is ${weather.temperature}°F. Stay hydrated and seek shade.`,
      severity: "extreme",
      icon: "🔥"
    });
  } else if (weather.temperature <= 10) {
    alerts.push({
      id: "cold-extreme",
      title: "Extreme Cold Warning",
      description: `Temperature is ${weather.temperature}°F. Dress warmly and limit exposure.`,
      severity: "extreme",
      icon: "🥶"
    });
  }

  // Winter weather alerts
  // Heavy snowfall warning
  if (weather.snowfall && weather.snowfall > 2) {
    alerts.push({
      id: "snow-heavy",
      title: "Heavy Snowfall Warning",
      description: `${weather.snowfall.toFixed(1)}" of snow expected. Travel not recommended.`,
      severity: "extreme",
      icon: "❄️"
    });
  } else if (weather.snowfall && weather.snowfall > 0.5) {
    alerts.push({
      id: "snow-moderate",
      title: "Snowfall Alert",
      description: `${weather.snowfall.toFixed(1)}" of snow expected. Drive with caution.`,
      severity: "high",
      icon: "🌨️"
    });
  }

  // Ice risk warning (based on temperature + precipitation)
  const iceRisk = weather.temperature <= 32 && weather.precipitation && weather.precipitation > 0;
  if (iceRisk) {
    alerts.push({
      id: "ice-danger",
      title: "Icy Conditions Warning",
      description: `Freezing rain creating hazardous ice. Avoid travel if possible.`,
      severity: "extreme",
      icon: "🧊"
    });
  }

  // Dangerous wind chill
  if (weather.feelsLike <= 0) {
    alerts.push({
      id: "windchill-extreme",
      title: "Dangerous Wind Chill",
      description: `Feels like ${weather.feelsLike}°F. Frostbite possible in minutes. Limit outdoor exposure.`,
      severity: "extreme",
      icon: "🌬️"
    });
  } else if (weather.feelsLike <= 20 && weather.feelsLike < weather.temperature - 10) {
    alerts.push({
      id: "windchill-high",
      title: "High Wind Chill Advisory",
      description: `Feels like ${weather.feelsLike}°F. Dress in warm layers.`,
      severity: "high",
      icon: "🥶"
    });
  }

  // Blizzard conditions (heavy snow + high wind)
  if (weather.snowfall && weather.snowfall > 3 && weather.windSpeed >= 35) {
    alerts.push({
      id: "blizzard",
      title: "Blizzard Warning",
      description: `Heavy snow and winds ${weather.windSpeed} mph. Whiteout conditions expected. Do not travel.`,
      severity: "extreme",
      icon: "🌨️"
    });
  }

  return alerts;
}