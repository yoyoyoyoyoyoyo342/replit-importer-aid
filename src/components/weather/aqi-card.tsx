import { Wind, Lock } from "lucide-react";
import { AQIData } from "@/types/hyperlocal-weather";
import { useSubscription } from "@/hooks/use-subscription";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface AQICardProps {
  data: AQIData;
}

const getAQILevel = (aqi: number) => {
  if (aqi <= 50) return { label: "Good", color: "text-blue-500", bg: "bg-blue-500/20" };
  if (aqi <= 100) return { label: "Moderate", color: "text-yellow-500", bg: "bg-yellow-500/20" };
  if (aqi <= 150) return { label: "Unhealthy for Sensitive", color: "text-orange-500", bg: "bg-orange-500/20" };
  if (aqi <= 200) return { label: "Unhealthy", color: "text-red-500", bg: "bg-red-500/20" };
  if (aqi <= 300) return { label: "Very Unhealthy", color: "text-purple-500", bg: "bg-purple-500/20" };
  return { label: "Hazardous", color: "text-red-900", bg: "bg-red-900/20" };
};

export function AQICard({ data }: AQICardProps) {
  const { isSubscribed } = useSubscription();
  const navigate = useNavigate();

  if (!data) return null;

  // Premium-only feature
  if (!isSubscribed) {
    return (
      <div className="overflow-hidden rounded-2xl shadow-xl border-0 relative">
        <div className="bg-gradient-to-r from-teal-300/70 via-cyan-400/60 to-blue-400/70 backdrop-blur-sm p-4">
          <div className="flex items-center gap-2">
            <Wind className="w-5 h-5 text-white" />
            <h3 className="font-semibold text-white">Air Quality Index</h3>
            <Lock className="w-4 h-4 text-white/80 ml-auto" />
          </div>
        </div>
        <div className="bg-background/50 backdrop-blur-md p-6 text-center">
          <Lock className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
          <h4 className="font-semibold mb-2">Premium Feature</h4>
          <p className="text-sm text-muted-foreground mb-4">
            Get detailed air quality data and pollutant breakdowns with Premium.
          </p>
          <Button size="sm" onClick={() => navigate("/subscription")}>
            Upgrade to Premium
          </Button>
        </div>
      </div>
    );
  }

  const level = getAQILevel(data.value);

  return (
    <div className="overflow-hidden rounded-2xl shadow-xl border-0">
      {/* Header with softer gradient */}
      <div className="bg-gradient-to-r from-teal-300/70 via-cyan-400/60 to-blue-400/70 backdrop-blur-sm p-4">
        <div className="flex items-center gap-2">
          <Wind className="w-5 h-5 text-white" />
          <h3 className="font-semibold text-white">Air Quality Index</h3>
        </div>
      </div>

      {/* Content */}
      <div className="bg-background/50 backdrop-blur-md p-4">
        <div className="flex items-center gap-4 mb-4">
          <div className={`${level.bg} p-4 rounded-xl`}>
            <div className={`text-3xl font-bold ${level.color}`}>
              {data.value}
            </div>
          </div>
          <div>
            <div className={`font-semibold ${level.color}`}>{level.label}</div>
            <div className="text-xs text-muted-foreground">US EPA Index</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-2 rounded-xl bg-gradient-to-br from-primary/10 to-accent/5 border border-border/50">
            <div className="text-muted-foreground">PM2.5</div>
            <div className="font-semibold">{data.pm25.toFixed(1)} μg/m³</div>
          </div>
          <div className="p-2 rounded-xl bg-gradient-to-br from-primary/10 to-accent/5 border border-border/50">
            <div className="text-muted-foreground">PM10</div>
            <div className="font-semibold">{data.pm10.toFixed(1)} μg/m³</div>
          </div>
          <div className="p-2 rounded-xl bg-gradient-to-br from-primary/10 to-accent/5 border border-border/50">
            <div className="text-muted-foreground">O₃</div>
            <div className="font-semibold">{data.o3.toFixed(1)} μg/m³</div>
          </div>
          <div className="p-2 rounded-xl bg-gradient-to-br from-primary/10 to-accent/5 border border-border/50">
            <div className="text-muted-foreground">NO₂</div>
            <div className="font-semibold">{data.no2.toFixed(1)} μg/m³</div>
          </div>
        </div>
      </div>
    </div>
  );
}
