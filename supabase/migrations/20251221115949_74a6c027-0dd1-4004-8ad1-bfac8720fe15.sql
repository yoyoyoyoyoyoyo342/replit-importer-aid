-- Add premium_settings column to user_preferences for cloud-synced premium display settings
ALTER TABLE public.user_preferences 
ADD COLUMN IF NOT EXISTS premium_settings jsonb NOT NULL DEFAULT '{
  "animatedBackgrounds": true,
  "compactMode": false,
  "showFeelsLike": true,
  "showWindChill": true,
  "showHumidity": true,
  "showUV": true,
  "showPrecipChance": true,
  "showDewPoint": false,
  "showPressure": false,
  "showVisibility": true,
  "showSunTimes": true,
  "showMoonPhase": true
}'::jsonb;