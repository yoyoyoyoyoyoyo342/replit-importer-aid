import React from "react";

interface PollenData {
  alder: number;
  birch: number;
  grass: number;
  mugwort: number;
  olive: number;
  ragweed: number;
}

interface PollenWheelProps {
  pollenData: PollenData;
}

interface SeasonalPollen {
  name: string;
  value: number;
  color: string;
  months: number[]; // Array of month numbers (0-11)
}

export function PollenWheel({ pollenData }: PollenWheelProps) {
  const allPollens: SeasonalPollen[] = [
    {
      name: "Alder",
      value: pollenData.alder,
      color: "hsl(25 95% 53%)", // Orange
      months: [0, 1, 2, 3] // Jan-Apr
    },
    {
      name: "Birch",
      value: pollenData.birch,
      color: "hsl(142 71% 45%)", // Green
      months: [2, 3, 4] // Mar-May
    },
    {
      name: "Grass",
      value: pollenData.grass,
      color: "hsl(120 60% 50%)", // Bright green
      months: [4, 5, 6, 7, 8] // May-Sep
    },
    {
      name: "Mugwort",
      value: pollenData.mugwort,
      color: "hsl(280 70% 55%)", // Purple
      months: [6, 7, 8] // Jul-Sep
    },
    {
      name: "Olive",
      value: pollenData.olive,
      color: "hsl(47 96% 53%)", // Yellow
      months: [3, 4, 5] // Apr-Jun
    },
    {
      name: "Ragweed",
      value: pollenData.ragweed,
      color: "hsl(15 80% 50%)", // Red-orange
      months: [7, 8, 9] // Aug-Oct
    }
  ];

  // Show all pollens regardless of season
  const activePollens = allPollens;

  const getIntensityRadius = (value: number) => {
    return 20 + (value * 15); // Base radius 20px, add up to 60px for max intensity
  };

  const getIntensityLabel = (value: number) => {
    if (value === 0) return "No risk";
    if (value === 1) return "Low";
    if (value === 2) return "Medium";
    if (value === 3) return "High";
    return "Very High";
  };

  if (activePollens.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-neutral-500 mb-2">🌿</div>
        <div className="text-sm text-neutral-600">No pollen data available</div>
      </div>
    );
  }

  const angleStep = 360 / activePollens.length;
  const centerX = 120;
  const centerY = 120;
  const baseRadius = 60;

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <svg width="240" height="240" className="overflow-visible">
          {/* Center circle */}
          <circle
            cx={centerX}
            cy={centerY}
            r="25"
            fill="hsl(var(--muted))"
            className="opacity-20"
          />
          
          {/* Pollen circles */}
          {activePollens.map((pollen, index) => {
            const angle = (index * angleStep - 90) * (Math.PI / 180); // -90 to start at top
            const x = centerX + Math.cos(angle) * baseRadius;
            const y = centerY + Math.sin(angle) * baseRadius;
            const radius = getIntensityRadius(pollen.value);
            
            return (
              <g key={pollen.name}>
                {/* Connection line */}
                <line
                  x1={centerX}
                  y1={centerY}
                  x2={x}
                  y2={y}
                  stroke="hsl(var(--muted-foreground))"
                  strokeWidth="1"
                  className="opacity-30"
                />
                
                {/* Pollen circle */}
                <circle
                  cx={x}
                  cy={y}
                  r={radius}
                  fill={pollen.color}
                  className="opacity-80"
                />
                
                {/* Value text */}
                <text
                  x={x}
                  y={y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="14"
                  fontWeight="600"
                  fill="white"
                >
                  {pollen.value}
                </text>
                
                {/* Label */}
                <text
                  x={x}
                  y={y + radius + 16}
                  textAnchor="middle"
                  fontSize="12"
                  fill="hsl(var(--foreground))"
                  className="font-medium"
                >
                  {pollen.name}
                </text>
              </g>
            );
          })}
          
          {/* Center text */}
          <text
            x={centerX}
            y={centerY - 5}
            textAnchor="middle"
            fontSize="10"
            fill="hsl(var(--muted-foreground))"
            fontWeight="500"
          >
            POLLEN
          </text>
          <text
            x={centerX}
            y={centerY + 8}
            textAnchor="middle"
            fontSize="10"
            fill="hsl(var(--muted-foreground))"
            fontWeight="500"
          >
            INDEX
          </text>
        </svg>
      </div>
      
      {/* Legend */}
      <div className="mt-4 text-center">
        <div className="text-xs text-neutral-600 mb-2">
          All pollen types
        </div>
        <div className="text-xs text-neutral-500">
          Size indicates intensity: 0 = No risk, 1 = Low, 2 = Medium, 3 = High, 4+ = Very High
        </div>
      </div>
    </div>
  );
}