import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Trophy, Medal, Award, TrendingUp, Gamepad2 } from "lucide-react";
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
}

export const GamesLeaderboard = () => {
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
    if (!user) {
      setLoading(false);
      return;
    }
    
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
      setLoading(false);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      // Fetch profiles with points ordered by total_points
      const { data, error } = await supabase
        .from("profiles")
        .select("display_name, total_points, user_id")
        .not("display_name", "is", null)
        .order("total_points", { ascending: false })
        .limit(10);

      if (error) throw error;

      // Fetch streak data for each user
      const leaderboardData: LeaderboardEntry[] = [];
      
      for (let i = 0; i < (data || []).length; i++) {
        const profile = data![i];
        
        const { data: streakData } = await supabase
          .from("user_streaks")
          .select("current_streak, longest_streak")
          .eq("user_id", profile.user_id)
          .single();

        leaderboardData.push({
          rank: i + 1,
          display_name: profile.display_name || "Anonymous",
          total_points: profile.total_points || 0,
          current_streak: streakData?.current_streak || 0,
          longest_streak: streakData?.longest_streak || 0,
        });
      }

      setLeaderboard(leaderboardData.slice(0, 5));
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

  // If first time and no display name, show dialog
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
          <Gamepad2 className="h-6 w-6 text-primary" />
          <h3 className="text-xl font-bold">Top Players</h3>
        </div>
        {user && (
          <button
            onClick={() => setShowNameDialog(true)}
            className="text-sm text-primary hover:underline"
          >
            Change Name
          </button>
        )}
      </div>

      {leaderboard.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Trophy className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>No scores yet. Be the first!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {leaderboard.map((entry, index) => (
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
                  <span className="font-medium">{entry.current_streak}🔥 streak</span>
                  <span>•</span>
                  <span>Best: {entry.longest_streak}🔥</span>
                </div>
              </div>

              <div className="text-right">
                <p className="text-2xl font-bold text-primary">
                  {entry.total_points}
                </p>
                <p className="text-xs text-muted-foreground">points</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 p-4 bg-secondary/20 rounded-lg">
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">Scoring:</span>
          <br />• 1 point per second survived
          <br />• +1 bonus point per coin/item collected
          <br />• +25 points daily for maintaining your streak
          <br />• 1 game allowed per day
        </p>
      </div>

      {/* Dialog for changing name */}
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
