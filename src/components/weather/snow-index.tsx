import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Snowflake } from "lucide-react";

interface SnowIndexProps {
  snowData?: {
    snowfall: number; // inches
    snowDepth: number; // inches
    temperature: number; // fahrenheit
    windChill: number; // fahrenheit
    iceRisk: number; // percentage
    snowIntensity?: number; // inches/hour from Tomorrow.io
    snowAccumulation?: number; // inches from Tomorrow.io
    iceAccumulation?: number; // inches from Tomorrow.io
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

  const getSnowfallLevel = (valueInInches: number) => {
    if (valueInInches === 0) return { label: 'No Snow', color: 'bg-blue-500' };
    if (valueInInches < 0.5) return { label: 'Light', color: 'bg-blue-300' };
    if (valueInInches < 2) return { label: 'Moderate', color: 'bg-blue-500' };
    if (valueInInches < 6) return { label: 'Heavy', color: 'bg-blue-700' };
    return { label: 'Extreme', color: 'bg-purple-700' };
  };

  const getIceRiskLevel = (value: number) => {
    if (value < 20) return { label: 'Low Risk', color: 'bg-blue-500' };
    if (value < 50) return { label: 'Medium Risk', color: 'bg-yellow-500' };
    if (value < 80) return { label: 'High Risk', color: 'bg-orange-500' };
    return { label: 'Extreme Risk', color: 'bg-red-500' };
  };

  // Use Tomorrow.io data if available, otherwise fall back to Open-Meteo
  const actualSnowfall = snowData.snowIntensity !== undefined && snowData.snowIntensity > 0 
    ? snowData.snowIntensity 
    : snowData.snowfall;
  
  const actualSnowDepth = snowData.snowAccumulation !== undefined && snowData.snowAccumulation > 0
    ? snowData.snowAccumulation
    : snowData.snowDepth;

  // Calculate ice risk from Tomorrow.io data or use provided value
  const calculatedIceRisk = snowData.iceAccumulation !== undefined && snowData.iceAccumulation > 0
    ? Math.min(100, snowData.iceAccumulation * 100) // Convert accumulation to percentage
    : snowData.iceRisk;

  const snowfallLevel = getSnowfallLevel(actualSnowfall);
  const iceRiskLevel = getIceRiskLevel(calculatedIceRisk);

  const unit = isImperial ? '"' : 'cm';
  const tempUnit = isImperial ? '°F' : '°C';

  const snowfallDisplay = isImperial
    ? actualSnowfall
    : actualSnowfall * 2.54; // inches -> cm

  const snowDepthDisplay = isImperial
    ? actualSnowDepth
    : actualSnowDepth * 2.54; // inches -> cm
  
  // Convert temperature and wind chill from Fahrenheit to Celsius if needed
  const temperatureDisplay = isImperial
    ? snowData.temperature
    : (snowData.temperature - 32) * 5 / 9;
  
  const windChillDisplay = isImperial
    ? snowData.windChill
    : (snowData.windChill - 32) * 5 / 9;
  
  const snowMetrics = [
    {
      name: 'Snowfall',
      value: `${snowfallDisplay.toFixed(1)}${unit}`,
      level: snowfallLevel,
      icon: '❄️'
    },
    {
      name: 'Snow Depth',
      value: `${snowDepthDisplay.toFixed(1)}${unit}`,
      level: getSnowfallLevel(actualSnowDepth),
      icon: '🌨️'
    },
    {
      name: 'Ice Risk',
      value: `${Math.round(calculatedIceRisk)}%`,
      level: iceRiskLevel,
      icon: '🧊'
    },
    {
      name: 'Wind Chill',
      value: `${Math.round(windChillDisplay)}${tempUnit}`,
      level: { 
        label: windChillDisplay < (isImperial ? 0 : -18) ? 'Dangerous' : 'Cold', 
        color: windChillDisplay < (isImperial ? 0 : -18) ? 'bg-purple-700' : 'bg-blue-500' 
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
