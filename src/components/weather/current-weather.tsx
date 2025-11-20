import { MapPin, RefreshCw, Eye, Droplets, Wind, Sun, Cloud, CloudSun, CloudRain, CloudDrizzle, CloudSnow, CloudLightning, CloudFog, Camera, Plus, Minus, ChevronLeft, ChevronRight, Snowflake } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { WeatherSource } from "@/types/weather";
import { useState, useEffect } from "react";
import { LocationCard } from "./location-card";
import { useLanguage } from "@/contexts/language-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
interface SavedLocation {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  country: string | null;
  state: string | null;
  is_primary: boolean;
}

interface CurrentWeatherProps {
  weatherData: WeatherSource[];
  mostAccurate: WeatherSource;
  onRefresh: () => void;
  isLoading: boolean;
  lastUpdated: Date | null;
  isImperial?: boolean;
  isAutoDetected?: boolean;
  currentLocation?: { lat: number; lon: number; name: string };
  onLocationSelect?: (lat: number, lon: number, locationName: string) => void;
}
export function CurrentWeather({
  weatherData,
  mostAccurate,
  onRefresh,
  isLoading,
  lastUpdated,
  isImperial = true,
  isAutoDetected = false,
  currentLocation,
  onLocationSelect
}: CurrentWeatherProps) {
  const [showLocationCard, setShowLocationCard] = useState(false);
  const { t } = useLanguage();
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
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      if (!currentLocation) throw new Error("No current location");

      const { error } = await supabase.from("saved_locations").insert({
        user_id: user.id,
        name: currentLocation.name,
        latitude: currentLocation.lat,
        longitude: currentLocation.lon,
        is_primary: savedLocations.length === 0,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saved-locations"] });
      toast.success("Location saved");
    },
    onError: () => toast.error("Failed to save location"),
  });

  const removeLocationMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      if (!currentLocation) throw new Error("No current location");

      const savedLocation = savedLocations.find(
        loc => Math.abs(loc.latitude - currentLocation.lat) < 0.01 && 
               Math.abs(loc.longitude - currentLocation.lon) < 0.01
      );

      if (!savedLocation) throw new Error("Location not found");

      const { error } = await supabase
        .from("saved_locations")
        .delete()
        .eq("id", savedLocation.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saved-locations"] });
      toast.success("Location removed");
    },
    onError: () => toast.error("Failed to remove location"),
  });

  const savedLocationData = currentLocation && savedLocations.find(
    loc => Math.abs(loc.latitude - currentLocation.lat) < 0.01 && 
           Math.abs(loc.longitude - currentLocation.lon) < 0.01
  );
  const isLocationSaved = !!savedLocationData;
  const getConditionIcon = (condition: string) => {
    const c = condition.toLowerCase();
    if (c.includes("thunder")) return <CloudLightning className="w-5 h-5 text-primary" />;
    if (c.includes("snow")) return <Snowflake className="w-5 h-5 text-primary" />;
    if (c.includes("drizzle")) return <CloudDrizzle className="w-5 h-5 text-primary" />;
    if (c.includes("shower") || c.includes("rain")) return <CloudRain className="w-5 h-5 text-primary" />;
    if (c.includes("fog")) return <CloudFog className="w-5 h-5 text-primary" />;
    if (c.includes("partly") || c.includes("sun")) return <CloudSun className="w-5 h-5 text-primary" />;
    if (c.includes("cloud")) return <Cloud className="w-5 h-5 text-primary" />;
    return <Sun className="w-5 h-5 text-primary" />;
  };
  const formatWindSpeed = (speed: number) => {
    if (isImperial) {
      return `${speed} mph`;
    } else {
      return `${Math.round(speed * 1.609)} km/h`;
    }
  };
  const formatVisibility = (visibility: number) => {
    if (isImperial) {
      return `${visibility} mi`;
    } else {
      return `${Math.round(visibility * 1.609)} km`;
    }
  };
  if (savedLocations.length > 0 && onLocationSelect) {
    return (
      <section className="mb-4">
        <Carousel className="w-full">
          <CarouselContent>
            {/* Current Location */}
            <CarouselItem>
              <Card className="border border-border shadow-sm">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <MapPin className="text-primary w-3 h-3" />
                      <span className="text-sm font-semibold text-foreground">
                        {isAutoDetected ? t('weather.myLocation') : mostAccurate.location.split(',')[0]}
                      </span>
                      {currentLocation && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-5 w-5 p-0"
                          onClick={() => isLocationSaved ? removeLocationMutation.mutate() : addLocationMutation.mutate()}
                        >
                          {isLocationSaved ? <Minus className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
                        </Button>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">Current</span>
                  </div>
                  {renderWeatherContent()}
                </CardContent>
              </Card>
            </CarouselItem>

            {/* Saved Locations */}
            {savedLocations.map((location) => (
              <CarouselItem key={location.id}>
                <Card className="border border-border shadow-sm">
                  <CardContent className="p-3">
                    <button
                      onClick={() => onLocationSelect(location.latitude, location.longitude, location.name)}
                      className="w-full"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <MapPin className="text-primary w-3 h-3" />
                          <span className="text-sm font-semibold text-foreground">
                            {location.name}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">Saved</span>
                      </div>
                      <div className="text-center py-8">
                        <p className="text-sm text-muted-foreground">Tap to view weather</p>
                      </div>
                    </button>
                  </CardContent>
                </Card>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="left-2" />
          <CarouselNext className="right-2" />
        </Carousel>

        <LocationCard 
          open={showLocationCard} 
          onOpenChange={setShowLocationCard}
          temperature={mostAccurate.currentWeather.temperature}
          location={mostAccurate.location}
          isImperial={isImperial}
        />
      </section>
    );
  }

  function renderWeatherContent() {
    return (
      <div>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 md:gap-4">
          {/* Main Temperature */}
          <div className="lg:col-span-2 flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
              {getConditionIcon(mostAccurate.currentWeather.condition)}
            </div>
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-foreground">
                  {isImperial ? mostAccurate.currentWeather.temperature : Math.round((mostAccurate.currentWeather.temperature - 32) * 5 / 9)}°
                </span>
                <span className="text-xs text-muted-foreground">{isImperial ? 'F' : 'C'}</span>
              </div>
              <div className="text-xs text-foreground/80 mb-1">
                {mostAccurate.currentWeather.condition}
              </div>
              <div className="flex gap-2 text-xs text-muted-foreground">
                <span>H:{isImperial ? mostAccurate.dailyForecast[0]?.highTemp : Math.round((mostAccurate.dailyForecast[0]?.highTemp - 32) * 5 / 9)}°</span>
                <span>L:{isImperial ? mostAccurate.dailyForecast[0]?.lowTemp : Math.round((mostAccurate.dailyForecast[0]?.lowTemp - 32) * 5 / 9)}°</span>
              </div>
            </div>
          </div>

          {/* Weather Metrics - Ultra Compact */}
          <div className="grid grid-cols-3 lg:grid-cols-1 gap-1 md:gap-2">
            <div className="bg-muted/50 rounded p-1.5 md:p-2 border border-border/50">
              <div className="flex items-center gap-1 mb-1">
                <Wind className="text-primary w-2 h-2" />
                <span className="text-xs text-muted-foreground">{t('weather.wind')}</span>
              </div>
              <div className="text-xs font-semibold text-foreground">
                {formatWindSpeed(mostAccurate.currentWeather.windSpeed)}
              </div>
            </div>
            <div className="bg-muted/50 rounded p-2 border border-border/50">
              <div className="flex items-center gap-1 mb-1">
                <Eye className="text-primary w-2 h-2" />
                <span className="text-xs text-muted-foreground">{t('weather.visibility')}</span>
              </div>
              <div className="text-xs font-semibold text-foreground">
                {formatVisibility(mostAccurate.currentWeather.visibility)}
              </div>
            </div>
            <div className="bg-muted/50 rounded p-2 border border-border/50">
              <div className="flex items-center gap-1 mb-1">
                <Droplets className="text-primary w-2 h-2" />
                <span className="text-xs text-muted-foreground">{t('weather.feelsLike')}</span>
              </div>
              <div className="text-xs font-semibold text-foreground">
                {isImperial ? mostAccurate.currentWeather.feelsLike : Math.round((mostAccurate.currentWeather.feelsLike - 32) * 5 / 9)}°
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-2 flex gap-2">
            <Button onClick={onRefresh} disabled={isLoading} variant="outline" size="sm" className="flex-1 h-6 text-xs">
              {isLoading ? <RefreshCw className="w-2 h-2 mr-1 animate-spin" /> : <RefreshCw className="w-2 h-2 mr-1" />}
              {t('weather.refresh')}
            </Button>
            <Button onClick={() => setShowLocationCard(true)} variant="outline" size="sm" className="flex-1 h-6 text-xs">
              <Camera className="w-2 h-2 mr-1" />
              {t('weather.locationCard')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return <section className="mb-4">
      <Card className="border border-border shadow-sm">
        <CardContent className="p-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <MapPin className="text-primary w-3 h-3" />
              <span className="text-sm font-semibold text-foreground">
                {isAutoDetected ? t('weather.myLocation') : mostAccurate.location.split(',')[0]}
              </span>
              {!isLocationSaved && currentLocation && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-5 w-5 p-0"
                  onClick={() => addLocationMutation.mutate()}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
          {renderWeatherContent()}
        </CardContent>
      </Card>
      
      <LocationCard 
        open={showLocationCard} 
        onOpenChange={setShowLocationCard}
        temperature={mostAccurate.currentWeather.temperature}
        location={mostAccurate.location}
        isImperial={isImperial}
      />
    </section>;

}