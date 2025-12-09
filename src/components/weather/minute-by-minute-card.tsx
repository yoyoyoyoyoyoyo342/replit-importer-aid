import { Droplets, Clock } from "lucide-react";
import { MinuteByMinute } from "@/types/hyperlocal-weather";

interface MinuteByMinuteCardProps {
  data: MinuteByMinute[];
}

export function MinuteByMinuteCard({ data }: MinuteByMinuteCardProps) {
  if (!data || data.length === 0) return null;

  // Show next 15 minutes
  const nextMinutes = data.slice(0, 15);
  
  // Check if rain is coming soon
  const rainSoon = nextMinutes.some(m => m.precipitation > 0);
  const minutesUntilRain = rainSoon 
    ? nextMinutes.findIndex(m => m.precipitation > 0) + 1
    : null;

  return (
    <div className="overflow-hidden rounded-2xl shadow-xl border-0">
      {/* Header with softer gradient */}
      <div className="bg-gradient-to-r from-violet-300/70 via-purple-400/60 to-fuchsia-400/70 backdrop-blur-sm p-4">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-white" />
          <h3 className="font-semibold text-white">Minute-by-Minute Forecast</h3>
        </div>
      </div>

      {/* Content */}
      <div className="bg-background/50 backdrop-blur-md p-4">
        {rainSoon && minutesUntilRain && (
          <div className="mb-3 p-2 rounded-xl bg-gradient-to-r from-primary/20 to-accent/10 border border-primary/20 flex items-center gap-2">
            <Droplets className="h-4 w-4 text-primary" />
            <span className="text-sm text-primary font-medium">
              Rain expected in {minutesUntilRain} {minutesUntilRain === 1 ? 'minute' : 'minutes'}
            </span>
          </div>
        )}
        
        <div className="space-y-1">
          {nextMinutes.map((minute, index) => {
            const time = new Date(minute.time);
            const timeStr = time.toLocaleTimeString('en-US', { 
              hour: 'numeric', 
              minute: '2-digit' 
            });
            
            return (
              <div 
                key={index}
                className="flex items-center justify-between py-1 text-xs"
              >
                <span className="text-muted-foreground">{timeStr}</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-muted rounded-full h-1.5 overflow-hidden">
                    <div 
                      className="h-full bg-primary transition-all"
                      style={{ width: `${Math.min(minute.precipitationProbability, 100)}%` }}
                    />
                  </div>
                  <span className="text-foreground w-12 text-right">
                    {minute.precipitationProbability}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
