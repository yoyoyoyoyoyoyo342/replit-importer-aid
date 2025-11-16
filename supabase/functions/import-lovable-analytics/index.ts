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

    const { analyticsData } = await req.json();

    if (!analyticsData || !Array.isArray(analyticsData)) {
      return new Response(JSON.stringify({ error: 'Invalid analytics data format' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      });
    }

    console.log(`Importing ${analyticsData.length} analytics events...`);

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
