import { useState, useEffect } from "react";
import { CloudSun, LogIn, MapPin, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { weatherApi } from "@/lib/weather-api";
import { LoadingOverlay } from "@/components/ui/loading-overlay";
import { LocationSearch } from "@/components/weather/location-search";
import { CurrentWeather } from "@/components/weather/current-weather";
import { HourlyForecast } from "@/components/weather/hourly-forecast";
import { TenDayForecast } from "@/components/weather/ten-day-forecast";
import { DetailedMetrics } from "@/components/weather/detailed-metrics";
import { PollenCard } from "@/components/weather/pollen-card";
import { SettingsDialog } from "@/components/weather/settings-dialog";
import { WeatherReportForm } from "@/components/weather/weather-report-form";
import { WeatherResponse } from "@/types/weather";
import { checkWeatherAlerts } from "@/lib/weather-alerts";
import { useAuth } from "@/hooks/use-auth";
import { usePushNotifications } from "@/hooks/use-push-notifications";
import { useUserPreferences } from "@/hooks/use-user-preferences";
import { AIChatButton } from "@/components/weather/ai-chat-button";
import { AnimatedWeatherBackground } from "@/components/weather/animated-weather-background";
import { MorningWeatherReview } from "@/components/weather/morning-weather-review";
import { WinterAlerts } from "@/components/weather/winter-alerts";
import { WeatherStationInfo } from "@/components/weather/weather-station-info";
import { LockedFeature } from "@/components/ui/locked-feature";
import { useLanguage } from "@/contexts/language-context";
import { WeatherTrendsCard } from "@/components/weather/weather-trends-card";
import { StreakDisplay } from "@/components/weather/streak-display";
import { PredictionDialog } from "@/components/weather/prediction-dialog";
import { useTimeOfDay } from "@/hooks/use-time-of-day";
import { useTimeOfDayContext } from "@/contexts/time-of-day-context";
import { LockedStreakDisplay } from "@/components/weather/locked-streak-display";
import { LockedPredictionButton } from "@/components/weather/locked-prediction-button";
import { useHyperlocalWeather } from "@/hooks/use-hyperlocal-weather";
import { AQICard } from "@/components/weather/aqi-card";
import { Leaderboard } from "@/components/weather/leaderboard";
import { LockedLeaderboard } from "@/components/weather/locked-leaderboard";
import { BarometerCard } from "@/components/weather/barometer-card";
import { MobileLocationNav } from "@/components/weather/mobile-location-nav";


export default function WeatherPage() {
  const [selectedLocation, setSelectedLocation] = useState<{
    lat: number;
    lon: number;
    name: string;
  } | null>(null);
  const [isAutoDetected, setIsAutoDetected] = useState(false);
  const [isImperial, setIsImperial] = useState(false); // false for Celsius (default), true for Fahrenheit
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const { toast } = useToast();
  const { user, profile, loading: authLoading } = useAuth();
  const { 
    visibleCards, 
    cardOrder, 
    is24Hour, 
    isHighContrast, 
    savedAddress,
    savedCoordinates,
    updateSavedAddress,
    loading: preferencesLoading 
  } = useUserPreferences();
  const { t } = useLanguage();
  const { setTimeOfDay } = useTimeOfDayContext();

  // Fetch hyperlocal weather data
  const { data: hyperlocalData } = useHyperlocalWeather(
    selectedLocation?.lat,
    selectedLocation?.lon
  );

  // Apply high contrast mode
  useEffect(() => {
    if (isHighContrast) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }
  }, [isHighContrast]);

  // Initialize push notifications
  usePushNotifications();
  const {
    data: weatherData,
    isLoading,
    refetch,
    error
  } = useQuery<WeatherResponse, Error>({
    queryKey: ["/api/weather", selectedLocation?.lat, selectedLocation?.lon],
    enabled: !!selectedLocation,
    queryFn: () => weatherApi.getWeatherData(selectedLocation!.lat, selectedLocation!.lon, selectedLocation!.name)
  });

  // Track time of day and update context for theme
  const sunrise = weatherData?.mostAccurate?.currentWeather?.sunrise;
  const sunset = weatherData?.mostAccurate?.currentWeather?.sunset;
  const timeOfDay = useTimeOfDay(sunrise, sunset);

  useEffect(() => {
    setTimeOfDay(timeOfDay);
  }, [timeOfDay, setTimeOfDay]);

  // After query: side effects for success/error
  useEffect(() => {
    if (weatherData) {
      setLastUpdated(new Date());

      // Update location name to use actual weather station name
      const stationInfo = weatherData.aggregated?.stationInfo || weatherData.sources?.[0]?.stationInfo;
      if (stationInfo?.name && selectedLocation && selectedLocation.name !== stationInfo.name) {
        const updatedLocation = {
          ...selectedLocation,
          name: stationInfo.name
        };
        setSelectedLocation(updatedLocation);
        localStorage.setItem('userLocation', JSON.stringify(updatedLocation));
      }

      // Check for weather alerts if notifications are enabled for authenticated users
      if (profile?.notification_enabled && weatherData.mostAccurate?.currentWeather) {
        const alerts = checkWeatherAlerts(weatherData.mostAccurate.currentWeather);
        alerts.forEach(alert => {
          toast({
            title: `${alert.icon} ${alert.title}`,
            description: alert.description,
            variant: alert.severity === "extreme" || alert.severity === "high" ? "destructive" : "default"
          });
        });
      }
    }
  }, [weatherData, profile, toast, selectedLocation]);

  // Apply night mode text visibility
  useEffect(() => {
    if (!weatherData?.mostAccurate?.currentWeather) return;
    
    const { sunrise, sunset } = weatherData.mostAccurate.currentWeather;
    if (!sunrise || !sunset) return;

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const parseSunTime = (timeStr: string) => {
      const [hours, minutes] = timeStr.split(':').map(Number);
      return hours * 60 + minutes;
    };
    
    const sunriseTime = parseSunTime(sunrise);
    const sunsetTime = parseSunTime(sunset);
    
    // Check if it's night time
    const isNightTime = currentTime < sunriseTime || currentTime > sunsetTime;
    
    if (isNightTime) {
      document.documentElement.classList.add('night-mode');
    } else {
      document.documentElement.classList.remove('night-mode');
    }
  }, [weatherData]);
  useEffect(() => {
    if (error) {
      toast({
        title: "Failed to fetch weather data",
        description: (error as Error).message || "Please check your connection and try again.",
        variant: "destructive"
      });
    }
  }, [error, toast]);

  // Auto-detect location on component mount
  useEffect(() => {
    const detectLocation = async () => {
      // Check if we have a saved location
      const savedLocation = localStorage.getItem('userLocation');
      if (savedLocation) {
        try {
          const location = JSON.parse(savedLocation);
          setSelectedLocation(location);
          setIsAutoDetected(true);
          return;
        } catch (error) {
          console.log("Failed to parse saved location");
        }
      }

      // Only try to detect location if we don't have a saved one
      try {
        const position = await weatherApi.getCurrentLocation();
        const {
          latitude,
          longitude
        } = position.coords;
        
        // Reverse geocode to get best matching nearby place name
        try {
          const geocodeResponse = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
          );
          const geocodeData = await geocodeResponse.json();

          // Choose the closest named place from localityInfo when available,
          // otherwise fall back to locality/city/subdivision
          const getBestLocationName = (data: any): string => {
            try {
              const localityInfo = data.localityInfo;
              const candidateGroups = [
                localityInfo?.locality,
                localityInfo?.administrative,
                localityInfo?.informative,
              ].filter(Boolean) as Array<any[]>;

              for (const group of candidateGroups) {
                if (Array.isArray(group) && group.length > 0) {
                  const sorted = [...group].sort((a, b) => {
                    const da = typeof a.distance === "number" ? a.distance : Number.POSITIVE_INFINITY;
                    const db = typeof b.distance === "number" ? b.distance : Number.POSITIVE_INFINITY;
                    return da - db;
                  });

                  const nearest = sorted[0];
                  if (nearest?.name) {
                    return nearest.name as string;
                  }
                }
              }
            } catch (e) {
              console.log("Failed to derive precise locality from reverse geocode", e);
            }

            return (
              data.locality ||
              data.city ||
              data.principalSubdivision ||
              data.localityInfo?.administrative?.[0]?.name ||
              "Current Location"
            );
          };

          const cityName = getBestLocationName(geocodeData);
          
          const newLocation = {
            lat: latitude,
            lon: longitude,
            name: cityName
          };
          
          setSelectedLocation(newLocation);
          setIsAutoDetected(true);
          
          // Save location to localStorage
          localStorage.setItem('userLocation', JSON.stringify(newLocation));
        } catch (geocodeError) {
          console.log("Reverse geocoding failed, using coordinates only");
          const newLocation = {
            lat: latitude,
            lon: longitude,
            name: "Current Location"
          };
          
          setSelectedLocation(newLocation);
          setIsAutoDetected(true);
          
          // Save location to localStorage
          localStorage.setItem('userLocation', JSON.stringify(newLocation));
        }
      } catch (error) {
        console.log("Location detection failed, user will need to search manually");
      }
    };
    detectLocation();
  }, []);
  const handleLocationSelect = (lat: number, lon: number, locationName: string) => {
    const newLocation = {
      lat,
      lon,
      name: locationName
    };
    setSelectedLocation(newLocation);
    setIsAutoDetected(false);
    
    // Save the manually selected location
    localStorage.setItem('userLocation', JSON.stringify(newLocation));
  };
  const handleRefresh = () => {
    window.location.reload();
  };
  return <div className="min-h-screen overflow-x-hidden relative">
      <AnimatedWeatherBackground 
        condition={weatherData?.mostAccurate?.currentWeather?.condition}
        sunrise={weatherData?.mostAccurate?.currentWeather?.sunrise}
        sunset={weatherData?.mostAccurate?.currentWeather?.sunset}
        moonPhase={weatherData?.mostAccurate?.currentWeather?.moonPhase}
      />
      
      <div className="container mx-auto px-4 py-4 sm:py-6 max-w-7xl relative z-10">
        {/* Modern Header */}
        <header className="mb-6 glass-header rounded-2xl p-4 sm:p-6 relative z-[1000] border border-border/20">
          {/* Logo & Auth Row */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="Rainz Logo" className="w-12 h-12 sm:w-14 sm:h-14 drop-shadow-lg" />
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">Rainz</h1>
                <p className="text-sm text-muted-foreground">{t('app.tagline')}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <LockedFeature isLocked={!user}>
                <SettingsDialog isImperial={isImperial} onUnitsChange={setIsImperial} mostAccurate={weatherData?.mostAccurate} />
              </LockedFeature>
              
              {!user && (
                <Button 
                  variant="outline" 
                  size="default"
                  onClick={() => window.location.href = '/auth'} 
                  className="gap-2"
                >
                  <LogIn className="w-4 h-4" />
                  <span>{t('header.signIn')}</span>
                </Button>
              )}
            </div>
          </div>

          {/* Search & Controls Row */}
          <div className="grid sm:grid-cols-[1fr_auto_auto] gap-3 items-start">
            <div className="space-y-2">
              <LocationSearch onLocationSelect={handleLocationSelect} isImperial={isImperial} />
              {weatherData?.aggregated?.stationInfo && (
                <WeatherStationInfo stationInfo={weatherData.aggregated.stationInfo} />
              )}
            </div>
            
            <div className="flex items-center gap-2 px-4 py-2.5 bg-muted/50 rounded-lg border border-border/20">
              <span className="text-sm font-medium">°F</span>
              <Switch checked={!isImperial} onCheckedChange={checked => setIsImperial(!checked)} />
              <span className="text-sm font-medium">°C</span>
            </div>
            
            {weatherData && (
              <WeatherReportForm 
                location={selectedLocation?.name || "Unknown"} 
                currentCondition={weatherData.mostAccurate.currentWeather.condition}
                locationData={{
                  latitude: selectedLocation?.lat || 0,
                  longitude: selectedLocation?.lon || 0
                }}
              />
            )}
          </div>

          {/* Prediction Row */}
          {selectedLocation && (
            <div className="mt-4 pt-4 border-t border-border/20">
              {user ? (
                <PredictionDialog
                  location={selectedLocation.name}
                  latitude={selectedLocation.lat}
                  longitude={selectedLocation.lon}
                  isImperial={isImperial}
                  onPredictionMade={() => refetch()}
                />
              ) : (
                <LockedFeature isLocked={true}>
                  <LockedPredictionButton />
                </LockedFeature>
              )}
            </div>
          )}
        </header>

        {/* Loading Overlay */}
        <LoadingOverlay isOpen={isLoading && !weatherData} />

        {/* Main Content */}
        {!selectedLocation ? (
          <Card className="glass-card border border-border/20 text-center py-12 rounded-2xl">
            <CardContent className="space-y-4">
              <CloudSun className="w-16 h-16 text-primary mx-auto" />
              <div>
                <h2 className="text-xl font-semibold text-foreground mb-2">{t('weather.welcome')}</h2>
                <p className="text-muted-foreground">
                  {t('weather.searchLocation')}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : error ? (
          <Card className="glass-card border-destructive/30 text-center py-12 rounded-2xl">
            <CardContent className="space-y-4">
              <div className="text-4xl">⚠️</div>
              <div>
                <h2 className="text-xl font-semibold text-destructive mb-2">
                  {t('weather.failed')}
                </h2>
                <p className="text-destructive/80 mb-4">
                  {t('weather.checkConnection')}
                </p>
                <Button onClick={handleRefresh} variant="outline" size="default">
                  {t('weather.tryAgain')}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : weatherData ? (
          <>
            {/* Demo Data Banner */}
            {weatherData.demo && (
              <div className="mb-6 p-4 bg-primary/10 border border-primary/20 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                    <span className="text-lg">⚠️</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-primary">{t('weather.demoData')}</h3>
                    <p className="text-primary/80 text-sm">
                      {weatherData.message || t('weather.demoMessage')}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Streak & Alerts Section */}
            <div className="mb-6 space-y-4">
              {user ? (
                <StreakDisplay />
              ) : (
                <LockedFeature isLocked={true}>
                  <LockedStreakDisplay />
                </LockedFeature>
              )}
              
              {weatherData.mostAccurate?.currentWeather && (
                <WinterAlerts 
                  alerts={checkWeatherAlerts(weatherData.mostAccurate.currentWeather)}
                />
              )}
            </div>

            {/* Morning Weather Review */}
            <MorningWeatherReview
              weatherData={weatherData.mostAccurate}
              location={selectedLocation.name}
              isImperial={isImperial}
              userId={user?.id}
            />

            {/* Leaderboard - Only show for non-logged-in users */}
            {!user && (
              <div className="mb-4">
                <LockedFeature isLocked={true}>
                  <LockedLeaderboard />
                </LockedFeature>
              </div>
            )}

            {/* Desktop Layout - Only show on large screens */}
            <div className="hidden lg:block mb-6">
              <CurrentWeather 
                weatherData={weatherData.sources} 
                mostAccurate={weatherData.mostAccurate} 
                onRefresh={handleRefresh} 
                isLoading={isLoading} 
                lastUpdated={lastUpdated} 
                isImperial={isImperial} 
                isAutoDetected={isAutoDetected}
                currentLocation={selectedLocation}
                onLocationSelect={handleLocationSelect}
              />
            </div>

            {/* Mobile Layout - Only show on small/medium screens */}
            <div className="lg:hidden">
              <CurrentWeather 
                weatherData={weatherData.sources} 
                mostAccurate={weatherData.mostAccurate} 
                onRefresh={handleRefresh} 
                isLoading={isLoading} 
                lastUpdated={lastUpdated} 
                isImperial={isImperial} 
                isAutoDetected={isAutoDetected}
                currentLocation={selectedLocation}
                onLocationSelect={handleLocationSelect}
              />
            </div>

            {/* Weather Cards in User's Preferred Order */}
            {cardOrder.map((cardType) => {
              if (!visibleCards[cardType]) return null;
              
              switch (cardType) {
                case "weatherTrends":
                  return (
                    <div key="weatherTrends" className="mb-4">
                      <WeatherTrendsCard
                        currentWeather={weatherData.mostAccurate.currentWeather}
                        location={selectedLocation.name}
                        latitude={selectedLocation.lat}
                        longitude={selectedLocation.lon}
                        isImperial={isImperial}
                      />
                    </div>
                  );

                case "pollen":
                  return weatherData?.mostAccurate?.currentWeather?.pollenData ? (
                    <div key="pollen" className="mb-4">
                      <PollenCard 
                        pollenData={weatherData.mostAccurate.currentWeather.pollenData}
                        userId={user?.id}
                        temperature={weatherData.mostAccurate.currentWeather.temperature}
                        windSpeed={weatherData.mostAccurate.currentWeather.windSpeed}
                        feelsLike={weatherData.mostAccurate.currentWeather.feelsLike}
                        snowfall={weatherData.mostAccurate.currentWeather.snowfall}
                        snowDepth={weatherData.mostAccurate.currentWeather.snowDepth}
                        condition={weatherData.mostAccurate.currentWeather.condition}
                        isImperial={isImperial}
                        hyperlocalSnow={hyperlocalData?.snow}
                      />
                    </div>
                  ) : null;
                
                case "hourly":
                  return (
                    <HourlyForecast 
                      key="hourly"
                      hourlyData={weatherData.mostAccurate.hourlyForecast} 
                      isImperial={isImperial}
                      is24Hour={is24Hour}
                    />
                  );
                
                case "tenDay":
                  return (
                    <TenDayForecast 
                      key="tenDay"
                      dailyForecast={weatherData.mostAccurate.dailyForecast} 
                      weatherSources={weatherData.sources} 
                      hourlyForecast={weatherData.mostAccurate.hourlyForecast} 
                      isImperial={isImperial}
                      is24Hour={is24Hour}
                    />
                  );
                
                case "detailedMetrics":
                  return (
                    <DetailedMetrics 
                      key="detailedMetrics"
                      currentWeather={weatherData.mostAccurate.currentWeather}
                      is24Hour={is24Hour}
                    />
                  );

                case "aqi":
                  return hyperlocalData?.aqi ? (
                    <div key="aqi" className="mb-4">
                      <AQICard data={hyperlocalData.aqi} />
                    </div>
                  ) : null;

                case "alerts":
                  return hyperlocalData?.alerts?.length > 0 ? (
                    <div key="alerts" className="mb-4">
                      {hyperlocalData.alerts.map((alert, index) => (
                        <Card key={index} className="glass-card rounded-2xl shadow-lg border border-destructive/50 mb-2">
                          <CardContent className="p-4">
                            <div className="flex items-start gap-2">
                              <span className="text-xl">⚠️</span>
                              <div>
                                <h3 className="font-semibold text-destructive">{alert.headline}</h3>
                                <p className="text-sm text-muted-foreground mt-1">{alert.description}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : null;

                case "barometer":
                  // Only show barometer when using auto-detected "My Location"
                  return isAutoDetected ? (
                    <div key="barometer" className="mb-4">
                      <BarometerCard />
                    </div>
                  ) : null;
                
                default:
                  return null;
              }
            })}

            {/* Footer - Ultra Compact */}
            <footer className="text-center py-2 mt-4 glass-header rounded-lg p-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
                <div className="text-muted-foreground text-xs">
                  {t('footer.dataFrom')}{" "}
                  <span className="font-medium text-foreground">ECMWF</span>,{" "}
                  <span className="font-medium text-foreground">GFS</span>,{" "}
                  <span className="font-medium text-foreground">DWD ICON</span>,{" "}
                  <span className="font-medium text-foreground">Open-meteo</span>, and{" "}
                  <span className="font-medium text-foreground">WeatherAPI</span>. {t('footer.disclaimer')}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  
                  <Button onClick={handleRefresh} variant="ghost" size="sm" className="text-primary hover:text-primary/80 h-5 px-1 text-xs">
                    🔄
                  </Button>
                </div>
              </div>
            </footer>
          </>
        ) : null}
      </div>
      
      {/* AI Chat Button - Floating */}
      {weatherData && <AIChatButton weatherData={weatherData.mostAccurate} location={selectedLocation.name} isImperial={isImperial} />}
      
      {/* Mobile Location Nav - Bottom */}
      {user && selectedLocation && (
        <MobileLocationNav 
          onLocationSelect={handleLocationSelect}
          currentLocation={selectedLocation}
          isImperial={isImperial}
        />
      )}
    </div>
}