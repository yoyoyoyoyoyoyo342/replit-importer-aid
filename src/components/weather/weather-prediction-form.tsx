import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CloudRain, CloudSnow, Cloud, Sun, CloudDrizzle } from "lucide-react";
import { z } from "zod";

interface WeatherPredictionFormProps {
  location: string;
  latitude: number;
  longitude: number;
  onPredictionMade: () => void;
}

const weatherConditions = [
  { value: "sunny", label: "Sunny", icon: Sun },
  { value: "cloudy", label: "Cloudy", icon: Cloud },
  { value: "rainy", label: "Rainy", icon: CloudRain },
  { value: "snowy", label: "Snowy", icon: CloudSnow },
  { value: "partly-cloudy", label: "Partly Cloudy", icon: CloudDrizzle },
];

// Validation schema
const predictionSchema = z.object({
  predictedHigh: z.number()
    .min(-100, "Temperature must be at least -100°F")
    .max(150, "Temperature must be at most 150°F"),
  predictedLow: z.number()
    .min(-100, "Temperature must be at least -100°F")
    .max(150, "Temperature must be at most 150°F"),
  predictedCondition: z.string().min(1, "Please select a weather condition"),
}).refine(data => data.predictedHigh >= data.predictedLow, {
  message: "High temperature must be greater than or equal to low temperature",
  path: ["predictedHigh"],
});

export const WeatherPredictionForm = ({ 
  location, 
  latitude, 
  longitude,
  onPredictionMade 
}: WeatherPredictionFormProps) => {
  const [predictedHigh, setPredictedHigh] = useState("");
  const [predictedLow, setPredictedLow] = useState("");
  const [predictedCondition, setPredictedCondition] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!predictedHigh || !predictedLow || !predictedCondition) {
      toast.error("Please fill in all fields");
      return;
    }

    // Validate input
    try {
      predictionSchema.parse({
        predictedHigh: parseFloat(predictedHigh),
        predictedLow: parseFloat(predictedLow),
        predictedCondition,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
        return;
      }
    }

    setLoading(true);
    
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const predictionDate = tomorrow.toISOString().split("T")[0];

      const { error } = await supabase
        .from("weather_predictions")
        .insert([{
          prediction_date: predictionDate,
          predicted_high: parseFloat(predictedHigh),
          predicted_low: parseFloat(predictedLow),
          predicted_condition: predictedCondition,
          location_name: location,
          latitude,
          longitude,
        }] as any);

      if (error) throw error;

      toast.success("🎯 Prediction submitted! Check back tomorrow to see if you were right!");
      setPredictedHigh("");
      setPredictedLow("");
      setPredictedCondition("");
      onPredictionMade();
    } catch (error: any) {
      if (error.code === "23505") {
        toast.error("You've already predicted tomorrow's weather for this location!");
      } else {
        toast.error("Failed to submit prediction");
      }
      console.error("Error submitting prediction:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6 bg-background/40 backdrop-blur-md border-border/50">
      <h3 className="text-lg font-semibold mb-4">🔮 Predict Tomorrow's Weather</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Make your prediction for <span className="font-medium text-foreground">{location}</span> tomorrow
      </p>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="high">High Temp (°F)</Label>
            <Input
              id="high"
              type="number"
              value={predictedHigh}
              onChange={(e) => setPredictedHigh(e.target.value)}
              placeholder="75"
              className="bg-background/60"
            />
          </div>
          <div>
            <Label htmlFor="low">Low Temp (°F)</Label>
            <Input
              id="low"
              type="number"
              value={predictedLow}
              onChange={(e) => setPredictedLow(e.target.value)}
              placeholder="55"
              className="bg-background/60"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="condition">Weather Condition</Label>
          <Select value={predictedCondition} onValueChange={setPredictedCondition}>
            <SelectTrigger className="bg-background/60">
              <SelectValue placeholder="Select condition" />
            </SelectTrigger>
            <SelectContent>
              {weatherConditions.map((condition) => {
                const Icon = condition.icon;
                return (
                  <SelectItem key={condition.value} value={condition.value}>
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      {condition.label}
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Submitting..." : "Submit Prediction"}
        </Button>
      </form>
    </Card>
  );
};
