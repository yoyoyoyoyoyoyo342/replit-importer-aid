import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { 
  ArrowLeft, 
  Trophy, 
  Flame, 
  Target, 
  Swords, 
  Award,
  TrendingUp,
  Calendar,
  CheckCircle,
  XCircle
} from "lucide-react";

interface UserProfileData {
  display_name: string;
  total_points: number;
  created_at: string;
}

interface StreakData {
  current_streak: number;
  longest_streak: number;
  total_visits: number;
}

interface BattleStats {
  total_battles: number;
  wins: number;
  losses: number;
  pending: number;
}

interface PredictionStats {
  total_predictions: number;
  correct_predictions: number;
  accuracy: number;
}

const UserProfile = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [streakData, setStreakData] = useState<StreakData | null>(null);
  const [battleStats, setBattleStats] = useState<BattleStats | null>(null);
  const [predictionStats, setPredictionStats] = useState<PredictionStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      fetchUserData();
    }
  }, [userId]);

  const fetchUserData = async () => {
    if (!userId) return;

    try {
      // Fetch profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("display_name, total_points, created_at")
        .eq("user_id", userId)
        .maybeSingle();

      setProfile(profileData);

      // Fetch streak data
      const { data: streakInfo } = await supabase
        .from("user_streaks")
        .select("current_streak, longest_streak, total_visits")
        .eq("user_id", userId)
        .maybeSingle();

      setStreakData(streakInfo);

      // Fetch battle stats
      const { data: battles } = await supabase
        .from("prediction_battles")
        .select("status, winner_id, challenger_id, opponent_id")
        .or(`challenger_id.eq.${userId},opponent_id.eq.${userId}`);

      if (battles) {
        const wins = battles.filter(b => b.winner_id === userId).length;
        const completed = battles.filter(b => b.status === "completed");
        const losses = completed.filter(b => b.winner_id && b.winner_id !== userId).length;
        const pending = battles.filter(b => b.status === "pending" || b.status === "accepted").length;

        setBattleStats({
          total_battles: battles.length,
          wins,
          losses,
          pending,
        });
      }

      // Fetch prediction stats
      const { data: predictions } = await supabase
        .from("weather_predictions")
        .select("is_verified, is_correct")
        .eq("user_id", userId);

      if (predictions) {
        const verified = predictions.filter(p => p.is_verified);
        const correct = verified.filter(p => p.is_correct).length;
        const accuracy = verified.length > 0 
          ? Math.round((correct / verified.length) * 100) 
          : 0;

        setPredictionStats({
          total_predictions: predictions.length,
          correct_predictions: correct,
          accuracy,
        });
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="max-w-2xl mx-auto space-y-6">
          <Skeleton className="h-12 w-48" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="max-w-2xl mx-auto text-center py-12">
          <h1 className="text-2xl font-bold text-foreground mb-4">User Not Found</h1>
          <Button onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const memberSince = new Date(profile.created_at).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        {/* Profile Header */}
        <Card className="p-6 bg-background/40 backdrop-blur-md border-border/50">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-2xl font-bold text-primary">
                {profile.display_name?.charAt(0).toUpperCase() || "?"}
              </span>
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-foreground">{profile.display_name}</h1>
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Calendar className="h-4 w-4" />
                <span>Member since {memberSince}</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-primary">{profile.total_points}</p>
              <p className="text-sm text-muted-foreground">Total Points</p>
            </div>
          </div>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          {/* Streak Stats */}
          <Card className="p-4 bg-background/40 backdrop-blur-md border-border/50">
            <div className="flex items-center gap-2 mb-3">
              <Flame className="h-5 w-5 text-orange-500" />
              <h3 className="font-semibold">Streaks</h3>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Current</span>
                <span className="font-bold">{streakData?.current_streak || 0} 🔥</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Longest</span>
                <span className="font-bold">{streakData?.longest_streak || 0} 🔥</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Visits</span>
                <span className="font-bold">{streakData?.total_visits || 0}</span>
              </div>
            </div>
          </Card>

          {/* Prediction Stats */}
          <Card className="p-4 bg-background/40 backdrop-blur-md border-border/50">
            <div className="flex items-center gap-2 mb-3">
              <Target className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Predictions</h3>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total</span>
                <span className="font-bold">{predictionStats?.total_predictions || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Correct</span>
                <span className="font-bold">{predictionStats?.correct_predictions || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Accuracy</span>
                <span className="font-bold">{predictionStats?.accuracy || 0}%</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Battle Stats */}
        <Card className="p-4 bg-background/40 backdrop-blur-md border-border/50">
          <div className="flex items-center gap-2 mb-4">
            <Swords className="h-5 w-5 text-red-500" />
            <h3 className="font-semibold">Battle Record</h3>
          </div>
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-foreground">{battleStats?.total_battles || 0}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-500">{battleStats?.wins || 0}</p>
              <p className="text-xs text-muted-foreground">Wins</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-red-500">{battleStats?.losses || 0}</p>
              <p className="text-xs text-muted-foreground">Losses</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-500">{battleStats?.pending || 0}</p>
              <p className="text-xs text-muted-foreground">Active</p>
            </div>
          </div>
          {battleStats && battleStats.wins + battleStats.losses > 0 && (
            <div className="mt-4 pt-4 border-t border-border/50">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Win Rate</span>
                <Badge variant={battleStats.wins > battleStats.losses ? "default" : "secondary"}>
                  {Math.round((battleStats.wins / (battleStats.wins + battleStats.losses)) * 100)}%
                </Badge>
              </div>
            </div>
          )}
        </Card>

        {/* Achievements */}
        <Card className="p-4 bg-background/40 backdrop-blur-md border-border/50">
          <div className="flex items-center gap-2 mb-4">
            <Award className="h-5 w-5 text-yellow-500" />
            <h3 className="font-semibold">Achievements</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {/* First Prediction */}
            <div className={`p-3 rounded-lg border ${(predictionStats?.total_predictions || 0) > 0 ? 'bg-primary/10 border-primary/30' : 'bg-muted/20 border-border/30 opacity-50'}`}>
              <CheckCircle className={`h-6 w-6 mb-1 ${(predictionStats?.total_predictions || 0) > 0 ? 'text-primary' : 'text-muted-foreground'}`} />
              <p className="text-sm font-medium">First Prediction</p>
              <p className="text-xs text-muted-foreground">Made a prediction</p>
            </div>

            {/* Streak Master */}
            <div className={`p-3 rounded-lg border ${(streakData?.longest_streak || 0) >= 7 ? 'bg-orange-500/10 border-orange-500/30' : 'bg-muted/20 border-border/30 opacity-50'}`}>
              <Flame className={`h-6 w-6 mb-1 ${(streakData?.longest_streak || 0) >= 7 ? 'text-orange-500' : 'text-muted-foreground'}`} />
              <p className="text-sm font-medium">Streak Master</p>
              <p className="text-xs text-muted-foreground">7-day streak</p>
            </div>

            {/* Battle Victor */}
            <div className={`p-3 rounded-lg border ${(battleStats?.wins || 0) >= 1 ? 'bg-green-500/10 border-green-500/30' : 'bg-muted/20 border-border/30 opacity-50'}`}>
              <Trophy className={`h-6 w-6 mb-1 ${(battleStats?.wins || 0) >= 1 ? 'text-green-500' : 'text-muted-foreground'}`} />
              <p className="text-sm font-medium">Battle Victor</p>
              <p className="text-xs text-muted-foreground">Won a battle</p>
            </div>

            {/* Accuracy Pro */}
            <div className={`p-3 rounded-lg border ${(predictionStats?.accuracy || 0) >= 70 ? 'bg-blue-500/10 border-blue-500/30' : 'bg-muted/20 border-border/30 opacity-50'}`}>
              <Target className={`h-6 w-6 mb-1 ${(predictionStats?.accuracy || 0) >= 70 ? 'text-blue-500' : 'text-muted-foreground'}`} />
              <p className="text-sm font-medium">Accuracy Pro</p>
              <p className="text-xs text-muted-foreground">70%+ accuracy</p>
            </div>

            {/* Points Legend */}
            <div className={`p-3 rounded-lg border ${(profile.total_points || 0) >= 1000 ? 'bg-purple-500/10 border-purple-500/30' : 'bg-muted/20 border-border/30 opacity-50'}`}>
              <TrendingUp className={`h-6 w-6 mb-1 ${(profile.total_points || 0) >= 1000 ? 'text-purple-500' : 'text-muted-foreground'}`} />
              <p className="text-sm font-medium">Points Legend</p>
              <p className="text-xs text-muted-foreground">1000+ points</p>
            </div>

            {/* Battle Champion */}
            <div className={`p-3 rounded-lg border ${(battleStats?.wins || 0) >= 10 ? 'bg-yellow-500/10 border-yellow-500/30' : 'bg-muted/20 border-border/30 opacity-50'}`}>
              <Swords className={`h-6 w-6 mb-1 ${(battleStats?.wins || 0) >= 10 ? 'text-yellow-500' : 'text-muted-foreground'}`} />
              <p className="text-sm font-medium">Battle Champion</p>
              <p className="text-xs text-muted-foreground">10 battle wins</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default UserProfile;
