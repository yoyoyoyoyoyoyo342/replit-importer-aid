import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./use-auth";
import { useToast } from "./use-toast";

export interface CardVisibility {
  pollen: boolean;
  hourly: boolean;
  tenDay: boolean;
  detailedMetrics: boolean;
  routines: boolean;
}

export type CardType = keyof CardVisibility;

const DEFAULT_VISIBILITY: CardVisibility = {
  pollen: true,
  hourly: true,
  tenDay: true,
  detailedMetrics: true,
  routines: true,
};

const DEFAULT_ORDER: CardType[] = ["pollen", "hourly", "tenDay", "detailedMetrics", "routines"];

export function useUserPreferences() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [visibleCards, setVisibleCards] = useState<CardVisibility>(DEFAULT_VISIBILITY);
  const [cardOrder, setCardOrder] = useState<CardType[]>(DEFAULT_ORDER);
  const [loading, setLoading] = useState(true);

  // Fetch user preferences
  useEffect(() => {
    if (!user) {
      setVisibleCards(DEFAULT_VISIBILITY);
      setCardOrder(DEFAULT_ORDER);
      setLoading(false);
      return;
    }

    const fetchPreferences = async () => {
      try {
        const { data, error } = await supabase
          .from("user_preferences")
          .select("visible_cards, card_order")
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) {
          console.error("Error fetching preferences:", error);
          return;
        }

        if (data) {
          setVisibleCards(data.visible_cards as unknown as CardVisibility);
          setCardOrder(data.card_order as unknown as CardType[]);
        } else {
          // Create default preferences for new user
          const { error: insertError } = await supabase
            .from("user_preferences")
            .insert({
              user_id: user.id,
              visible_cards: DEFAULT_VISIBILITY as any,
              card_order: DEFAULT_ORDER as any,
            });

          if (insertError) {
            console.error("Error creating preferences:", insertError);
          }
        }
      } catch (error) {
        console.error("Error in fetchPreferences:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPreferences();
  }, [user]);

  const updateVisibility = async (cardType: CardType, visible: boolean) => {
    if (!user) return;

    const newVisibility = { ...visibleCards, [cardType]: visible };
    setVisibleCards(newVisibility);

    try {
      const { error } = await supabase
        .from("user_preferences")
        .upsert({ 
          user_id: user.id,
          visible_cards: newVisibility as any,
          card_order: cardOrder as any,
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error("Error updating visibility:", error);
        toast({
          title: "Failed to save preferences",
          description: error.message,
          variant: "destructive",
        });
        // Revert on error
        setVisibleCards(visibleCards);
      }
    } catch (error) {
      console.error("Error in updateVisibility:", error);
    }
  };

  const updateOrder = async (newOrder: CardType[]) => {
    if (!user) return;

    setCardOrder(newOrder);

    try {
      const { error } = await supabase
        .from("user_preferences")
        .upsert({ 
          user_id: user.id,
          visible_cards: visibleCards as any,
          card_order: newOrder as any,
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error("Error updating order:", error);
        toast({
          title: "Failed to save order",
          description: error.message,
          variant: "destructive",
        });
        // Revert on error
        setCardOrder(cardOrder);
      }
    } catch (error) {
      console.error("Error in updateOrder:", error);
    }
  };

  const resetToDefaults = async () => {
    if (!user) return;

    setVisibleCards(DEFAULT_VISIBILITY);
    setCardOrder(DEFAULT_ORDER);

    try {
      const { error } = await supabase
        .from("user_preferences")
        .upsert({
          user_id: user.id,
          visible_cards: DEFAULT_VISIBILITY as any,
          card_order: DEFAULT_ORDER as any,
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error("Error resetting preferences:", error);
        toast({
          title: "Failed to reset preferences",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Preferences reset",
          description: "All cards are now visible in default order",
        });
      }
    } catch (error) {
      console.error("Error in resetToDefaults:", error);
    }
  };

  return {
    visibleCards,
    cardOrder,
    loading,
    updateVisibility,
    updateOrder,
    resetToDefaults,
    isAuthenticated: !!user,
  };
}
