import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./use-auth";
import { useToast } from "./use-toast";

export interface CardVisibility {
  pollen: boolean;
  hourly: boolean;
  tenDay: boolean;
  detailedMetrics: boolean;
  weatherTrends: boolean;
}

export type CardType = keyof CardVisibility;

const DEFAULT_VISIBILITY: CardVisibility = {
  pollen: true,
  hourly: true,
  tenDay: true,
  detailedMetrics: true,
  weatherTrends: true,
};

const DEFAULT_ORDER: CardType[] = ["pollen", "hourly", "tenDay", "detailedMetrics", "weatherTrends"];

export function useUserPreferences() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [visibleCards, setVisibleCards] = useState<CardVisibility>(DEFAULT_VISIBILITY);
  const [cardOrder, setCardOrder] = useState<CardType[]>(DEFAULT_ORDER);
  const [is24Hour, setIs24Hour] = useState(true); // Default to 24-hour format
  const [loading, setLoading] = useState(true);

  // Fetch user preferences
  useEffect(() => {
    if (!user) {
      setVisibleCards(DEFAULT_VISIBILITY);
      setCardOrder(DEFAULT_ORDER);
      setIs24Hour(true);
      setLoading(false);
      return;
    }

    const fetchPreferences = async () => {
      try {
        const { data, error } = await supabase
          .from("user_preferences")
          .select("visible_cards, card_order, is_24_hour")
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) {
          console.error("Error fetching preferences:", error);
          return;
        }

        if (data) {
          // Migrate old preferences from "routines" to "weatherTrends"
          let visibleCards = data.visible_cards as any;
          let cardOrder = data.card_order as any;
          
          // Check if we have old "routines" key and migrate it
          if (visibleCards.routines !== undefined && visibleCards.weatherTrends === undefined) {
            visibleCards = {
              ...visibleCards,
              weatherTrends: true,
            };
            delete visibleCards.routines;
          }
          
          if (cardOrder.includes('routines') && !cardOrder.includes('weatherTrends')) {
            cardOrder = cardOrder.map((card: string) => card === 'routines' ? 'weatherTrends' : card);
          }
          
          // Ensure weatherTrends exists
          if (visibleCards.weatherTrends === undefined) {
            visibleCards.weatherTrends = true;
          }
          if (!cardOrder.includes('weatherTrends')) {
            cardOrder.push('weatherTrends');
          }
          
          setVisibleCards(visibleCards);
          setCardOrder(cardOrder);
          setIs24Hour(data.is_24_hour ?? true);
          
          // Update the database with migrated preferences
          await supabase
            .from("user_preferences")
            .update({
              visible_cards: visibleCards,
              card_order: cardOrder,
            })
            .eq("user_id", user.id);
        } else {
          // Create default preferences for new user
          const { error: insertError } = await supabase
            .from("user_preferences")
            .insert({
              user_id: user.id,
              visible_cards: DEFAULT_VISIBILITY as any,
              card_order: DEFAULT_ORDER as any,
              is_24_hour: true,
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
    
    // Optimistically update UI
    setVisibleCards(newVisibility);

    try {
      const { error } = await supabase
        .from("user_preferences")
        .upsert({ 
          user_id: user.id,
          visible_cards: newVisibility as any,
          card_order: cardOrder as any,
          is_24_hour: is24Hour,
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
      } else {
        console.log("Visibility saved successfully:", newVisibility);
      }
    } catch (error) {
      console.error("Error in updateVisibility:", error);
      // Revert on error
      setVisibleCards(visibleCards);
    }
  };

  const updateOrder = async (newOrder: CardType[]) => {
    if (!user) return;

    // Optimistically update UI
    setCardOrder(newOrder);

    try {
      const { error } = await supabase
        .from("user_preferences")
        .upsert({ 
          user_id: user.id,
          visible_cards: visibleCards as any,
          card_order: newOrder as any,
          is_24_hour: is24Hour,
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
      } else {
        console.log("Order saved successfully:", newOrder);
      }
    } catch (error) {
      console.error("Error in updateOrder:", error);
      // Revert on error
      setCardOrder(cardOrder);
    }
  };

  const updateTimeFormat = async (use24Hour: boolean) => {
    if (!user) return;

    setIs24Hour(use24Hour);

    try {
      const { error } = await supabase
        .from("user_preferences")
        .upsert({ 
          user_id: user.id,
          visible_cards: visibleCards as any,
          card_order: cardOrder as any,
          is_24_hour: use24Hour,
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error("Error updating time format:", error);
        toast({
          title: "Failed to save time format",
          description: error.message,
          variant: "destructive",
        });
        setIs24Hour(!use24Hour);
      }
    } catch (error) {
      console.error("Error in updateTimeFormat:", error);
      setIs24Hour(!use24Hour);
    }
  };

  const resetToDefaults = async () => {
    if (!user) return;

    setVisibleCards(DEFAULT_VISIBILITY);
    setCardOrder(DEFAULT_ORDER);
    setIs24Hour(true);

    try {
      const { error } = await supabase
        .from("user_preferences")
        .upsert({
          user_id: user.id,
          visible_cards: DEFAULT_VISIBILITY as any,
          card_order: DEFAULT_ORDER as any,
          is_24_hour: true,
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
    is24Hour,
    loading,
    updateVisibility,
    updateOrder,
    updateTimeFormat,
    resetToDefaults,
    isAuthenticated: !!user,
  };
}
