import { Badge } from "@/components/ui/badge";
import { TrendingUp, AlertCircle, CheckCircle2 } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";

interface ForecastConfidenceCardProps {
  ensembleData?: {
    hourly: {
      temperature: {
        median: number[];
        p10: number[];
        p90: number[];
      };
      time: string[];
    };
    confidence: "high" | "medium" | "low";
  };
  modelAgreement?: number; // 0-100 percentage
}

export function ForecastConfidenceCard({ ensembleData, modelAgreement }: ForecastConfidenceCardProps) {
  if (!ensembleData) return null;

  const confidenceConfig = {
    high: { color: "text-blue-600", bgColor: "bg-blue-100", icon: CheckCircle2, label: "High Confidence" },
    medium: { color: "text-yellow-600", bgColor: "bg-yellow-100", icon: AlertCircle, label: "Medium Confidence" },
    low: { color: "text-red-600", bgColor: "bg-red-100", icon: AlertCircle, label: "Low Confidence" },
  };

  const config = confidenceConfig[ensembleData.confidence];
  const Icon = config.icon;

  // Prepare chart data for next 24 hours
  const chartData = ensembleData.hourly.time.slice(0, 24).map((time, i) => ({
    time: new Date(time).toLocaleTimeString([], { hour: "2-digit" }),
    median: ensembleData.hourly.temperature.median[i],
    p10: ensembleData.hourly.temperature.p10[i],
    p90: ensembleData.hourly.temperature.p90[i],
  }));

  return (
    <div className="overflow-hidden rounded-2xl shadow-xl border-0">
      {/* Header with softer gradient */}
      <div className="bg-gradient-to-r from-emerald-300/70 via-teal-400/60 to-cyan-400/70 backdrop-blur-sm p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-white" />
            <h3 className="font-semibold text-white">Forecast Confidence</h3>
          </div>
          <Badge variant="outline" className={`${config.bgColor} ${config.color}`}>
            <Icon className="w-3 h-3 mr-1" />
            {config.label}
          </Badge>
        </div>
      </div>

      {/* Content */}
      <div className="bg-background/50 backdrop-blur-md p-4 space-y-4">
        {modelAgreement !== undefined && (
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">Model Agreement</span>
              <span className="font-medium">{modelAgreement}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  modelAgreement > 80 ? "bg-blue-500" : modelAgreement > 60 ? "bg-yellow-500" : "bg-red-500"
                }`}
                style={{ width: `${modelAgreement}%` }}
              />
            </div>
          </div>
        )}

        <div>
          <h4 className="text-sm font-medium mb-3">Temperature Uncertainty (24h)</h4>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="time" 
                tick={{ fontSize: 11 }}
                interval={2}
              />
              <YAxis 
                tick={{ fontSize: 11 }}
                domain={['dataMin - 5', 'dataMax + 5']}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
                formatter={(value: number) => [`${value}°F`, '']}
              />
              <Area 
                type="monotone" 
                dataKey="p10" 
                stackId="1"
                stroke="hsl(var(--primary))"
                fill="hsl(var(--primary) / 0.1)"
                name="Lower Bound"
              />
              <Area 
                type="monotone" 
                dataKey="p90" 
                stackId="1"
                stroke="hsl(var(--primary))"
                fill="hsl(var(--primary) / 0.2)"
                name="Upper Bound"
              />
              <Line 
                type="monotone" 
                dataKey="median" 
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={false}
                name="Most Likely"
              />
            </AreaChart>
          </ResponsiveContainer>
          <p className="text-xs text-muted-foreground mt-2">
            Shaded area shows possible temperature range based on {ensembleData.hourly.temperature.median.length} ensemble models
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-2">
          <div className="text-center p-3 rounded-xl bg-gradient-to-br from-primary/10 to-accent/5 border border-border/50">
            <p className="text-2xl font-bold">±{Math.round((chartData[0].p90 - chartData[0].p10) / 2)}°F</p>
            <p className="text-xs text-muted-foreground">Uncertainty Range</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-gradient-to-br from-primary/10 to-accent/5 border border-border/50">
            <p className="text-2xl font-bold">{ensembleData.hourly.temperature.median.length}</p>
            <p className="text-xs text-muted-foreground">Ensemble Members</p>
          </div>
        </div>
      </div>
    </div>
  );
}
