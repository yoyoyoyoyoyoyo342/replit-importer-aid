import { useState } from "react";
import { MessageCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AIWeatherCompanion } from "./ai-weather-companion";
import { WeatherSource } from "@/types/weather";

interface AIChatButtonProps {
  weatherData: WeatherSource;
  location: string;
  isImperial: boolean;
}

export function AIChatButton({ weatherData, location, isImperial }: AIChatButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Chat Button */}
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg bg-primary hover:bg-primary/90 text-primary-foreground"
        size="icon"
      >
        <MessageCircle className="w-6 h-6" />
      </Button>

      {/* Chat Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] p-0">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="flex items-center justify-between">
              <span>AI Weather Companion</span>
              <Button
                onClick={() => setIsOpen(false)}
                variant="ghost"
                size="icon"
                className="w-6 h-6"
              >
                <X className="w-4 h-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          <div className="p-6 pt-2">
            <AIWeatherCompanion 
              weatherData={weatherData}
              location={location}
              isImperial={isImperial}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}