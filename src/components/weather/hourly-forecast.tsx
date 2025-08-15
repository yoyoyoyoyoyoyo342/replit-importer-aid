import { Clock, Sun, Cloud, CloudSun, CloudRain, CloudDrizzle, CloudSnow, CloudLightning, CloudFog } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { HourlyForecast as HourlyData } from "@/types/weather";

interface HourlyForecastProps {
  hourlyData: HourlyData[];
  isImperial?: boolean;
}

export function HourlyForecast({ hourlyData, isImperial = true }: HourlyForecastProps) {
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
  return (
    <section className="mb-8">
      <Card className="bg-white rounded-2xl shadow-lg border border-neutral-100">
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold text-neutral-800 mb-6 flex items-center gap-2">
            <Clock className="text-primary w-5 h-5" />
            24-Hour Forecast
          </h2>

          <div className="space-y-2">
            {hourlyData.slice(0, 12).map((hour, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-neutral-50 transition-colors border border-neutral-100"
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="text-sm text-neutral-600 font-medium w-16">
                    {hour.time}
                  </div>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-200 to-blue-300 flex items-center justify-center">
                    {getConditionIcon(hour.condition)}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-xs text-neutral-500">
                    {hour.precipitation}%
                  </div>
                  <div className="text-lg font-semibold text-neutral-800 min-w-[40px] text-right">
                    {isImperial ? hour.temperature : Math.round((hour.temperature - 32) * 5/9)}°
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
