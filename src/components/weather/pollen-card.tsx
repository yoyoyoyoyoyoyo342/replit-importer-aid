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
  userId?: string;
}

export function PollenCard({ pollenData, userId }: PollenCardProps) {
  if (!pollenData) return null;

  return (
    <div className="glass-card rounded-2xl shadow-lg border border-border p-4">
      <PollenWheel pollenData={pollenData} userId={userId} />
    </div>
  );
}