import { Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface LockedFeatureProps {
  children: React.ReactNode;
  isLocked: boolean;
  className?: string;
}

export function LockedFeature({ children, isLocked, className }: LockedFeatureProps) {
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleClick = (e: React.MouseEvent) => {
    if (isLocked) {
      e.preventDefault();
      e.stopPropagation();
      
      toast({
        title: "🔒 Sign up to enjoy this feature + many more!",
        description: "Create a free account to unlock predictions, leaderboards, streaks, and personalized AI insights.",
        action: (
          <button
            onClick={() => navigate("/auth")}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Sign Up
          </button>
        ),
        duration: 6000,
      });
    }
  };

  if (!isLocked) {
    return <>{children}</>;
  }

  return (
    <div
      onClick={handleClick}
      className={cn(
        "relative cursor-not-allowed",
        className
      )}
    >
      <div className="pointer-events-none opacity-60 grayscale select-none [&_*]:!text-foreground/80">
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="bg-background/95 backdrop-blur-sm p-3 rounded-full shadow-lg border-2 border-primary/30">
          <Lock className="h-6 w-6 text-foreground" />
        </div>
      </div>
    </div>
  );
}
