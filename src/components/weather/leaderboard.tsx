import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Trophy, Medal, Award, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { DisplayNameDialog } from "./display-name-dialog";
import { useAuth } from "@/hooks/use-auth";

interface LeaderboardEntry {
  id: string;
  display_name: string;
  total_points: number;
  current_streak: number;
  longest_streak: number;
  total_predictions: number;
  correct_predictions: number;
}

export const Leaderboard = () => {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNameDialog, setShowNameDialog] = useState(false);
  const [hasDisplayName, setHasDisplayName] = useState(false);

  useEffect(() => {
    checkDisplayName();
  }, [user]);

  useEffect(() => {
    if (hasDisplayName) {
      fetchLeaderboard();
    }
  }, [hasDisplayName]);

  const checkDisplayName = async () => {
    if (!user) return;
    
    try {
      const { data } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("user_id", user.id)
        .single();

      if (data?.display_name) {
        setHasDisplayName(true);
      } else {
        setShowNameDialog(true);
      }
    } catch (error) {
      console.error("Error checking display name:", error);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const { data, error } = await supabase
        .from("leaderboard")
        .select("*");

      if (error) throw error;

      setLeaderboard(data || []);
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleNameSet = (name: string | null) => {
    setShowNameDialog(false);
    if (name) {
      setHasDisplayName(true);
    }
  };

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 1:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 2:
        return <Award className="h-5 w-5 text-amber-600" />;
      default:
        return <span className="text-sm font-bold text-muted-foreground">#{index + 1}</span>;
    }
  };

  if (showNameDialog) {
    return <DisplayNameDialog open={showNameDialog} onClose={handleNameSet} />;
  }

  if (!hasDisplayName) {
    return null;
  }

  if (loading) {
    return (
      <Card className="p-6 bg-background/40 backdrop-blur-md border-border/50">
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-background/40 backdrop-blur-md border-border/50">
      <div className="flex items-center gap-2 mb-6">
        <TrendingUp className="h-6 w-6 text-primary" />
        <h3 className="text-xl font-bold">Top 10 Weather Predictors</h3>
      </div>

      {leaderboard.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Trophy className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>No predictions yet. Be the first!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {leaderboard.map((entry, index) => {
            const accuracy = entry.total_predictions > 0
              ? Math.round((entry.correct_predictions / entry.total_predictions) * 100)
              : 0;

            return (
              <div
                key={entry.id}
                className={`flex items-center gap-4 p-4 rounded-lg transition-colors ${
                  index === 0
                    ? "bg-yellow-500/10 border border-yellow-500/30"
                    : index === 1
                    ? "bg-gray-400/10 border border-gray-400/30"
                    : index === 2
                    ? "bg-amber-600/10 border border-amber-600/30"
                    : "bg-background/60 border border-border/30"
                }`}
              >
                <div className="flex items-center justify-center w-8">
                  {getRankIcon(index)}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground truncate">
                    {entry.display_name}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{entry.total_predictions} predictions</span>
                    <span>•</span>
                    <span>{accuracy}% accurate</span>
                    <span>•</span>
                    <span>{entry.current_streak}🔥 streak</span>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-2xl font-bold text-primary">
                    {entry.total_points}
                  </p>
                  <p className="text-xs text-muted-foreground">points</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-6 p-4 bg-secondary/20 rounded-lg">
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">Scoring:</span> +100 points for correct predictions, -50 for incorrect ones
        </p>
      </div>
    </Card>
  );
};
