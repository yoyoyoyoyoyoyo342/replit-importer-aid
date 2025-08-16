import { MapPin, RefreshCw, Eye, Droplets, Wind, Thermometer, Sun, Cloud, CloudSun, CloudRain, CloudDrizzle, CloudSnow, CloudLightning, CloudFog } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { WeatherSource } from "@/types/weather";

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
  isImperial = true,
}: CurrentWeatherProps) {
  const sourceColors = {
    openweathermap: "bg-secondary",
    accuweather: "bg-accent",
    weatherapi: "bg-primary",
    demo: "bg-neutral-400"
  };

  const sourceNames = {
    openweathermap: "OpenWeatherMap",
    accuweather: "AccuWeather",
    weatherapi: "WeatherAPI",
    demo: "Demo Data"
  };

  const getSourceAbbreviation = (source: string) => {
    const abbrev = {
      openweathermap: "OWM",
      accuweather: "ACC",
      weatherapi: "API"
    };
    return abbrev[source as keyof typeof abbrev] || source.toUpperCase();
  };

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

  return (
    <section className="mb-8">
      <Card className="bg-white rounded-2xl shadow-lg border border-neutral-100">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <MapPin className="text-primary w-5 h-5" />
              <span className="text-lg font-semibold text-neutral-800">
                {mostAccurate.location}
              </span>
            </div>
            <div className="text-sm text-neutral-500">
              <span>
                Updated {lastUpdated ? 
                  new Date(Date.now() - lastUpdated.getTime()).getMinutes() + ' min ago' : 
                  'just now'
                }
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Current Temperature & Conditions */}
            <div className="text-center lg:text-left">
              <div className="flex items-center justify-center lg:justify-start gap-4 mb-4">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-200 to-blue-300 flex items-center justify-center">
                  {getConditionIcon(mostAccurate.currentWeather.condition)}
                </div>
                <div>
                  <div className="text-6xl font-bold text-neutral-800">
                    {isImperial ? mostAccurate.currentWeather.temperature : Math.round((mostAccurate.currentWeather.temperature - 32) * 5/9)}°
                  </div>
                  <div className="flex items-center gap-2 text-sm text-neutral-500 mt-1">
                    <span>H: {isImperial ? mostAccurate.dailyForecast[0]?.highTemp : Math.round((mostAccurate.dailyForecast[0]?.highTemp - 32) * 5/9)}°</span>
                    <span>L: {isImperial ? mostAccurate.dailyForecast[0]?.lowTemp : Math.round((mostAccurate.dailyForecast[0]?.lowTemp - 32) * 5/9)}°</span>
                  </div>
                  <div className="text-neutral-600 text-lg">
                    {mostAccurate.currentWeather.condition}
                  </div>
                </div>
              </div>

              {/* Weather Metrics */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-neutral-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Eye className="text-primary w-4 h-4" />
                    <span className="text-sm text-neutral-600">Visibility</span>
                  </div>
                  <div className="text-xl font-semibold text-neutral-800">
                    {isImperial ? mostAccurate.currentWeather.visibility : Math.round(mostAccurate.currentWeather.visibility * 1.609)} {isImperial ? 'mi' : 'km'}
                  </div>
                </div>
                <div className="bg-neutral-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Droplets className="text-primary w-4 h-4" />
                    <span className="text-sm text-neutral-600">Humidity</span>
                  </div>
                  <div className="text-xl font-semibold text-neutral-800">
                    {mostAccurate.currentWeather.humidity}%
                  </div>
                </div>
                <div className="bg-neutral-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Wind className="text-primary w-4 h-4" />
                    <span className="text-sm text-neutral-600">Wind</span>
                  </div>
                  <div className="text-xl font-semibold text-neutral-800">
                    {isImperial ? mostAccurate.currentWeather.windSpeed : Math.round(mostAccurate.currentWeather.windSpeed * 1.609)} {isImperial ? 'mph' : 'km/h'}
                  </div>
                </div>
                <div className="bg-neutral-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Thermometer className="text-primary w-4 h-4" />
                    <span className="text-sm text-neutral-600">Feels like</span>
                  </div>
                  <div className="text-xl font-semibold text-neutral-800">
                    {isImperial ? mostAccurate.currentWeather.feelsLike : Math.round((mostAccurate.currentWeather.feelsLike - 32) * 5/9)}°
                  </div>
                </div>
              </div>
            </div>

            {/* Pollen Index */}
            <div className="bg-gradient-to-br from-primary/5 to-secondary/5 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-neutral-800 mb-4 flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                Pollen Index
              </h3>

              <div className="space-y-4">
                {mostAccurate.currentWeather.pollenData ? (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white/60 rounded-lg p-3">
                        <div className="text-sm text-neutral-600 mb-1">Alder</div>
                        <div className="text-xl font-semibold text-neutral-800">
                          {mostAccurate.currentWeather.pollenData.alder}
                        </div>
                      </div>
                      <div className="bg-white/60 rounded-lg p-3">
                        <div className="text-sm text-neutral-600 mb-1">Birch</div>
                        <div className="text-xl font-semibold text-neutral-800">
                          {mostAccurate.currentWeather.pollenData.birch}
                        </div>
                      </div>
                      <div className="bg-white/60 rounded-lg p-3">
                        <div className="text-sm text-neutral-600 mb-1">Grass</div>
                        <div className="text-xl font-semibold text-neutral-800">
                          {mostAccurate.currentWeather.pollenData.grass}
                        </div>
                      </div>
                      <div className="bg-white/60 rounded-lg p-3">
                        <div className="text-sm text-neutral-600 mb-1">Mugwort</div>
                        <div className="text-xl font-semibold text-neutral-800">
                          {mostAccurate.currentWeather.pollenData.mugwort}
                        </div>
                      </div>
                      <div className="bg-white/60 rounded-lg p-3">
                        <div className="text-sm text-neutral-600 mb-1">Olive</div>
                        <div className="text-xl font-semibold text-neutral-800">
                          {mostAccurate.currentWeather.pollenData.olive}
                        </div>
                      </div>
                      <div className="bg-white/60 rounded-lg p-3">
                        <div className="text-sm text-neutral-600 mb-1">Ragweed</div>
                        <div className="text-xl font-semibold text-neutral-800">
                          {mostAccurate.currentWeather.pollenData.ragweed}
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 p-3 bg-white/60 rounded-lg">
                      <div className="text-sm text-neutral-600">
                        <span className="text-accent">🌸</span>
                        <span className="font-medium ml-1">Scale:</span> 0 = No risk, 1 = Low, 2 = Medium, 3 = High, 4+ = Very High
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-4">
                    <div className="text-neutral-500">Pollen data unavailable</div>
                  </div>
                )}
              </div>

              <Button
                onClick={onRefresh}
                disabled={isLoading}
                variant="outline"
                size="sm"
                className="w-full mt-4"
              >
                {isLoading ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-2" />
                )}
                Refresh Data
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
