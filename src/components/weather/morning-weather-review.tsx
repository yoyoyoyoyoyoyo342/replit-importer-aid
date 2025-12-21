import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sunrise, Droplets, Wind, AlertTriangle, ChevronDown, ChevronUp, Sparkles, Crown, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/language-context";
import { useSubscription } from "@/hooks/use-subscription";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate } from "react-router-dom";

interface MorningWeatherReviewProps {
  weatherData: any;
  location: string;
  isImperial: boolean;
  userId?: string;
}

interface MorningReviewData {
  summary: string;
  outfit: string;
  pollenAlerts: string[];
  activityRecommendation: string;
  keyInsight: string;
}

export function MorningWeatherReview({ 
  weatherData, 
  location, 
  isImperial,
  userId 
}: MorningWeatherReviewProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isDismissed, setIsDismissed] = useState(false);
  const [reviewData, setReviewData] = useState<MorningReviewData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { t, language } = useLanguage();
  const { isSubscribed, openCheckout } = useSubscription();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Check if it's morning time (6 AM - 12 PM)
  const isMorningTime = () => {
    const hour = new Date().getHours();
    return hour >= 6 && hour < 12;
  };

  // Check if user dismissed it today
  useEffect(() => {
    const dismissedDate = localStorage.getItem('morning-review-dismissed');
    const today = new Date().toDateString();
    
    if (dismissedDate === today) {
      setIsDismissed(true);
    }
  }, []);

  // Auto-fetch morning review on component mount (only for subscribers)
  useEffect(() => {
    if (isMorningTime() && !isDismissed && weatherData && !reviewData && isSubscribed) {
      fetchMorningReview();
    }
  }, [weatherData, isDismissed, isSubscribed]);

  const fetchMorningReview = async () => {
    if (!weatherData) {
      console.error('No weather data available for morning review');
      return;
    }
    
    setIsLoading(true);
    console.log('Fetching morning review for:', location);
    
    try {
      const { data, error } = await supabase.functions.invoke('ai-weather-insights', {
        body: {
          type: 'morning_review',
          weatherData,
          location,
          isImperial,
          language
        }
      });

      console.log('Morning review response:', { data, error });

      if (error) {
        console.error('Edge function error:', error);
        throw error;
      }

      if (data?.review) {
        console.log('Morning review received successfully');
        setReviewData(data.review);
      } else {
        console.warn('No review data in response:', data);
        throw new Error('No review data received');
      }
    } catch (error) {
      console.error('Error fetching morning review:', error);
      toast({
        title: "Couldn't load morning review",
        description: error instanceof Error ? error.message : "Using basic weather summary instead.",
        variant: "destructive"
      });
      
      // Fallback to basic summary
      const temp = weatherData?.currentWeather?.temperature || 0;
      const condition = weatherData?.currentWeather?.condition || "Unknown";
      setReviewData({
        summary: `Good morning! It's ${temp}°${isImperial ? 'F' : 'C'} and ${condition.toLowerCase()} in ${location}.`,
        outfit: "Dress appropriately for the conditions.",
        pollenAlerts: [],
        activityRecommendation: "Check the full forecast for activity planning.",
        keyInsight: "Have a great day!"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDismiss = () => {
    const today = new Date().toDateString();
    localStorage.setItem('morning-review-dismissed', today);
    setIsDismissed(true);
  };

  const handleUpgrade = () => {
    if (!user) {
      navigate("/auth");
      return;
    }

    // Errors are surfaced via toast inside openCheckout
    void openCheckout().catch(() => {});
  };

  // Don't show if not morning time, already dismissed, or no weather data
  if (!isMorningTime() || isDismissed || !weatherData) {
    return null;
  }

  const temp = weatherData?.currentWeather?.temperature || 0;
  const displayTemp = isImperial ? temp : Math.round((temp - 32) * 5/9);

  // Show upgrade prompt for non-subscribers
  if (!isSubscribed) {
    return (
      <Card className="mb-4 border-2 border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-orange-500/5">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sunrise className="w-5 h-5 text-orange-500" />
              <CardTitle className="text-lg">{t('morning.title')}</CardTitle>
              <span className="flex items-center gap-1 text-xs bg-gradient-to-r from-amber-500 to-orange-500 text-white px-2 py-0.5 rounded-full">
                <Crown className="w-3 h-3" />
                Plus
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="h-7 px-2 text-xs"
            >
              {t('time.dismiss')}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <span className="text-2xl font-bold">{displayTemp}°</span>
              <span className="text-muted-foreground">{isImperial ? 'F' : 'C'}</span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Droplets className="w-4 h-4" />
              <span>{weatherData?.currentWeather?.humidity}%</span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Wind className="w-4 h-4" />
              <span>
                {isImperial 
                  ? `${weatherData?.currentWeather?.windSpeed} mph`
                  : `${Math.round((weatherData?.currentWeather?.windSpeed || 0) * 1.609)} km/h`
                }
              </span>
            </div>
          </div>
          
          <div className="text-center p-4 bg-background/50 rounded-lg border border-amber-500/20">
            <Lock className="w-8 h-8 text-amber-500 mx-auto mb-2" />
            <p className="text-sm font-medium mb-1">Personalized Morning Briefing</p>
            <p className="text-xs text-muted-foreground mb-3">
              Get AI-powered outfit recommendations, pollen alerts, and activity suggestions every morning.
            </p>
            <Button 
              onClick={handleUpgrade}
              size="sm"
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Upgrade to Rainz+ • €2/month
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-4 glass-card border border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sunrise className="w-5 h-5 text-orange-500" />
            <CardTitle className="text-lg">{t('morning.title')}</CardTitle>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-7 w-7 p-0"
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="h-7 px-2 text-xs"
            >
              {t('time.dismiss')}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="space-y-3">
          {/* Quick Stats */}
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <span className="text-2xl font-bold">{displayTemp}°</span>
              <span className="text-muted-foreground">{isImperial ? 'F' : 'C'}</span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Droplets className="w-4 h-4" />
              <span>{weatherData?.currentWeather?.humidity}%</span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Wind className="w-4 h-4" />
              <span>
                {isImperial 
                  ? `${weatherData?.currentWeather?.windSpeed} mph`
                  : `${Math.round((weatherData?.currentWeather?.windSpeed || 0) * 1.609)} km/h`
                }
              </span>
            </div>
          </div>

          {/* Morning Review Content */}
          {isLoading ? (
            <div className="text-center py-4">
              <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">{t('morning.generating')}</p>
            </div>
          ) : reviewData ? (
            <div className="space-y-3">
              {/* Summary */}
              <p className="text-sm font-medium">{reviewData.summary}</p>
              
              {/* Outfit Recommendation */}
              {reviewData.outfit && (
                <div className="bg-background/50 rounded-lg p-3">
                  <p className="text-sm">
                    <span className="font-semibold">👔 {t('morning.outfit')}</span> {reviewData.outfit}
                  </p>
                </div>
              )}

              {/* Pollen Alerts */}
              {reviewData.pollenAlerts && reviewData.pollenAlerts.length > 0 && (
                <div className="bg-yellow-50 dark:bg-yellow-950/20 rounded-lg p-3 border border-yellow-200 dark:border-yellow-800">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-yellow-900 dark:text-yellow-100">{t('morning.pollenAlerts')}</p>
                      {reviewData.pollenAlerts.map((alert, idx) => (
                        <p key={idx} className="text-xs text-yellow-800 dark:text-yellow-200">• {alert}</p>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Activity Recommendation */}
              {reviewData.activityRecommendation && (
                <div className="bg-background/50 rounded-lg p-3">
                  <p className="text-sm">
                    <span className="font-semibold">🏃 {t('morning.activities')}</span> {reviewData.activityRecommendation}
                  </p>
                </div>
              )}

              {/* Key Insight */}
              {reviewData.keyInsight && (
                <div className="bg-primary/10 rounded-lg p-3 border border-primary/20">
                  <p className="text-sm">
                    <span className="font-semibold">💡 {t('morning.keyInsight')}</span> {reviewData.keyInsight}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <Button
              onClick={fetchMorningReview}
              variant="outline"
              size="sm"
              className="w-full"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              {t('morning.generate')}
            </Button>
          )}
        </CardContent>
      )}
    </Card>
  );
}
