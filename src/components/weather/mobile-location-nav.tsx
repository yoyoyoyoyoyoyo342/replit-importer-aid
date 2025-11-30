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
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 pb-safe">
        <div className="glass-card border-t border-border/30 backdrop-blur-xl">
          <ScrollArea className="w-full">
            <div className="flex items-center gap-2 p-3 overflow-x-auto">
              {/* Add Location Button */}
              <Dialog open={isAddingLocation} onOpenChange={setIsAddingLocation}>
                <Button
                  onClick={() => setIsAddingLocation(true)}
                  size="sm"
                  variant="outline"
                  className="shrink-0 h-12 px-4 gap-2 bg-primary/10 border-primary/30 hover:bg-primary/20"
                >
                  <Plus className="h-4 w-4" />
                  <span className="text-xs font-medium">Add</span>
                </Button>
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
                  className={`shrink-0 h-12 px-4 rounded-lg flex items-center gap-2 transition-all ${
                    isCurrent(location)
                      ? "bg-primary text-primary-foreground shadow-lg scale-105"
                      : "bg-muted/50 hover:bg-muted text-foreground"
                  }`}
                >
                  <MapPin className="h-3.5 w-3.5" />
                  <span className="text-xs font-medium whitespace-nowrap">
                    {location.name}
                  </span>
                  {isCurrent(location) && (
                    <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                  )}
                </button>
              ))}

              {savedLocations.length === 0 && (
                <div className="flex-1 flex items-center justify-center py-2">
                  <p className="text-xs text-muted-foreground">
                    Add locations for quick access
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </nav>

      {/* Spacer to prevent content being hidden behind nav */}
      <div className="lg:hidden h-20" />
    </>
  );
}
