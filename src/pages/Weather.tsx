import { useState, useEffect } from "react";
import { CloudSun, LogIn } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
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
import { AIChatButton } from "@/components/weather/ai-chat-button";
import { UserRoutineTracker } from "@/components/weather/user-routine-tracker";
import { AnimatedWeatherBackground } from "@/components/weather/animated-weather-background";
export default function WeatherPage() {
  const [selectedLocation, setSelectedLocation] = useState<{
    lat: number;
    lon: number;
    name: string;
  } | null>(null);
  const [isImperial, setIsImperial] = useState(false); // false for Celsius (default), true for Fahrenheit
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [userRoutines, setUserRoutines] = useState([]);
  const {
    toast
  } = useToast();
  const {
    user,
    profile,
    loading: authLoading
  } = useAuth();

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

  // After query: side effects for success/error
  useEffect(() => {
    if (weatherData) {
      setLastUpdated(new Date());

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
  }, [weatherData, profile, toast]);
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
      try {
        const position = await weatherApi.getCurrentLocation();
        const {
          latitude,
          longitude
        } = position.coords;
        setSelectedLocation({
          lat: latitude,
          lon: longitude,
          name: "Current Location"
        });
      } catch (error) {
        console.log("Location detection failed, user will need to search manually");
      }
    };
    detectLocation();
  }, []);
  const handleLocationSelect = (lat: number, lon: number, locationName: string) => {
    setSelectedLocation({
      lat,
      lon,
      name: locationName
    });
  };
  const handleRefresh = () => {
    refetch();
  };
  return <div className="min-h-screen overflow-x-hidden relative">
      <AnimatedWeatherBackground condition={weatherData?.mostAccurate?.currentWeather?.condition} />
      <div className="container mx-auto px-3 py-2 max-w-5xl relative z-10">
        {/* Header - Ultra Compact */}
        <header className="mb-4 glass-header rounded-lg p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-center gap-2 flex-1">
              <img src="/logo.png" alt="Rainz Logo" className="w-8 h-8" />
              <div>
                <h1 className="text-lg font-bold text-foreground">Rainz</h1>
                <p className="text-xs text-slate-950">Aiming to be the best weather app.</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <LocationSearch onLocationSelect={handleLocationSelect} />
              
              <div className="flex items-center gap-1 px-2 py-1 text-muted-foreground bg-muted rounded text-xs">
                <span>°F</span>
                <Switch checked={!isImperial} onCheckedChange={checked => setIsImperial(!checked)} />
                <span>°C</span>
              </div>
              
              {user ? <SettingsDialog isImperial={isImperial} onUnitsChange={setIsImperial} mostAccurate={weatherData?.mostAccurate} /> : <Button variant="outline" size="sm" onClick={() => window.location.href = '/auth'} className="h-8 px-2 text-xs">
                  <LogIn className="w-3 h-3 mr-1" />
                  Sign In
                </Button>}
              
              {weatherData && <WeatherReportForm location={selectedLocation?.name || "Unknown"} currentCondition={weatherData.mostAccurate.currentWeather.condition} />}
            </div>
          </div>
        </header>
        
        {/* Pollen Index - Always visible below header */}
        {weatherData?.mostAccurate?.currentWeather?.pollenData && <div className="mb-4">
            <PollenCard pollenData={weatherData.mostAccurate.currentWeather.pollenData} />
          </div>}

        {/* Loading Overlay */}
        <LoadingOverlay isOpen={isLoading && !weatherData} />

        {/* Main Content */}
        {!selectedLocation ? <Card className="bg-card border border-border text-center py-6">
            <CardContent>
              <CloudSun className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <h2 className="text-sm font-semibold text-foreground mb-1">Welcome to Rainz</h2>
              <p className="text-muted-foreground text-xs">
                Search for a location above or allow location access
              </p>
            </CardContent>
          </Card> : error ? <Card className="bg-destructive/10 border-destructive/20 text-center py-6">
            <CardContent>
              <div className="text-destructive mb-2">⚠️</div>
              <h2 className="text-sm font-semibold text-destructive mb-1">
                Failed to load weather data
              </h2>
              <p className="text-destructive/80 mb-3 text-xs">
                Please check your connection and try again
              </p>
              <Button onClick={handleRefresh} variant="outline" size="sm">
                Try Again
              </Button>
            </CardContent>
          </Card> : weatherData ? <>
            {/* Demo Data Banner */}
            {weatherData.demo && <div className="mb-3 p-2 bg-primary/10 border border-primary/20 rounded">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-primary/20 rounded flex items-center justify-center">
                    <span className="text-primary text-xs">⚠️</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-primary text-xs">Demo Data</h3>
                    <p className="text-primary/80 text-xs">
                      {weatherData.message || "API keys needed for real data"}
                    </p>
                  </div>
                </div>
              </div>}

            {/* Desktop Layout - Only show on large screens */}
            <div className="hidden lg:block mb-6">
              <CurrentWeather weatherData={weatherData.sources} mostAccurate={weatherData.mostAccurate} onRefresh={handleRefresh} isLoading={isLoading} lastUpdated={lastUpdated} isImperial={isImperial} />
            </div>

            {/* Mobile Layout - Only show on small/medium screens */}
            <div className="lg:hidden">
              <CurrentWeather weatherData={weatherData.sources} mostAccurate={weatherData.mostAccurate} onRefresh={handleRefresh} isLoading={isLoading} lastUpdated={lastUpdated} isImperial={isImperial} />
            </div>

            <HourlyForecast hourlyData={weatherData.mostAccurate.hourlyForecast} isImperial={isImperial} />

            <TenDayForecast dailyForecast={weatherData.mostAccurate.dailyForecast} weatherSources={weatherData.sources} hourlyForecast={weatherData.mostAccurate.hourlyForecast} isImperial={isImperial} />

            <DetailedMetrics currentWeather={weatherData.mostAccurate.currentWeather} />

            {/* User Routine Tracker - Full Width */}
            <div className="mt-6">
              <UserRoutineTracker onRoutineUpdate={setUserRoutines} />
            </div>

            {/* Footer - Ultra Compact */}
            <footer className="text-center py-2 mt-4 glass-header rounded-lg p-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
                <div className="text-muted-foreground text-xs">
                  Data from{" "}
                  <span className="font-medium text-foreground">OpenWeatherMap</span>,{" "}
                  <span className="font-medium text-foreground">Open-meteo</span>, and{" "}
                  <span className="font-medium text-foreground">WeatherAPI. We are not to be held accountable for any inaccuracies or wrong claims.</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>
                    Updated:{" "}
                    <span className="text-foreground">
                      {lastUpdated ? `${Math.floor((Date.now() - lastUpdated.getTime()) / (1000 * 60))}m ago` : "now"}
                    </span>
                  </span>
                  <Button onClick={handleRefresh} variant="ghost" size="sm" className="text-primary hover:text-primary/80 h-5 px-1 text-xs">
                    🔄
                  </Button>
                </div>
              </div>
            </footer>
          </> : null}
      </div>
      
      {/* AI Chat Button - Floating */}
      {weatherData && <AIChatButton weatherData={weatherData.mostAccurate} location={selectedLocation.name} isImperial={isImperial} />}
    </div>;
}