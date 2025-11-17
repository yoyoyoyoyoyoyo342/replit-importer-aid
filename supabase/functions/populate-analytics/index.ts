import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.54.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!roleData || roleData.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { analyticsData } = await req.json();

    if (!analyticsData || !analyticsData.timeSeries) {
      return new Response(JSON.stringify({ error: 'Invalid analytics data' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Transform and insert analytics data
    const events = [];
    
    for (const day of analyticsData.timeSeries) {
      const date = new Date(day.date);
      const pageviews = day.pageviews || 0;
      const visitors = day.visitors || 0;
      
      // Create pageview events distributed throughout the day
      for (let i = 0; i < pageviews; i++) {
        const hourOffset = Math.floor(Math.random() * 24);
        const minuteOffset = Math.floor(Math.random() * 60);
        const eventDate = new Date(date);
        eventDate.setHours(hourOffset, minuteOffset, 0, 0);
        
        events.push({
          event_type: 'pageview',
          page_path: '/',
          session_id: crypto.randomUUID(),
          created_at: eventDate.toISOString(),
          user_agent: 'Mozilla/5.0 (imported from Lovable Analytics)',
          referrer: null,
          country: null,
          city: null,
          user_id: null,
        });
      }
    }

    // Insert in batches
    const batchSize = 100;
    let inserted = 0;

    for (let i = 0; i < events.length; i += batchSize) {
      const batch = events.slice(i, i + batchSize);
      const { error: insertError } = await supabase
        .from('analytics_events')
        .insert(batch);

      if (insertError) {
        console.error('Error inserting batch:', insertError);
        throw insertError;
      }

      inserted += batch.length;
    }

    console.log(`Successfully inserted ${inserted} analytics events`);

    return new Response(
      JSON.stringify({ 
        message: `Successfully imported ${inserted} analytics events`,
        inserted 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in populate-analytics:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
