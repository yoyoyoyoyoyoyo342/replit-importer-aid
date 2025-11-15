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

    console.log('Processing weather corrections...');

    // Get all reports from yesterday
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const reportDate = yesterday.toISOString().split('T')[0];

    const { data: reports, error: fetchError } = await supabase
      .from('weather_reports')
      .select('*')
      .eq('report_date', reportDate);

    if (fetchError) {
      console.error('Error fetching reports:', fetchError);
      throw fetchError;
    }

    if (!reports || reports.length === 0) {
      console.log('No reports to process');
      return new Response(
        JSON.stringify({ message: 'No reports to process', corrected: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${reports.length} reports to process`);

    // Group reports by location
    const reportsByLocation = reports.reduce((acc: any, report) => {
      const key = `${report.location_name}_${report.latitude}_${report.longitude}`;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(report);
      return acc;
    }, {});

    let correctedCount = 0;

    // Process each location
    for (const [locationKey, locationReports] of Object.entries(reportsByLocation)) {
      const reports = locationReports as any[];
      
      // Check if we have 3+ reports with the same actual_condition
      const conditionCounts = reports.reduce((acc: any, report) => {
        acc[report.actual_condition] = (acc[report.actual_condition] || 0) + 1;
        return acc;
      }, {});

      // Find conditions with 3+ reports
      const correctableConditions = Object.entries(conditionCounts)
        .filter(([_, count]) => (count as number) >= 3);

      if (correctableConditions.length > 0) {
        const [correctedCondition] = correctableConditions[0];
        const sampleReport = reports[0];

        console.log(`Correcting weather for ${sampleReport.location_name} to ${correctedCondition}`);

        // Update weather_history with corrected data
        const { error: updateError } = await supabase
          .from('weather_history')
          .update({ condition: correctedCondition })
          .eq('location_name', sampleReport.location_name)
          .eq('date', reportDate)
          .gte('latitude', sampleReport.latitude - 0.01)
          .lte('latitude', sampleReport.latitude + 0.01)
          .gte('longitude', sampleReport.longitude - 0.01)
          .lte('longitude', sampleReport.longitude + 0.01);

        if (updateError) {
          console.error(`Error updating weather history:`, updateError);
        } else {
          correctedCount++;
        }

        // Also update any predictions that were marked incorrect due to the wrong data
        const { error: predictionUpdateError } = await supabase
          .from('weather_predictions')
          .update({
            actual_condition: correctedCondition,
            is_correct: supabase.rpc('check_prediction_accuracy', {
              predicted: correctedCondition,
              actual: correctedCondition
            })
          })
          .eq('location_name', sampleReport.location_name)
          .eq('prediction_date', reportDate)
          .eq('is_verified', true);

        if (predictionUpdateError) {
          console.error(`Error updating predictions:`, predictionUpdateError);
        }
      }
    }

    console.log(`Corrected weather data for ${correctedCount} locations`);

    return new Response(
      JSON.stringify({ 
        message: 'Weather corrections processed',
        corrected: correctedCount,
        totalReports: reports.length 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in process-weather-corrections:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
