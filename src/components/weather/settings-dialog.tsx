import { useState, useEffect } from "react";
import { Settings, Globe, LogOut, User, Eye, RotateCcw, GripVertical, Languages, Moon, Sun, Shield, Bell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage, Language, languageFlags } from "@/contexts/language-context";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useUserPreferences } from "@/hooks/use-user-preferences";
import { FeedbackForm } from "./feedback-form";
import { useTheme } from "@/components/theme-provider";
import { useIsAdmin } from "@/hooks/use-is-admin";
import { useNavigate } from "react-router-dom";
interface SettingsDialogProps {
  isImperial: boolean;
  onUnitsChange: (isImperial: boolean) => void;
  mostAccurate?: any;
}
function SortableCardItem({
  cardKey,
  label,
  visible,
  onVisibilityChange
}: {
  cardKey: string;
  label: string;
  visible: boolean;
  onVisibilityChange: (checked: boolean) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: cardKey
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  };
  return <div ref={setNodeRef} style={style} className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 border border-border cursor-move">
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
        <GripVertical className="w-4 h-4 text-muted-foreground" />
      </div>
      <div className="flex items-center gap-2 flex-1">
        <Eye className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm">{label}</span>
      </div>
      <Switch checked={visible} onCheckedChange={onVisibilityChange} />
    </div>;
}
export function SettingsDialog({
  isImperial,
  onUnitsChange,
  mostAccurate
}: SettingsDialogProps) {
  const {
    user,
    signOut
  } = useAuth();
  const {
    toast
  } = useToast();
  const {
    visibleCards,
    cardOrder,
    is24Hour,
    isHighContrast,
    updateVisibility,
    updateOrder,
    updateTimeFormat,
    updateHighContrast,
    resetToDefaults
  } = useUserPreferences();
  const { language, setLanguage, t } = useLanguage();
  const { theme, setTheme } = useTheme();
  const { isAdmin } = useIsAdmin();
  const navigate = useNavigate();
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [notificationTime, setNotificationTime] = useState('08:00');
  const [notifySettings, setNotifySettings] = useState({
    severe_weather: true,
    pollen: true,
    daily_summary: true,
    ai_preview: true,
  });
  const [loadingNotifications, setLoadingNotifications] = useState(true);

  useEffect(() => {
    if (user) {
      loadNotificationSettings();
    }
  }, [user]);

  async function loadNotificationSettings() {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('notification_enabled, notification_time, notify_severe_weather, notify_pollen, notify_daily_summary, notify_ai_preview')
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;

      if (data) {
        setNotificationsEnabled(data.notification_enabled || false);
        setNotificationTime(data.notification_time || '08:00');
        setNotifySettings({
          severe_weather: data.notify_severe_weather ?? true,
          pollen: data.notify_pollen ?? true,
          daily_summary: data.notify_daily_summary ?? true,
          ai_preview: data.notify_ai_preview ?? true,
        });
      }
    } catch (error) {
      console.error('Error loading notification settings:', error);
    } finally {
      setLoadingNotifications(false);
    }
  }

  async function updateNotificationSettings(enabled: boolean, time?: string) {
    if (!user) return;

    try {
      const updates: any = { notification_enabled: enabled };
      if (time !== undefined) {
        updates.notification_time = time;
      }

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Notifications updated",
        description: enabled 
          ? `Daily notifications enabled for ${time || notificationTime}` 
          : "Notifications disabled"
      });
    } catch (error) {
      console.error('Error updating notifications:', error);
      toast({
        title: "Error",
        description: "Failed to update notification settings",
        variant: "destructive"
      });
    }
  }

  async function updateNotificationPreference(type: keyof typeof notifySettings, enabled: boolean) {
    if (!user) return;

    const columnMap = {
      severe_weather: 'notify_severe_weather',
      pollen: 'notify_pollen',
      daily_summary: 'notify_daily_summary',
      ai_preview: 'notify_ai_preview',
    };

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ [columnMap[type]]: enabled })
        .eq('user_id', user.id);

      if (error) throw error;

      setNotifySettings(prev => ({ ...prev, [type]: enabled }));

      toast({
        title: "Preference updated",
        description: `${type.replace('_', ' ')} notifications ${enabled ? 'enabled' : 'disabled'}`
      });
    } catch (error) {
      console.error('Error updating preference:', error);
      toast({
        title: "Error",
        description: "Failed to update notification preference",
        variant: "destructive"
      });
    }
  }
  const cardLabels = {
    pollen: t('pollen.pollenIndex'),
    hourly: t('pollen.hourlyForecast'),
    tenDay: t('pollen.tenDayForecast'),
    detailedMetrics: t('pollen.detailedMetrics'),
    weatherTrends: 'Weather Trends'
  };
  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Sign out failed",
        description: "Please try again."
      });
    }
  };
  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, {
    coordinateGetter: sortableKeyboardCoordinates
  }));
  const handleDragEnd = (event: DragEndEvent) => {
    const {
      active,
      over
    } = event;
    if (over && active.id !== over.id) {
      const oldIndex = cardOrder.indexOf(active.id as any);
      const newIndex = cardOrder.indexOf(over.id as any);
      const newOrder = arrayMove(cardOrder, oldIndex, newIndex);
      updateOrder(newOrder);
      toast({
        title: "Card order updated",
        description: "Your card layout has been saved"
      });
    }
  };
  return <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="text-foreground hover:text-primary rounded-xl">
          <Settings className="w-5 h-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            {t('settings.title')}
          </DialogTitle>
          <DialogDescription>
            {t('settings.customise')}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4 overflow-y-auto flex-1 px-1">
          {/* User Profile */}
          {user && <>
              <div className="space-y-3">
                <Label className="text-base font-medium">{t('settings.account')}</Label>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{user.email}</span>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleSignOut}>
                    <LogOut className="w-3 h-3 mr-2" />
                    {t('settings.signOut')}
                  </Button>
                </div>
              </div>
              <Separator />
            </>}

          {/* Language Selection */}
          <div className="space-y-3">
            <Label className="text-base font-medium flex items-center gap-2">
              <Languages className="w-4 h-4" />
              {t('settings.language')}
            </Label>
            <div className="grid gap-2">
              {(['en-GB', 'en-US', 'da', 'sv', 'no', 'fr', 'it'] as Language[]).map((lang) => (
                <button
                  key={lang}
                  onClick={() => {
                    setLanguage(lang);
                    toast({
                      title: t('settings.languageChanged'),
                      description: `${t('settings.changedTo')} ${t(`language.${lang}`)}`,
                    });
                  }}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                    language === lang
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50 hover:bg-muted/50'
                  }`}
                >
                  <span className="text-2xl">{languageFlags[lang]}</span>
                  <span className="text-sm font-medium">{t(`language.${lang}`)}</span>
                  {language === lang && (
                    <span className="ml-auto text-xs text-primary">✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Feedback Button */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Feedback</Label>
            <FeedbackForm />
          </div>

          <Separator />

          {/* Display Settings */}
          <div className="space-y-4">
            <Label className="text-base font-medium">Display Settings</Label>
            
            {/* Dark Mode */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {theme === 'dark' ? (
                    <Moon className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <Sun className="w-4 h-4 text-muted-foreground" />
                  )}
                  <span className="text-sm">Dark mode</span>
                </div>
                <Switch 
                  checked={theme === 'dark'} 
                  onCheckedChange={(checked) => {
                    setTheme(checked ? 'dark' : 'light');
                    toast({
                      title: "Theme updated",
                      description: `Switched to ${checked ? 'dark' : 'light'} mode`
                    });
                  }} 
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {theme === 'dark' ? 'Currently using dark mode' : 'Currently using light mode'}
              </p>
            </div>

            {/* Temperature Units */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">{t('settings.useCelsius')}</span>
                </div>
                <Switch checked={!isImperial} onCheckedChange={checked => onUnitsChange(!checked)} />
              </div>
              <p className="text-xs text-muted-foreground">
                {isImperial ? t('settings.currentlyFahrenheit') : t('settings.currentlyCelsius')}
              </p>
            </div>

            {/* Time Format */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">Use 24-hour time</span>
                </div>
                <Switch 
                  checked={is24Hour} 
                  onCheckedChange={(checked) => {
                    updateTimeFormat(checked);
                    toast({
                      title: "Time format updated",
                      description: `Now using ${checked ? '24-hour' : '12-hour'} time format`
                    });
                  }} 
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {is24Hour ? 'Currently using 24-hour format (e.g., 15:30)' : 'Currently using 12-hour format (e.g., 3:30 PM)'}
              </p>
            </div>

            {/* High Contrast Mode */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">High contrast mode</span>
                </div>
                <Switch 
                  checked={isHighContrast} 
                  onCheckedChange={(checked) => {
                    updateHighContrast(checked);
                    toast({
                      title: "High contrast mode updated",
                      description: `High contrast mode ${checked ? 'enabled' : 'disabled'}`
                    });
                  }} 
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {isHighContrast ? 'Text is displayed with enhanced contrast' : 'Text is displayed with normal contrast'}
              </p>
            </div>
          </div>

          <Separator />

          {/* Notification Settings */}
          <div className="space-y-4">
            <Label className="text-base font-medium">Notifications</Label>
            
            {/* Enable Notifications */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">Daily weather notifications</span>
                </div>
                <Switch 
                  checked={notificationsEnabled}
                  disabled={loadingNotifications}
                  onCheckedChange={(checked) => {
                    setNotificationsEnabled(checked);
                    updateNotificationSettings(checked);
                  }} 
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {notificationsEnabled 
                  ? 'Receive AI-powered morning weather updates' 
                  : 'Enable to get daily weather notifications'}
              </p>
            </div>

            {/* Notification Time */}
            {notificationsEnabled && (
              <div className="space-y-2">
                <Label htmlFor="notification-time" className="text-sm">
                  Notification time
                </Label>
                <div className="flex items-center gap-2">
                  <input
                    id="notification-time"
                    type="time"
                    value={notificationTime}
                    onChange={(e) => {
                      const newTime = e.target.value;
                      setNotificationTime(newTime);
                      updateNotificationSettings(true, newTime);
                    }}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  You'll receive notifications at {notificationTime} daily
                </p>
              </div>
            )}

            {/* Notification Type Preferences */}
            {notificationsEnabled && (
              <div className="space-y-3 pt-2">
                <Label className="text-sm font-medium">Notification types</Label>
                
                <div className="space-y-2 pl-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Severe weather alerts</span>
                    <Switch 
                      checked={notifySettings.severe_weather}
                      onCheckedChange={(checked) => updateNotificationPreference('severe_weather', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Pollen alerts</span>
                    <Switch 
                      checked={notifySettings.pollen}
                      onCheckedChange={(checked) => updateNotificationPreference('pollen', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Daily summary</span>
                    <Switch 
                      checked={notifySettings.daily_summary}
                      onCheckedChange={(checked) => updateNotificationPreference('daily_summary', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">AI weather preview</span>
                    <Switch 
                      checked={notifySettings.ai_preview}
                      onCheckedChange={(checked) => updateNotificationPreference('ai_preview', checked)}
                    />
                  </div>
                </div>

                <p className="text-xs text-muted-foreground">
                  Choose which types of weather notifications you want to receive
                </p>
              </div>
            )}
          </div>

          <Separator />


          {/* Card Visibility - Only for authenticated users */}
          {user && <>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-medium">{t('settings.cardVisibility')}</Label>
                  <Button variant="ghost" size="sm" onClick={resetToDefaults} className="h-8 text-xs">
                    <RotateCcw className="w-3 h-3 mr-1" />
                    {t('settings.reset')}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">{t('settings.reloadChanges')}</p>
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={cardOrder} strategy={verticalListSortingStrategy}>
                    <div className="space-y-2">
                      {cardOrder.map(cardKey => <SortableCardItem key={cardKey} cardKey={cardKey} label={cardLabels[cardKey]} visible={visibleCards[cardKey]} onVisibilityChange={checked => updateVisibility(cardKey, checked)} />)}
                    </div>
                  </SortableContext>
                </DndContext>
              </div>
            </>}

          {/* Admin Panel Button - Only for admins */}
          {isAdmin && (
            <>
              <Separator />
              <div className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate('/admin')}
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Admin Panel
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>;
}