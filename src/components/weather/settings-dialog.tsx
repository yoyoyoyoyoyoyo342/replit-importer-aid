import { useEffect } from "react";
import { Settings, Moon, Sun, Globe, Bell } from "lucide-react";
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
import { useTheme } from "@/components/theme-provider";
import { useToast } from "@/hooks/use-toast";

interface SettingsDialogProps {
  isImperial: boolean;
  onUnitsChange: (isImperial: boolean) => void;
  notifications: boolean;
  onNotificationsChange: (enabled: boolean) => void;
}

export function SettingsDialog({ 
  isImperial, 
  onUnitsChange, 
  notifications, 
  onNotificationsChange 
}: SettingsDialogProps) {
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();

  useEffect(() => {
    if (theme === "dark") {
      toast({
        title: "Dark mode enabled",
        description: "The interface has switched to dark theme.",
      });
    }
  }, [theme, toast]);

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

          {/* Theme Settings */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Appearance</Label>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {theme === "dark" ? <Moon className="w-4 h-4 text-muted-foreground" /> : <Sun className="w-4 h-4 text-muted-foreground" />}
                <span className="text-sm">Dark mode</span>
              </div>
              <Switch
                checked={theme === "dark"}
                onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Switch between light and dark themes
            </p>
          </div>

          <Separator />

          {/* Notifications */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Notifications</Label>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">Weather alerts</span>
              </div>
              <Switch
                checked={notifications}
                onCheckedChange={onNotificationsChange}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Receive notifications for severe weather conditions
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}