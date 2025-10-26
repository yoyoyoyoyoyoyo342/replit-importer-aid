import { useState, useEffect } from "react";
import { useAuth } from "./use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface StreakData {
  currentStreak: number;
  longestStreak: number;
  totalVisits: number;
  lastVisitDate: string;
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
              last_visit_date: today,
              total_visits: 1,
            })
            .select()
            .single();

          if (insertError) throw insertError;

          setStreakData({
            currentStreak: newStreak.current_streak,
            longestStreak: newStreak.longest_streak,
            totalVisits: newStreak.total_visits,
            lastVisitDate: newStreak.last_visit_date,
          });
        } else {
          const lastVisit = existingStreak.last_visit_date;
          
          if (lastVisit === today) {
            // Already visited today - just load data
            setStreakData({
              currentStreak: existingStreak.current_streak,
              longestStreak: existingStreak.longest_streak,
              totalVisits: existingStreak.total_visits,
              lastVisitDate: existingStreak.last_visit_date,
            });
          } else {
            // Calculate if streak continues
            const lastDate = new Date(lastVisit);
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
            const newTotalVisits = existingStreak.total_visits + 1;

            // Update streak
            const { data: updatedStreak, error: updateError } = await supabase
              .from("user_streaks")
              .update({
                current_streak: newCurrentStreak,
                longest_streak: newLongestStreak,
                last_visit_date: today,
                total_visits: newTotalVisits,
              })
              .eq("user_id", user.id)
              .select()
              .single();

            if (updateError) throw updateError;

            setStreakData({
              currentStreak: updatedStreak.current_streak,
              longestStreak: updatedStreak.longest_streak,
              totalVisits: updatedStreak.total_visits,
              lastVisitDate: updatedStreak.last_visit_date,
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
