import { useState, useEffect } from "react";
import { Search, MapPin, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { weatherApi } from "@/lib/weather-api";
import { Location } from "@/types/weather";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/language-context";
import { supabase } from "@/integrations/supabase/client";
import { StationSelector } from "./station-selector";

interface WeatherStation {
  name: string;
  region: string;
  country: string;
  latitude: number;
  longitude: number;
  distance: number;
  reliability: number;
}

interface AddressResult {
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

interface LocationSearchProps {
  onLocationSelect: (lat: number, lon: number, locationName: string) => void;
  isImperial: boolean;
}

export function LocationSearch({
  onLocationSelect,
  isImperial
}: LocationSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [isDetecting, setIsDetecting] = useState(false);
  const [stations, setStations] = useState<WeatherStation[]>([]);
  const [showStations, setShowStations] = useState(false);
  const [loadingStations, setLoadingStations] = useState(false);
  const [addressResults, setAddressResults] = useState<AddressResult[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const {
    toast
  } = useToast();
  const { t } = useLanguage();

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);
  
  const {
    data: locations = [],
    isLoading
  } = useQuery({
    queryKey: ["/api/locations/search", debouncedQuery],
    enabled: debouncedQuery.length > 2,
    queryFn: () => weatherApi.searchLocations(debouncedQuery)
  });

  // Fetch address results in parallel
  useEffect(() => {
    const fetchAddresses = async () => {
      if (debouncedQuery.length < 3) {
        setAddressResults([]);
        return;
      }

      setLoadingAddresses(true);

      try {
        const { data, error } = await supabase.functions.invoke('geocode-address', {
          body: { query: debouncedQuery }
        });

        if (error) {
          console.error("Geocode error:", error);
          setAddressResults([]);
          return;
        }

        const results: AddressResult[] = data?.results || [];
        setAddressResults(results);
      } catch (error) {
        console.error("Address search error:", error);
        setAddressResults([]);
      } finally {
        setLoadingAddresses(false);
      }
    };

    fetchAddresses();
  }, [debouncedQuery]);

  const handleLocationClick = async (location: Location) => {
    setSearchQuery("");
    setLoadingStations(true);

    try {
      // Find nearby weather stations
      const { data, error } = await supabase.functions.invoke('find-nearby-stations', {
        body: { 
          latitude: location.latitude, 
          longitude: location.longitude 
        }
      });

      if (error) throw error;

      const nearbyStations: WeatherStation[] = data?.stations || [];
      
      if (nearbyStations.length > 0) {
        setStations(nearbyStations);
        setShowStations(true);
      } else {
        // If no stations found, use the location directly
        const locationName = `${location.name}, ${location.state ? `${location.state}, ` : ''}${location.country}`;
        onLocationSelect(location.latitude, location.longitude, locationName);
        toast({
          title: "Location selected",
          description: `Weather data loading for ${locationName}`,
        });
      }
    } catch (error) {
      console.error("Error finding stations:", error);
      // Fallback to direct coordinates
      const locationName = `${location.name}, ${location.state ? `${location.state}, ` : ''}${location.country}`;
      onLocationSelect(location.latitude, location.longitude, locationName);
      toast({
        title: "Location selected",
        description: `Weather data loading for ${locationName}`,
      });
    } finally {
      setLoadingStations(false);
    }
  };

  const handleAddressClick = async (address: AddressResult) => {
    const lat = parseFloat(address.lat);
    const lon = parseFloat(address.lon);

    const locationName = 
      address.address.suburb || 
      address.address.village || 
      address.address.town || 
      address.address.city || 
      address.display_name;

    setSearchQuery("");
    setLoadingStations(true);

    try {
      // Find nearby weather stations
      const { data, error } = await supabase.functions.invoke('find-nearby-stations', {
        body: { latitude: lat, longitude: lon }
      });

      if (error) throw error;

      const nearbyStations: WeatherStation[] = data?.stations || [];
      
      if (nearbyStations.length > 0) {
        setStations(nearbyStations);
        setShowStations(true);
      } else {
        onLocationSelect(lat, lon, locationName);
        toast({
          title: "Location selected",
          description: `Weather data loading for ${locationName}`,
        });
      }
    } catch (error) {
      console.error("Error finding stations:", error);
      onLocationSelect(lat, lon, locationName);
      toast({
        title: "Location selected",
        description: `Weather data loading for ${locationName}`,
      });
    } finally {
      setLoadingStations(false);
    }
  };

  const handleLocationDetection = async () => {
    setIsDetecting(true);
    try {
      const position = await weatherApi.getCurrentLocation();
      const {
        latitude,
        longitude
      } = position.coords;

      // Find nearby stations for current location
      try {
        const { data, error } = await supabase.functions.invoke('find-nearby-stations', {
          body: { latitude, longitude }
        });

        if (error) throw error;

        const nearbyStations: WeatherStation[] = data?.stations || [];
        
        if (nearbyStations.length > 0) {
          setStations(nearbyStations);
          setShowStations(true);
        } else {
          onLocationSelect(latitude, longitude, "Current Location");
          toast({
            title: "Location detected",
            description: "Using your current location for weather data."
          });
        }
      } catch (error) {
        console.error("Error finding stations:", error);
        onLocationSelect(latitude, longitude, "Current Location");
        toast({
          title: "Location detected",
          description: "Using your current location for weather data."
        });
      }
    } catch (error) {
      toast({
        title: "Location detection failed",
        description: "Please search for a location manually.",
        variant: "destructive"
      });
    } finally {
      setIsDetecting(false);
    }
  };

  const handleSelectStation = (lat: number, lon: number, stationName: string) => {
    setShowStations(false);
    onLocationSelect(lat, lon, stationName);
    toast({
      title: "Station selected",
      description: `Loading weather data from ${stationName}`,
    });
  };

  if (showStations) {
    return (
      <StationSelector
        stations={stations}
        isImperial={isImperial}
        onSelectStation={handleSelectStation}
        onCancel={() => setShowStations(false)}
      />
    );
  }

  return (
    <div className="relative flex-1 max-w-md z-[9999]">
      <div className="relative">
        <Input 
          type="text" 
          placeholder={t('search.placeholder')} 
          value={searchQuery} 
          onChange={e => setSearchQuery(e.target.value)} 
          className="w-full pl-12 pr-16 py-3 bg-input text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-muted-foreground rounded-xl text-ellipsis" 
          style={{ textAlign: 'left' }} 
        />
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
        <Button 
          onClick={handleLocationDetection} 
          disabled={isDetecting || loadingStations} 
          variant="ghost" 
          size="sm" 
          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors p-2"
        >
          {isDetecting || loadingStations ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
        </Button>
      </div>

      {/* Search Results Dropdown */}
      {(searchQuery.length > 2 || isLoading || loadingAddresses) && (
        <Card className="absolute top-full left-0 right-0 mt-2 z-[9999] shadow-lg border border-border bg-popover">
          <CardContent className="p-0">
            {(isLoading || loadingAddresses) ? (
              <div className="p-4 text-center text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin inline-block mr-2" />
                {t('search.searching')}
              </div>
            ) : (locations.length > 0 || addressResults.length > 0) ? (
              <div className="max-h-60 overflow-y-auto">
                {/* Location Results */}
                {locations.length > 0 && (
                  <>
                    <div className="px-3 py-2 text-xs font-semibold text-muted-foreground bg-muted/30">
                      Cities & Places
                    </div>
                    {locations.map((location, index) => (
                      <button 
                        key={`loc-${index}`} 
                        onClick={() => handleLocationClick(location)} 
                        className="w-full text-left p-4 hover:bg-muted/50 transition-colors border-b border-border last:border-b-0 flex items-start gap-2"
                      >
                        <MapPin className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
                        <div>
                          <div className="font-medium text-foreground">{location.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {location.state ? `${location.state}, ` : ''}{location.country}
                          </div>
                        </div>
                      </button>
                    ))}
                  </>
                )}

                {/* Address Results */}
                {addressResults.length > 0 && (
                  <>
                    <div className="px-3 py-2 text-xs font-semibold text-muted-foreground bg-muted/30">
                      Addresses
                    </div>
                    {addressResults.slice(0, 3).map((address, index) => (
                      <button 
                        key={`addr-${index}`} 
                        onClick={() => handleAddressClick(address)} 
                        className="w-full text-left p-4 hover:bg-muted/50 transition-colors border-b border-border last:border-b-0 flex items-start gap-2"
                      >
                        <Search className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-foreground truncate">
                            {address.address.suburb ||
                              address.address.village ||
                              address.address.town ||
                              address.address.city ||
                              "Unknown Location"}
                          </div>
                          <div className="text-xs text-muted-foreground truncate">
                            {address.display_name}
                          </div>
                        </div>
                      </button>
                    ))}
                  </>
                )}
              </div>
            ) : searchQuery.length > 2 ? (
              <div className="p-4 text-center text-muted-foreground">
                {t('search.noResults')}
              </div>
            ) : null}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
