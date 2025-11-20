import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Snowflake } from "lucide-react";

interface SnowIndexProps {
  snowData?: {
    snowfall: number;
    snowDepth: number;
    temperature: number;
    windChill: number;
    iceRisk: number;
  };
  isImperial?: boolean;
}

export function SnowIndex({ snowData, isImperial = false }: SnowIndexProps) {
  if (!snowData) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Snowflake className="w-5 h-5" />
            Snow Index
          </CardTitle>
          <CardDescription>Live winter conditions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            <div>No snow data available</div>
            <div className="text-xs mt-1">Location required</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getSnowfallLevel = (value: number) => {
    if (value === 0) return { label: 'No Snow', color: 'bg-green-500' };
    if (value < 0.5) return { label: 'Light', color: 'bg-blue-300' };
    if (value < 2) return { label: 'Moderate', color: 'bg-blue-500' };
    if (value < 6) return { label: 'Heavy', color: 'bg-blue-700' };
    return { label: 'Extreme', color: 'bg-purple-700' };
  };

  const getIceRiskLevel = (value: number) => {
    if (value < 20) return { label: 'Low Risk', color: 'bg-green-500' };
    if (value < 50) return { label: 'Medium Risk', color: 'bg-yellow-500' };
    if (value < 80) return { label: 'High Risk', color: 'bg-orange-500' };
    return { label: 'Extreme Risk', color: 'bg-red-500' };
  };

  const snowfallLevel = getSnowfallLevel(snowData.snowfall);
  const iceRiskLevel = getIceRiskLevel(snowData.iceRisk);

  const unit = isImperial ? '"' : 'cm';
  const tempUnit = isImperial ? '°F' : '°C';
  
  const snowMetrics = [
    {
      name: 'Snowfall',
      value: `${snowData.snowfall.toFixed(1)}${unit}`,
      level: snowfallLevel,
      icon: '❄️'
    },
    {
      name: 'Snow Depth',
      value: `${snowData.snowDepth.toFixed(1)}${unit}`,
      level: getSnowfallLevel(snowData.snowDepth),
      icon: '🌨️'
    },
    {
      name: 'Ice Risk',
      value: `${Math.round(snowData.iceRisk)}%`,
      level: iceRiskLevel,
      icon: '🧊'
    },
    {
      name: 'Wind Chill',
      value: `${Math.round(snowData.windChill)}${tempUnit}`,
      level: { 
        label: snowData.windChill < (isImperial ? 0 : -18) ? 'Dangerous' : 'Cold', 
        color: snowData.windChill < (isImperial ? 0 : -18) ? 'bg-purple-700' : 'bg-blue-500' 
      },
      icon: '🌬️'
    }
  ];

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Snowflake className="w-5 h-5 animate-spin-slow" />
          Snow Index
        </CardTitle>
        <CardDescription>Live winter conditions</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Snow metrics grid */}
        <div className="grid grid-cols-2 gap-3">
          {snowMetrics.map((metric, idx) => (
            <div 
              key={idx} 
              className="glass-card p-3 rounded-xl border border-border/50 hover:border-border transition-all hover:scale-105"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl">{metric.icon}</span>
                <Badge 
                  className={`${metric.level.color} text-white text-[10px] px-1.5 py-0.5`}
                >
                  {metric.level.label}
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground mb-1">{metric.name}</div>
              <div className="text-xl font-bold">{metric.value}</div>
            </div>
          ))}
        </div>

        {/* Overall winter advisory */}
        <div className="glass-card p-3 rounded-xl border border-border/50">
          <div className="flex items-center gap-2 mb-2">
            <Snowflake className="w-4 h-4" />
            <span className="text-sm font-medium">Winter Advisory</span>
          </div>
          <p className="text-xs text-muted-foreground">
            {snowData.snowfall > 2 
              ? '⚠️ Heavy snowfall expected. Travel not recommended.'
              : snowData.iceRisk > 50
              ? '⚠️ Icy conditions likely. Drive carefully.'
              : snowData.windChill < 0
              ? '🥶 Dangerous wind chill. Limit outdoor exposure.'
              : '✅ Winter conditions manageable.'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
