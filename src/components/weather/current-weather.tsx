import { MapPin, RefreshCw, Eye, Droplets, Wind, Sun, Cloud, CloudSun, CloudRain, CloudDrizzle, CloudSnow, CloudLightning, CloudFog, Camera, Plus, Minus, Snowflake, Thermometer } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { WeatherSource } from "@/types/weather";
import { useState } from "react";
import { LocationCard } from "./location-card";
import { useLanguage } from "@/contexts/language-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { PremiumSettings } from "@/hooks/use-premium-settings";

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
  displayName?: string | null;
  actualStationName?: string;
  premiumSettings?: PremiumSettings;
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
  onLocationSelect,
  displayName,
  actualStationName,
  premiumSettings
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

  const getConditionIcon = (condition: string, size: string = "w-8 h-8") => {
    const c = condition.toLowerCase();
    const iconClass = `${size} text-white drop-shadow-lg`;
    if (c.includes("thunder")) return <CloudLightning className={iconClass} />;
    if (c.includes("snow")) return <Snowflake className={iconClass} />;
    if (c.includes("drizzle")) return <CloudDrizzle className={iconClass} />;
    if (c.includes("shower") || c.includes("rain")) return <CloudRain className={iconClass} />;
    if (c.includes("fog")) return <CloudFog className={iconClass} />;
    if (c.includes("overcast")) return <Cloud className={iconClass} />;
    if (c.includes("partly") || c.includes("sun")) return <CloudSun className={iconClass} />;
    if (c.includes("cloud")) return <Cloud className={iconClass} />;
    return <Sun className={iconClass} />;
  };

  const getWeatherGradient = (condition: string) => {
    const c = condition.toLowerCase();
    if (c.includes("thunder") || c.includes("storm")) return "from-slate-700/80 via-purple-800/70 to-slate-800/80";
    if (c.includes("rain") || c.includes("shower") || c.includes("drizzle")) return "from-slate-500/80 via-blue-600/70 to-slate-600/80";
    if (c.includes("snow") || c.includes("sleet")) return "from-slate-200/80 via-blue-100/70 to-white/80";
    if (c.includes("fog") || c.includes("mist")) return "from-gray-300/80 via-gray-400/70 to-gray-500/80";
    if (c.includes("overcast")) return "from-gray-500/80 via-slate-600/70 to-gray-700/80";
    if (c.includes("cloud") && !c.includes("partly")) return "from-gray-400/80 via-slate-500/70 to-gray-600/80";
    if (c.includes("partly")) return "from-blue-300/80 via-gray-300/70 to-blue-400/80";
    // Clear/sunny
    return "from-sky-300/80 via-blue-400/70 to-indigo-500/80";
  };

  const formatWindSpeed = (speed: number) => {
    if (isImperial) {
      return `${speed}`;
    } else {
      return `${Math.round(speed * 1.609)}`;
    }
  };

  const feelsLikeTemp = isImperial 
    ? mostAccurate.currentWeather.feelsLike 
    : Math.round((mostAccurate.currentWeather.feelsLike - 32) * 5 / 9);
  const actualTemp = isImperial 
    ? mostAccurate.currentWeather.temperature 
    : Math.round((mostAccurate.currentWeather.temperature - 32) * 5 / 9);
  const highTemp = isImperial 
    ? mostAccurate.dailyForecast[0]?.highTemp 
    : Math.round((mostAccurate.dailyForecast[0]?.highTemp - 32) * 5 / 9);
  const lowTemp = isImperial 
    ? mostAccurate.dailyForecast[0]?.lowTemp 
    : Math.round((mostAccurate.dailyForecast[0]?.lowTemp - 32) * 5 / 9);
  
  // Convert visibility from miles to km when metric is selected
  const displayVisibility = isImperial 
    ? mostAccurate.currentWeather.visibility 
    : Math.round(mostAccurate.currentWeather.visibility * 1.60934 * 10) / 10;

  const locationDisplay = displayName 
    ? displayName.split(',')[0] 
    : (isAutoDetected ? t('weather.myLocation') : mostAccurate.location.split(',')[0]);

  // Apply compact mode padding
  const cardPadding = premiumSettings?.compactMode ? 'p-3' : 'p-4';
  const statsPadding = premiumSettings?.compactMode ? 'p-2' : 'p-2.5';

  return (
    <section className="mb-4">
      <Card className="overflow-hidden border-0 shadow-xl">
        {/* Main Weather Display with Dynamic Gradient */}
        <div className={`relative bg-gradient-to-br ${getWeatherGradient(mostAccurate.currentWeather.condition)} ${cardPadding}`}>
          {/* Ambient glow effects */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/5 rounded-full blur-2xl" />
          </div>

          {/* Top Row: Location + Actions */}
          <div className="relative flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-white/80" />
              <span className="text-white font-semibold text-lg">{locationDisplay}</span>
              {currentLocation && (
                <button
                  onClick={() => isLocationSaved ? removeLocationMutation.mutate() : addLocationMutation.mutate()}
                  className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
                >
                  {isLocationSaved ? <Minus className="w-3 h-3 text-white" /> : <Plus className="w-3 h-3 text-white" />}
                </button>
              )}
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={onRefresh}
                disabled={isLoading}
                className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 text-white ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Center: Temperature + Condition */}
          <div className="relative flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                {getConditionIcon(mostAccurate.currentWeather.condition)}
              </div>
              <div>
                <div className="flex items-baseline">
                  <span className="text-6xl font-bold text-white tracking-tight">{actualTemp}</span>
                  <span className="text-2xl text-white/70 ml-1">°{isImperial ? 'F' : 'C'}</span>
                </div>
                <p className="text-white/80 font-medium text-sm">{mostAccurate.currentWeather.condition}</p>
              </div>
            </div>

            {/* Feels Like - controlled by setting */}
            {(premiumSettings?.showFeelsLike !== false) && (
              <div className="text-right">
                <p className="text-white/60 text-xs uppercase tracking-wide">{t('weather.feelsLike')}</p>
                <p className="text-3xl font-bold text-white">{feelsLikeTemp}°</p>
                <p className="text-white/70 text-xs">H:{highTemp}° L:{lowTemp}°</p>
              </div>
            )}
          </div>

          {/* Bottom: Quick Stats - controlled by settings */}
          <div className="relative grid grid-cols-3 gap-2">
            {/* Wind - always shown */}
            <div className={`bg-white/15 backdrop-blur-sm rounded-xl ${statsPadding} text-center`}>
              <Wind className="w-4 h-4 text-white/80 mx-auto mb-1" />
              <p className="text-white font-semibold text-sm">{formatWindSpeed(mostAccurate.currentWeather.windSpeed)}</p>
              <p className="text-white/60 text-xs">{isImperial ? 'mph' : 'km/h'}</p>
            </div>
            {/* Humidity - controlled by setting */}
            {(premiumSettings?.showHumidity !== false) && (
              <div className={`bg-white/15 backdrop-blur-sm rounded-xl ${statsPadding} text-center`}>
                <Droplets className="w-4 h-4 text-white/80 mx-auto mb-1" />
                <p className="text-white font-semibold text-sm">{mostAccurate.currentWeather.humidity}%</p>
                <p className="text-white/60 text-xs">Humidity</p>
              </div>
            )}
            {/* Visibility - controlled by setting */}
            {(premiumSettings?.showVisibility !== false) && (
              <div className={`bg-white/15 backdrop-blur-sm rounded-xl ${statsPadding} text-center`}>
                <Eye className="w-4 h-4 text-white/80 mx-auto mb-1" />
                <p className="text-white font-semibold text-sm">{displayVisibility}</p>
                <p className="text-white/60 text-xs">{isImperial ? 'mi' : 'km'}</p>
              </div>
            )}
            {/* Precipitation Chance - controlled by setting */}
            {premiumSettings?.showPrecipChance && (mostAccurate.currentWeather as any).precipChance !== undefined && (
              <div className={`bg-white/15 backdrop-blur-sm rounded-xl ${statsPadding} text-center`}>
                <Droplets className="w-4 h-4 text-blue-300 mx-auto mb-1" />
                <p className="text-white font-semibold text-sm">{(mostAccurate.currentWeather as any).precipChance}%</p>
                <p className="text-white/60 text-xs">Precip</p>
              </div>
            )}
            {/* Dew Point - controlled by setting */}
            {premiumSettings?.showDewPoint && (mostAccurate.currentWeather as any).dewPoint !== undefined && (
              <div className={`bg-white/15 backdrop-blur-sm rounded-xl ${statsPadding} text-center`}>
                <Thermometer className="w-4 h-4 text-white/80 mx-auto mb-1" />
                <p className="text-white font-semibold text-sm">
                  {isImperial ? (mostAccurate.currentWeather as any).dewPoint : Math.round(((mostAccurate.currentWeather as any).dewPoint - 32) * 5 / 9)}°
                </p>
                <p className="text-white/60 text-xs">Dew Pt</p>
              </div>
            )}
            {/* Pressure - controlled by setting */}
            {premiumSettings?.showPressure && mostAccurate.currentWeather.pressure !== undefined && (
              <div className={`bg-white/15 backdrop-blur-sm rounded-xl ${statsPadding} text-center`}>
                <span className="text-white/80 text-xs">hPa</span>
                <p className="text-white font-semibold text-sm">{Math.round(mostAccurate.currentWeather.pressure)}</p>
                <p className="text-white/60 text-xs">Pressure</p>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Actions Bar */}
        <CardContent className="p-2 bg-background/60 backdrop-blur-md border-t border-border/30">
          <div className="flex gap-2">
            <Button 
              onClick={() => setShowLocationCard(true)} 
              variant="ghost" 
              size="sm" 
              className="flex-1 h-8 text-xs"
            >
              <Camera className="w-3 h-3 mr-1.5" />
              Share Card
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <LocationCard 
        open={showLocationCard} 
        onOpenChange={setShowLocationCard}
        temperature={mostAccurate.currentWeather.temperature}
        location={displayName || mostAccurate.location}
        actualStationName={actualStationName || mostAccurate.location}
        isImperial={isImperial}
      />
    </section>
  );
}
