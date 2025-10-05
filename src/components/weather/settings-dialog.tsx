import { useState } from "react";
import { Settings, Globe, Bell, TestTube, Clock, LogOut, User, Eye, RotateCcw, GripVertical, ArrowUp, ArrowDown } from "lucide-react";
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
import { useAuth } from "@/hooks/use-auth";
import { useUserPreferences } from "@/hooks/use-user-preferences";

interface SettingsDialogProps {
  isImperial: boolean;
  onUnitsChange: (isImperial: boolean) => void;
  mostAccurate?: any;
}

export function SettingsDialog({ 
  isImperial, 
  onUnitsChange, 
  mostAccurate 
}: SettingsDialogProps) {
  const { user, profile, signOut, updateProfile } = useAuth();
  const { toast } = useToast();
  const { permission, requestPermission, sendTestNotification, isSupported } = usePushNotifications();
  const { visibleCards, cardOrder, updateVisibility, updateOrder, resetToDefaults } = useUserPreferences();
  const [showTimePicker, setShowTimePicker] = useState(false);

  const cardLabels = {
    pollen: "Pollen Index",
    hourly: "24-Hour Forecast",
    tenDay: "10-Day Forecast",
    detailedMetrics: "Detailed Metrics",
    routines: "User Routines",
  };

  const handleNotificationToggle = async (enabled: boolean) => {
    if (!profile) return;
    
    try {
      if (enabled && permission !== 'granted') {
        const granted = await requestPermission();
        if (!granted) {
          toast({
            variant: "destructive",
            title: "Permission Required",
            description: "Please enable notifications in your browser settings.",
          });
          return;
        }
      }

      await updateProfile({
        notification_enabled: enabled
      });

      toast({
        title: enabled ? "Notifications Enabled" : "Notifications Disabled",
        description: enabled ? "You'll receive daily weather and pollen updates" : "Daily notifications have been turned off",
      });

      if (enabled) {
        setShowTimePicker(true);
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to update settings",
        description: "Please try again.",
      });
    }
  };

  const handleTimeChange = async (time: string) => {
    if (!profile) return;
    
    try {
      await updateProfile({
        notification_time: time
      });

      toast({
        title: "Notification time updated",
        description: `Daily updates will be sent at ${time}`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to update time",
        description: "Please try again.",
      });
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

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Sign out failed",
        description: "Please try again.",
      });
    }
  };

  const moveCard = (index: number, direction: 'up' | 'down') => {
    const newOrder = [...cardOrder];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex < 0 || targetIndex >= newOrder.length) return;
    
    [newOrder[index], newOrder[targetIndex]] = [newOrder[targetIndex], newOrder[index]];
    updateOrder(newOrder);
    
    toast({
      title: "Card order updated",
      description: "Your card layout has been saved",
    });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="text-neutral-600 hover:text-primary rounded-xl">
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
          {/* User Profile */}
          {user && (
            <>
              <div className="space-y-3">
                <Label className="text-base font-medium">Account</Label>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{user.email}</span>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleSignOut}>
                    <LogOut className="w-3 h-3 mr-2" />
                    Sign Out
                  </Button>
                </div>
              </div>
              <Separator />
            </>
          )}

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
                checked={profile?.notification_enabled || false}
                onCheckedChange={handleNotificationToggle}
                disabled={!isSupported || permission === 'denied' || !profile}
              />
            </div>
            
            {/* Time Picker */}
            {profile?.notification_enabled && (
              <div className="space-y-2 p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <Label className="text-sm font-medium">Notification Time</Label>
                </div>
                <input
                  type="time"
                  value={profile.notification_time}
                  onChange={(e) => handleTimeChange(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-input rounded-md glass-card"
                />
              </div>
            )}
            
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                {profile?.notification_enabled ? `Daily updates at ${profile.notification_time}` : "Enable to receive daily weather and pollen updates"}
              </p>
              {permission === 'denied' && (
                <p className="text-xs text-destructive">
                  Notifications blocked. Please enable in browser settings.
                </p>
              )}
              {mostAccurate && profile?.notification_enabled && permission === 'granted' && (
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

          {/* Card Visibility - Only for authenticated users */}
          {user && (
            <>
              <Separator />
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-medium">Card Visibility</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={resetToDefaults}
                    className="h-8 text-xs"
                  >
                    <RotateCcw className="w-3 h-3 mr-1" />
                    Reset
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Toggle visibility and reorder cards
                </p>
                <div className="space-y-2">
                  {cardOrder.map((cardKey, index) => (
                    <div key={cardKey} className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/30 border border-transparent hover:border-border">
                      <div className="flex flex-col gap-0.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-4 w-4 p-0 hover:bg-transparent"
                          onClick={() => moveCard(index, 'up')}
                          disabled={index === 0}
                        >
                          <ArrowUp className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-4 w-4 p-0 hover:bg-transparent"
                          onClick={() => moveCard(index, 'down')}
                          disabled={index === cardOrder.length - 1}
                        >
                          <ArrowDown className="w-3 h-3" />
                        </Button>
                      </div>
                      <GripVertical className="w-4 h-4 text-muted-foreground" />
                      <div className="flex items-center gap-2 flex-1">
                        <Eye className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">{cardLabels[cardKey]}</span>
                      </div>
                      <Switch
                        checked={visibleCards[cardKey]}
                        onCheckedChange={(checked) => updateVisibility(cardKey, checked)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}