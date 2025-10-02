import { Card, CardContent } from "@/components/ui/card";
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

  return (
    <Card className="rounded border border-border">
      <CardContent className="p-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-primary/20 rounded-lg">
            <Leaf className="text-primary w-4 h-4" />
          </div>
          <h3 className="font-semibold text-card-foreground text-sm">Pollen Index</h3>
        </div>
        <PollenWheel pollenData={pollenData} />
      </CardContent>
    </Card>
  );
}