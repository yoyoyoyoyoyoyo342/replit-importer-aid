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
import { useLanguage } from "@/contexts/language-context";

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
  userId?: string;
}

interface SeasonalPollen {
  name: string;
  value: number;
  color: string;
  months: number[];
  season: string;
}

const SEVERITY_LEVELS = ['mild', 'moderate', 'severe'];

export function PollenWheel({ pollenData, userId }: PollenWheelProps) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const activeUserId = userId || user?.id;
  const [userAllergies, setUserAllergies] = useState<UserAllergy[]>([]);
  const [isAddingAllergy, setIsAddingAllergy] = useState(false);
  const [newAllergen, setNewAllergen] = useState("");
  const [newSeverity, setNewSeverity] = useState("moderate");

  useEffect(() => {
    if (activeUserId) {
      fetchUserAllergies();
    }
  }, [activeUserId]);

  const fetchUserAllergies = async () => {
    if (!activeUserId) return;
    
    const { data, error } = await supabase
      .from('user_allergies')
      .select('*')
      .eq('user_id', activeUserId);
    
    if (error) {
      console.error('Error fetching allergies:', error);
      return;
    }
    
    setUserAllergies(data || []);
  };

  const addAllergy = async () => {
    if (!activeUserId || !newAllergen.trim()) return;
    
    const { error } = await supabase
      .from('user_allergies')
      .insert({
        user_id: activeUserId,
        allergen: newAllergen.trim(),
        severity: newSeverity
      });
    
    if (error) {
      if (error.code === '23505') {
        toast.error(t('pollen.alreadyTracked'));
      } else {
        toast.error(t('pollen.addFailed'));
      }
      return;
    }
    
    toast.success(t('pollen.addSuccess'));
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
      toast.error(t('pollen.removeFailed'));
      return;
    }
    
    toast.success(t('pollen.removeSuccess'));
    fetchUserAllergies();
  };

  if (!pollenData) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-lg">{t('pollen.pollenIndex')}</CardTitle>
          <CardDescription>{t('pollen.liveData')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            <div>{t('pollen.noData')}</div>
            <div className="text-xs mt-1">{t('pollen.locationRequired')}</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // October is month 9 (0-indexed)
  const currentMonth = new Date().getMonth(); // 0-11
  
  const allPollens: SeasonalPollen[] = [
    {
      name: "Alder",
      value: pollenData.alder || 0,
      color: "hsl(25 95% 53%)",
      months: [0, 1, 2, 3],
      season: t('pollen.earlySpring')
    },
    {
      name: "Birch",
      value: pollenData.birch || 0,
      color: "hsl(142 71% 45%)",
      months: [2, 3, 4],
      season: t('pollen.spring')
    },
    {
      name: "Grass",
      value: pollenData.grass || 0,
      color: "hsl(120 60% 50%)",
      months: [4, 5, 6, 7, 8],
      season: t('pollen.lateSpring')
    },
    {
      name: "Mugwort",
      value: pollenData.mugwort || 0,
      color: "hsl(280 70% 55%)",
      months: [6, 7, 8],
      season: t('pollen.lateSummer')
    },
    {
      name: "Olive",
      value: pollenData.olive || 0,
      color: "hsl(47 96% 53%)",
      months: [3, 4, 5],
      season: t('pollen.springSummer')
    },
    {
      name: "Ragweed",
      value: pollenData.ragweed || 0,
      color: "hsl(15 80% 50%)",
      months: [7, 8, 9, 10],
      season: t('pollen.autumn')
    }
  ];

  // Filter to show only seasonal pollens (current season ± 1 month)
  // Show pollens that are in season with their real values (even if 0)
  const seasonalPollens = allPollens.filter(pollen => {
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
    const isInSeason = pollen.months.includes(prevMonth) || 
                       pollen.months.includes(currentMonth) || 
                       pollen.months.includes(nextMonth);
    
    // Show all in-season pollens with their actual API values
    return isInSeason;
  });

  const getIntensityLabel = (value: number) => {
    if (value === 0) return t('pollen.noRisk');
    if (value <= 2) return t('pollen.low');
    if (value <= 5) return t('pollen.medium');
    if (value <= 8) return t('pollen.high');
    return t('pollen.veryHigh');
  };

  const getUserAllergyAlert = (pollenName: string, value: number): boolean => {
    if (!activeUserId) return false;
    const userAllergy = userAllergies.find(a => a.allergen.toLowerCase() === pollenName.toLowerCase());
    if (!userAllergy || value === 0) return false;
    
    if (userAllergy.severity === 'mild' && value > 5) return true;
    if (userAllergy.severity === 'moderate' && value > 2) return true;
    if (userAllergy.severity === 'severe' && value > 0) return true;
    
    return false;
  };

  const getTotalValue = () => {
    // For visual display, ensure we have at least some value for the wheel
    const total = seasonalPollens.reduce((sum, pollen) => sum + pollen.value, 0);
    // If all values are 0, use small values for visual representation
    return total > 0 ? total : seasonalPollens.length * 0.1;
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
  const total = getTotalValue();
  let currentAngle = -90; // Start at top

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle className="text-lg">{t('pollen.pollenIndex')}</CardTitle>
          <CardDescription>{t('pollen.liveData')}</CardDescription>
        </div>
        {activeUserId && (
          <Dialog open={isAddingAllergy} onOpenChange={setIsAddingAllergy}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-1" />
                {t('pollen.trackAllergy')}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('pollen.addAllergy')}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="allergen">{t('pollen.allergen')}</Label>
                  <Input
                    id="allergen"
                    value={newAllergen}
                    onChange={(e) => setNewAllergen(e.target.value)}
                    placeholder={t('pollen.allergenPlaceholder')}
                  />
                </div>
                <div>
                  <Label htmlFor="severity">{t('pollen.sensitivityLevel')}</Label>
                  <Select value={newSeverity} onValueChange={setNewSeverity}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mild">{t('pollen.mild')}</SelectItem>
                      <SelectItem value="moderate">{t('pollen.moderate')}</SelectItem>
                      <SelectItem value="severe">{t('pollen.severe')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={addAllergy} className="w-full">
                  {t('pollen.addAllergyButton')}
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
                // Use actual value, or small value for visual display if all are 0
                const segmentValue = total > 1 ? pollen.value : 1;
                const segmentAngle = (segmentValue / (total > 1 ? total : seasonalPollens.length)) * 360;
                
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
                
                const hasAlert = activeUserId && getUserAllergyAlert(pollen.name, pollen.value);
                
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
                {t('pollen.pollenIndex')}
              </text>
            </svg>
          </div>
        </div>

        {/* Detailed Pollen List */}
        <div className="space-y-2">
          <div className="text-sm font-medium text-muted-foreground mb-3">
            {t('pollen.currentSeason')} ({seasonalPollens.length} {t('pollen.active')})
          </div>
          {seasonalPollens.map((pollen) => {
            const hasAlert = activeUserId && getUserAllergyAlert(pollen.name, pollen.value);
            const level = getIntensityLabel(pollen.value);
            
            return (
              <div key={pollen.name} className="flex items-center justify-between p-3 rounded-lg border glass-card">
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
        {activeUserId && userAllergies.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm">{t('pollen.yourTracked')}</h4>
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
          <div><strong>{t('pollen.scale')}</strong></div>
          <div>{t('pollen.scaleInfo')}</div>
          {activeUserId && (
            <div className="text-destructive">🔴 {t('pollen.alertInfo')}</div>
          )}
          <div>{t('pollen.adviceInfo')}</div>
        </div>
      </CardContent>
    </Card>
  );
}