import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get yesterday's date
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const predictionDate = yesterday.toISOString().split('T')[0];

    console.log(`Verifying predictions for date: ${predictionDate}`);

    // Get all unverified predictions for yesterday that were explicitly created by users
    // Only process predictions that have all required fields and were created before today
    const { data: predictions, error: fetchError } = await supabase
      .from('weather_predictions')
      .select('*')
      .eq('prediction_date', predictionDate)
      .eq('is_verified', false)
      .not('user_id', 'is', null)
      .not('predicted_high', 'is', null)
      .not('predicted_low', 'is', null)
      .not('predicted_condition', 'is', null);

    if (fetchError) {
      console.error('Error fetching predictions:', fetchError);
      throw fetchError;
    }

    if (!predictions || predictions.length === 0) {
      console.log('No valid predictions to verify for yesterday');
      return new Response(
        JSON.stringify({ message: 'No predictions to verify', verified: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${predictions.length} valid predictions to verify`);

    let verifiedCount = 0;

    // Verify each prediction
    for (const prediction of predictions) {
      try {
        // Fetch actual weather data for the prediction location and date
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${prediction.latitude}&longitude=${prediction.longitude}&daily=temperature_2m_max,temperature_2m_min,weathercode&start_date=${predictionDate}&end_date=${predictionDate}&temperature_unit=fahrenheit&timezone=auto`;
        
        const weatherResponse = await fetch(weatherUrl);
        const weatherData = await weatherResponse.json();

        if (!weatherData.daily || !weatherData.daily.temperature_2m_max) {
          console.log(`No weather data available for prediction ${prediction.id}`);
          continue;
        }

        const actualHigh = weatherData.daily.temperature_2m_max[0];
        const actualLow = weatherData.daily.temperature_2m_min[0];
        const actualWeatherCode = weatherData.daily.weathercode[0];

        // Map weather code to condition
        const actualCondition = mapWeatherCodeToCondition(actualWeatherCode);

        // Check if prediction is correct (within 5 degrees for temps and exact match for condition)
        const highAccurate = Math.abs(prediction.predicted_high - actualHigh) <= 5;
        const lowAccurate = Math.abs(prediction.predicted_low - actualLow) <= 5;
        const conditionAccurate = prediction.predicted_condition === actualCondition;
        
        // Count how many parts are correct
        const correctParts = [highAccurate, lowAccurate, conditionAccurate].filter(Boolean).length;
        
        // Calculate tiered accuracy points
        let pointsEarned = 0;
        switch (correctParts) {
          case 3:
            pointsEarned = 300;  // All correct
            break;
          case 2:
            pointsEarned = 200;  // 2 correct
            break;
          case 1:
            pointsEarned = 100;  // 1 correct
            break;
          case 0:
            pointsEarned = -100; // All wrong (penalty)
            break;
        }
        
        // is_correct is true if at least 1 part is correct
        const isCorrect = correctParts >= 1;

        // Update prediction with verification
        const { error: updateError } = await supabase
          .from('weather_predictions')
          .update({
            actual_high: actualHigh,
            actual_low: actualLow,
            actual_condition: actualCondition,
            is_verified: true,
            is_correct: isCorrect,
            points_earned: pointsEarned,
            updated_at: new Date().toISOString(),
          })
          .eq('id', prediction.id);

        if (updateError) {
          console.error(`Error updating prediction ${prediction.id}:`, updateError);
          continue;
        }

        // Update user's total points in profiles table
        const { data: profile } = await supabase
          .from('profiles')
          .select('total_points')
          .eq('user_id', prediction.user_id)
          .single();

        // Ensure total points don't go below 0
        const newTotalPoints = Math.max(0, (profile?.total_points || 0) + pointsEarned);

        await supabase
          .from('profiles')
          .update({ total_points: newTotalPoints })
          .eq('user_id', prediction.user_id);

        verifiedCount++;
        console.log(`Verified prediction ${prediction.id}: ${isCorrect ? 'Correct' : 'Incorrect'} (${pointsEarned} points)`);
      } catch (error) {
        console.error(`Error processing prediction ${prediction.id}:`, error);
      }
    }

    return new Response(
      JSON.stringify({ 
        message: 'Predictions verified successfully', 
        verified: verifiedCount,
        total: predictions.length 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in verify-predictions function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

function mapWeatherCodeToCondition(code: number): string {
  if (code === 0) return 'sunny';
  if (code >= 1 && code <= 3) return 'partly-cloudy';
  if (code >= 45 && code <= 48) return 'cloudy';
  if (code >= 51 && code <= 67) return 'rainy';
  if (code >= 71 && code <= 86) return 'snowy';
  if (code >= 95) return 'rainy'; // thunderstorms as rainy
  return 'cloudy';
}