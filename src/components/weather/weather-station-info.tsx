import { Radio } from "lucide-react";
import { Card } from "@/components/ui/card";

interface StationInfo {
  name: string;
  region: string;
  country: string;
  localtime: string;
}

interface WeatherStationInfoProps {
  stationInfo?: StationInfo;
}

export function WeatherStationInfo({ stationInfo }: WeatherStationInfoProps) {
  if (!stationInfo) return null;

  return (
    <Card className="p-3 mb-4 bg-muted/50">
      <div className="flex items-center gap-2">
        <Radio className="w-4 h-4 text-primary" />
        <div className="flex-1">
          <p className="text-sm font-medium">
            Weather Station: {stationInfo.name}
          </p>
          <p className="text-xs text-muted-foreground">
            {stationInfo.region && `${stationInfo.region}, `}
            {stationInfo.country}
          </p>
        </div>
      </div>
    </Card>
  );
}
