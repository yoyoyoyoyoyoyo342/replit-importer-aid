import { Crown, Check, Sparkles, Bot, Zap, Ban, Sun, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useSubscription, RAINZ_PLUS } from "@/hooks/use-subscription";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate } from "react-router-dom";

const features = [
  {
    icon: Bot,
    title: "AI Weather Companion",
    description: "Chat with PAI for personalized weather insights and recommendations"
  },
  {
    icon: Ban,
    title: "Ad-Free Experience",
    description: "Enjoy Rainz without any advertisements"
  },
  {
    icon: Zap,
    title: "AI Enhanced Forecasts",
    description: "Access experimental AI-processed weather data"
  },
  {
    icon: Sun,
    title: "Morning AI Review",
    description: "Get personalized morning weather briefings"
  },
  {
    icon: Settings,
    title: "Advanced Settings",
    description: "Unlock additional customization options"
  }
];

export function SubscriptionCard() {
  const { isSubscribed, isLoading, subscriptionEnd, openCheckout, openPortal } = useSubscription();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleSubscribe = async () => {
    if (!user) {
      navigate("/auth");
      return;
    }

    // Errors are surfaced via toast inside openCheckout
    await openCheckout().catch(() => {});
  };

  return (
    <Card className="w-full max-w-md mx-auto overflow-hidden border-2 border-primary/20 bg-gradient-to-br from-background to-primary/5">
      <CardHeader className="text-center pb-2">
        <div className="flex justify-center mb-3">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
            <Crown className="w-8 h-8 text-white" />
          </div>
        </div>
        <CardTitle className="text-2xl font-bold flex items-center justify-center gap-2">
          Rainz+
          {isSubscribed && (
            <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full">Active</span>
          )}
        </CardTitle>
        <CardDescription className="text-lg">
          <span className="text-3xl font-bold text-foreground">{RAINZ_PLUS.price}</span>
          <span className="text-muted-foreground">/{RAINZ_PLUS.interval}</span>
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="space-y-3">
          {features.map((feature, index) => (
            <div key={index} className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <feature.icon className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">{feature.title}</p>
                <p className="text-xs text-muted-foreground">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>

        {isSubscribed ? (
          <div className="space-y-3">
            <div className="text-center text-sm text-muted-foreground">
              {subscriptionEnd && (
                <p>Renews on {new Date(subscriptionEnd).toLocaleDateString()}</p>
              )}
            </div>
            <Button 
              onClick={openPortal} 
              variant="outline" 
              className="w-full"
              disabled={isLoading}
            >
              Manage Subscription
            </Button>
          </div>
        ) : (
          <Button 
            onClick={handleSubscribe} 
            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold"
            disabled={isLoading}
          >
            <Sparkles className="w-4 h-4 mr-2" />
            {user ? "Subscribe to Rainz+" : "Sign in to Subscribe"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
