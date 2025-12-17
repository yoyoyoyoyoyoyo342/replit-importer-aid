import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

interface DailyGameStatus {
  hasPlayedToday: boolean;
  todayScore: number | null;
  lastPlayDate: string | null;
}

export const useDailyGameLimit = () => {
  const { user } = useAuth();
  const [status, setStatus] = useState<DailyGameStatus>({
    hasPlayedToday: false,
    todayScore: null,
    lastPlayDate: null,
  });
  const [loading, setLoading] = useState(true);

  const today = new Date().toISOString().split("T")[0];

  const checkDailyStatus = useCallback(async () => {
    if (!user) {
      // For non-logged-in users, check localStorage
      const localData = localStorage.getItem("dailyGamePlay");
      if (localData) {
        const parsed = JSON.parse(localData);
        if (parsed.date === today) {
          setStatus({
            hasPlayedToday: true,
            todayScore: parsed.score,
            lastPlayDate: parsed.date,
          });
        }
      }
      setLoading(false);
      return;
    }

    try {
      // Check localStorage for game tracking
      const localData = localStorage.getItem(`dailyGamePlay_${user.id}`);
      if (localData) {
        const parsed = JSON.parse(localData);
        if (parsed.date === today) {
          setStatus({
            hasPlayedToday: true,
            todayScore: parsed.score,
            lastPlayDate: parsed.date,
          });
        }
      }
    } catch (error) {
      console.error("Error checking daily game status:", error);
    } finally {
      setLoading(false);
    }
  }, [user, today]);

  useEffect(() => {
    checkDailyStatus();
  }, [checkDailyStatus]);

  const recordGamePlay = useCallback(async (score: number) => {
    const storageKey = user ? `dailyGamePlay_${user.id}` : "dailyGamePlay";
    
    localStorage.setItem(storageKey, JSON.stringify({
      date: today,
      score,
    }));

    setStatus({
      hasPlayedToday: true,
      todayScore: score,
      lastPlayDate: today,
    });

    // If logged in, update profile points
    if (user) {
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("total_points")
          .eq("user_id", user.id)
          .single();

        await supabase
          .from("profiles")
          .update({ total_points: (profile?.total_points || 0) + score })
          .eq("user_id", user.id);
      } catch (error) {
        console.error("Error updating points:", error);
      }
    }
  }, [user, today]);

  return { status, loading, recordGamePlay, checkDailyStatus };
};
