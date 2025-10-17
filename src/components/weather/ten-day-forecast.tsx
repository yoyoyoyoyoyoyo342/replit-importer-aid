import { useState } from "react";
import { CalendarDays, Droplets, Sun, Cloud, CloudSun, CloudRain, CloudDrizzle, CloudSnow, CloudLightning, CloudFog, ChevronDown, ChevronUp, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { DailyForecast, WeatherSource, HourlyForecast } from "@/types/weather";

interface TenDayForecastProps {
  dailyForecast: DailyForecast[];
  weatherSources: WeatherSource[];
  hourlyForecast: HourlyForecast[];
  isImperial?: boolean;
}

export function TenDayForecast({ dailyForecast, weatherSources, hourlyForecast, isImperial = true }: TenDayForecastProps) {
  const [expandedDay, setExpandedDay] = useState<number | null>(null);
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

  // Get hourly data for a specific day (midnight to midnight, 00:00-23:00)
  const getHourlyForDay = (dayIndex: number) => {
    if (!hourlyForecast.length) return [];
    
    // dayIndex is now 0-9 representing days 1-10 (tomorrow through day 10)
    const actualDayIndex = dayIndex + 1; // Adjust because we're skipping today
    
    // Create a date for the target day at midnight
    const now = new Date();
    const targetDate = new Date(now);
    targetDate.setDate(now.getDate() + actualDayIndex);
    targetDate.setHours(0, 0, 0, 0);
    
    const targetDateStr = targetDate.toISOString().split('T')[0]; // YYYY-MM-DD format
    
    // Collect hours that belong to this specific calendar day
    const dayHours: HourlyForecast[] = [];
    
    // Start from midnight of target day and collect 24 hours (00:00 to 23:00)
    for (let hour = 0; hour < 24; hour++) {
      const checkDate = new Date(targetDate);
      checkDate.setHours(hour);
      
      // Calculate hours from now to this specific hour
      const hoursFromNow = Math.round((checkDate.getTime() - now.getTime()) / (1000 * 60 * 60));
      
      if (hoursFromNow >= 0 && hoursFromNow < hourlyForecast.length) {
        const hourData = hourlyForecast[hoursFromNow];
        // Override the time to show the exact hour (00:00 to 23:00 format)
        dayHours.push({
          ...hourData,
          time: `${String(hour).padStart(2, '0')}:00`
        });
      }
    }
    
    return dayHours;
  };

  const toggleDay = (index: number) => {
    setExpandedDay(expandedDay === index ? null : index);
  };

  return (
    <section className="mb-4 md:mb-8">
      <Card className="rounded-2xl shadow-lg border border-border">
        <CardContent className="p-3 md:p-4 lg:p-6">
          <h2 className="text-lg md:text-xl font-semibold text-card-foreground mb-3 md:mb-6 flex items-center gap-2">
            <CalendarDays className="text-primary w-4 h-4 md:w-5 md:h-5" />
            10-Day Forecast
          </h2>

          <div className="space-y-2">
            {dailyForecast.slice(1, 11).map((day, index) => (
              <Collapsible
                key={index}
                open={expandedDay === index}
                onOpenChange={() => toggleDay(index)}
              >
                <CollapsibleTrigger className="w-full">
                  <div className="flex items-center justify-between p-2 md:p-3 rounded-xl hover:bg-muted/50 transition-colors border border-border cursor-pointer">
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
                      <div className="ml-2">
                        {expandedDay === index ? (
                          <ChevronUp className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </div>
                </CollapsibleTrigger>
                
                <CollapsibleContent className="mt-2">
                  <div className="border border-border rounded-lg p-3 bg-muted/20">
                    <div className="flex items-center gap-2 mb-3">
                      <Clock className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium text-card-foreground">24-Hour Forecast</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
                      {getHourlyForDay(index).map((hour, hourIndex) => (
                        <div
                          key={hourIndex}
                          className="text-center p-2 rounded-lg glass-card border border-border/50"
                        >
                          <div className="text-xs text-muted-foreground mb-1">
                            {hour.time}
                          </div>
                          <div className="w-6 h-6 mx-auto mb-1 rounded-full bg-primary/20 flex items-center justify-center">
                            {getConditionIcon(hour.condition)}
                          </div>
                          <div className="text-xs font-medium text-card-foreground">
                            {isImperial ? Math.round(hour.temperature) : Math.round((hour.temperature - 32) * 5/9)}°
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {hour.precipitation}%
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
