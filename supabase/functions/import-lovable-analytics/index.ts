import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify admin access
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabaseClient.auth.getUser(token);
    
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401
      });
    }

    // Check if user is admin
    const { data: roles } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (!roles) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403
      });
    }

    const projectId = Deno.env.get('SUPABASE_PROJECT_ID') || 'ohwtbkudpkfbakynikyj';
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    
    if (!lovableApiKey) {
      return new Response(JSON.stringify({ error: 'LOVABLE_API_KEY not configured' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      });
    }

    console.log('Fetching analytics from Lovable API for project:', projectId);

    // Fetch analytics from Lovable Project Analytics API
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30); // Last 30 days

    const analyticsUrl = `https://api.lovable.app/v1/projects/${projectId}/analytics?start=${startDate.toISOString()}&end=${endDate.toISOString()}`;
    
    const lovableResponse = await fetch(analyticsUrl, {
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!lovableResponse.ok) {
      const errorText = await lovableResponse.text();
      console.error('Lovable API error:', lovableResponse.status, errorText);
      return new Response(JSON.stringify({ 
        error: 'Failed to fetch analytics from Lovable',
        details: errorText 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      });
    }

    const lovableData = await lovableResponse.json();
    console.log('Received Lovable analytics data');

    // Transform Lovable analytics data to analytics_events format
    const analyticsData = [];
    
    // Process timeSeries data for pageviews
    if (lovableData.timeSeries?.pageviews?.data) {
      lovableData.timeSeries.pageviews.data.forEach((item: any) => {
        if (item.value > 0) {
          // Create events for each pageview
          for (let i = 0; i < item.value; i++) {
            analyticsData.push({
              event_type: 'pageview',
              page_path: '/',
              session_id: `session_${Date.now()}_${Math.random().toString(36).substring(7)}`,
              created_at: new Date(item.date).toISOString(),
              country: null,
              city: null,
              user_agent: null,
              referrer: null,
            });
          }
        }
      });
    }

    console.log(`Transformed ${analyticsData.length} analytics events from Lovable data`);

    console.log(`Transformed ${analyticsData.length} analytics events...`);

    // Insert events in batches
    const batchSize = 100;
    let inserted = 0;

    for (let i = 0; i < analyticsData.length; i += batchSize) {
      const batch = analyticsData.slice(i, i + batchSize);
      
      const { error } = await supabaseClient
        .from('analytics_events')
        .insert(batch);

      if (error) {
        console.error('Error inserting batch:', error);
        throw error;
      }

      inserted += batch.length;
      console.log(`Inserted ${inserted}/${analyticsData.length} events`);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        inserted,
        message: `Successfully imported ${inserted} analytics events`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in import-lovable-analytics:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
