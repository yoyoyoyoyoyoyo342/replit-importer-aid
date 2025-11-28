import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Gauge, TrendingUp, TrendingDown, Minus, Smartphone } from "lucide-react";
import { useBarometer } from "@/hooks/use-barometer";

export function BarometerCard() {
  const { pressureData, isSupported, permissionGranted, requestPermission } = useBarometer();

  if (!isSupported) {
    return null; // Don't show card if device doesn't support barometer
  }

  const getTrendIcon = () => {
    if (!pressureData?.trend) return <Minus className="h-5 w-5 text-muted-foreground" />;
    
    switch (pressureData.trend) {
      case "rising":
        return <TrendingUp className="h-5 w-5 text-green-500" />;
      case "falling":
        return <TrendingDown className="h-5 w-5 text-orange-500" />;
      case "stable":
        return <Minus className="h-5 w-5 text-blue-500" />;
      default:
        return <Minus className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getTrendMessage = () => {
    if (!pressureData?.trend) return "Collecting data...";
    
    switch (pressureData.trend) {
      case "rising":
        return "Pressure rising - improving weather likely";
      case "falling":
        return "Pressure falling - weather may worsen";
      case "stable":
        return "Pressure stable - no immediate changes";
      default:
        return "Monitoring pressure changes";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gauge className="h-5 w-5" />
          Barometer (Device)
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!permissionGranted ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Smartphone className="h-4 w-4" />
              <p>Use your iPhone's built-in barometer to predict weather changes</p>
            </div>
            <Button onClick={requestPermission} className="w-full">
              Enable Barometer
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold">
                  {pressureData ? `${pressureData.pressure.toFixed(1)}` : "---"}
                  <span className="text-lg font-normal text-muted-foreground ml-1">hPa</span>
                </p>
                <p className="text-sm text-muted-foreground mt-1">Atmospheric Pressure</p>
              </div>
              <div className="flex flex-col items-center">
                {getTrendIcon()}
                <p className="text-xs text-muted-foreground mt-1 capitalize">
                  {pressureData?.trend || "---"}
                </p>
              </div>
            </div>
            
            <div className="p-3 bg-secondary/20 rounded-lg">
              <p className="text-sm">{getTrendMessage()}</p>
            </div>

            <div className="text-xs text-muted-foreground">
              <p>• Rapidly falling pressure → storms approaching</p>
              <p>• Rising pressure → clearing skies ahead</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
