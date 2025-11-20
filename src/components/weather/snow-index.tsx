import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Snowflake } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";

interface SnowIndexProps {
  snowData?: {
    snowfall: number;
    snowDepth: number;
    temperature: number;
    windChill: number;
    iceRisk: number;
  };
}

export function SnowIndex({ snowData }: SnowIndexProps) {
  const { t } = useLanguage();

  if (!snowData) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Snowflake className="w-5 h-5" />
            {t('snow.snowIndex') || 'Snow Index'}
          </CardTitle>
          <CardDescription>{t('snow.liveData') || 'Live winter conditions'}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            <div>{t('snow.noData') || 'No snow data available'}</div>
            <div className="text-xs mt-1">{t('snow.locationRequired') || 'Location required'}</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getSnowfallLevel = (value: number) => {
    if (value === 0) return { label: t('snow.noSnow') || 'No Snow', color: 'bg-green-500' };
    if (value < 0.5) return { label: t('snow.light') || 'Light', color: 'bg-blue-300' };
    if (value < 2) return { label: t('snow.moderate') || 'Moderate', color: 'bg-blue-500' };
    if (value < 6) return { label: t('snow.heavy') || 'Heavy', color: 'bg-blue-700' };
    return { label: t('snow.extreme') || 'Extreme', color: 'bg-purple-700' };
  };

  const getIceRiskLevel = (value: number) => {
    if (value < 20) return { label: t('snow.lowRisk') || 'Low Risk', color: 'bg-green-500' };
    if (value < 50) return { label: t('snow.mediumRisk') || 'Medium Risk', color: 'bg-yellow-500' };
    if (value < 80) return { label: t('snow.highRisk') || 'High Risk', color: 'bg-orange-500' };
    return { label: t('snow.extremeRisk') || 'Extreme Risk', color: 'bg-red-500' };
  };

  const snowfallLevel = getSnowfallLevel(snowData.snowfall);
  const iceRiskLevel = getIceRiskLevel(snowData.iceRisk);

  const snowMetrics = [
    {
      name: t('snow.snowfall') || 'Snowfall',
      value: `${snowData.snowfall}"`,
      level: snowfallLevel,
      icon: '❄️'
    },
    {
      name: t('snow.snowDepth') || 'Snow Depth',
      value: `${snowData.snowDepth}"`,
      level: getSnowfallLevel(snowData.snowDepth),
      icon: '🌨️'
    },
    {
      name: t('snow.iceRisk') || 'Ice Risk',
      value: `${snowData.iceRisk}%`,
      level: iceRiskLevel,
      icon: '🧊'
    },
    {
      name: t('snow.windChill') || 'Wind Chill',
      value: `${Math.round(snowData.windChill)}°`,
      level: { 
        label: snowData.windChill < 0 ? (t('snow.dangerousCold') || 'Dangerous') : (t('snow.cold') || 'Cold'), 
        color: snowData.windChill < 0 ? 'bg-purple-700' : 'bg-blue-500' 
      },
      icon: '🌬️'
    }
  ];

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Snowflake className="w-5 h-5 animate-spin-slow" />
          {t('snow.snowIndex') || 'Snow Index'}
        </CardTitle>
        <CardDescription>{t('snow.liveData') || 'Live winter conditions'}</CardDescription>
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
            <span className="text-sm font-medium">{t('snow.advisory') || 'Winter Advisory'}</span>
          </div>
          <p className="text-xs text-muted-foreground">
            {snowData.snowfall > 2 
              ? (t('snow.heavySnowWarning') || '⚠️ Heavy snowfall expected. Travel not recommended.')
              : snowData.iceRisk > 50
              ? (t('snow.iceWarning') || '⚠️ Icy conditions likely. Drive carefully.')
              : snowData.windChill < 0
              ? (t('snow.coldWarning') || '🥶 Dangerous wind chill. Limit outdoor exposure.')
              : (t('snow.safeConditions') || '✅ Winter conditions manageable.')}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
