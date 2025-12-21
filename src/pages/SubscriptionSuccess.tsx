import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useSubscription } from "@/hooks/use-subscription";

export default function SubscriptionSuccess() {
  const navigate = useNavigate();
  const { checkSubscription } = useSubscription();

  useEffect(() => {
    // Refresh subscription status
    checkSubscription();
  }, [checkSubscription]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-primary/5 to-background">
      <Card className="w-full max-w-md text-center border-2 border-green-500/20 bg-gradient-to-br from-background to-green-500/5">
        <CardHeader className="pb-2">
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center animate-pulse">
              <CheckCircle2 className="w-10 h-10 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-green-600">
            Welcome to Rainz+!
          </CardTitle>
          <CardDescription className="text-lg">
            Your subscription is now active
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="space-y-3 text-left">
            <p className="text-sm text-muted-foreground text-center">
              You now have access to all premium features:
            </p>
            <div className="space-y-2">
              {[
                "AI Weather Companion (PAI)",
                "Ad-free experience",
                "AI Enhanced Forecasts",
                "Morning AI Review",
                "Advanced Settings"
              ].map((feature, index) => (
                <div key={index} className="flex items-center gap-2 p-2 bg-green-500/10 rounded-lg">
                  <Sparkles className="w-4 h-4 text-green-500" />
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          <Button 
            onClick={() => navigate("/")} 
            className="w-full"
          >
            Start Using Rainz+
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
