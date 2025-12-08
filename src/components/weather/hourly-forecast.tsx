import { useState } from "react";
import { Clock, Sun, Cloud, CloudSun, CloudRain, CloudDrizzle, Snowflake, CloudLightning, CloudFog, ChevronDown, ChevronUp } from "lucide-react";
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
  
  const getConditionIcon = (condition: string, size: string = "w-5 h-5") => {
    const c = condition.toLowerCase();
    const iconClass = `${size} text-white drop-shadow`;
    if (c.includes("thunder")) return <CloudLightning className={iconClass} />;
    if (c.includes("drizzle")) return <CloudDrizzle className={iconClass} />;
    if (c.includes("shower") || c.includes("rain")) return <CloudRain className={iconClass} />;
    if (c.includes("snow")) return <Snowflake className={iconClass} />;
    if (c.includes("fog")) return <CloudFog className={iconClass} />;
    if (c.includes("partly") || c.includes("sun")) return <CloudSun className={iconClass} />;
    if (c.includes("cloud")) return <Cloud className={iconClass} />;
    return <Sun className={iconClass} />;
  };

  // Create array of 24 hours starting from current hour
  const now = new Date();
  const fullDayData: HourlyData[] = [];
  
  for (let i = 0; i < 24; i++) {
    const futureDate = new Date(now);
    futureDate.setHours(now.getHours() + i, 0, 0, 0);
    
    const hour = futureDate.getHours();
    
    if (i < hourlyData.length) {
      fullDayData.push({
        ...hourlyData[i],
        time: `${String(hour).padStart(2, '0')}:00`
      });
    }
  }
  
  const defaultVisibleData = fullDayData.slice(0, Math.min(3, fullDayData.length));
  
  return (
    <section className="mb-4 md:mb-8">
      <div className="overflow-hidden rounded-2xl shadow-xl border-0">
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Clock className="w-5 h-5" />
              24-Hour Forecast
            </h2>
            <Collapsible open={isOpen} onOpenChange={setIsOpen}>
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/20 gap-1"
                >
                  {isOpen ? (
                    <>
                      <ChevronUp className="h-4 w-4" />
                      <span className="text-xs">Less</span>
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4" />
                      <span className="text-xs">All 24h</span>
                    </>
                  )}
                </Button>
              </CollapsibleTrigger>
            </Collapsible>
          </div>
        </div>

        {/* Content */}
        <div className="bg-background/80 backdrop-blur-sm p-3">
          <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <div className="space-y-2">
              {defaultVisibleData.map((hour, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-primary/10 to-primary/5 border border-border/50"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-muted-foreground w-14">
                      {formatTime(hour.time, is24Hour)}
                    </span>
                    <div className="w-8 h-8 rounded-full bg-primary/30 flex items-center justify-center">
                      {getConditionIcon(hour.condition)}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-muted-foreground">{hour.precipitation}%</span>
                    <span className="text-lg font-bold text-foreground">
                      {isImperial ? hour.temperature : Math.round((hour.temperature - 32) * 5/9)}°
                    </span>
                  </div>
                </div>
              ))}
              
              <CollapsibleContent>
                <div className="space-y-2 mt-2">
                  {fullDayData.slice(defaultVisibleData.length).map((hour, index) => (
                    <div
                      key={index + defaultVisibleData.length}
                      className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-primary/10 to-primary/5 border border-border/50"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-muted-foreground w-14">
                          {formatTime(hour.time, is24Hour)}
                        </span>
                        <div className="w-8 h-8 rounded-full bg-primary/30 flex items-center justify-center">
                          {getConditionIcon(hour.condition)}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-xs text-muted-foreground">{hour.precipitation}%</span>
                        <span className="text-lg font-bold text-foreground">
                          {isImperial ? hour.temperature : Math.round((hour.temperature - 32) * 5/9)}°
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>
        </div>
      </div>
    </section>
  );
}
