import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { WeatherAlert } from "@/lib/weather-alerts";
import { AlertTriangle, AlertCircle, Info } from "lucide-react";

interface WinterAlertsProps {
  alerts: WeatherAlert[];
}

export function WinterAlerts({ alerts }: WinterAlertsProps) {
  if (!alerts || alerts.length === 0) return null;

  // Filter for winter-specific alerts
  const winterAlerts = alerts.filter(alert => 
    alert.id.includes('snow') || 
    alert.id.includes('ice') || 
    alert.id.includes('windchill') || 
    alert.id.includes('blizzard')
  );

  if (winterAlerts.length === 0) return null;

  const getSeverityStyles = (severity: string) => {
    switch (severity) {
      case "extreme":
        return "border-destructive bg-destructive/10 text-destructive";
      case "high":
        return "border-orange-500 bg-orange-500/10 text-orange-700 dark:text-orange-400";
      case "moderate":
        return "border-yellow-500 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400";
      default:
        return "border-blue-500 bg-blue-500/10 text-blue-700 dark:text-blue-400";
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "extreme":
        return <AlertTriangle className="h-4 w-4" />;
      case "high":
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-3 mb-4">
      {winterAlerts.map((alert) => (
        <Alert 
          key={alert.id} 
          className={getSeverityStyles(alert.severity)}
        >
          <div className="flex items-start gap-3">
            <span className="text-2xl mt-0.5">{alert.icon}</span>
            <div className="flex-1">
              <AlertTitle className="flex items-center gap-2 mb-1">
                {getSeverityIcon(alert.severity)}
                {alert.title}
              </AlertTitle>
              <AlertDescription className="text-sm">
                {alert.description}
              </AlertDescription>
            </div>
          </div>
        </Alert>
      ))}
    </div>
  );
}
