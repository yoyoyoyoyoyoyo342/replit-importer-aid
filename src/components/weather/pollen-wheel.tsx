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

  const getIntensityLabel = (value: number) => {
    if (value === 0) return "No risk";
    if (value === 1) return "Low";
    if (value === 2) return "Medium";
    if (value === 3) return "High";
    return "Very High";
  };

  const getTotalValue = () => {
    return activePollens.reduce((sum, pollen) => sum + pollen.value, 0);
  };

  const getOverallLevel = () => {
    const total = getTotalValue();
    const average = total / activePollens.length;
    return getIntensityLabel(Math.round(average));
  };

  if (activePollens.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-neutral-500 mb-2">🌿</div>
        <div className="text-sm text-neutral-600">No pollen data available</div>
      </div>
    );
  }

  const centerX = 120;
  const centerY = 120;
  const outerRadius = 80;
  const innerRadius = 50;
  const strokeWidth = 30;

  // Calculate segments
  const total = activePollens.reduce((sum, pollen) => sum + Math.max(pollen.value, 0.5), 0);
  let currentAngle = -90; // Start at top

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <svg width="240" height="240" className="overflow-visible">
          {/* Background circle */}
          <circle
            cx={centerX}
            cy={centerY}
            r={outerRadius - strokeWidth/2}
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth={strokeWidth}
            className="opacity-20"
          />
          
          {/* Pollen segments */}
          {activePollens.map((pollen, index) => {
            const segmentValue = Math.max(pollen.value, 0.5);
            const segmentAngle = (segmentValue / total) * 360;
            
            const startAngle = currentAngle;
            const endAngle = currentAngle + segmentAngle;
            
            const startAngleRad = (startAngle * Math.PI) / 180;
            const endAngleRad = (endAngle * Math.PI) / 180;
            
            const radius = outerRadius - strokeWidth/2;
            
            const x1 = centerX + Math.cos(startAngleRad) * radius;
            const y1 = centerY + Math.sin(startAngleRad) * radius;
            const x2 = centerX + Math.cos(endAngleRad) * radius;
            const y2 = centerY + Math.sin(endAngleRad) * radius;
            
            const largeArcFlag = segmentAngle > 180 ? 1 : 0;
            
            const pathData = [
              `M ${centerX} ${centerY}`,
              `L ${x1} ${y1}`,
              `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
              'Z'
            ].join(' ');
            
            // Position for label
            const labelAngle = (startAngle + segmentAngle / 2) * Math.PI / 180;
            const labelRadius = outerRadius + 20;
            const labelX = centerX + Math.cos(labelAngle) * labelRadius;
            const labelY = centerY + Math.sin(labelAngle) * labelRadius;
            
            currentAngle = endAngle;
            
            return (
              <g key={pollen.name}>
                {/* Segment */}
                <path
                  d={pathData}
                  fill={pollen.color}
                  className="opacity-80"
                />
                
                {/* Label */}
                <text
                  x={labelX}
                  y={labelY - 8}
                  textAnchor="middle"
                  fontSize="10"
                  fill="hsl(var(--foreground))"
                  className="font-medium"
                >
                  {pollen.name}
                </text>
                <text
                  x={labelX}
                  y={labelY + 4}
                  textAnchor="middle"
                  fontSize="12"
                  fill="hsl(var(--foreground))"
                  className="font-semibold"
                >
                  {pollen.value}
                </text>
              </g>
            );
          })}
          
          {/* Center circle */}
          <circle
            cx={centerX}
            cy={centerY}
            r={innerRadius}
            fill="hsl(var(--background))"
            stroke="hsl(var(--border))"
            strokeWidth="2"
          />
          
          {/* Center text */}
          <text
            x={centerX}
            y={centerY - 8}
            textAnchor="middle"
            fontSize="16"
            fill="hsl(var(--foreground))"
            fontWeight="600"
          >
            {getOverallLevel()}
          </text>
          <text
            x={centerX}
            y={centerY + 8}
            textAnchor="middle"
            fontSize="10"
            fill="hsl(var(--muted-foreground))"
            fontWeight="500"
          >
            Pollen Index
          </text>
        </svg>
      </div>
      
      {/* Legend */}
      <div className="mt-4 text-center">
        <div className="text-xs text-muted-foreground">
          Overall level based on all pollen types
        </div>
      </div>
    </div>
  );
}