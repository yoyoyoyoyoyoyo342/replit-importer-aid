import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Trophy, Medal, Award, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { DisplayNameDialog } from "./display-name-dialog";
import { useAuth } from "@/hooks/use-auth";

interface LeaderboardEntry {
  rank: number;
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
        .select("*")
        .limit(10);

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

  // If first time and no display name, show dialog and don't render leaderboard
  if (showNameDialog && !hasDisplayName) {
    return <DisplayNameDialog open={showNameDialog} onClose={handleNameSet} allowSkip={false} />;
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
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-6 w-6 text-primary" />
          <h3 className="text-xl font-bold">Top Weather Predictors</h3>
        </div>
        <button
          onClick={() => setShowNameDialog(true)}
          className="text-sm text-primary hover:underline"
        >
          Change Name
        </button>
      </div>

      {leaderboard.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Trophy className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>No predictions yet. Be the first!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {leaderboard.slice(0, 10).map((entry, index) => {
            const accuracy = entry.total_predictions > 0
              ? Math.round((entry.correct_predictions / entry.total_predictions) * 100)
              : 0;

            return (
              <div
                key={entry.rank}
                className={`flex items-center gap-4 p-4 rounded-lg border transition-all ${
                  index === 0
                    ? "bg-yellow-500/20 border-yellow-500/50"
                    : index === 1
                    ? "bg-gray-400/15 border-gray-400/40"
                    : index === 2
                    ? "bg-amber-600/15 border-amber-600/40"
                    : "bg-background/60 border-border/30 hover:bg-background/80"
                }`}
              >
                <div className="flex items-center justify-center w-8">
                  {getRankIcon(index)}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-bold text-foreground truncate">
                    {entry.display_name}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground mt-1">
                    <span className="font-medium">{accuracy}% accurate</span>
                    <span>•</span>
                    <span className="font-medium">{entry.current_streak}🔥</span>
                    <span>•</span>
                    <span>Longest: {entry.longest_streak}🔥</span>
                    <span>•</span>
                    <span>{entry.total_predictions} total</span>
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
          <span className="font-semibold text-foreground">Scoring:</span>
          <br />• +25 points daily for maintaining your streak
          <br />• +100 points if 1 prediction correct
          <br />• +200 points if 2 predictions correct
          <br />• +300 points if all 3 predictions correct
          <br />• -100 points if all predictions wrong
        </p>
      </div>

      {/* Dialog for changing name - only shows when button is clicked */}
      {showNameDialog && hasDisplayName && (
        <DisplayNameDialog 
          open={showNameDialog} 
          onClose={handleNameSet}
          allowSkip={true}
        />
      )}
    </Card>
  );
};
