import { Crown, Lock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useSubscription } from "@/hooks/use-subscription";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate } from "react-router-dom";

interface UpgradePromptProps {
  feature: string;
  description?: string;
  compact?: boolean;
}

export function UpgradePrompt({ feature, description, compact = false }: UpgradePromptProps) {
  const { openCheckout } = useSubscription();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleUpgrade = () => {
    if (!user) {
      navigate("/auth");
      return;
    }
    openCheckout();
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
          className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
        >
          <Crown className="w-3 h-3 mr-1" />
          Upgrade
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
          className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Upgrade to Rainz+ • €2/month
        </Button>
      </CardContent>
    </Card>
  );
}
