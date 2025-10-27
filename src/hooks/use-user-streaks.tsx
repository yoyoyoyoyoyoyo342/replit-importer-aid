import { useState, useEffect } from "react";
import { useAuth } from "./use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface StreakData {
  currentStreak: number;
  longestStreak: number;
  totalPredictions: number;
  lastPredictionDate: string;
}

export const useUserStreaks = () => {
  const { user } = useAuth();
  const [streakData, setStreakData] = useState<StreakData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const checkAndUpdateStreak = async () => {
      try {
        // Fetch existing streak data
        const { data: existingStreak, error: fetchError } = await supabase
          .from("user_streaks")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (fetchError && fetchError.code !== "PGRST116") {
          throw fetchError;
        }

        const today = new Date().toISOString().split("T")[0];

        if (!existingStreak) {
          // First time user - create streak record
          const { data: newStreak, error: insertError } = await supabase
            .from("user_streaks")
            .insert({
              user_id: user.id,
              current_streak: 1,
              longest_streak: 1,
              last_prediction_date: today,
              total_predictions: 1,
            })
            .select()
            .single();

          if (insertError) throw insertError;

          setStreakData({
            currentStreak: newStreak.current_streak,
            longestStreak: newStreak.longest_streak,
            totalPredictions: newStreak.total_predictions,
            lastPredictionDate: newStreak.last_prediction_date,
          });
        } else {
          const lastPrediction = existingStreak.last_prediction_date;
          
          if (lastPrediction === today) {
            // Already predicted today - just load data
            setStreakData({
              currentStreak: existingStreak.current_streak,
              longestStreak: existingStreak.longest_streak,
              totalPredictions: existingStreak.total_predictions,
              lastPredictionDate: existingStreak.last_prediction_date,
            });
          } else {
            // Calculate if streak continues
            const lastDate = new Date(lastPrediction);
            const currentDate = new Date(today);
            const diffDays = Math.floor(
              (currentDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
            );

            let newCurrentStreak: number;
            let showToast = false;

            if (diffDays === 1) {
              // Consecutive day - increment streak
              newCurrentStreak = existingStreak.current_streak + 1;
              showToast = true;
            } else {
              // Streak broken - reset to 1
              newCurrentStreak = 1;
            }

            const newLongestStreak = Math.max(
              existingStreak.longest_streak,
              newCurrentStreak
            );
            const newTotalPredictions = existingStreak.total_predictions + 1;

            // Update streak
            const { data: updatedStreak, error: updateError } = await supabase
              .from("user_streaks")
              .update({
                current_streak: newCurrentStreak,
                longest_streak: newLongestStreak,
                last_prediction_date: today,
                total_predictions: newTotalPredictions,
              })
              .eq("user_id", user.id)
              .select()
              .single();

            if (updateError) throw updateError;

            setStreakData({
              currentStreak: updatedStreak.current_streak,
              longestStreak: updatedStreak.longest_streak,
              totalPredictions: updatedStreak.total_predictions,
              lastPredictionDate: updatedStreak.last_prediction_date,
            });

            if (showToast && newCurrentStreak > 1) {
              toast.success(`🔥 ${newCurrentStreak} day streak!`);
            }
          }
        }
      } catch (error) {
        console.error("Error managing streak:", error);
      } finally {
        setLoading(false);
      }
    };

    checkAndUpdateStreak();
  }, [user]);

  return { streakData, loading };
};
