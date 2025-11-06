import { useState } from "react";
import { Settings, Globe, LogOut, User, Eye, RotateCcw, GripVertical, Languages } from "lucide-react";
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
        <Button variant="ghost" size="icon" className="text-neutral-600 hover:text-primary rounded-xl">
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
        </div>
      </DialogContent>
    </Dialog>;
}