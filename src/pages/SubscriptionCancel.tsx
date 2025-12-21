import { useNavigate } from "react-router-dom";
import { XCircle, ArrowRight, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useSubscription } from "@/hooks/use-subscription";

export default function SubscriptionCancel() {
  const navigate = useNavigate();
  const { openCheckout } = useSubscription();

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-muted/20 to-background">
      <Card className="w-full max-w-md text-center border-2 border-border">
        <CardHeader className="pb-2">
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
              <XCircle className="w-10 h-10 text-muted-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">
            Checkout Cancelled
          </CardTitle>
          <CardDescription className="text-lg">
            No worries, you weren't charged
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            You can subscribe to Rainz+ anytime to unlock all premium features.
          </p>

          <div className="flex flex-col gap-2">
            <Button 
              onClick={openCheckout} 
              variant="outline"
              className="w-full"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
            
            <Button 
              onClick={() => navigate("/")} 
              className="w-full"
            >
              Continue to Rainz
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
