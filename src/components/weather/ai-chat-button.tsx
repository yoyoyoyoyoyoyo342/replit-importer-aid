import { useState } from "react";
import { LiquidButton } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { AIWeatherCompanion } from "./ai-weather-companion";
import { WeatherSource } from "@/types/weather";
import paiLogo from "@/assets/pai-logo.png";

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
      <LiquidButton
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-[60] h-14 w-14 rounded-full shadow-lg bg-primary text-primary-foreground hover:bg-primary/90 p-2 hover-scale"
        size="icon"
      >
        <img src={paiLogo} alt="AI weather assistant PAI" className="w-full h-full object-contain" />
      </LiquidButton>

      {/* Chat Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl w-[95vw] lg:w-[80vw] h-[85vh] flex flex-col p-0 gap-0">
          <AIWeatherCompanion 
            weatherData={weatherData}
            location={location}
            isImperial={isImperial}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}