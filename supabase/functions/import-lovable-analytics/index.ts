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

    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) {
      return new Response(JSON.stringify({ error: 'LOVABLE_API_KEY not configured' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      });
    }

    console.log('Fetching analytics data from Lovable API...');

    // Fetch analytics data from Lovable API
    const lovableResponse = await fetch('https://api.lovable.app/v1/analytics', {
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!lovableResponse.ok) {
      const errorText = await lovableResponse.text();
      console.error('Lovable API error:', errorText);
      return new Response(JSON.stringify({ error: 'Failed to fetch analytics from Lovable' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      });
    }

    const lovableData = await lovableResponse.json();
    console.log(`Received ${lovableData.events?.length || 0} events from Lovable API`);

    if (!lovableData.events || !Array.isArray(lovableData.events)) {
      return new Response(JSON.stringify({ error: 'Invalid data from Lovable API' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      });
    }

    // Transform Lovable analytics data to our format
    const analyticsData = lovableData.events.map((event: any) => ({
      event_type: event.type || 'pageview',
      page_path: event.path || '/',
      session_id: event.sessionId,
      country: event.geo?.country || null,
      city: event.geo?.city || null,
      user_agent: event.userAgent || null,
      referrer: event.referrer || null,
      created_at: event.timestamp
    }));

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
