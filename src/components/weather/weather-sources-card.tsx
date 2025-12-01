import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Database, CheckCircle2, AlertCircle } from "lucide-react";
import { WeatherSource } from "@/types/weather";

interface WeatherSourcesCardProps {
  sources: WeatherSource[];
}

export function WeatherSourcesCard({ sources }: WeatherSourcesCardProps) {
  if (!sources || sources.length === 0) return null;

  // Calculate model agreement (how similar are the temperatures)
  const temps = sources.map(s => s.currentWeather.temperature);
  const avgTemp = temps.reduce((a, b) => a + b, 0) / temps.length;
  const maxDeviation = Math.max(...temps.map(t => Math.abs(t - avgTemp)));
  const agreement = Math.max(0, 100 - (maxDeviation * 10)); // 1°F deviation = 10% reduction

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 0.92) return "bg-blue-100 text-blue-700 border-blue-300";
    if (accuracy >= 0.88) return "bg-yellow-100 text-yellow-700 border-yellow-300";
    return "bg-orange-100 text-orange-700 border-orange-300";
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Data Sources
          </CardTitle>
          <Badge variant="outline" className={agreement > 80 ? "bg-blue-100 text-blue-700" : "bg-yellow-100 text-yellow-700"}>
            {agreement > 80 ? <CheckCircle2 className="w-3 h-3 mr-1" /> : <AlertCircle className="w-3 h-3 mr-1" />}
            {Math.round(agreement)}% Agreement
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sources.map((source, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm">{source.source}</span>
                  <Badge variant="outline" className={`text-xs ${getAccuracyColor(source.accuracy)}`}>
                    {Math.round(source.accuracy * 100)}% accurate
                  </Badge>
                </div>
                {source.stationInfo && (
                  <p className="text-xs text-muted-foreground">
                    {source.stationInfo.name}, {source.stationInfo.region}
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="text-lg font-bold">{source.currentWeather.temperature}°F</p>
                <p className="text-xs text-muted-foreground">{source.currentWeather.condition}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t">
          <p className="text-xs text-muted-foreground">
            Rainz combines forecasts from multiple weather models (ECMWF, GFS, DWD ICON) to provide more accurate predictions.
            Model agreement indicates how certain the forecast is.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
