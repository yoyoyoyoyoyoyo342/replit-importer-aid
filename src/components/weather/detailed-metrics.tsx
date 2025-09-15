import { Sun, Sunrise, Sunset, Moon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { CurrentWeather } from "@/types/weather";
import { PollenCard } from "./pollen-card";

interface DetailedMetricsProps {
  currentWeather: CurrentWeather;
}

export function DetailedMetrics({
  currentWeather
}: DetailedMetricsProps) {
  return (
    <section className="mb-4">
      <div className="grid grid-cols-1 gap-4">
        {/* Three cards side by side on desktop, stacked on mobile */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Pollen Index Card - only on desktop */}
          <div className="hidden lg:block">
            <PollenCard pollenData={currentWeather.pollenData} />
          </div>
          
          {/* UV Index Card */}
          <Card className="bg-card rounded border border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-primary/20 rounded-lg">
                  <Sun className="text-primary w-4 h-4" />
                </div>
                <h3 className="font-semibold text-card-foreground text-sm">UV Index</h3>
              </div>
              <div className="text-2xl font-bold text-card-foreground mb-2">
                {currentWeather.uvIndex}
              </div>
              <div className="text-xs text-muted-foreground mb-3">
                {currentWeather.uvIndex <= 2 ? 'Low - No protection needed' : 
                 currentWeather.uvIndex <= 5 ? 'Moderate - Some protection needed' : 
                 currentWeather.uvIndex <= 7 ? 'High - Wear sunscreen' : 
                 currentWeather.uvIndex <= 10 ? 'Very High - Extra protection needed' : 
                 'Extreme - Avoid sun exposure'}
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-green-400 via-yellow-400 to-red-500 rounded-full" 
                  style={{
                    width: `${Math.min(currentWeather.uvIndex / 11 * 100, 100)}%`
                  }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Sun & Moon Times Combined Card */}
          <Card className="bg-card rounded border border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-primary/20 rounded-lg">
                  <Sunrise className="text-primary w-4 h-4" />
                </div>
                <h3 className="font-semibold text-card-foreground text-sm">Sun & Moon</h3>
              </div>
              
              {/* Sun Times */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sunrise className="text-primary w-3 h-3" />
                    <span className="text-xs text-muted-foreground">Sunrise</span>
                  </div>
                  <span className="font-semibold text-card-foreground text-xs">{currentWeather.sunrise || '—'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sunset className="text-primary w-3 h-3" />
                    <span className="text-xs text-muted-foreground">Sunset</span>
                  </div>
                  <span className="font-semibold text-card-foreground text-xs">{currentWeather.sunset || '—'}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Daylight</span>
                  <span className="text-card-foreground font-medium">{currentWeather.daylight ?? '—'}</span>
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-border my-3" />

              {/* Moon Times */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Moon className="text-primary w-3 h-3" />
                    <span className="text-xs text-muted-foreground">Moonrise</span>
                  </div>
                  <span className="font-semibold text-card-foreground text-xs">{currentWeather.moonrise || '—'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Moon className="text-primary w-3 h-3" />
                    <span className="text-xs text-muted-foreground">Moonset</span>
                  </div>
                  <span className="font-semibold text-card-foreground text-xs">{currentWeather.moonset || '—'}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Moon Phase</span>
                  <span className="text-card-foreground font-medium">{currentWeather.moonPhase ?? '—'}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}