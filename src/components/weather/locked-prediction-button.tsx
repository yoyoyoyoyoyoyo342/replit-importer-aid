import { Button } from "@/components/ui/button";
import { CloudSun } from "lucide-react";

export const LockedPredictionButton = () => {
  return (
    <Button
      variant="default"
      size="lg"
      className="gap-2 shadow-lg"
    >
      <CloudSun className="h-5 w-5" />
      Make Prediction
    </Button>
  );
};
