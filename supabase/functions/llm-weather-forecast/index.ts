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

// Helper function to call Groq API
async function callGroqAPI(systemPrompt: string, userPrompt: string): Promise<string | null> {
  const groqApiKey = Deno.env.get("GROQ_API_KEY");
  if (!groqApiKey) {
    console.log("GROQ_API_KEY not configured");
    return null;
  }

  try {
    console.log("Calling Groq API...");
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
      return null;
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || null;
  } catch (error) {
    console.error("Groq API call failed:", error);
    return null;
  }
}

// Helper function to call Hugging Face API (free backup)
async function callHuggingFaceAPI(systemPrompt: string, userPrompt: string): Promise<string | null> {
  const huggingFaceToken = Deno.env.get("HUGGING_FACE_ACCESS_TOKEN");
  if (!huggingFaceToken) {
    console.log("HUGGING_FACE_ACCESS_TOKEN not configured");
    return null;
  }

  try {
    console.log("Calling Hugging Face API as backup...");
    const response = await fetch("https://api-inference.huggingface.co/models/mistralai/Mixtral-8x7B-Instruct-v0.1", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${huggingFaceToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: `<s>[INST] ${systemPrompt}\n\n${userPrompt} [/INST]`,
        parameters: {
          max_new_tokens: 4000,
          temperature: 0.3,
          return_full_text: false,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Hugging Face API error: ${response.status} - ${errorText}`);
      return null;
    }

    const result = await response.json();
    const content = Array.isArray(result) ? result[0]?.generated_text : result?.generated_text;
    console.log("Hugging Face response received");
    return content || null;
  } catch (error) {
    console.error("Hugging Face API call failed:", error);
    return null;
  }
}

// Main LLM call with fallback chain: Groq -> HuggingFace
async function callLLM(systemPrompt: string, userPrompt: string): Promise<string | null> {
  let response = await callGroqAPI(systemPrompt, userPrompt);
  
  if (!response) {
    console.log("Groq failed, trying Hugging Face backup...");
    response = await callHuggingFaceAPI(systemPrompt, userPrompt);
  }
  
  return response;
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

    console.log(`Calling LLM with ${sources.length} weather sources...`);

    const content = await callLLM(systemPrompt, userPrompt);

    // Helper to create raw API response from first source
    const createRawApiResponse = (source: WeatherSource) => ({
      current: {
        temperature: source.currentWeather?.temperature || 0,
        feelsLike: source.currentWeather?.feelsLike || 0,
        condition: source.currentWeather?.condition || "Unknown",
        description: source.currentWeather?.condition || "Weather data from API",
        humidity: source.currentWeather?.humidity || 0,
        windSpeed: source.currentWeather?.windSpeed || 0,
        pressure: source.currentWeather?.pressure || 1013,
        confidence: 100
      },
      hourly: source.hourlyForecast?.slice(0, 24).map(h => ({
        time: h.time,
        temperature: h.temperature,
        condition: h.condition,
        precipitation: h.precipitation || 0,
        confidence: 100
      })) || [],
      daily: source.dailyForecast?.slice(0, 7).map(d => ({
        day: d.day,
        condition: d.condition,
        description: d.condition,
        highTemp: d.highTemp,
        lowTemp: d.lowTemp,
        precipitation: d.precipitation || 0,
        confidence: 100
      })) || [],
      summary: `Current: ${source.currentWeather?.condition || 'Unknown'}, ${source.currentWeather?.temperature || 0}°F`,
      modelAgreement: 100,
      insights: [],
      rawApiData: true,
      source: source.source
    });

    // If LLM failed, return raw API data
    if (!content) {
      console.log("All LLM providers failed, returning raw API data");
      const firstSource = sources[0] as WeatherSource;
      return new Response(
        JSON.stringify(createRawApiResponse(firstSource)),
        { headers: { "Content-Type": "application/json", ...corsHeaders }, status: 200 }
      );
    }

    console.log("LLM response received, parsing...");

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
      console.error("Failed to parse LLM response:", content.substring(0, 500));
      // Return raw API data on parse failure
      const firstSource = sources[0] as WeatherSource;
      console.log("Returning raw API data due to parse error");
      return new Response(
        JSON.stringify(createRawApiResponse(firstSource)),
        { headers: { "Content-Type": "application/json", ...corsHeaders }, status: 200 }
      );
    }

    // Validate and ensure required fields
    if (!forecast.current) {
      const firstSource = sources[0] as WeatherSource;
      forecast.current = {
        temperature: firstSource.currentWeather?.temperature || 50, 
        feelsLike: firstSource.currentWeather?.feelsLike || 50, 
        condition: firstSource.currentWeather?.condition || "Unknown",
        description: "Data from API", 
        humidity: firstSource.currentWeather?.humidity || 50, 
        windSpeed: firstSource.currentWeather?.windSpeed || 0,
        pressure: firstSource.currentWeather?.pressure || 1013, 
        confidence: 80
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
