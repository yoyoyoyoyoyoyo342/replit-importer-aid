import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MapPin, Plus, Trash2, Star } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { LocationSearch } from "./location-search";

interface SavedLocation {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  country: string | null;
  state: string | null;
  is_primary: boolean;
}

interface SavedLocationsProps {
  onLocationSelect: (lat: number, lon: number, locationName: string) => void;
  currentLocation?: { latitude: number; longitude: number };
}

export function SavedLocations({ onLocationSelect, currentLocation }: SavedLocationsProps) {
  const [isAddingLocation, setIsAddingLocation] = useState(false);
  const queryClient = useQueryClient();

  const { data: savedLocations = [], isLoading } = useQuery({
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

  const deleteLocationMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("saved_locations").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saved-locations"] });
      toast.success("Location removed");
    },
    onError: () => toast.error("Failed to remove location"),
  });

  const setPrimaryMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Unset all primary flags
      await supabase.from("saved_locations").update({ is_primary: false }).eq("user_id", user.id);

      // Set the selected one as primary
      const { error } = await supabase.from("saved_locations").update({ is_primary: true }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saved-locations"] });
      toast.success("Primary location updated");
    },
    onError: () => toast.error("Failed to update primary location"),
  });

  const handleLocationSelect = (lat: number, lon: number, locationName: string) => {
    addLocationMutation.mutate({ name: locationName, lat, lon });
  };

  const isCurrent = (location: SavedLocation) => {
    if (!currentLocation) return false;
    return (
      Math.abs(location.latitude - currentLocation.latitude) < 0.01 &&
      Math.abs(location.longitude - currentLocation.longitude) < 0.01
    );
  };

  if (isLoading) {
    return (
      <Card className="p-4 glass-panel">
        <p className="text-sm text-muted-foreground">Loading locations...</p>
      </Card>
    );
  }

  return (
    <Card className="p-4 glass-panel">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          Saved Locations
        </h3>
        <Dialog open={isAddingLocation} onOpenChange={setIsAddingLocation}>
          <DialogTrigger asChild>
            <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
              <Plus className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Location</DialogTitle>
            </DialogHeader>
            <LocationSearch onLocationSelect={handleLocationSelect} />
          </DialogContent>
        </Dialog>
      </div>

      {savedLocations.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          No saved locations yet. Add one to get started!
        </p>
      ) : (
        <div className="space-y-2">
          {savedLocations.map((location) => (
            <div
              key={location.id}
              className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                isCurrent(location) ? "bg-primary/10" : "bg-secondary/50 hover:bg-secondary"
              }`}
            >
              <button
                onClick={() => onLocationSelect(location.latitude, location.longitude, location.name)}
                className="flex-1 text-left"
              >
                <div className="flex items-center gap-2">
                  {location.is_primary && <Star className="h-3 w-3 fill-primary text-primary" />}
                  <span className="font-medium text-sm">{location.name}</span>
                </div>
                {location.state && location.country && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {location.state}, {location.country}
                  </p>
                )}
              </button>
              <div className="flex items-center gap-1">
                {!location.is_primary && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0"
                    onClick={() => setPrimaryMutation.mutate(location.id)}
                  >
                    <Star className="h-3 w-3" />
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                  onClick={() => deleteLocationMutation.mutate(location.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}