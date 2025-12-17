import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Target, Trophy, Swords } from "lucide-react";
import { WeatherPredictionForm } from "./weather-prediction-form";
import { Leaderboard } from "./leaderboard";
import { PredictionBattles } from "./prediction-battles";
import { useLanguage } from "@/contexts/language-context";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { usePredictionBattles } from "@/hooks/use-prediction-battles";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

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
  const [activeTab, setActiveTab] = useState("predict");
  const [createBattleMode, setCreateBattleMode] = useState(false);
  const { t } = useLanguage();
  const { pendingChallenges, createBattle } = usePredictionBattles();

  const handlePredictionMade = async (predictionId?: string) => {
    if (createBattleMode && predictionId) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const battleDate = tomorrow.toISOString().split("T")[0];
      await createBattle(location, latitude, longitude, battleDate, predictionId);
    }
    onPredictionMade();
    setOpen(false);
  };

  const handleAcceptBattle = (battleId: string) => {
    setActiveTab("predict");
    // User needs to make a prediction first, then we'll link it to the battle
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-10 px-4 text-sm sm:h-8 sm:px-3 sm:text-xs flex-1 sm:flex-initial relative">
          <Target className="w-4 h-4 sm:w-3 sm:h-3 mr-2 sm:mr-1" />
          Make Prediction
          {pendingChallenges.length > 0 && (
            <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center bg-destructive text-destructive-foreground">
              {pendingChallenges.length}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Weather Challenge</DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="predict" className="text-sm sm:text-base">
              <Target className="w-4 h-4 mr-2" />
              Predict
            </TabsTrigger>
            <TabsTrigger value="battles" className="text-sm sm:text-base relative">
              <Swords className="w-4 h-4 mr-2" />
              Battles
              {pendingChallenges.length > 0 && (
                <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center bg-destructive text-destructive-foreground text-xs">
                  {pendingChallenges.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="leaderboard" className="text-sm sm:text-base">
              <Trophy className="w-4 h-4 mr-2" />
              Leaderboard
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="predict" className="mt-6">
            <div className="mb-4 flex items-center justify-between p-3 bg-primary/10 rounded-lg border border-primary/20">
              <div className="flex items-center gap-2">
                <Swords className="w-5 h-5 text-primary" />
                <div>
                  <Label htmlFor="battle-mode" className="font-medium">Challenge Mode</Label>
                  <p className="text-xs text-muted-foreground">Create a battle for others to accept</p>
                </div>
              </div>
              <Switch
                id="battle-mode"
                checked={createBattleMode}
                onCheckedChange={setCreateBattleMode}
              />
            </div>
            {createBattleMode && (
              <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <p className="text-sm text-yellow-600 dark:text-yellow-400">
                  <Swords className="w-4 h-4 inline mr-1" />
                  Your prediction will create a head-to-head battle. If someone accepts, the winner gets <strong>+50 bonus points</strong>!
                </p>
              </div>
            )}
            <WeatherPredictionForm
              location={location}
              latitude={latitude}
              longitude={longitude}
              onPredictionMade={handlePredictionMade}
              isImperial={isImperial}
              returnPredictionId={createBattleMode}
            />
          </TabsContent>
          
          <TabsContent value="battles" className="mt-6">
            <PredictionBattles
              location={location}
              latitude={latitude}
              longitude={longitude}
              onAcceptBattle={handleAcceptBattle}
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
