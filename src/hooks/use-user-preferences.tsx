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
  aqi: boolean;
  alerts: boolean;
  barometer: boolean;
  rainMap: boolean;
}

export type CardType = keyof CardVisibility;

const DEFAULT_VISIBILITY: CardVisibility = {
  pollen: true,
  hourly: true,
  tenDay: true,
  detailedMetrics: true,
  weatherTrends: true,
  aqi: true,
  alerts: true,
  barometer: true,
  rainMap: true,
};

const DEFAULT_ORDER: CardType[] = ["weatherTrends", "barometer", "pollen", "hourly", "rainMap", "tenDay", "detailedMetrics", "aqi", "alerts"];

export function useUserPreferences() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [visibleCards, setVisibleCards] = useState<CardVisibility>(DEFAULT_VISIBILITY);
  const [cardOrder, setCardOrder] = useState<CardType[]>(DEFAULT_ORDER);
  const [is24Hour, setIs24Hour] = useState(true); // Default to 24-hour format
  const [isHighContrast, setIsHighContrast] = useState(false); // Default to off
  const [savedAddress, setSavedAddress] = useState<string>("");
  const [savedCoordinates, setSavedCoordinates] = useState<{ lat: number; lon: number } | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch user preferences
  useEffect(() => {
    if (!user) {
      setVisibleCards(DEFAULT_VISIBILITY);
      setCardOrder(DEFAULT_ORDER);
      setIs24Hour(true);
      setIsHighContrast(false);
      setLoading(false);
      return;
    }

    const fetchPreferences = async () => {
      try {
        const { data, error } = await supabase
          .from("user_preferences")
          .select("visible_cards, card_order, is_24_hour, is_high_contrast, saved_address, saved_latitude, saved_longitude")
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
          
          // Ensure all new cards exist
          if (visibleCards.weatherTrends === undefined) {
            visibleCards.weatherTrends = true;
          }
          if (visibleCards.aqi === undefined) {
            visibleCards.aqi = true;
          }
          if (visibleCards.alerts === undefined) {
            visibleCards.alerts = true;
          }
          if (visibleCards.barometer === undefined) {
            visibleCards.barometer = true;
          }
          if (visibleCards.rainMap === undefined) {
            visibleCards.rainMap = true;
          }
          if (!cardOrder.includes('weatherTrends')) {
            cardOrder.push('weatherTrends');
          }
          if (!cardOrder.includes('aqi')) {
            cardOrder.push('aqi');
          }
          if (!cardOrder.includes('alerts')) {
            cardOrder.push('alerts');
          }
          if (!cardOrder.includes('barometer')) {
            cardOrder.push('barometer');
          }
          if (!cardOrder.includes('rainMap')) {
            cardOrder.push('rainMap');
          }
          
          // Remove old cards if they exist
          delete visibleCards.weatherSources;
          delete visibleCards.forecastConfidence;
          cardOrder = cardOrder.filter(card => card !== 'forecastConfidence' && card !== 'weatherSources');
          
          setVisibleCards(visibleCards);
          setCardOrder(cardOrder);
          setIs24Hour(data.is_24_hour ?? true);
          setIsHighContrast(data.is_high_contrast ?? false);
          setSavedAddress(data.saved_address || "");
          if (data.saved_latitude && data.saved_longitude) {
            setSavedCoordinates({ lat: data.saved_latitude, lon: data.saved_longitude });
          }
          
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
              is_high_contrast: false,
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
          is_high_contrast: isHighContrast,
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
          is_high_contrast: isHighContrast,
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
          is_high_contrast: isHighContrast,
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

  const updateHighContrast = async (useHighContrast: boolean) => {
    if (!user) return;

    setIsHighContrast(useHighContrast);

    try {
      const { error } = await supabase
        .from("user_preferences")
        .upsert({ 
          user_id: user.id,
          visible_cards: visibleCards as any,
          card_order: cardOrder as any,
          is_24_hour: is24Hour,
          is_high_contrast: useHighContrast,
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error("Error updating high contrast mode:", error);
        toast({
          title: "Failed to save high contrast mode",
          description: error.message,
          variant: "destructive",
        });
        setIsHighContrast(!useHighContrast);
      }
    } catch (error) {
      console.error("Error in updateHighContrast:", error);
      setIsHighContrast(!useHighContrast);
    }
  };

  const resetToDefaults = async () => {
    if (!user) return;

    setVisibleCards(DEFAULT_VISIBILITY);
    setCardOrder(DEFAULT_ORDER);
    setIs24Hour(true);
    setIsHighContrast(false);

    try {
      const { error } = await supabase
        .from("user_preferences")
        .upsert({
          user_id: user.id,
          visible_cards: DEFAULT_VISIBILITY as any,
          card_order: DEFAULT_ORDER as any,
          is_24_hour: true,
          is_high_contrast: false,
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

  const updateSavedAddress = async (address: string, lat: number, lon: number) => {
    if (!user) return;

    setSavedAddress(address);
    setSavedCoordinates({ lat, lon });

    try {
      const { error } = await supabase
        .from("user_preferences")
        .upsert({
          user_id: user.id,
          visible_cards: visibleCards as any,
          card_order: cardOrder as any,
          is_24_hour: is24Hour,
          is_high_contrast: isHighContrast,
          saved_address: address,
          saved_latitude: lat,
          saved_longitude: lon,
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error("Error saving address:", error);
        toast({
          title: "Failed to save address",
          description: error.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error in updateSavedAddress:", error);
    }
  };

  return {
    visibleCards,
    cardOrder,
    is24Hour,
    isHighContrast,
    savedAddress,
    savedCoordinates,
    loading,
    updateVisibility,
    updateOrder,
    updateTimeFormat,
    updateHighContrast,
    updateSavedAddress,
    resetToDefaults,
    isAuthenticated: !!user,
  };
}
