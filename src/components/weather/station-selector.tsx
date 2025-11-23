import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Radio, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface WeatherStation {
  name: string;
  region: string;
  country: string;
  latitude: number;
  longitude: number;
  distance: number;
  reliability: number;
}

interface StationSelectorProps {
  stations: WeatherStation[];
  isImperial: boolean;
  onSelectStation: (lat: number, lon: number, name: string) => void;
  onCancel: () => void;
}

export function StationSelector({ stations, isImperial, onSelectStation, onCancel }: StationSelectorProps) {
  const formatDistance = (km: number) => {
    if (isImperial) {
      const miles = km * 0.621371;
      return `${miles.toFixed(1)} mi`;
    }
    return `${km.toFixed(1)} km`;
  };

  const getReliabilityColor = (reliability: number) => {
    if (reliability >= 0.85) return "bg-green-500";
    if (reliability >= 0.75) return "bg-yellow-500";
    return "bg-orange-500";
  };

  const getReliabilityLabel = (reliability: number) => {
    if (reliability >= 0.85) return "High";
    if (reliability >= 0.75) return "Medium";
    return "Moderate";
  };

  return (
    <Card className="p-4 mb-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Select Weather Station</h3>
        </div>
        <Button variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
      </div>

      <p className="text-sm text-muted-foreground mb-4">
        Choose the nearest weather station for the most accurate data
      </p>

      <div className="space-y-3">
        {stations.map((station, index) => (
          <Card
            key={index}
            className="p-3 cursor-pointer hover:bg-accent/50 transition-colors"
            onClick={() => onSelectStation(station.latitude, station.longitude, station.name)}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Radio className="w-4 h-4 text-primary" />
                  <h4 className="font-semibold text-sm">{station.name}</h4>
                  {index === 0 && (
                    <Badge variant="secondary" className="text-xs">
                      Nearest
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {station.region && `${station.region}, `}
                  {station.country}
                </p>
              </div>

              <div className="text-right space-y-1">
                <div className="flex items-center gap-1 justify-end">
                  <div className={`w-2 h-2 rounded-full ${getReliabilityColor(station.reliability)}`} />
                  <span className="text-xs font-medium">
                    {getReliabilityLabel(station.reliability)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatDistance(station.distance)} away
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <p className="text-xs text-muted-foreground mt-4">
        Reliability is based on station proximity and data quality
      </p>
    </Card>
  );
}
