export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      games: {
        Row: {
          code: string
          created_at: string
          description: string | null
          id: string
          is_public: boolean
          play_count: number
          thumbnail_url: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean
          play_count?: number
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean
          play_count?: number
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string | null
          id: string
          notification_enabled: boolean | null
          notification_time: string | null
          total_points: number | null
          updated_at: string
          user_id: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          notification_enabled?: boolean | null
          notification_time?: string | null
          total_points?: number | null
          updated_at?: string
          user_id: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          notification_enabled?: boolean | null
          notification_time?: string | null
          total_points?: number | null
          updated_at?: string
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
      saved_locations: {
        Row: {
          country: string | null
          created_at: string
          id: string
          is_primary: boolean | null
          latitude: number
          longitude: number
          name: string
          state: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          country?: string | null
          created_at?: string
          id?: string
          is_primary?: boolean | null
          latitude: number
          longitude: number
          name: string
          state?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          country?: string | null
          created_at?: string
          id?: string
          is_primary?: boolean | null
          latitude?: number
          longitude?: number
          name?: string
          state?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_allergies: {
        Row: {
          allergen: string
          created_at: string
          id: string
          severity: string | null
          user_id: string
        }
        Insert: {
          allergen: string
          created_at?: string
          id?: string
          severity?: string | null
          user_id: string
        }
        Update: {
          allergen?: string
          created_at?: string
          id?: string
          severity?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          card_order: Json
          created_at: string
          id: string
          is_24_hour: boolean | null
          language: string | null
          updated_at: string
          user_id: string
          visible_cards: Json
        }
        Insert: {
          card_order?: Json
          created_at?: string
          id?: string
          is_24_hour?: boolean | null
          language?: string | null
          updated_at?: string
          user_id: string
          visible_cards?: Json
        }
        Update: {
          card_order?: Json
          created_at?: string
          id?: string
          is_24_hour?: boolean | null
          language?: string | null
          updated_at?: string
          user_id?: string
          visible_cards?: Json
        }
        Relationships: []
      }
      user_routines: {
        Row: {
          activity_type: string
          created_at: string
          id: string
          location: string | null
          name: string
          time: string
          updated_at: string
          user_id: string
          weather_sensitive: boolean
        }
        Insert: {
          activity_type: string
          created_at?: string
          id?: string
          location?: string | null
          name: string
          time: string
          updated_at?: string
          user_id: string
          weather_sensitive?: boolean
        }
        Update: {
          activity_type?: string
          created_at?: string
          id?: string
          location?: string | null
          name?: string
          time?: string
          updated_at?: string
          user_id?: string
          weather_sensitive?: boolean
        }
        Relationships: []
      }
      user_streaks: {
        Row: {
          created_at: string
          current_streak: number
          id: string
          last_prediction_date: string
          longest_streak: number
          total_predictions: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_streak?: number
          id?: string
          last_prediction_date?: string
          longest_streak?: number
          total_predictions?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_streak?: number
          id?: string
          last_prediction_date?: string
          longest_streak?: number
          total_predictions?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      weather_history: {
        Row: {
          avg_temp: number
          condition: string | null
          created_at: string
          date: string
          high_temp: number
          humidity: number | null
          id: string
          latitude: number
          location_name: string
          longitude: number
          low_temp: number
          precipitation: number | null
          user_id: string | null
          wind_speed: number | null
        }
        Insert: {
          avg_temp: number
          condition?: string | null
          created_at?: string
          date: string
          high_temp: number
          humidity?: number | null
          id?: string
          latitude: number
          location_name: string
          longitude: number
          low_temp: number
          precipitation?: number | null
          user_id?: string | null
          wind_speed?: number | null
        }
        Update: {
          avg_temp?: number
          condition?: string | null
          created_at?: string
          date?: string
          high_temp?: number
          humidity?: number | null
          id?: string
          latitude?: number
          location_name?: string
          longitude?: number
          low_temp?: number
          precipitation?: number | null
          user_id?: string | null
          wind_speed?: number | null
        }
        Relationships: []
      }
      weather_predictions: {
        Row: {
          actual_condition: string | null
          actual_high: number | null
          actual_low: number | null
          created_at: string | null
          id: string
          is_correct: boolean | null
          is_verified: boolean | null
          latitude: number
          location_name: string
          longitude: number
          points_earned: number | null
          predicted_condition: string
          predicted_high: number
          predicted_low: number
          prediction_date: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          actual_condition?: string | null
          actual_high?: number | null
          actual_low?: number | null
          created_at?: string | null
          id?: string
          is_correct?: boolean | null
          is_verified?: boolean | null
          latitude: number
          location_name: string
          longitude: number
          points_earned?: number | null
          predicted_condition: string
          predicted_high: number
          predicted_low: number
          prediction_date: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          actual_condition?: string | null
          actual_high?: number | null
          actual_low?: number | null
          created_at?: string | null
          id?: string
          is_correct?: boolean | null
          is_verified?: boolean | null
          latitude?: number
          location_name?: string
          longitude?: number
          points_earned?: number | null
          predicted_condition?: string
          predicted_high?: number
          predicted_low?: number
          prediction_date?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      leaderboard: {
        Row: {
          correct_predictions: number | null
          current_streak: number | null
          display_name: string | null
          longest_streak: number | null
          rank: number | null
          total_points: number | null
          total_predictions: number | null
        }
        Relationships: []
      }
      public_games: {
        Row: {
          created_at: string | null
          description: string | null
          id: string | null
          is_public: boolean | null
          play_count: number | null
          thumbnail_url: string | null
          title: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string | null
          is_public?: boolean | null
          play_count?: number | null
          thumbnail_url?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string | null
          is_public?: boolean | null
          play_count?: number | null
          thumbnail_url?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_public_profile: {
        Args: { profile_user_id: string }
        Returns: {
          avatar_url: string
          bio: string
          created_at: string
          display_name: string
          id: string
          username: string
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
