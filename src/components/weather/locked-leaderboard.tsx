import { Card } from "@/components/ui/card";
import { Trophy, Medal, Award, TrendingUp } from "lucide-react";

export const LockedLeaderboard = () => {
  const mockLeaderboard = [
    { rank: 1, display_name: "WeatherPro_2024", total_points: 1250, current_streak: 12 },
    { rank: 2, display_name: "StormChaser", total_points: 1100, current_streak: 8 },
    { rank: 3, display_name: "CloudWatcher", total_points: 950, current_streak: 15 },
    { rank: 4, display_name: "RainGuru", total_points: 820, current_streak: 5 },
    { rank: 5, display_name: "ForecastFan", total_points: 750, current_streak: 9 },
  ];

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

  return (
    <Card className="p-6 bg-background/40 backdrop-blur-md border-border/50">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-6 w-6 text-primary" />
          <h3 className="text-xl font-bold">Top Weather Predictors</h3>
        </div>
      </div>

      <div className="space-y-3">
        {mockLeaderboard.map((entry, index) => (
          <div
            key={entry.rank}
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/50 hover:bg-muted/50 transition-colors"
          >
            <div className="w-8 flex justify-center">
              {getRankIcon(index)}
            </div>
            
            <div className="flex-1">
              <div className="font-semibold text-sm">{entry.display_name}</div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                <span className="flex items-center gap-1">
                  <Trophy className="h-3 w-3" />
                  {entry.total_points} pts
                </span>
                <span className="flex items-center gap-1">
                  🔥 {entry.current_streak} days
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};
