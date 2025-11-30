import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MapPin, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { LocationSearch } from "./location-search";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SavedLocation {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  country: string | null;
  state: string | null;
  is_primary: boolean;
}

interface MobileLocationNavProps {
  onLocationSelect: (lat: number, lon: number, locationName: string) => void;
  currentLocation?: { lat: number; lon: number; name: string } | null;
  isImperial: boolean;
}

export function MobileLocationNav({ onLocationSelect, currentLocation, isImperial }: MobileLocationNavProps) {
  const [isAddingLocation, setIsAddingLocation] = useState(false);
  const queryClient = useQueryClient();

  const { data: savedLocations = [] } = useQuery({
    queryKey: ["saved-locations"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("saved_locations")
        .select("*")
        .order("is_primary", { ascending: false })
        .order("name");

      if (error) throw error;
      return data as SavedLocation[];
    },
  });

  const addLocationMutation = useMutation({
    mutationFn: async ({ name, lat, lon }: { name: string; lat: number; lon: number }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("saved_locations").insert({
        user_id: user.id,
        name,
        latitude: lat,
        longitude: lon,
        is_primary: savedLocations.length === 0,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saved-locations"] });
      setIsAddingLocation(false);
      toast.success("Location saved");
    },
    onError: () => toast.error("Failed to save location"),
  });

  const handleLocationSelect = (lat: number, lon: number, locationName: string) => {
    addLocationMutation.mutate({ name: locationName, lat, lon });
  };

  const isCurrent = (location: SavedLocation) => {
    if (!currentLocation) return false;
    return (
      Math.abs(location.latitude - currentLocation.lat) < 0.01 &&
      Math.abs(location.longitude - currentLocation.lon) < 0.01
    );
  };

  return (
    <>
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 pb-safe px-2">
        <div className="glass-card rounded-3xl border border-border/30 backdrop-blur-xl mx-2 mb-2 shadow-lg">
          <div className="overflow-x-auto overflow-y-hidden scrollbar-hide">
            <div className="flex items-center gap-1 p-2 min-w-max">
              {/* Add Location Button */}
              <Dialog open={isAddingLocation} onOpenChange={setIsAddingLocation}>
                <button
                  onClick={() => setIsAddingLocation(true)}
                  className={`shrink-0 flex flex-col items-center justify-center gap-1.5 min-w-[80px] py-3 px-4 rounded-2xl transition-all ${
                    isAddingLocation
                      ? "bg-primary/20 scale-95"
                      : "hover:bg-muted/30 active:scale-95"
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Plus className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-[10px] font-medium text-foreground whitespace-nowrap">Add</span>
                </button>
                <DialogContent className="glass-card">
                  <DialogHeader>
                    <DialogTitle>Add Location</DialogTitle>
                  </DialogHeader>
                  <LocationSearch onLocationSelect={handleLocationSelect} isImperial={isImperial} />
                </DialogContent>
              </Dialog>

              {/* Saved Locations */}
              {savedLocations.map((location) => (
                <button
                  key={location.id}
                  onClick={() => onLocationSelect(location.latitude, location.longitude, location.name)}
                  className={`shrink-0 flex flex-col items-center justify-center gap-1.5 min-w-[80px] py-3 px-4 rounded-2xl transition-all ${
                    isCurrent(location)
                      ? "bg-primary/20 scale-95"
                      : "hover:bg-muted/30 active:scale-95"
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    isCurrent(location)
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}>
                    <MapPin className="h-5 w-5" />
                  </div>
                  <span className="text-[10px] font-medium text-foreground whitespace-nowrap max-w-[72px] truncate">
                    {location.name}
                  </span>
                  {isCurrent(location) && (
                    <span className="w-1 h-1 rounded-full bg-primary animate-pulse" />
                  )}
                </button>
              ))}

              {savedLocations.length === 0 && (
                <div className="flex-1 flex items-center justify-center py-4 px-4">
                  <p className="text-xs text-muted-foreground">
                    Add locations for quick access
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Spacer to prevent content being hidden behind nav */}
      <div className="lg:hidden h-24" />
    </>
  );
}
