import { useState } from "react";
import { Crown, Lock, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useSubscription } from "@/hooks/use-subscription";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate } from "react-router-dom";

interface UpgradePromptProps {
  feature: string;
  description?: string;
  compact?: boolean;
  onClose?: () => void;
}

export function UpgradePrompt({ feature, description, compact = false, onClose }: UpgradePromptProps) {
  const { openCheckout } = useSubscription();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleUpgrade = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isLoading) return;
    
    if (!user) {
      navigate("/auth");
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Close the dialog first to prevent any interference
      onClose?.();
      
      // Small delay to let the dialog close
      await new Promise(resolve => setTimeout(resolve, 100));
      
      console.log('Upgrade button clicked, calling openCheckout...');
      await openCheckout();
    } catch (error) {
      console.error('Error during upgrade:', error);
      setIsLoading(false);
    }
  };

  if (compact) {
    return (
      <div className="flex items-center justify-between p-3 bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-lg border border-amber-500/20">
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-amber-500" />
          <span className="text-sm font-medium">{feature}</span>
        </div>
        <Button 
          size="sm" 
          onClick={handleUpgrade}
          disabled={isLoading}
          className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
        >
          {isLoading ? (
            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
          ) : (
            <Crown className="w-3 h-3 mr-1" />
          )}
          {isLoading ? 'Loading...' : 'Upgrade'}
        </Button>
      </div>
    );
  }

  return (
    <Card className="border-2 border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-orange-500/5">
      <CardHeader className="text-center pb-2">
        <div className="flex justify-center mb-2">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
            <Lock className="w-6 h-6 text-white" />
          </div>
        </div>
        <CardTitle className="text-lg">{feature}</CardTitle>
        {description && (
          <CardDescription>{description}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="text-center">
        <p className="text-sm text-muted-foreground mb-4">
          This feature requires a Rainz+ subscription.
        </p>
        <Button 
          onClick={handleUpgrade}
          disabled={isLoading}
          className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4 mr-2" />
          )}
          {isLoading ? 'Opening checkout...' : 'Upgrade to Rainz+ • €2/month'}
        </Button>
      </CardContent>
    </Card>
  );
}
