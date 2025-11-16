import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Sample data for realistic generation
const pages = ['/', '/weather', '/admin'];
const countries = ['United States', 'United Kingdom', 'Canada', 'Germany', 'France', 'Denmark'];
const cities = ['New York', 'London', 'Toronto', 'Berlin', 'Paris', 'Copenhagen'];
const eventTypes = ['pageview', 'asset', 'api_function', 'external', 'image'];
const userAgents = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15'
];

function generateEvent(date: Date) {
  const hour = date.getHours();
  // More traffic during business hours (9am-5pm)
  const isBusinessHours = hour >= 9 && hour <= 17;
  const baseTraffic = isBusinessHours ? 30 : 10;
  
  const countryIndex = Math.floor(Math.random() * countries.length);
  
  return {
    event_type: eventTypes[Math.floor(Math.random() * eventTypes.length)],
    page_path: pages[Math.floor(Math.random() * pages.length)],
    session_id: crypto.randomUUID(),
    country: countries[countryIndex],
    city: cities[countryIndex],
    user_agent: userAgents[Math.floor(Math.random() * userAgents.length)],
    referrer: Math.random() > 0.5 ? 'https://google.com' : null,
    created_at: date.toISOString(),
    user_id: null
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify admin access
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

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

    const { days = 30 } = await req.json();

    // Generate events for the past N days
    const events = [];
    const now = new Date();
    
    for (let dayOffset = days; dayOffset > 0; dayOffset--) {
      const date = new Date(now);
      date.setDate(date.getDate() - dayOffset);
      
      // Generate 50-200 events per day with hourly distribution
      const eventsPerDay = Math.floor(Math.random() * 150) + 50;
      
      for (let i = 0; i < eventsPerDay; i++) {
        const eventDate = new Date(date);
        eventDate.setHours(Math.floor(Math.random() * 24));
        eventDate.setMinutes(Math.floor(Math.random() * 60));
        eventDate.setSeconds(Math.floor(Math.random() * 60));
        
        events.push(generateEvent(eventDate));
      }
    }

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
        message: `Backfilled ${inserted} analytics events for the past ${days} days`
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Error in backfill-analytics function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
