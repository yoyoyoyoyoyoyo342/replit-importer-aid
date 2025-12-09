import { PollenWheel } from "./pollen-wheel";
import { SnowIndex } from "./snow-index";

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
  temperature?: number;
  windSpeed?: number;
  feelsLike?: number;
  snowfall?: number;
  snowDepth?: number;
  condition?: string;
  isImperial?: boolean;
  hyperlocalSnow?: {
    snowIntensity?: number;
    snowAccumulation?: number;
    iceAccumulation?: number;
    temperature?: number;
    windChill?: number;
  };
}

export function PollenCard({ pollenData, userId, temperature, windSpeed, feelsLike, snowfall, snowDepth, condition, isImperial = false, hyperlocalSnow }: PollenCardProps) {
  if (!pollenData) return null;

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentDate = now.getDate();
  const isWinterSeason = 
    (currentMonth === 10 && currentDate >= 20) ||
    currentMonth === 11 ||
    currentMonth === 0 ||
    currentMonth === 1;

  if (isWinterSeason && temperature !== undefined) {
    let effectiveSnowfall = snowfall || 0;
    let effectiveSnowDepth = snowDepth || 0;
    let effectiveIceRisk = temperature <= 32 ? Math.min(100, (32 - temperature) * 8) : 0;

    if (hyperlocalSnow?.snowIntensity !== undefined && hyperlocalSnow.snowIntensity > 0) {
      effectiveSnowfall = hyperlocalSnow.snowIntensity;
    }
    
    if (hyperlocalSnow?.snowAccumulation !== undefined && hyperlocalSnow.snowAccumulation > 0) {
      effectiveSnowDepth = hyperlocalSnow.snowAccumulation;
    }

    if (hyperlocalSnow?.iceAccumulation !== undefined && hyperlocalSnow.iceAccumulation > 0) {
      effectiveIceRisk = Math.min(100, hyperlocalSnow.iceAccumulation * 100);
    }

    if (effectiveSnowfall === 0 && condition?.toLowerCase().includes("snow")) {
      effectiveSnowfall = isImperial ? 0.1 : 0.25;
    }

    const snowData = {
      snowfall: effectiveSnowfall,
      snowDepth: effectiveSnowDepth,
      temperature: hyperlocalSnow?.temperature || temperature,
      windChill: hyperlocalSnow?.windChill || feelsLike || temperature,
      iceRisk: effectiveIceRisk,
      snowIntensity: hyperlocalSnow?.snowIntensity,
      snowAccumulation: hyperlocalSnow?.snowAccumulation,
      iceAccumulation: hyperlocalSnow?.iceAccumulation,
    };

    return <SnowIndex snowData={snowData} isImperial={isImperial} />;
  }

  return (
    <div className="overflow-hidden rounded-2xl shadow-xl border-0">
      <div className="bg-gradient-to-r from-green-300/70 via-emerald-400/60 to-teal-400/70 backdrop-blur-sm p-4">
        <h3 className="font-semibold text-white">Pollen Index</h3>
      </div>
      <div className="bg-background/50 backdrop-blur-md p-4">
        <PollenWheel pollenData={pollenData} userId={userId} />
      </div>
    </div>
  );
}
