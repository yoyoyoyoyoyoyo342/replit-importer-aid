import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Gamepad2, Cloud, Droplets, Snowflake } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SnowSkiingGame } from "./games/snow-skiing-game";
import { RainDodgeGame } from "./games/rain-dodge-game";
import { CloudJumpGame } from "./games/cloud-jump-game";

export function GamesDialog() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-10 px-4 text-sm sm:h-8 sm:px-3 sm:text-xs flex-1 sm:flex-initial">
          <Gamepad2 className="w-4 h-4 sm:w-3 sm:h-3 mr-2 sm:mr-1" />
          Play Games
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Gamepad2 className="w-6 h-6" />
            Weather Mini-Games
          </DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="snow" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="snow" className="text-xs sm:text-sm">
              <Snowflake className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Snow</span> Ski
            </TabsTrigger>
            <TabsTrigger value="rain" className="text-xs sm:text-sm">
              <Droplets className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Rain</span> Dodge
            </TabsTrigger>
            <TabsTrigger value="cloud" className="text-xs sm:text-sm">
              <Cloud className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Cloud</span> Jump
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="snow" className="mt-4">
            <SnowSkiingGame />
          </TabsContent>
          
          <TabsContent value="rain" className="mt-4">
            <RainDodgeGame />
          </TabsContent>
          
          <TabsContent value="cloud" className="mt-4">
            <CloudJumpGame />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
