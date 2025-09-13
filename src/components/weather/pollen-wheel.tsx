import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Trash2, Plus, AlertTriangle } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

interface PollenData {
  alder: number;
  birch: number;
  grass: number;
  mugwort: number;
  olive: number;
  ragweed: number;
}

interface UserAllergy {
  id: string;
  allergen: string;
  severity: string;
}

interface PollenWheelProps {
  pollenData?: PollenData;
}

interface SeasonalPollen {
  name: string;
  value: number;
  color: string;
  months: number[];
  season: string;
}

const SEVERITY_LEVELS = ['mild', 'moderate', 'severe'];

export function PollenWheel({ pollenData }: PollenWheelProps) {
  const { user } = useAuth();
  const [userAllergies, setUserAllergies] = useState<UserAllergy[]>([]);
  const [isAddingAllergy, setIsAddingAllergy] = useState(false);
  const [newAllergen, setNewAllergen] = useState("");
  const [newSeverity, setNewSeverity] = useState("moderate");

  useEffect(() => {
    if (user) {
      fetchUserAllergies();
    }
  }, [user]);

  const fetchUserAllergies = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('user_allergies')
      .select('*')
      .eq('user_id', user.id);
    
    if (error) {
      console.error('Error fetching allergies:', error);
      return;
    }
    
    setUserAllergies(data || []);
  };

  const addAllergy = async () => {
    if (!user || !newAllergen.trim()) return;
    
    const { error } = await supabase
      .from('user_allergies')
      .insert({
        user_id: user.id,
        allergen: newAllergen.trim(),
        severity: newSeverity
      });
    
    if (error) {
      if (error.code === '23505') {
        toast.error('You already have this allergy tracked');
      } else {
        toast.error('Failed to add allergy');
      }
      return;
    }
    
    toast.success('Allergy added successfully');
    setNewAllergen("");
    setNewSeverity("moderate");
    setIsAddingAllergy(false);
    fetchUserAllergies();
  };

  const removeAllergy = async (id: string) => {
    const { error } = await supabase
      .from('user_allergies')
      .delete()
      .eq('id', id);
    
    if (error) {
      toast.error('Failed to remove allergy');
      return;
    }
    
    toast.success('Allergy removed');
    fetchUserAllergies();
  };

  if (!pollenData) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-lg">Pollen Index</CardTitle>
          <CardDescription>Live seasonal allergy data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            <div>No pollen data available</div>
            <div className="text-xs mt-1">Location data required</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentMonth = new Date().getMonth(); // 0-11
  
  const allPollens: SeasonalPollen[] = [
    {
      name: "Alder",
      value: pollenData.alder,
      color: "hsl(25 95% 53%)",
      months: [0, 1, 2, 3],
      season: "Early Spring"
    },
    {
      name: "Birch",
      value: pollenData.birch,
      color: "hsl(142 71% 45%)",
      months: [2, 3, 4],
      season: "Spring"
    },
    {
      name: "Grass",
      value: pollenData.grass,
      color: "hsl(120 60% 50%)",
      months: [4, 5, 6, 7, 8],
      season: "Late Spring/Summer"
    },
    {
      name: "Mugwort",
      value: pollenData.mugwort,
      color: "hsl(280 70% 55%)",
      months: [6, 7, 8],
      season: "Late Summer"
    },
    {
      name: "Olive",
      value: pollenData.olive,
      color: "hsl(47 96% 53%)",
      months: [3, 4, 5],
      season: "Spring/Summer"
    },
    {
      name: "Ragweed",
      value: pollenData.ragweed,
      color: "hsl(15 80% 50%)",
      months: [7, 8, 9],
      season: "Fall"
    }
  ];

  // Add user allergies to pollen data if they track allergies not in the main list
  const userAllergyPollens: SeasonalPollen[] = userAllergies
    .filter(allergy => !allPollens.some(p => p.name.toLowerCase() === allergy.allergen.toLowerCase()))
    .map(allergy => ({
      name: allergy.allergen,
      value: 3, // Default moderate level for tracked allergies
      color: "hsl(330 70% 55%)", // Purple for user-added allergens
      months: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], // Year-round
      season: "Year-round"
    }));

  // Combine standard and user pollens
  const combinedPollens = [...allPollens, ...userAllergyPollens];
  
  // Filter to show seasonal pollens (current month ± 1 month for better coverage)
  const seasonalPollens = combinedPollens.filter(pollen => {
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
    return pollen.months.includes(prevMonth) || 
           pollen.months.includes(currentMonth) || 
           pollen.months.includes(nextMonth);
  });

  const getIntensityLabel = (value: number) => {
    if (value === 0) return "No risk";
    if (value <= 2) return "Low";
    if (value <= 5) return "Medium";
    if (value <= 8) return "High";
    return "Very High";
  };

  const getUserAllergyAlert = (pollenName: string, value: number): boolean => {
    const userAllergy = userAllergies.find(a => a.allergen.toLowerCase() === pollenName.toLowerCase());
    if (!userAllergy || value === 0) return false;
    
    if (userAllergy.severity === 'mild' && value > 5) return true;
    if (userAllergy.severity === 'moderate' && value > 2) return true;
    if (userAllergy.severity === 'severe' && value > 0) return true;
    
    return false;
  };

  const getTotalValue = () => {
    return seasonalPollens.reduce((sum, pollen) => sum + pollen.value, 0);
  };

  const getOverallLevel = () => {
    const total = getTotalValue();
    const average = seasonalPollens.length > 0 ? total / seasonalPollens.length : 0;
    return getIntensityLabel(Math.round(average));
  };

  const centerX = 120;
  const centerY = 120;
  const outerRadius = 80;
  const innerRadius = 50;
  const strokeWidth = 30;

  // Calculate segments using seasonal pollens
  const total = seasonalPollens.reduce((sum, pollen) => sum + Math.max(pollen.value, 0.5), 0);
  let currentAngle = -90; // Start at top

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle className="text-lg">Pollen Index</CardTitle>
          <CardDescription>Live seasonal allergy data</CardDescription>
        </div>
        {user && (
          <Dialog open={isAddingAllergy} onOpenChange={setIsAddingAllergy}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-1" />
                Track Allergy
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Allergy to Track</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="allergen">Allergen</Label>
                  <Input
                    id="allergen"
                    value={newAllergen}
                    onChange={(e) => setNewAllergen(e.target.value)}
                    placeholder="e.g. Grass, Birch, Ragweed"
                  />
                </div>
                <div>
                  <Label htmlFor="severity">Sensitivity Level</Label>
                  <Select value={newSeverity} onValueChange={setNewSeverity}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mild">Mild</SelectItem>
                      <SelectItem value="moderate">Moderate</SelectItem>
                      <SelectItem value="severe">Severe</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={addAllergy} className="w-full">
                  Add Allergy
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Pollen Wheel */}
        <div className="flex justify-center">
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
              {seasonalPollens.map((pollen, index) => {
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
                
                const hasAlert = user && getUserAllergyAlert(pollen.name, pollen.value);
                
                return (
                  <g key={pollen.name}>
                    {/* Segment */}
                    <path
                      d={pathData}
                      fill={pollen.color}
                      className={hasAlert ? "opacity-90" : "opacity-80"}
                      stroke={hasAlert ? "hsl(var(--destructive))" : "none"}
                      strokeWidth={hasAlert ? "2" : "0"}
                    />
                    
                    {/* Alert indicator */}
                    {hasAlert && (
                      <circle
                        cx={labelX}
                        cy={labelY - 25}
                        r="6"
                        fill="hsl(var(--destructive))"
                      />
                    )}
                    
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
        </div>

        {/* Detailed Pollen List */}
        <div className="space-y-2">
          <div className="text-sm font-medium text-muted-foreground mb-3">
            Current Season Pollen ({seasonalPollens.length} active)
          </div>
          {seasonalPollens.map((pollen) => {
            const hasAlert = user && getUserAllergyAlert(pollen.name, pollen.value);
            const level = getIntensityLabel(pollen.value);
            
            return (
              <div key={pollen.name} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                <div className="flex items-center space-x-3">
                  {hasAlert && <AlertTriangle className="w-4 h-4 text-destructive" />}
                  <div>
                    <div className="font-medium">{pollen.name}</div>
                    <div className="text-xs text-muted-foreground">{pollen.season}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold" style={{ color: pollen.color }}>{level}</div>
                  <div className="text-xs text-muted-foreground">{pollen.value}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* User Tracked Allergies */}
        {user && userAllergies.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Your Tracked Allergies</h4>
            <div className="flex flex-wrap gap-2">
              {userAllergies.map((allergy) => (
                <Badge key={allergy.id} variant="secondary" className="flex items-center gap-1">
                  {allergy.allergen}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 hover:bg-transparent"
                    onClick={() => removeAllergy(allergy.id)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Information */}
        <div className="pt-3 border-t text-xs text-muted-foreground space-y-1">
          <div><strong>Pollen Scale:</strong></div>
          <div>0 = No risk • 1-2 = Low • 3-5 = Medium • 6-8 = High • 9+ = Very High</div>
          {user && (
            <div className="text-destructive">🔴 Red alerts for your tracked allergies when levels may affect you</div>
          )}
          <div>Higher numbers indicate increased pollen concentration. Consider limiting outdoor activities during high pollen periods.</div>
        </div>
      </CardContent>
    </Card>
  );
}