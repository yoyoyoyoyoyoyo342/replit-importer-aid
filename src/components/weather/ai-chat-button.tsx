import { useState } from "react";
import { LiquidButton } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { AIWeatherCompanion } from "./ai-weather-companion";
import { UpgradePrompt } from "@/components/subscription/upgrade-prompt";
import { WeatherSource } from "@/types/weather";
import { useSubscription } from "@/hooks/use-subscription";
import { Crown, Lock } from "lucide-react";
import rainzLogo from "@/assets/rainz-logo.png";

interface AIChatButtonProps {
  weatherData: WeatherSource;
  location: string;
  isImperial: boolean;
}

export function AIChatButton({ weatherData, location, isImperial }: AIChatButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { isSubscribed } = useSubscription();

  return (
    <>
      {/* Floating Chat Button */}
      <LiquidButton
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 right-6 xl:bottom-6 z-[60] h-14 w-14 rounded-full shadow-lg bg-primary text-primary-foreground hover:bg-primary/90 p-2 hover-scale"
        size="icon"
      >
        <div className="relative w-full h-full">
          <img src={rainzLogo} alt="AI weather assistant" className="w-full h-full object-contain rounded-lg" />
          {!isSubscribed && (
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center">
              <Crown className="w-3 h-3 text-white" />
            </div>
          )}
        </div>
      </LiquidButton>

      {/* Chat Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl w-[95vw] lg:w-[80vw] h-[85vh] flex flex-col p-0 gap-0">
          {isSubscribed ? (
            <AIWeatherCompanion 
              weatherData={weatherData}
              location={location}
              isImperial={isImperial}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center p-6">
              <UpgradePrompt 
                feature="AI Weather Companion"
                description="Chat with PAI for personalized weather insights, recommendations, and proactive alerts"
                onClose={() => setIsOpen(false)}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
