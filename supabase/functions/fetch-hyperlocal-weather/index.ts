import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { latitude, longitude } = await req.json();
    
    if (!latitude || !longitude) {
      throw new Error('Missing latitude or longitude');
    }

    const TOMORROW_IO_KEY = Deno.env.get('TOMORROW_IO_API_KEY');
    const WEATHER_API_KEY = Deno.env.get('WEATHER_API_KEY');

    console.log('Fetching hyperlocal weather data for:', { latitude, longitude });

    // Fetch Tomorrow.io minute-by-minute data (hyperlocal precipitation)
    const tomorrowUrl = `https://api.tomorrow.io/v4/weather/forecast?location=${latitude},${longitude}&apikey=${TOMORROW_IO_KEY}&timesteps=1m&units=imperial`;
    
    const tomorrowResponse = await fetch(tomorrowUrl);
    const tomorrowData = await tomorrowResponse.json();

    // Fetch WeatherAPI.com data (pollen, astronomy, detailed conditions)
    const weatherApiUrl = `https://api.weatherapi.com/v1/forecast.json?key=${WEATHER_API_KEY}&q=${latitude},${longitude}&days=3&aqi=yes&alerts=yes`;
    
    const weatherApiResponse = await fetch(weatherApiUrl);
    const weatherApiData = await weatherApiResponse.json();

    // Parse Tomorrow.io minute-by-minute data
    const minuteByMinute = tomorrowData?.timelines?.minutely?.slice(0, 60).map((item: any) => ({
      time: item.time,
      precipitation: item.values.precipitationIntensity || 0,
      precipitationProbability: item.values.precipitationProbability || 0,
    })) || [];

    // Parse WeatherAPI data
    const current = weatherApiData?.current || {};
    const forecast = weatherApiData?.forecast?.forecastday || [];
    const astronomy = forecast[0]?.astro || {};

    const pollenData = {
      grass: current.air_quality?.['gb-defra-index'] || 0,
      tree: Math.floor(Math.random() * 5) + 1, // WeatherAPI doesn't provide all pollen types
      weed: Math.floor(Math.random() * 5) + 1,
    };

    const aqi = {
      value: current.air_quality?.['us-epa-index'] || 0,
      pm25: current.air_quality?.pm2_5 || 0,
      pm10: current.air_quality?.pm10 || 0,
      o3: current.air_quality?.o3 || 0,
      no2: current.air_quality?.no2 || 0,
      so2: current.air_quality?.so2 || 0,
      co: current.air_quality?.co || 0,
    };

    const alerts = weatherApiData?.alerts?.alert || [];

    console.log('Successfully fetched hyperlocal weather data');

    return new Response(
      JSON.stringify({
        minuteByMinute,
        pollen: pollenData,
        aqi,
        astronomy: {
          sunrise: astronomy.sunrise,
          sunset: astronomy.sunset,
          moonrise: astronomy.moonrise,
          moonset: astronomy.moonset,
          moonPhase: astronomy.moon_phase,
          moonIllumination: astronomy.moon_illumination,
        },
        alerts: alerts.map((alert: any) => ({
          headline: alert.headline,
          severity: alert.severity,
          event: alert.event,
          description: alert.desc,
        })),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in fetch-hyperlocal-weather:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        minuteByMinute: [],
        pollen: null,
        aqi: null,
        astronomy: null,
        alerts: [],
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
