import { useState } from "react";
import { Settings, Globe, LogOut, User, Eye, RotateCcw, GripVertical } from "lucide-react";
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
    updateVisibility,
    updateOrder,
    resetToDefaults
  } = useUserPreferences();
  const cardLabels = {
    pollen: "Pollen Index",
    hourly: "24-Hour Forecast",
    tenDay: "10-Day Forecast",
    detailedMetrics: "Detailed Metrics",
    routines: "User Routines"
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
            Settings
          </DialogTitle>
          <DialogDescription>
            Customize your weather app experience
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4 overflow-y-auto flex-1 px-1">
          {/* User Profile */}
          {user && <>
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
            </>}

          {/* Temperature Units */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Temperature Units</Label>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">Use Celsius (°C)</span>
              </div>
              <Switch checked={!isImperial} onCheckedChange={checked => onUnitsChange(!checked)} />
            </div>
            <p className="text-xs text-muted-foreground">
              {isImperial ? "Currently using Fahrenheit (°F)" : "Currently using Celsius (°C)"}
            </p>
          </div>


          {/* Card Visibility - Only for authenticated users */}
          {user && <>
              <Separator />
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-medium">Card Visibility</Label>
                  <Button variant="ghost" size="sm" onClick={resetToDefaults} className="h-8 text-xs">
                    <RotateCcw className="w-3 h-3 mr-1" />
                    Reset
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">Reload to activate changes.</p>
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