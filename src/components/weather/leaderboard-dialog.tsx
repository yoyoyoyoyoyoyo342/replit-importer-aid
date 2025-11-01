import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Trophy } from "lucide-react";
import { Leaderboard } from "./leaderboard";

export const LeaderboardDialog = () => {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-10 px-4 text-sm sm:h-8 sm:px-3 sm:text-xs flex-1 sm:flex-initial">
          <Trophy className="w-4 h-4 sm:w-3 sm:h-3 mr-2 sm:mr-1" />
          Leaderboard
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Leaderboard</DialogTitle>
        </DialogHeader>
        <Leaderboard />
      </DialogContent>
    </Dialog>
  );
};
