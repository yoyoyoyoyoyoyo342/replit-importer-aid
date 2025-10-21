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
        <DialogContent className="max-w-4xl w-[95vw] lg:w-[80vw] max-h-[90vh] flex flex-col p-0">
          <DialogHeader className="p-4 pb-0 flex-shrink-0">
            <DialogTitle className="flex items-center justify-between text-lg">
              <span>AI Weather Companion</span>
              <Button
                onClick={() => setIsOpen(false)}
                variant="ghost"
                size="icon"
                className="w-8 h-8"
              >
                <X className="w-4 h-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 min-h-0 p-4 pt-2 overflow-hidden">
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