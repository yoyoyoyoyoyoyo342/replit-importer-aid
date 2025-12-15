import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Gamepad2, Cloud, Droplets, Snowflake, Zap, Wind, Sun, Trophy, Lock } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SnowSkiingGame } from "./games/snow-skiing-game";
import { RainDodgeGame } from "./games/rain-dodge-game";
import { CloudJumpGame } from "./games/cloud-jump-game";
import { LightningDodgeGame } from "./games/lightning-dodge-game";
import { WindSurferGame } from "./games/wind-surfer-game";
import { SunshineCollectorGame } from "./games/sunshine-collector-game";
import { GamesLeaderboard } from "./games-leaderboard";
import { useDailyGameLimit } from "@/hooks/use-daily-game-limit";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";

export function GamesDialog() {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const { status, recordGamePlay } = useDailyGameLimit();
  const [gameCompleted, setGameCompleted] = useState(false);

  const handleGameEnd = async (score: number) => {
    if (!status.hasPlayedToday && !gameCompleted) {
      await recordGamePlay(score);
      setGameCompleted(true);
      toast.success(`Game complete! You earned ${score} points!`);
    }
  };

  const isDisabled = status.hasPlayedToday || gameCompleted;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-10 px-4 text-sm sm:h-8 sm:px-3 sm:text-xs flex-1 sm:flex-initial">
          <Gamepad2 className="w-4 h-4 sm:w-3 sm:h-3 mr-2 sm:mr-1" />
          Play Games
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Gamepad2 className="w-6 h-6" />
            Weather Mini-Games
          </DialogTitle>
        </DialogHeader>

        {/* Daily limit notice */}
        {isDisabled && (
          <Card className="border-primary/30 bg-primary/10">
            <CardContent className="p-4 flex items-center gap-3">
              <Lock className="w-5 h-5 text-primary" />
              <div>
                <p className="font-medium">You've played today!</p>
                <p className="text-sm text-muted-foreground">
                  Today's score: {status.todayScore || gameCompleted ? "recorded" : 0} points. Come back tomorrow!
                </p>
              </div>
            </CardContent>
          </Card>
        )}
        
        <Tabs defaultValue="games" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="games" className="text-sm">
              <Gamepad2 className="w-4 h-4 mr-2" />
              Games
            </TabsTrigger>
            <TabsTrigger value="leaderboard" className="text-sm">
              <Trophy className="w-4 h-4 mr-2" />
              Leaderboard
            </TabsTrigger>
          </TabsList>

          <TabsContent value="games">
            <Tabs defaultValue="snow" className="w-full">
              <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6 gap-1">
                <TabsTrigger value="snow" className="text-xs px-2">
                  <Snowflake className="w-4 h-4" />
                </TabsTrigger>
                <TabsTrigger value="rain" className="text-xs px-2">
                  <Droplets className="w-4 h-4" />
                </TabsTrigger>
                <TabsTrigger value="cloud" className="text-xs px-2">
                  <Cloud className="w-4 h-4" />
                </TabsTrigger>
                <TabsTrigger value="lightning" className="text-xs px-2">
                  <Zap className="w-4 h-4" />
                </TabsTrigger>
                <TabsTrigger value="wind" className="text-xs px-2">
                  <Wind className="w-4 h-4" />
                </TabsTrigger>
                <TabsTrigger value="sun" className="text-xs px-2">
                  <Sun className="w-4 h-4" />
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="snow" className="mt-4">
                <SnowSkiingGame onGameEnd={handleGameEnd} disabled={isDisabled} />
              </TabsContent>
              
              <TabsContent value="rain" className="mt-4">
                <RainDodgeGame onGameEnd={handleGameEnd} disabled={isDisabled} />
              </TabsContent>
              
              <TabsContent value="cloud" className="mt-4">
                <CloudJumpGame onGameEnd={handleGameEnd} disabled={isDisabled} />
              </TabsContent>

              <TabsContent value="lightning" className="mt-4">
                <LightningDodgeGame onGameEnd={handleGameEnd} disabled={isDisabled} />
              </TabsContent>

              <TabsContent value="wind" className="mt-4">
                <WindSurferGame onGameEnd={handleGameEnd} disabled={isDisabled} />
              </TabsContent>

              <TabsContent value="sun" className="mt-4">
                <SunshineCollectorGame onGameEnd={handleGameEnd} disabled={isDisabled} />
              </TabsContent>
            </Tabs>
          </TabsContent>
          
          <TabsContent value="leaderboard">
            <GamesLeaderboard />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
