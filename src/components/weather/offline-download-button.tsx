import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, CheckCircle, Loader2, Trash2, Crown, Lock } from "lucide-react";
import { useOfflineWeather } from "@/hooks/use-offline-weather";
import { useSubscription } from "@/hooks/use-subscription";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface OfflineDownloadButtonProps {
  location: string;
  latitude: number;
  longitude: number;
  currentWeather: any;
  hourlyForecast: any[];
  dailyForecast: any[];
}

export function OfflineDownloadButton({
  location,
  latitude,
  longitude,
  currentWeather,
  hourlyForecast,
  dailyForecast
}: OfflineDownloadButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const { downloadForOffline, hasOfflineData, offlineData, clearOfflineData, getTimeSinceSave } = useOfflineWeather();
  const { isSubscribed, openCheckout } = useSubscription();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleDownload = async () => {
    setIsDownloading(true);
    await downloadForOffline(location, latitude, longitude, currentWeather, hourlyForecast, dailyForecast);
    setIsDownloading(false);
  };

  const handleUpgrade = () => {
    if (!user) {
      navigate("/auth");
      return;
    }
    void openCheckout().catch(() => {});
  };

  // Show locked state for non-subscribers
  if (!isSubscribed) {
    return (
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Offline Mode</span>
            <span className="flex items-center gap-1 text-xs bg-gradient-to-r from-amber-500 to-orange-500 text-white px-1.5 py-0.5 rounded-full">
              <Crown className="w-3 h-3" />
            </span>
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Offline Weather Mode
              <span className="flex items-center gap-1 text-xs bg-gradient-to-r from-amber-500 to-orange-500 text-white px-2 py-0.5 rounded-full">
                <Crown className="w-3 h-3" />
                Plus
              </span>
            </DialogTitle>
            <DialogDescription>
              Download weather data to access it without an internet connection.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="text-center p-4 bg-muted/50 rounded-lg border border-amber-500/20">
              <Lock className="w-8 h-8 text-amber-500 mx-auto mb-2" />
              <p className="text-sm font-medium mb-1">Offline Weather Access</p>
              <p className="text-xs text-muted-foreground mb-3">
                Save 3-day forecasts for offline viewing. Perfect for traveling or areas with poor connectivity.
              </p>
              <Button 
                onClick={handleUpgrade}
                size="sm"
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
              >
                Upgrade to Rainz+
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          {hasOfflineData ? (
            <>
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="hidden sm:inline">Saved Offline</span>
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Save Offline</span>
            </>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Offline Weather Mode
          </DialogTitle>
          <DialogDescription>
            Save weather data to access it when you're offline.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {hasOfflineData && offlineData ? (
            <div className="space-y-3">
              <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400 mb-1">
                  <CheckCircle className="h-4 w-4" />
                  <span className="font-medium text-sm">Weather Saved</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {offlineData.location} • Updated {getTimeSinceSave()}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  3-day forecast available offline
                </p>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  onClick={handleDownload} 
                  disabled={isDownloading}
                  className="flex-1"
                >
                  {isDownloading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Update Data
                    </>
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={clearOfflineData}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Download the current weather and 3-day forecast for <strong>{location}</strong> to access it without an internet connection.
              </p>
              
              <div className="text-xs text-muted-foreground space-y-1">
                <p>• Current conditions</p>
                <p>• Hourly forecast (72 hours)</p>
                <p>• Daily forecast (3 days)</p>
              </div>
              
              <Button 
                onClick={handleDownload} 
                disabled={isDownloading}
                className="w-full"
              >
                {isDownloading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Downloading...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Download for Offline
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
