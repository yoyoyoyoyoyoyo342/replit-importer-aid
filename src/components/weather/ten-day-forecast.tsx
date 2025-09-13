import { CalendarDays, Droplets, Sun, Cloud, CloudSun, CloudRain, CloudDrizzle, CloudSnow, CloudLightning, CloudFog } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { DailyForecast, WeatherSource } from "@/types/weather";

interface TenDayForecastProps {
  dailyForecast: DailyForecast[];
  weatherSources: WeatherSource[];
  isImperial?: boolean;
}

export function TenDayForecast({ dailyForecast, weatherSources, isImperial = true }: TenDayForecastProps) {
  const getConditionIcon = (condition: string) => {
    const c = condition.toLowerCase();
    if (c.includes("thunder")) return <CloudLightning className="w-7 h-7 text-primary" />;
    if (c.includes("drizzle")) return <CloudDrizzle className="w-7 h-7 text-primary" />;
    if (c.includes("shower") || c.includes("rain")) return <CloudRain className="w-7 h-7 text-primary" />;
    if (c.includes("snow")) return <CloudSnow className="w-7 h-7 text-primary" />;
    if (c.includes("fog")) return <CloudFog className="w-7 h-7 text-primary" />;
    if (c.includes("partly") || c.includes("sun")) return <CloudSun className="w-7 h-7 text-primary" />;
    if (c.includes("cloud")) return <Cloud className="w-7 h-7 text-primary" />;
    return <Sun className="w-7 h-7 text-primary" />;
  };
  const sourceColors = {
    openweathermap: "bg-secondary",
    accuweather: "bg-accent", 
    weatherapi: "bg-primary"
  };

  const getSourceAbbreviation = (source: string) => {
    const abbrev = {
      openweathermap: "OWM",
      accuweather: "ACC",
      weatherapi: "API"
    };
    return abbrev[source as keyof typeof abbrev] || source.toUpperCase();
  };

  // Get the most accurate source for each day (simplified - just use most accurate overall)
  const mostAccurateSource = weatherSources.reduce((prev, current) => 
    (current.accuracy > prev.accuracy) ? current : prev
  );

  return (
    <section className="mb-4 md:mb-8">
      <Card className="bg-card rounded-2xl shadow-lg border border-border">
        <CardContent className="p-3 md:p-4 lg:p-6">
          <h2 className="text-lg md:text-xl font-semibold text-card-foreground mb-3 md:mb-6 flex items-center gap-2">
            <CalendarDays className="text-primary w-4 h-4 md:w-5 md:h-5" />
            10-Day Forecast
          </h2>

          <div className="space-y-2">
            {dailyForecast.map((day, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 md:p-3 rounded-xl hover:bg-muted/50 transition-colors border border-border"
              >
                <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
                  <div className="text-xs md:text-sm text-muted-foreground font-medium w-12 md:w-16 shrink-0">
                    {day.day}
                  </div>
                  <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                    {getConditionIcon(day.condition)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-card-foreground text-xs md:text-sm truncate">
                      {day.condition}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 md:gap-4 shrink-0">
                  <div className="text-xs text-muted-foreground">
                    {day.precipitation}%
                  </div>
                  <div className="text-right min-w-[50px] md:min-w-[60px]">
                    <div className="text-sm md:text-lg font-semibold text-card-foreground">
                      {isImperial ? day.highTemp : Math.round((day.highTemp - 32) * 5/9)}°
                    </div>
                    <div className="text-xs md:text-sm text-muted-foreground">
                      {isImperial ? day.lowTemp : Math.round((day.lowTemp - 32) * 5/9)}°
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
