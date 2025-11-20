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

  // Determine if we're in winter season (November 20th to February)
  const now = new Date();
  const currentMonth = now.getMonth(); // 0-11
  const currentDate = now.getDate();
  const isWinterSeason = 
    (currentMonth === 10 && currentDate >= 20) || // November 20th onwards
    currentMonth === 11 || // December
    currentMonth === 0 || // January
    currentMonth === 1; // February

  // If it's winter and we have temperature data, show snow index instead
  if (isWinterSeason && temperature !== undefined) {
    // Use Tomorrow.io hyperlocal data if available, otherwise fall back to Open-Meteo
    let effectiveSnowfall = snowfall || 0;
    let effectiveSnowDepth = snowDepth || 0;
    let effectiveIceRisk = temperature <= 32 ? Math.min(100, (32 - temperature) * 8) : 0;

    // Prioritize Tomorrow.io data
    if (hyperlocalSnow?.snowIntensity !== undefined && hyperlocalSnow.snowIntensity > 0) {
      effectiveSnowfall = hyperlocalSnow.snowIntensity;
    }
    
    if (hyperlocalSnow?.snowAccumulation !== undefined && hyperlocalSnow.snowAccumulation > 0) {
      effectiveSnowDepth = hyperlocalSnow.snowAccumulation;
    }

    if (hyperlocalSnow?.iceAccumulation !== undefined && hyperlocalSnow.iceAccumulation > 0) {
      effectiveIceRisk = Math.min(100, hyperlocalSnow.iceAccumulation * 100);
    }

    // If API snowfall is zero but condition says snow, assume light snow
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

    return (
      <div className="glass-card rounded-2xl shadow-lg border border-border p-4">
        <SnowIndex snowData={snowData} isImperial={isImperial} />
      </div>
    );
  }

  return (
    <div className="glass-card rounded-2xl shadow-lg border border-border p-4">
      <PollenWheel pollenData={pollenData} userId={userId} />
    </div>
  );
}