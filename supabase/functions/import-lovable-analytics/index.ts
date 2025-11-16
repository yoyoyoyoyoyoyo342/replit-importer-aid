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
      .single();

    if (!roles) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403
      });
    }

    const { lovableApiKey, projectId } = await req.json();

    if (!lovableApiKey || !projectId) {
      return new Response(JSON.stringify({ error: 'Missing lovableApiKey or projectId' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      });
    }

    console.log('Fetching Lovable analytics...');

    // Fetch analytics from Lovable API
    const lovableResponse = await fetch(
      `https://api.lovable.app/v1/projects/${projectId}/analytics?startDate=2025-08-01&endDate=2025-11-30&metric=totalVisits`,
      {
        headers: {
          'Authorization': `Bearer ${lovableApiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!lovableResponse.ok) {
      const errorText = await lovableResponse.text();
      console.error('Lovable API error:', errorText);
      return new Response(JSON.stringify({ error: 'Failed to fetch Lovable analytics', details: errorText }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: lovableResponse.status
      });
    }

    const lovableData = await lovableResponse.json();
    console.log('Received Lovable data:', JSON.stringify(lovableData).substring(0, 500));

    // Transform Lovable analytics to analytics_events format
    const events = [];
    
    // Process daily traffic data
    if (lovableData.timeSeries?.visitors?.data) {
      for (const dayData of lovableData.timeSeries.visitors.data) {
        const date = new Date(dayData.date);
        const visitors = dayData.value;
        
        // Find corresponding pageview data for this date
        const pageviewData = lovableData.timeSeries?.pageviews?.data?.find(
          (pv: any) => pv.date === dayData.date
        );
        const pageviews = pageviewData?.value || visitors;
        
        // Generate events spread throughout the day for each visitor
        for (let i = 0; i < visitors; i++) {
          const eventDate = new Date(date);
          eventDate.setHours(Math.floor(Math.random() * 24));
          eventDate.setMinutes(Math.floor(Math.random() * 60));
          
          // Create pageview events
          const sessionId = crypto.randomUUID();
          const pagesPerVisitor = Math.ceil(pageviews / visitors);
          
          for (let p = 0; p < pagesPerVisitor; p++) {
            events.push({
              event_type: 'pageview',
              page_path: '/',
              session_id: sessionId,
              country: null,
              city: null,
              user_agent: 'Imported from Lovable Analytics',
              referrer: null,
              created_at: new Date(eventDate.getTime() + (p * 60000)).toISOString(),
              user_id: null
            });
          }
        }
      }
    }

    console.log(`Generated ${events.length} events from Lovable analytics`);

    // Insert in batches of 100
    let inserted = 0;
    for (let i = 0; i < events.length; i += 100) {
      const batch = events.slice(i, i + 100);
      const { error } = await supabaseClient
        .from('analytics_events')
        .insert(batch);
      
      if (error) {
        console.error('Batch insert error:', error);
      } else {
        inserted += batch.length;
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        inserted,
        total: events.length,
        message: `Imported ${inserted} events from Lovable analytics`
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Error in import-lovable-analytics function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
