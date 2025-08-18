import { MapPin, RefreshCw, Eye, Droplets, Wind, Thermometer, Sun, Cloud, CloudSun, CloudRain, CloudDrizzle, CloudSnow, CloudLightning, CloudFog } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { WeatherSource } from "@/types/weather";
import { PollenWheel } from "./pollen-wheel";

interface CurrentWeatherProps {
  weatherData: WeatherSource[];
  mostAccurate: WeatherSource;
  onRefresh: () => void;
  isLoading: boolean;
  lastUpdated: Date | null;
  isImperial?: boolean;
}

export function CurrentWeather({
  weatherData,
  mostAccurate,
  onRefresh,
  isLoading,
  lastUpdated,
  isImperial = true
}: CurrentWeatherProps) {
  const getConditionIcon = (condition: string) => {
    const c = condition.toLowerCase();
    if (c.includes("thunder")) return <CloudLightning className="w-8 h-8 text-primary" />;
    if (c.includes("drizzle")) return <CloudDrizzle className="w-8 h-8 text-primary" />;
    if (c.includes("shower") || c.includes("rain")) return <CloudRain className="w-8 h-8 text-primary" />;
    if (c.includes("snow")) return <CloudSnow className="w-8 h-8 text-primary" />;
    if (c.includes("fog")) return <CloudFog className="w-8 h-8 text-primary" />;
    if (c.includes("partly") || c.includes("sun")) return <CloudSun className="w-8 h-8 text-primary" />;
    if (c.includes("cloud")) return <Cloud className="w-8 h-8 text-primary" />;
    return <Sun className="w-8 h-8 text-primary" />;
  };

  const formatWindSpeed = (speed: number) => {
    if (isImperial) {
      return `${speed} mph`;
    } else {
      return `${Math.round(speed * 1.609)} km/h`;
    }
  };

  const formatVisibility = (visibility: number) => {
    if (isImperial) {
      return `${visibility} mi`;
    } else {
      return `${Math.round(visibility * 1.609)} km`;
    }
  };

  return (
    <section className="mb-6">
      <Card className="bg-card border border-border shadow-sm rounded-xl">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <MapPin className="text-primary w-4 h-4" />
              <span className="text-lg font-semibold text-foreground">
                {mostAccurate.location.split(',')[0]}
              </span>
            </div>
            <div className="text-xs text-muted-foreground">
              <span>
                Updated {lastUpdated ? Math.floor((Date.now() - lastUpdated.getTime()) / (1000 * 60)) + ' min ago' : 'just now'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Current Temperature & Conditions - Compact */}
            <div className="lg:col-span-2">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                  {getConditionIcon(mostAccurate.currentWeather.condition)}
                </div>
                <div className="flex-1">
                  <div className="flex items-baseline gap-2">
                    <div className="text-4xl font-bold text-foreground">
                      {isImperial ? mostAccurate.currentWeather.temperature : Math.round((mostAccurate.currentWeather.temperature - 32) * 5 / 9)}°
                    </div>
                    <div className="text-muted-foreground text-sm">
                      {isImperial ? 'F' : 'C'}
                    </div>
                  </div>
                  <div className="text-foreground/80 text-sm mb-2">
                    {mostAccurate.currentWeather.condition}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>H: {isImperial ? mostAccurate.dailyForecast[0]?.highTemp : Math.round((mostAccurate.dailyForecast[0]?.highTemp - 32) * 5 / 9)}°</span>
                    <span>L: {isImperial ? mostAccurate.dailyForecast[0]?.lowTemp : Math.round((mostAccurate.dailyForecast[0]?.lowTemp - 32) * 5 / 9)}°</span>
                    <span>Feels {isImperial ? mostAccurate.currentWeather.feelsLike : Math.round((mostAccurate.currentWeather.feelsLike - 32) * 5 / 9)}°</span>
                  </div>
                </div>
              </div>

              {/* Weather Metrics - Compact Grid */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-muted/50 rounded-lg p-3 border border-border/50">
                  <div className="flex items-center gap-2 mb-1">
                    <Wind className="text-primary w-3 h-3" />
                    <span className="text-xs text-muted-foreground">Wind</span>
                  </div>
                  <div className="text-sm font-semibold text-foreground">
                    {formatWindSpeed(mostAccurate.currentWeather.windSpeed)}
                  </div>
                </div>
                <div className="bg-muted/50 rounded-lg p-3 border border-border/50">
                  <div className="flex items-center gap-2 mb-1">
                    <Eye className="text-primary w-3 h-3" />
                    <span className="text-xs text-muted-foreground">Visibility</span>
                  </div>
                  <div className="text-sm font-semibold text-foreground">
                    {formatVisibility(mostAccurate.currentWeather.visibility)}
                  </div>
                </div>
                <div className="bg-muted/50 rounded-lg p-3 border border-border/50">
                  <div className="flex items-center gap-2 mb-1">
                    <Droplets className="text-primary w-3 h-3" />
                    <span className="text-xs text-muted-foreground">Humidity</span>
                  </div>
                  <div className="text-sm font-semibold text-foreground">
                    {mostAccurate.currentWeather.humidity}%
                  </div>
                </div>
              </div>
            </div>

            {/* Pollen Index - Compact */}
            <div className="bg-accent/5 border border-accent/20 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <div className="w-2 h-2 bg-accent rounded-full"></div>
                Pollen Index
              </h3>

              {mostAccurate.currentWeather.pollenData ? (
                <PollenWheel pollenData={mostAccurate.currentWeather.pollenData} />
              ) : (
                <div className="text-center py-6">
                  <div className="text-muted-foreground text-xs">Pollen data unavailable</div>
                </div>
              )}

              <Button onClick={onRefresh} disabled={isLoading} variant="outline" size="sm" className="w-full mt-3 h-8 text-xs">
                {isLoading ? <RefreshCw className="w-3 h-3 mr-1 animate-spin" /> : <RefreshCw className="w-3 h-3 mr-1" />}
                Refresh
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}