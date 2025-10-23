import { useState } from "react";
import { Clock, Sun, Cloud, CloudSun, CloudRain, CloudDrizzle, CloudSnow, CloudLightning, CloudFog, ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { HourlyForecast as HourlyData } from "@/types/weather";
import { formatTime } from "@/lib/time-format";

interface HourlyForecastProps {
  hourlyData: HourlyData[];
  isImperial?: boolean;
  is24Hour?: boolean;
}

export function HourlyForecast({ hourlyData, isImperial = true, is24Hour = true }: HourlyForecastProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  const getConditionIcon = (condition: string) => {
    const c = condition.toLowerCase();
    if (c.includes("thunder")) return <CloudLightning className="w-6 h-6 text-primary" />;
    if (c.includes("drizzle")) return <CloudDrizzle className="w-6 h-6 text-primary" />;
    if (c.includes("shower") || c.includes("rain")) return <CloudRain className="w-6 h-6 text-primary" />;
    if (c.includes("snow")) return <CloudSnow className="w-6 h-6 text-primary" />;
    if (c.includes("fog")) return <CloudFog className="w-6 h-6 text-primary" />;
    if (c.includes("partly") || c.includes("sun")) return <CloudSun className="w-6 h-6 text-primary" />;
    if (c.includes("cloud")) return <Cloud className="w-6 h-6 text-primary" />;
    return <Sun className="w-6 h-6 text-primary" />;
  };

  // Create array of 24 hours starting from current hour
  const now = new Date();
  const fullDayData: HourlyData[] = [];
  
  for (let i = 0; i < 24; i++) {
    const futureDate = new Date(now);
    futureDate.setHours(now.getHours() + i, 0, 0, 0);
    
    const hour = futureDate.getHours();
    
    // Get data from hourlyData array if available
    if (i < hourlyData.length) {
      fullDayData.push({
        ...hourlyData[i],
        time: `${String(hour).padStart(2, '0')}:00`
      });
    }
  }
  
  // Get default visible hours (current + next 2)
  const defaultVisibleData = fullDayData.slice(0, Math.min(3, fullDayData.length));
  
  return (
    <section className="mb-4 md:mb-8">
      <Card className="rounded-2xl shadow-lg border border-border">
        <CardContent className="p-3 md:p-4 lg:p-6">
          <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <div className="flex items-center justify-between mb-3 md:mb-6">
              <h2 className="text-lg md:text-xl font-semibold text-card-foreground flex items-center gap-2">
                <Clock className="text-primary w-4 h-4 md:w-5 md:h-5" />
                24-Hour Forecast
              </h2>
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1"
                >
                  {isOpen ? (
                    <>
                      <ChevronUp className="h-4 w-4" />
                      <span className="text-xs md:text-sm">Show Less</span>
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4" />
                      <span className="text-xs md:text-sm">Show All 24h</span>
                    </>
                  )}
                </Button>
              </CollapsibleTrigger>
            </div>

            <div className="space-y-2">
              {/* Current hour + next 2 (always visible) */}
              {defaultVisibleData.map((hour, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 md:p-3 rounded-xl hover:bg-muted/50 transition-colors border border-border"
                >
                  <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
                    <div className="text-xs md:text-sm text-muted-foreground font-medium w-12 md:w-16 shrink-0">
                      {formatTime(hour.time, is24Hour)}
                    </div>
                    <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                      {getConditionIcon(hour.condition)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 md:gap-4 shrink-0">
                    <div className="text-xs text-muted-foreground">
                      {hour.precipitation}%
                    </div>
                    <div className="text-sm md:text-lg font-semibold text-card-foreground min-w-[32px] md:min-w-[40px] text-right">
                      {isImperial ? hour.temperature : Math.round((hour.temperature - 32) * 5/9)}°
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Remaining hours (shown only when expanded) */}
              <CollapsibleContent>
                <div className="space-y-2">
                  {fullDayData.slice(defaultVisibleData.length).map((hour, index) => (
                    <div
                      key={index + defaultVisibleData.length}
                      className="flex items-center justify-between p-2 md:p-3 rounded-xl hover:bg-muted/50 transition-colors border border-border"
                    >
                      <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
                        <div className="text-xs md:text-sm text-muted-foreground font-medium w-12 md:w-16 shrink-0">
                          {formatTime(hour.time, is24Hour)}
                        </div>
                        <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                          {getConditionIcon(hour.condition)}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 md:gap-4 shrink-0">
                        <div className="text-xs text-muted-foreground">
                          {hour.precipitation}%
                        </div>
                        <div className="text-sm md:text-lg font-semibold text-card-foreground min-w-[32px] md:min-w-[40px] text-right">
                          {isImperial ? hour.temperature : Math.round((hour.temperature - 32) * 5/9)}°
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>
        </CardContent>
      </Card>
    </section>
  );
}
