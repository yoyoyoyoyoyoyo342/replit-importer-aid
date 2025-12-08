import { Sun, Sunrise, Sunset, Moon } from "lucide-react";
import { CurrentWeather } from "@/types/weather";
import { formatTime } from "@/lib/time-format";

interface DetailedMetricsProps {
  currentWeather: CurrentWeather;
  is24Hour?: boolean;
}

export function DetailedMetrics({
  currentWeather,
  is24Hour = true
}: DetailedMetricsProps) {
  return (
    <section className="mb-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* UV Index Card */}
        <div className="overflow-hidden rounded-2xl shadow-xl border-0">
          <div className="bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 p-4">
            <div className="flex items-center gap-2">
              <Sun className="w-5 h-5 text-white" />
              <h3 className="font-semibold text-white">UV Index</h3>
            </div>
          </div>
          <div className="bg-background/80 backdrop-blur-sm p-4">
            <div className="text-4xl font-bold text-foreground mb-2">
              {currentWeather.uvIndex}
            </div>
            <div className="text-sm text-muted-foreground mb-3">
              {currentWeather.uvIndex <= 2 ? 'Low - No protection needed' : 
               currentWeather.uvIndex <= 5 ? 'Moderate - Some protection needed' : 
               currentWeather.uvIndex <= 7 ? 'High - Wear sunscreen' : 
               currentWeather.uvIndex <= 10 ? 'Very High - Extra protection needed' : 
               'Extreme - Avoid sun exposure'}
            </div>
            <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-green-400 via-yellow-400 via-orange-500 to-red-500 rounded-full transition-all"
                style={{
                  width: `${Math.min(currentWeather.uvIndex / 11 * 100, 100)}%`
                }}
              />
            </div>
          </div>
        </div>

        {/* Sun & Moon Card */}
        <div className="overflow-hidden rounded-2xl shadow-xl border-0">
          <div className="bg-gradient-to-r from-amber-400 via-orange-400 to-purple-500 p-4">
            <div className="flex items-center gap-2">
              <Sunrise className="w-5 h-5 text-white" />
              <h3 className="font-semibold text-white">Sun & Moon</h3>
            </div>
          </div>
          <div className="bg-background/80 backdrop-blur-sm p-4">
            <div className="grid grid-cols-2 gap-4">
              {/* Sun */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sunrise className="w-4 h-4 text-amber-500" />
                    <span className="text-xs text-muted-foreground">Sunrise</span>
                  </div>
                  <span className="font-semibold text-sm">{formatTime(currentWeather.sunrise, is24Hour)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sunset className="w-4 h-4 text-orange-500" />
                    <span className="text-xs text-muted-foreground">Sunset</span>
                  </div>
                  <span className="font-semibold text-sm">{formatTime(currentWeather.sunset, is24Hour)}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Daylight</span>
                  <span className="font-medium">{currentWeather.daylight ?? '—'}</span>
                </div>
              </div>

              {/* Moon */}
              <div className="space-y-3 border-l border-border/50 pl-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Moon className="w-4 h-4 text-purple-400" />
                    <span className="text-xs text-muted-foreground">Rise</span>
                  </div>
                  <span className="font-semibold text-sm">{formatTime(currentWeather.moonrise, is24Hour)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Moon className="w-4 h-4 text-slate-400" />
                    <span className="text-xs text-muted-foreground">Set</span>
                  </div>
                  <span className="font-semibold text-sm">{formatTime(currentWeather.moonset, is24Hour)}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Phase</span>
                  <span className="font-medium">{currentWeather.moonPhase ?? '—'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
