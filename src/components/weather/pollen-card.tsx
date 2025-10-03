import { Leaf } from "lucide-react";
import { PollenWheel } from "./pollen-wheel";

interface PollenCardProps {
  pollenData?: {
    alder: number;
    birch: number;
    grass: number;
    mugwort: number;
    olive: number;
    ragweed: number;
  };
}

export function PollenCard({ pollenData }: PollenCardProps) {
  if (!pollenData) return null;

  // Calculate average pollen level for color gradient
  const avgPollen = (pollenData.alder + pollenData.birch + pollenData.grass + 
                     pollenData.mugwort + pollenData.olive + pollenData.ragweed) / 6;
  
  // Determine gradient colors based on pollen level
  const getGradientColors = () => {
    if (avgPollen < 1) return "from-green-500/20 to-emerald-500/20"; // Low
    if (avgPollen < 3) return "from-yellow-500/20 to-amber-500/20"; // Moderate
    if (avgPollen < 5) return "from-orange-500/20 to-red-500/20"; // High
    return "from-red-500/20 to-purple-500/20"; // Very High
  };

  const getBorderColor = () => {
    if (avgPollen < 1) return "border-green-500/30";
    if (avgPollen < 3) return "border-yellow-500/30";
    if (avgPollen < 5) return "border-orange-500/30";
    return "border-red-500/30";
  };

  return (
    <div className="p-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-primary/20 rounded-lg">
          <Leaf className="text-primary w-4 h-4" />
        </div>
        <h3 className="font-semibold text-card-foreground text-sm">Pollen Index</h3>
      </div>
      <PollenWheel pollenData={pollenData} />
    </div>
  );
}