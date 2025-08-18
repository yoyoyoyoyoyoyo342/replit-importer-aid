import { MapPin, RefreshCw, Eye, Droplets, Wind, Sun, Cloud, CloudSun, CloudRain, CloudDrizzle, CloudSnow, CloudLightning, CloudFog } from "lucide-react";
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
    if (c.includes("thunder")) return <CloudLightning className="w-5 h-5 text-primary" />;
    if (c.includes("drizzle")) return <CloudDrizzle className="w-5 h-5 text-primary" />;
    if (c.includes("shower") || c.includes("rain")) return <CloudRain className="w-5 h-5 text-primary" />;
    if (c.includes("snow")) return <CloudSnow className="w-5 h-5 text-primary" />;
    if (c.includes("fog")) return <CloudFog className="w-5 h-5 text-primary" />;
    if (c.includes("partly") || c.includes("sun")) return <CloudSun className="w-5 h-5 text-primary" />;
    if (c.includes("cloud")) return <Cloud className="w-5 h-5 text-primary" />;
    return <Sun className="w-5 h-5 text-primary" />;
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
    <section className="mb-4">
      <Card className="bg-card border border-border shadow-sm">
        <CardContent className="p-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <MapPin className="text-primary w-3 h-3" />
              <span className="text-sm font-semibold text-foreground">
                {mostAccurate.location.split(',')[0]}
              </span>
            </div>
            <div className="text-xs text-muted-foreground">
              {lastUpdated ? Math.floor((Date.now() - lastUpdated.getTime()) / (1000 * 60)) + 'm ago' : 'now'}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {/* Main Temperature */}
            <div className="lg:col-span-2 flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
                {getConditionIcon(mostAccurate.currentWeather.condition)}
              </div>
              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-foreground">
                    {isImperial ? mostAccurate.currentWeather.temperature : Math.round((mostAccurate.currentWeather.temperature - 32) * 5 / 9)}°
                  </span>
                  <span className="text-xs text-muted-foreground">{isImperial ? 'F' : 'C'}</span>
                </div>
                <div className="text-xs text-foreground/80 mb-1">
                  {mostAccurate.currentWeather.condition}
                </div>
                <div className="flex gap-2 text-xs text-muted-foreground">
                  <span>H:{isImperial ? mostAccurate.dailyForecast[0]?.highTemp : Math.round((mostAccurate.dailyForecast[0]?.highTemp - 32) * 5 / 9)}°</span>
                  <span>L:{isImperial ? mostAccurate.dailyForecast[0]?.lowTemp : Math.round((mostAccurate.dailyForecast[0]?.lowTemp - 32) * 5 / 9)}°</span>
                </div>
              </div>
            </div>

            {/* Weather Metrics - Ultra Compact */}
            <div className="grid grid-cols-3 lg:grid-cols-1 gap-2">
              <div className="bg-muted/50 rounded p-2 border border-border/50">
                <div className="flex items-center gap-1 mb-1">
                  <Wind className="text-primary w-2 h-2" />
                  <span className="text-xs text-muted-foreground">Wind</span>
                </div>
                <div className="text-xs font-semibold text-foreground">
                  {formatWindSpeed(mostAccurate.currentWeather.windSpeed)}
                </div>
              </div>
              <div className="bg-muted/50 rounded p-2 border border-border/50">
                <div className="flex items-center gap-1 mb-1">
                  <Eye className="text-primary w-2 h-2" />
                  <span className="text-xs text-muted-foreground">Visibility</span>
                </div>
                <div className="text-xs font-semibold text-foreground">
                  {formatVisibility(mostAccurate.currentWeather.visibility)}
                </div>
              </div>
              <div className="bg-muted/50 rounded p-2 border border-border/50">
                <div className="flex items-center gap-1 mb-1">
                  <Droplets className="text-primary w-2 h-2" />
                  <span className="text-xs text-muted-foreground">Humidity</span>
                </div>
                <div className="text-xs font-semibold text-foreground">
                  {mostAccurate.currentWeather.humidity}%
                </div>
              </div>
            </div>

            {/* Pollen - Ultra Compact */}
            <div className="bg-primary/5 border border-primary/20 rounded p-2">
              <h3 className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1">
                <div className="w-1 h-1 bg-primary rounded-full"></div>
                Pollen
              </h3>
              {mostAccurate.currentWeather.pollenData ? (
                <div className="text-xs">
                  <PollenWheel pollenData={mostAccurate.currentWeather.pollenData} />
                </div>
              ) : (
                <div className="text-xs text-muted-foreground">No data</div>
              )}
              <Button onClick={onRefresh} disabled={isLoading} variant="outline" size="sm" className="w-full mt-2 h-6 text-xs">
                {isLoading ? <RefreshCw className="w-2 h-2 mr-1 animate-spin" /> : <RefreshCw className="w-2 h-2 mr-1" />}
                Refresh
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}