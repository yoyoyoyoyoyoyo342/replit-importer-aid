import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Target, Trophy } from "lucide-react";
import { WeatherPredictionForm } from "./weather-prediction-form";
import { Leaderboard } from "./leaderboard";
import { useLanguage } from "@/contexts/language-context";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface PredictionDialogProps {
  location: string;
  latitude: number;
  longitude: number;
  isImperial: boolean;
  onPredictionMade: () => void;
}

export const PredictionDialog = ({
  location,
  latitude,
  longitude,
  isImperial,
  onPredictionMade
}: PredictionDialogProps) => {
  const [open, setOpen] = useState(false);
  const { t } = useLanguage();

  const handlePredictionMade = () => {
    onPredictionMade();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-10 px-4 text-sm sm:h-8 sm:px-3 sm:text-xs flex-1 sm:flex-initial">
          <Target className="w-4 h-4 sm:w-3 sm:h-3 mr-2 sm:mr-1" />
          Make Prediction
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Weather Challenge</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="predict" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="predict" className="text-sm sm:text-base">
              <Target className="w-4 h-4 mr-2" />
              Make Prediction
            </TabsTrigger>
            <TabsTrigger value="leaderboard" className="text-sm sm:text-base">
              <Trophy className="w-4 h-4 mr-2" />
              Leaderboard
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="predict" className="mt-6">
            <WeatherPredictionForm
              location={location}
              latitude={latitude}
              longitude={longitude}
              onPredictionMade={handlePredictionMade}
              isImperial={isImperial}
            />
          </TabsContent>
          
          <TabsContent value="leaderboard" className="mt-6">
            <Leaderboard />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
