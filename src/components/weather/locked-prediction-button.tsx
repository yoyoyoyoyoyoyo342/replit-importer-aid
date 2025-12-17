import { Button } from "@/components/ui/button";
import { Target } from "lucide-react";

export const LockedPredictionButton = () => {
  return (
    <Button
      variant="outline"
      size="sm"
      className="h-10 px-4 text-sm sm:h-8 sm:px-3 sm:text-xs flex-1 sm:flex-initial opacity-60 cursor-not-allowed"
      disabled
    >
      <Target className="w-4 h-4 sm:w-3 sm:h-3 mr-2 sm:mr-1" />
      Make Prediction
    </Button>
  );
};
