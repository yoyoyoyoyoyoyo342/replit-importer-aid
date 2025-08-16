import { useState } from "react";
import { Settings, Globe, Bell, TestTube, Clock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { usePushNotifications } from "@/hooks/use-push-notifications";

interface SettingsDialogProps {
  isImperial: boolean;
  onUnitsChange: (isImperial: boolean) => void;
  notifications: boolean;
  onNotificationsChange: (enabled: boolean) => void;
  notificationTime: string;
  onNotificationTimeChange: (time: string) => void;
  mostAccurate?: any;
}

export function SettingsDialog({ 
  isImperial, 
  onUnitsChange, 
  notifications, 
  onNotificationsChange,
  notificationTime,
  onNotificationTimeChange,
  mostAccurate 
}: SettingsDialogProps) {
  const { toast } = useToast();
  const { permission, requestPermission, sendTestNotification, isSupported } = usePushNotifications();
  const [showTimePicker, setShowTimePicker] = useState(false);

  const handleNotificationToggle = async (enabled: boolean) => {
    if (enabled && permission !== 'granted') {
      const granted = await requestPermission();
      if (granted) {
        onNotificationsChange(true);
        setShowTimePicker(true);
      }
    } else {
      onNotificationsChange(enabled);
      if (enabled) {
        setShowTimePicker(true);
      }
    }
  };

  const handleTestNotification = async () => {
    if (!mostAccurate) return;
    
    const pollenAlerts = [];
    if (mostAccurate.currentWeather.pollenData) {
      const { pollenData } = mostAccurate.currentWeather;
      if (pollenData.grass > 2) pollenAlerts.push('Grass');
      if (pollenData.mugwort > 2) pollenAlerts.push('Mugwort');
      if (pollenData.alder > 2) pollenAlerts.push('Alder');
      if (pollenData.birch > 2) pollenAlerts.push('Birch');
      if (pollenData.olive > 2) pollenAlerts.push('Olive');
      if (pollenData.ragweed > 2) pollenAlerts.push('Ragweed');
    }

    await sendTestNotification({
      temperature: mostAccurate.currentWeather.temperature,
      condition: mostAccurate.currentWeather.condition,
      highTemp: mostAccurate.dailyForecast[0]?.highTemp || 0,
      lowTemp: mostAccurate.dailyForecast[0]?.lowTemp || 0,
      pollenAlerts
    });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="text-neutral-600 hover:text-primary hover:bg-white rounded-xl">
          <Settings className="w-5 h-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Settings
          </DialogTitle>
          <DialogDescription>
            Customize your weather app experience
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          {/* Temperature Units */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Temperature Units</Label>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">Use Celsius (°C)</span>
              </div>
              <Switch
                checked={!isImperial}
                onCheckedChange={(checked) => onUnitsChange(!checked)}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {isImperial ? "Currently using Fahrenheit (°F)" : "Currently using Celsius (°C)"}
            </p>
          </div>

          <Separator />

          {/* Notifications */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Daily Notifications</Label>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">Weather & pollen alerts</span>
              </div>
              <Switch
                checked={notifications}
                onCheckedChange={handleNotificationToggle}
                disabled={!isSupported || permission === 'denied'}
              />
            </div>
            
            {/* Time Picker */}
            {notifications && (
              <div className="space-y-2 p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <Label className="text-sm font-medium">Notification Time</Label>
                </div>
                <input
                  type="time"
                  value={notificationTime}
                  onChange={(e) => onNotificationTimeChange(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-input bg-background rounded-md"
                />
              </div>
            )}
            
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                {notifications ? `Daily updates at ${notificationTime}` : "Enable to receive daily weather and pollen updates"}
              </p>
              {permission === 'denied' && (
                <p className="text-xs text-destructive">
                  Notifications blocked. Please enable in browser settings.
                </p>
              )}
              {mostAccurate && notifications && permission === 'granted' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleTestNotification}
                  className="w-full mt-2"
                >
                  <TestTube className="w-3 h-3 mr-2" />
                  Send Test Notification
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}