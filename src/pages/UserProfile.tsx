import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
  Star,
  Crown,
  Shield,
  Sparkles,
  Zap,
  Medal,
  User,
  Clock,
  Activity
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
  ties: number;
  pending: number;
  currentWinStreak: number;
  longestWinStreak: number;
}

interface PredictionStats {
  total_predictions: number;
  correct_predictions: number;
  accuracy: number;
}

// Circular progress component
const CircularProgress = ({ 
  value, 
  max, 
  size = 120, 
  strokeWidth = 8, 
  color = "hsl(var(--primary))",
  label,
  sublabel
}: { 
  value: number; 
  max: number; 
  size?: number; 
  strokeWidth?: number; 
  color?: string;
  label: string;
  sublabel: string;
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const percentage = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth={strokeWidth}
            className="opacity-20"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-foreground">{value}</span>
          <span className="text-xs text-muted-foreground">{sublabel}</span>
        </div>
      </div>
      <span className="mt-2 text-sm font-medium text-foreground">{label}</span>
    </div>
  );
};

// Stat card component
const StatCard = ({ 
  icon: Icon, 
  label, 
  value, 
  sublabel,
  color = "primary",
  trend
}: { 
  icon: any; 
  label: string; 
  value: string | number; 
  sublabel?: string;
  color?: string;
  trend?: "up" | "down" | "neutral";
}) => {
  const colorClasses: Record<string, string> = {
    primary: "from-primary/20 to-primary/5 border-primary/30",
    orange: "from-orange-500/20 to-orange-500/5 border-orange-500/30",
    green: "from-green-500/20 to-green-500/5 border-green-500/30",
    red: "from-red-500/20 to-red-500/5 border-red-500/30",
    yellow: "from-yellow-500/20 to-yellow-500/5 border-yellow-500/30",
    purple: "from-purple-500/20 to-purple-500/5 border-purple-500/30",
  };

  const iconColors: Record<string, string> = {
    primary: "text-primary",
    orange: "text-orange-500",
    green: "text-green-500",
    red: "text-red-500",
    yellow: "text-yellow-500",
    purple: "text-purple-500",
  };

  return (
    <div className={`p-4 rounded-xl bg-gradient-to-br ${colorClasses[color]} border backdrop-blur-sm animate-fade-in`}>
      <div className="flex items-center justify-between mb-2">
        <Icon className={`h-5 w-5 ${iconColors[color]}`} />
        {trend && (
          <TrendingUp className={`h-4 w-4 ${trend === "up" ? "text-green-500" : trend === "down" ? "text-red-500 rotate-180" : "text-muted-foreground"}`} />
        )}
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
      {sublabel && <p className="text-xs text-muted-foreground/70 mt-1">{sublabel}</p>}
    </div>
  );
};

// Achievement badge component
const AchievementBadge = ({ 
  icon: Icon, 
  name, 
  description, 
  unlocked, 
  color,
  rarity = "common"
}: { 
  icon: any; 
  name: string; 
  description: string; 
  unlocked: boolean; 
  color: string;
  rarity?: "common" | "rare" | "epic" | "legendary";
}) => {
  const rarityGlow: Record<string, string> = {
    common: "",
    rare: "shadow-blue-500/20",
    epic: "shadow-purple-500/30",
    legendary: "shadow-yellow-500/40",
  };

  const rarityBorder: Record<string, string> = {
    common: "border-border/30",
    rare: "border-blue-500/50",
    epic: "border-purple-500/50",
    legendary: "border-yellow-500/50 animate-pulse",
  };

  return (
    <div 
      className={`
        relative p-4 rounded-xl border transition-all duration-300
        ${unlocked 
          ? `bg-${color}/10 ${rarityBorder[rarity]} shadow-lg ${rarityGlow[rarity]} hover:scale-105` 
          : 'bg-muted/10 border-border/20 opacity-40 grayscale'
        }
      `}
    >
      {unlocked && rarity === "legendary" && (
        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-yellow-500/10 via-transparent to-yellow-500/10 animate-pulse" />
      )}
      <div className="relative flex items-start gap-3">
        <div className={`
          p-2.5 rounded-lg 
          ${unlocked ? `bg-${color}/20` : 'bg-muted/20'}
        `}>
          <Icon className={`h-6 w-6 ${unlocked ? `text-${color}` : 'text-muted-foreground'}`} 
            style={{ color: unlocked ? color : undefined }} 
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className={`font-semibold text-sm ${unlocked ? 'text-foreground' : 'text-muted-foreground'}`}>
              {name}
            </p>
            {unlocked && rarity !== "common" && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                {rarity.charAt(0).toUpperCase() + rarity.slice(1)}
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        </div>
        {unlocked && (
          <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
        )}
      </div>
    </div>
  );
};

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
      const { data: profileData } = await supabase
        .from("profiles")
        .select("display_name, total_points, created_at")
        .eq("user_id", userId)
        .maybeSingle();

      setProfile(profileData);

      const { data: streakInfo } = await supabase
        .from("user_streaks")
        .select("current_streak, longest_streak, total_visits")
        .eq("user_id", userId)
        .maybeSingle();

      setStreakData(streakInfo);

      const { data: battles } = await supabase
        .from("prediction_battles")
        .select("status, winner_id, challenger_id, opponent_id, updated_at")
        .or(`challenger_id.eq.${userId},opponent_id.eq.${userId}`)
        .order("updated_at", { ascending: false });

      if (battles) {
        const wins = battles.filter(b => b.winner_id === userId).length;
        const completed = battles.filter(b => b.status === "completed");
        const losses = completed.filter(b => b.winner_id && b.winner_id !== userId).length;
        const ties = completed.filter(b => !b.winner_id).length;
        const pending = battles.filter(b => b.status === "pending" || b.status === "accepted").length;

        let currentWinStreak = 0;
        const completedBattles = battles.filter(b => b.status === "completed");
        for (const battle of completedBattles) {
          if (battle.winner_id === userId) {
            currentWinStreak++;
          } else {
            break;
          }
        }

        let longestWinStreak = 0;
        let tempStreak = 0;
        for (const battle of [...completedBattles].reverse()) {
          if (battle.winner_id === userId) {
            tempStreak++;
            longestWinStreak = Math.max(longestWinStreak, tempStreak);
          } else {
            tempStreak = 0;
          }
        }

        setBattleStats({
          total_battles: battles.length,
          wins,
          losses,
          ties,
          pending,
          currentWinStreak,
          longestWinStreak,
        });
      }

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
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20 p-4 md:p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-12 w-32" />
          <Skeleton className="h-72 w-full rounded-2xl" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20 p-4 md:p-8">
        <div className="max-w-4xl mx-auto text-center py-20">
          <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-6">
            <User className="h-10 w-10 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">User Not Found</h1>
          <p className="text-muted-foreground mb-6">This profile doesn't exist or has been removed.</p>
          <Button onClick={() => navigate(-1)} variant="outline">
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

  const daysSinceJoined = Math.floor((Date.now() - new Date(profile.created_at).getTime()) / (1000 * 60 * 60 * 24));
  const winRate = battleStats && (battleStats.wins + battleStats.losses) > 0 
    ? Math.round((battleStats.wins / (battleStats.wins + battleStats.losses)) * 100) 
    : 0;

  const achievements = [
    { icon: CheckCircle, name: "First Prediction", description: "Made your first prediction", unlocked: (predictionStats?.total_predictions || 0) > 0, color: "#22c55e", rarity: "common" as const },
    { icon: Sparkles, name: "Weather Guru", description: "50 predictions made", unlocked: (predictionStats?.total_predictions || 0) >= 50, color: "#06b6d4", rarity: "rare" as const },
    { icon: Medal, name: "Weather Veteran", description: "100 predictions made", unlocked: (predictionStats?.total_predictions || 0) >= 100, color: "#6366f1", rarity: "epic" as const },
    { icon: Star, name: "Perfect Prediction", description: "100% accuracy with 5+ predictions", unlocked: (predictionStats?.accuracy || 0) === 100 && (predictionStats?.correct_predictions || 0) >= 5, color: "#f59e0b", rarity: "legendary" as const },
    { icon: Target, name: "Accuracy Pro", description: "70%+ prediction accuracy", unlocked: (predictionStats?.accuracy || 0) >= 70, color: "#3b82f6", rarity: "rare" as const },
    { icon: Flame, name: "Streak Master", description: "7-day prediction streak", unlocked: (streakData?.longest_streak || 0) >= 7, color: "#f97316", rarity: "rare" as const },
    { icon: Zap, name: "Streak Legend", description: "30-day prediction streak", unlocked: (streakData?.longest_streak || 0) >= 30, color: "#ef4444", rarity: "legendary" as const },
    { icon: Trophy, name: "Battle Victor", description: "Won your first battle", unlocked: (battleStats?.wins || 0) >= 1, color: "#22c55e", rarity: "common" as const },
    { icon: Swords, name: "Battle Champion", description: "Won 10 battles", unlocked: (battleStats?.wins || 0) >= 10, color: "#eab308", rarity: "epic" as const },
    { icon: Shield, name: "Undefeated", description: "5 consecutive wins", unlocked: (battleStats?.longestWinStreak || 0) >= 5, color: "#10b981", rarity: "epic" as const },
    { icon: TrendingUp, name: "Points Legend", description: "1000+ total points", unlocked: (profile.total_points || 0) >= 1000, color: "#a855f7", rarity: "rare" as const },
    { icon: Crown, name: "Weather Elite", description: "5000+ total points", unlocked: (profile.total_points || 0) >= 5000, color: "#ec4899", rarity: "legendary" as const },
  ];

  const unlockedCount = achievements.filter(a => a.unlocked).length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20 pb-32">
      {/* Header */}
      <div className="relative">
        {/* Background gradient */}
        <div className="absolute inset-0 h-80 bg-gradient-to-b from-primary/20 via-primary/10 to-transparent" />
        
        {/* Content */}
        <div className="relative max-w-4xl mx-auto px-4 pt-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate(-1)}
            className="mb-6 hover:bg-background/50"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>

          {/* Profile Card */}
          <Card className="relative overflow-hidden bg-background/60 backdrop-blur-xl border-border/50 shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5" />
            
            <div className="relative p-6 md:p-8">
              <div className="flex flex-col md:flex-row items-center gap-6">
                {/* Avatar */}
                <div className="relative">
                  <div className="w-28 h-28 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg shadow-primary/30">
                    <span className="text-4xl font-bold text-primary-foreground">
                      {profile.display_name?.charAt(0).toUpperCase() || "?"}
                    </span>
                  </div>
                  {/* Level indicator */}
                  <div className="absolute -bottom-1 -right-1 w-10 h-10 rounded-full bg-background border-2 border-primary flex items-center justify-center">
                    <span className="text-sm font-bold text-primary">
                      {Math.floor((profile.total_points || 0) / 500) + 1}
                    </span>
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1 text-center md:text-left">
                  <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
                    {profile.display_name}
                  </h1>
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-4 w-4" />
                      <span className="text-sm">Joined {memberSince}</span>
                    </div>
                    <span className="hidden md:inline text-border">•</span>
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-4 w-4" />
                      <span className="text-sm">{daysSinceJoined} days active</span>
                    </div>
                  </div>
                  
                  {/* Achievement progress */}
                  <div className="mt-4">
                    <div className="flex items-center justify-center md:justify-start gap-2 mb-1.5">
                      <Award className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm text-muted-foreground">
                        {unlockedCount}/{achievements.length} Achievements
                      </span>
                    </div>
                    <Progress 
                      value={(unlockedCount / achievements.length) * 100} 
                      className="h-2 w-full md:w-64"
                    />
                  </div>
                </div>

                {/* Points */}
                <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30">
                  <Trophy className="h-6 w-6 text-primary mx-auto mb-2" />
                  <p className="text-4xl font-bold text-primary">{profile.total_points.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Total Points</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Stats Section */}
      <div className="max-w-4xl mx-auto px-4 mt-8 space-y-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard 
            icon={Flame} 
            label="Current Streak" 
            value={`${streakData?.current_streak || 0}🔥`}
            sublabel={`Best: ${streakData?.longest_streak || 0} days`}
            color="orange"
          />
          <StatCard 
            icon={Target} 
            label="Accuracy" 
            value={`${predictionStats?.accuracy || 0}%`}
            sublabel={`${predictionStats?.correct_predictions || 0}/${predictionStats?.total_predictions || 0} correct`}
            color="primary"
          />
          <StatCard 
            icon={Swords} 
            label="Win Rate" 
            value={`${winRate}%`}
            sublabel={`${battleStats?.wins || 0}W - ${battleStats?.losses || 0}L`}
            color={winRate >= 50 ? "green" : "red"}
          />
          <StatCard 
            icon={Activity} 
            label="Total Visits" 
            value={streakData?.total_visits || 0}
            sublabel="Days on Rainz"
            color="purple"
          />
        </div>

        {/* Circular Progress Stats */}
        <Card className="p-6 md:p-8 bg-background/40 backdrop-blur-md border-border/50">
          <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Performance Overview
          </h3>
          <div className="flex flex-wrap justify-around gap-8">
            <CircularProgress 
              value={predictionStats?.total_predictions || 0} 
              max={100}
              label="Predictions"
              sublabel="made"
              color="hsl(var(--primary))"
            />
            <CircularProgress 
              value={predictionStats?.accuracy || 0} 
              max={100}
              label="Accuracy"
              sublabel="percent"
              color="#22c55e"
            />
            <CircularProgress 
              value={battleStats?.wins || 0} 
              max={Math.max(battleStats?.total_battles || 10, 10)}
              label="Battles Won"
              sublabel={`of ${battleStats?.total_battles || 0}`}
              color="#eab308"
            />
            <CircularProgress 
              value={streakData?.longest_streak || 0} 
              max={30}
              label="Best Streak"
              sublabel="days"
              color="#f97316"
            />
          </div>
        </Card>

        {/* Battle Record */}
        <Card className="p-6 md:p-8 bg-background/40 backdrop-blur-md border-border/50">
          <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <Swords className="h-5 w-5 text-red-500" />
            Battle Record
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div className="text-center p-4 rounded-xl bg-muted/20">
              <p className="text-3xl font-bold text-foreground">{battleStats?.total_battles || 0}</p>
              <p className="text-sm text-muted-foreground">Total</p>
            </div>
            <div className="text-center p-4 rounded-xl bg-green-500/10 border border-green-500/30">
              <p className="text-3xl font-bold text-green-500">{battleStats?.wins || 0}</p>
              <p className="text-sm text-muted-foreground">Wins</p>
            </div>
            <div className="text-center p-4 rounded-xl bg-red-500/10 border border-red-500/30">
              <p className="text-3xl font-bold text-red-500">{battleStats?.losses || 0}</p>
              <p className="text-sm text-muted-foreground">Losses</p>
            </div>
            <div className="text-center p-4 rounded-xl bg-gray-500/10 border border-gray-500/30">
              <p className="text-3xl font-bold text-gray-400">{battleStats?.ties || 0}</p>
              <p className="text-sm text-muted-foreground">Ties</p>
            </div>
            <div className="text-center p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30">
              <p className="text-3xl font-bold text-yellow-500">{battleStats?.pending || 0}</p>
              <p className="text-sm text-muted-foreground">Active</p>
            </div>
          </div>

          {/* Win/Loss bar */}
          {battleStats && (battleStats.wins + battleStats.losses) > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-green-500 font-medium">{battleStats.wins} Wins</span>
                <span className="text-red-500 font-medium">{battleStats.losses} Losses</span>
              </div>
              <div className="h-3 rounded-full overflow-hidden bg-red-500/30 flex">
                <div 
                  className="h-full bg-gradient-to-r from-green-500 to-green-400 transition-all duration-500"
                  style={{ width: `${winRate}%` }}
                />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">
                  Current streak: {battleStats.currentWinStreak} wins
                </span>
                <Badge variant={winRate >= 50 ? "default" : "secondary"}>
                  {winRate}% Win Rate
                </Badge>
              </div>
            </div>
          )}
        </Card>

        {/* Achievements */}
        <Card className="p-6 md:p-8 bg-background/40 backdrop-blur-md border-border/50">
          <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <Award className="h-5 w-5 text-yellow-500" />
            Achievements
            <Badge variant="outline" className="ml-2">
              {unlockedCount}/{achievements.length}
            </Badge>
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {achievements.map((achievement, index) => (
              <AchievementBadge
                key={index}
                icon={achievement.icon}
                name={achievement.name}
                description={achievement.description}
                unlocked={achievement.unlocked}
                color={achievement.color}
                rarity={achievement.rarity}
              />
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default UserProfile;
