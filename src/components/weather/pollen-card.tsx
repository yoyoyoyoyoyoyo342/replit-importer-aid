import { PollenWheel } from "./pollen-wheel";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

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
  const [userAllergies, setUserAllergies] = useState<string[]>([]);
  const [filteredPollenData, setFilteredPollenData] = useState(pollenData);

  useEffect(() => {
    const fetchUserAllergies = async () => {
      if (!userId) {
        // Show all pollens if not logged in
        setFilteredPollenData(pollenData);
        return;
      }

      const { data, error } = await supabase
        .from('user_allergies')
        .select('allergen')
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching user allergies:', error);
        setFilteredPollenData(pollenData);
        return;
      }

      if (data && data.length > 0) {
        const allergies = data.map(a => a.allergen.toLowerCase());
        setUserAllergies(allergies);
        
        // Show only user's tracked allergens with real pollen data
        const filtered: any = {};
        Object.keys(pollenData || {}).forEach(key => {
          if (allergies.includes(key.toLowerCase())) {
            filtered[key] = pollenData![key as keyof typeof pollenData];
          }
        });
        
        // If user has allergies but none match current pollen data, still show their tracked ones with value 0
        if (Object.keys(filtered).length === 0) {
          allergies.forEach(allergen => {
            const matchingKey = Object.keys(pollenData || {}).find(k => k.toLowerCase() === allergen);
            if (matchingKey) {
              filtered[matchingKey] = pollenData![matchingKey as keyof typeof pollenData];
            }
          });
        }
        
        setFilteredPollenData(Object.keys(filtered).length > 0 ? filtered : pollenData);
      } else {
        // User has no allergies tracked, show all pollens
        setFilteredPollenData(pollenData);
      }
    };

    fetchUserAllergies();
  }, [userId, pollenData]);

  if (!filteredPollenData || Object.keys(filteredPollenData).length === 0) return null;

  // Calculate average pollen level for color gradient using filtered data
  const pollenValues = Object.values(filteredPollenData);
  const avgPollen = pollenValues.length > 0 
    ? pollenValues.reduce((sum, val) => sum + val, 0) / pollenValues.length 
    : 0;
  
  // Determine gradient colors based on pollen level
  const getGradientColors = () => {
    if (avgPollen < 1) return "from-green-500/20 to-emerald-500/20"; // Low
    if (avgPollen < 3) return "from-yellow-500/20 to-amber-500/20"; // Moderate
    if (avgPollen < 5) return "from-orange-500/20 to-red-500/20"; // High
    return "from-red-500/20 to-purple-500/20"; // Very High
  };

  const getBorderColor = () => {
    if (avgPollen < 1) return "border-green-500/30";
    if (avgPollen < 3) return "border-yellow-500/30";
    if (avgPollen < 5) return "border-orange-500/30";
    return "border-red-500/30";
  };

  return (
    <div className="glass-card rounded-2xl shadow-lg border border-border p-4">
      <PollenWheel pollenData={filteredPollenData} />
    </div>
  );
}