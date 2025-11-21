import { useState } from "react";
import { MapPin, Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

interface AddressSearchProps {
  onLocationSelect: (lat: number, lon: number, address: string) => void;
}

interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
  address: {
    road?: string;
    suburb?: string;
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    country?: string;
  };
}

export function AddressSearch({ onLocationSelect }: AddressSearchProps) {
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSearch = async () => {
    if (!address.trim()) {
      toast({
        title: "Enter an address",
        description: "Please type an address to search",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Use Nominatim for geocoding
      const url = new URL("https://nominatim.openstreetmap.org/search");
      url.searchParams.set("q", address);
      url.searchParams.set("format", "json");
      url.searchParams.set("addressdetails", "1");
      url.searchParams.set("limit", "1");

      const response = await fetch(url.toString(), {
        headers: {
          "User-Agent": "Rainz Weather App/1.0",
        },
      });

      if (!response.ok) {
        throw new Error("Geocoding service unavailable");
      }

      const data: NominatimResult[] = await response.json();

      if (!data || data.length === 0) {
        toast({
          title: "Address not found",
          description: "Could not find that address. Try being more specific.",
          variant: "destructive",
        });
        return;
      }

      const result = data[0];
      const lat = parseFloat(result.lat);
      const lon = parseFloat(result.lon);

      // Use the most specific location name available
      const locationName = 
        result.address.suburb || 
        result.address.village || 
        result.address.town || 
        result.address.city || 
        result.display_name;

      onLocationSelect(lat, lon, locationName);

      toast({
        title: "Location found",
        description: `Weather data loading for ${locationName}`,
      });
    } catch (error) {
      console.error("Geocoding error:", error);
      toast({
        title: "Search failed",
        description: "Unable to search for address. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-4 mb-4">
      <div className="flex items-center gap-2 mb-2">
        <MapPin className="w-5 h-5 text-primary" />
        <h3 className="font-semibold">Search by Address</h3>
      </div>
      <div className="flex gap-2">
        <Input
          type="text"
          placeholder="Type your address..."
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleSearch();
            }
          }}
          disabled={loading}
          className="flex-1"
        />
        <Button 
          onClick={handleSearch} 
          disabled={loading}
          size="icon"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Search className="w-4 h-4" />
          )}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground mt-2">
        Address geocoding by OpenStreetMap Nominatim
      </p>
    </Card>
  );
}
