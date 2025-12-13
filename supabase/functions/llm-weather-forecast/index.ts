import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WeatherSource {
  source: string;
  currentWeather: {
    temperature: number;
    condition: string;
    humidity: number;
    windSpeed: number;
    feelsLike: number;
    pressure: number;
  };
  hourlyForecast: Array<{
    time: string;
    temperature: number;
    condition: string;
    precipitation: number;
  }>;
  dailyForecast: Array<{
    day: string;
    condition: string;
    highTemp: number;
    lowTemp: number;
    precipitation: number;
  }>;
}

interface LLMForecast {
  current: {
    temperature: number;
    feelsLike: number;
    condition: string;
    description: string;
    humidity: number;
    windSpeed: number;
    pressure: number;
    confidence: number;
  };
  hourly: Array<{
    time: string;
    temperature: number;
    condition: string;
    precipitation: number;
    confidence: number;
  }>;
  daily: Array<{
    day: string;
    condition: string;
    description: string;
    highTemp: number;
    lowTemp: number;
    precipitation: number;
    confidence: number;
  }>;
  summary: string;
  modelAgreement: number;
  insights: string[];
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sources, location } = await req.json();
    
    if (!sources || !Array.isArray(sources) || sources.length === 0) {
      return new Response(
        JSON.stringify({ error: "No weather sources provided" }),
        { headers: { "Content-Type": "application/json", ...corsHeaders }, status: 400 }
      );
    }

    const groqApiKey = Deno.env.get("GROQ_API_KEY");
    if (!groqApiKey) {
      console.error("GROQ_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "LLM service not configured" }),
        { headers: { "Content-Type": "application/json", ...corsHeaders }, status: 500 }
      );
    }

    // Prepare weather data summary for LLM
    const weatherSummary = sources.map((s: WeatherSource) => ({
      model: s.source,
      current: s.currentWeather,
      next24h: s.hourlyForecast?.slice(0, 12) || [],
      next10days: s.dailyForecast?.slice(0, 7) || [],
    }));

    const systemPrompt = `You are an expert meteorologist AI that analyzes weather data from multiple forecasting models and provides unified, accurate weather predictions. 

Your task is to:
1. Analyze data from multiple weather models (ECMWF, GFS, DWD ICON, Met.no, WeatherAPI, etc.)
2. Identify model consensus and disagreements
3. Apply meteorological expertise to weight predictions appropriately
4. Provide a unified forecast with confidence levels
5. Generate actionable insights

CRITICAL: You must respond with ONLY valid JSON, no markdown, no explanations. The JSON must match this exact structure:
{
  "current": {
    "temperature": <number in Fahrenheit>,
    "feelsLike": <number in Fahrenheit>,
    "condition": "<Clear|Partly Cloudy|Cloudy|Overcast|Light Rain|Rain|Heavy Rain|Thunderstorm|Snow|Light Snow|Heavy Snow|Fog|Drizzle>",
    "description": "<brief natural language description>",
    "humidity": <number 0-100>,
    "windSpeed": <number in mph>,
    "pressure": <number in mb>,
    "confidence": <number 0-100>
  },
  "hourly": [<array of 24 hours with time, temperature, condition, precipitation, confidence>],
  "daily": [<array of 7 days with day, condition, description, highTemp, lowTemp, precipitation, confidence>],
  "summary": "<1-2 sentence natural weather summary for today>",
  "modelAgreement": <number 0-100>,
  "insights": ["<insight 1>", "<insight 2>", "<insight 3>"]
}`;

    const userPrompt = `Analyze this weather data from ${sources.length} forecasting models for ${location || "the selected location"} and provide a unified forecast:

${JSON.stringify(weatherSummary, null, 2)}

Provide your unified weather analysis as JSON.`;

    console.log(`Calling Groq API with ${sources.length} weather sources...`);

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${groqApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.3,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Groq API error: ${response.status} - ${errorText}`);
      
      // Return the first source's data directly on any error
      const firstSource = sources[0] as WeatherSource;
      console.log("Returning raw API data due to LLM error");
      return new Response(
        JSON.stringify({
          current: {
            temperature: firstSource.currentWeather?.temperature || 0,
            feelsLike: firstSource.currentWeather?.feelsLike || 0,
            condition: firstSource.currentWeather?.condition || "Unknown",
            description: firstSource.currentWeather?.condition || "Weather data from API",
            humidity: firstSource.currentWeather?.humidity || 0,
            windSpeed: firstSource.currentWeather?.windSpeed || 0,
            pressure: firstSource.currentWeather?.pressure || 1013,
            confidence: 100
          },
          hourly: firstSource.hourlyForecast?.slice(0, 24).map(h => ({
            time: h.time,
            temperature: h.temperature,
            condition: h.condition,
            precipitation: h.precipitation || 0,
            confidence: 100
          })) || [],
          daily: firstSource.dailyForecast?.slice(0, 7).map(d => ({
            day: d.day,
            condition: d.condition,
            description: d.condition,
            highTemp: d.highTemp,
            lowTemp: d.lowTemp,
            precipitation: d.precipitation || 0,
            confidence: 100
          })) || [],
          summary: `Current: ${firstSource.currentWeather?.condition || 'Unknown'}, ${firstSource.currentWeather?.temperature || 0}°F`,
          modelAgreement: 100,
          insights: [],
          rawApiData: true,
          source: firstSource.source
        }),
        { headers: { "Content-Type": "application/json", ...corsHeaders }, status: 200 }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content in Groq response");
    }

    console.log("Groq response received, parsing...");

    let forecast: LLMForecast;
    try {
      // Clean markdown code blocks if present
      let cleanContent = content.trim();
      if (cleanContent.startsWith('```json')) {
        cleanContent = cleanContent.replace(/^```json\n?/, '').replace(/\n?```$/, '');
      } else if (cleanContent.startsWith('```')) {
        cleanContent = cleanContent.replace(/^```\n?/, '').replace(/\n?```$/, '');
      }
      
      forecast = JSON.parse(cleanContent);
    } catch (parseErr) {
      console.error("Failed to parse Groq response:", content.substring(0, 500));
      // Return a fallback forecast based on the first source
      const firstSource = sources[0] as WeatherSource;
      forecast = {
        current: {
          temperature: firstSource.currentWeather?.temperature || 50,
          feelsLike: firstSource.currentWeather?.feelsLike || 50,
          condition: firstSource.currentWeather?.condition || "Unknown",
          description: "Weather data aggregated from multiple sources",
          humidity: firstSource.currentWeather?.humidity || 50,
          windSpeed: firstSource.currentWeather?.windSpeed || 0,
          pressure: firstSource.currentWeather?.pressure || 1013,
          confidence: 70
        },
        hourly: firstSource.hourlyForecast?.slice(0, 24).map(h => ({
          time: h.time,
          temperature: h.temperature,
          condition: h.condition,
          precipitation: h.precipitation || 0,
          confidence: 70
        })) || [],
        daily: firstSource.dailyForecast?.slice(0, 7).map(d => ({
          day: d.day,
          condition: d.condition,
          description: d.condition,
          highTemp: d.highTemp,
          lowTemp: d.lowTemp,
          precipitation: d.precipitation || 0,
          confidence: 70
        })) || [],
        summary: "Weather forecast based on aggregated data sources.",
        modelAgreement: 70,
        insights: ["LLM analysis unavailable - using source data directly"]
      };
      console.log("Using fallback forecast from source data");
    }

    // Validate and ensure required fields
    if (!forecast.current) {
      forecast.current = {
        temperature: 50, feelsLike: 50, condition: "Unknown",
        description: "Data unavailable", humidity: 50, windSpeed: 0,
        pressure: 1013, confidence: 50
      };
    }
    if (!forecast.summary) {
      forecast.summary = "Weather forecast aggregated from multiple sources.";
    }

    console.log(`LLM forecast generated with ${forecast.modelAgreement}% model agreement`);

    return new Response(JSON.stringify(forecast), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
      status: 200,
    });

  } catch (e) {
    console.error("llm-weather-forecast error:", e);
    
    // Try to return raw source data on any error
    try {
      const body = await req.clone().json().catch(() => ({}));
      const sources = body.sources;
      if (sources && Array.isArray(sources) && sources.length > 0) {
        const firstSource = sources[0] as WeatherSource;
        console.log("Returning raw API data due to error");
        return new Response(
          JSON.stringify({
            current: {
              temperature: firstSource.currentWeather?.temperature || 0,
              feelsLike: firstSource.currentWeather?.feelsLike || 0,
              condition: firstSource.currentWeather?.condition || "Unknown",
              description: firstSource.currentWeather?.condition || "Weather data from API",
              humidity: firstSource.currentWeather?.humidity || 0,
              windSpeed: firstSource.currentWeather?.windSpeed || 0,
              pressure: firstSource.currentWeather?.pressure || 1013,
              confidence: 100
            },
            hourly: firstSource.hourlyForecast?.slice(0, 24).map((h: any) => ({
              time: h.time,
              temperature: h.temperature,
              condition: h.condition,
              precipitation: h.precipitation || 0,
              confidence: 100
            })) || [],
            daily: firstSource.dailyForecast?.slice(0, 7).map((d: any) => ({
              day: d.day,
              condition: d.condition,
              description: d.condition,
              highTemp: d.highTemp,
              lowTemp: d.lowTemp,
              precipitation: d.precipitation || 0,
              confidence: 100
            })) || [],
            summary: `Current: ${firstSource.currentWeather?.condition || 'Unknown'}`,
            modelAgreement: 100,
            insights: [],
            rawApiData: true,
            source: firstSource.source
          }),
          { headers: { "Content-Type": "application/json", ...corsHeaders }, status: 200 }
        );
      }
    } catch {}
    
    return new Response(
      JSON.stringify({ 
        error: "Weather analysis temporarily unavailable",
        details: e instanceof Error ? e.message : "Unknown error"
      }),
      { headers: { "Content-Type": "application/json", ...corsHeaders }, status: 500 }
    );
  }
});
