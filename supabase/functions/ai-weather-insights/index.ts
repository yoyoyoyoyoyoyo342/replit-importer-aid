import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, message, weatherData, location, isImperial, conversationHistory, userRoutines } = await req.json();

    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    console.log('AI Weather Insights request:', { type, location, hasWeatherData: !!weatherData });

    let systemPrompt = '';
    let userPrompt = '';

    if (type === 'proactive_insights') {
      // Convert temperatures if user prefers Celsius
      const temp = isImperial ? weatherData.currentWeather.temperature : Math.round((weatherData.currentWeather.temperature - 32) * 5/9);
      const feelsLike = isImperial ? weatherData.currentWeather.feelsLike : Math.round((weatherData.currentWeather.feelsLike - 32) * 5/9);
      const condition = weatherData.currentWeather.condition;
      const humidity = weatherData.currentWeather.humidity;
      const windSpeed = isImperial ? weatherData.currentWeather.windSpeed : Math.round(weatherData.currentWeather.windSpeed * 1.60934);
      const uvIndex = weatherData.currentWeather.uvIndex;
      const visibility = isImperial ? weatherData.currentWeather.visibility : Math.round(weatherData.currentWeather.visibility * 1.60934);
      const pressure = weatherData.currentWeather.pressure;
      
      systemPrompt = `You are an AI Weather Companion that provides personalized, actionable weather insights. You analyze real weather data and provide 3-5 specific, practical recommendations that help users make informed decisions about their day.

Key Guidelines:
- Focus on actionable advice (what to wear, when to travel, activities to plan/avoid)
- Consider comfort, safety, and optimization of daily activities
- Be concise but specific (each insight should be 15-25 words)
- Include relevant emojis for visual appeal
- Consider both immediate and near-future conditions
- Use ${isImperial ? 'Fahrenheit and mph' : 'Celsius and km/h'} units
- Be specific about timing and conditions
${userRoutines && userRoutines.length > 0 ? `
- IMPORTANT: Tailor advice to the user's daily routines:
${userRoutines.map((r: any) => `  * ${r.name} at ${r.time} on ${r.days_of_week.join(', ')} - ${r.activity_type} activity`).join('\n')}
- Consider which routines happen today and provide weather-specific advice for them` : ''}

Current Weather in ${location}:
- Temperature: ${temp}°${isImperial ? 'F' : 'C'} (feels like ${feelsLike}°${isImperial ? 'F' : 'C'})
- Condition: ${condition}
- Humidity: ${humidity}%
- Wind Speed: ${windSpeed} ${isImperial ? 'mph' : 'km/h'}
- UV Index: ${uvIndex}/10
- Visibility: ${visibility} ${isImperial ? 'miles' : 'km'}
- Pressure: ${pressure} hPa`;

      userPrompt = `Based on the current weather in ${location}, generate 3-5 specific, actionable insights. Focus on what the user should do RIGHT NOW based on these conditions. Return ONLY a JSON array of strings.

Current conditions to consider:
- Temperature: ${temp}°${isImperial ? 'F' : 'C'} (feels like ${feelsLike}°${isImperial ? 'F' : 'C'})
- Weather: ${condition}
- Humidity: ${humidity}%
- Wind: ${windSpeed} ${isImperial ? 'mph' : 'km/h'}
- UV Index: ${uvIndex}/10

Examples of good insights:
- "🧥 Feels ${feelsLike}°${isImperial ? 'F' : 'C'} - grab a light jacket for comfort!"
- "☀️ UV ${uvIndex}/10 - apply SPF 30+ for outdoor activities"
- "💨 Winds at ${windSpeed} ${isImperial ? 'mph' : 'km/h'} - secure loose items if heading out"
- "💧 ${humidity}% humidity - stay hydrated and dress breathable"
- "👁️ Visibility ${visibility} ${isImperial ? 'miles' : 'km'} - drive carefully if conditions are poor"`;

    } else if (type === 'morning_review') {
      // Morning briefing - comprehensive start-of-day summary
      const temp = isImperial ? weatherData.currentWeather.temperature : Math.round((weatherData.currentWeather.temperature - 32) * 5/9);
      const feelsLike = isImperial ? weatherData.currentWeather.feelsLike : Math.round((weatherData.currentWeather.feelsLike - 32) * 5/9);
      const condition = weatherData.currentWeather.condition;
      const humidity = weatherData.currentWeather.humidity;
      const windSpeed = isImperial ? weatherData.currentWeather.windSpeed : Math.round(weatherData.currentWeather.windSpeed * 1.60934);
      const uvIndex = weatherData.currentWeather.uvIndex;
      
      // Get high pollen types
      const pollenData = weatherData.currentWeather?.pollenData || {};
      const highPollens = Object.entries(pollenData)
        .filter(([_, value]) => value > 6)
        .map(([type]) => type);

      systemPrompt = `You are creating a personalized morning weather briefing. Provide a warm, helpful summary that helps the user plan their day.

Current Weather in ${location}:
- Temperature: ${temp}°${isImperial ? 'F' : 'C'} (feels like ${feelsLike}°${isImperial ? 'F' : 'C'})
- Condition: ${condition}
- Humidity: ${humidity}%
- Wind: ${windSpeed} ${isImperial ? 'mph' : 'km/h'}
- UV Index: ${uvIndex}/10
${highPollens.length > 0 ? `- High Pollen: ${highPollens.join(', ')}` : ''}

Return ONLY a JSON object (no markdown code blocks) with these fields:
{
  "summary": "A warm 2-sentence greeting with weather overview",
  "outfit": "VERY SPECIFIC clothing items list (e.g., 'Light jacket, long sleeves, jeans, and trainers' or 'T-shirt, shorts, trainers, and sunglasses'). Never say just 'dress appropriately'. Always list actual clothing items.",
  "pollenAlerts": ["Array of specific pollen warnings if any high levels detected"],
  "activityRecommendation": "SPECIFIC activity suggestions based on weather analysis (e.g., 'Perfect for outdoor running from 8-10am before it gets hot' or 'Indoor activities recommended due to rain - great day for museums or cinema'). Never say generic phrases like 'plan your day'. Always analyze weather and suggest specific activities with timing.",
  "keyInsight": "One important thing to remember for the day"
}`;

      userPrompt = `Create a morning briefing for ${location}. Be warm, specific, and actionable. 

CRITICAL REQUIREMENTS:
1. For "outfit": List SPECIFIC clothing items (jacket, t-shirt, trousers, shoes, etc.). NEVER say "dress appropriately" or generic advice. Think about what someone would actually wear for ${temp}°${isImperial ? 'F' : 'C'} and ${condition}.
2. For "activityRecommendation": Analyze the weather (${temp}°, ${condition}, ${windSpeed} ${isImperial ? 'mph' : 'km/h'} wind, UV ${uvIndex}) and suggest SPECIFIC activities with timing. Examples: "Perfect for outdoor cycling 7-9am", "Stay indoors, heavy rain expected - good day for reading", "Great beach weather 10am-4pm, apply SPF30+". NEVER give generic advice.
3. IMPORTANT: Return ONLY pure JSON. Do NOT wrap the response in markdown code blocks. Do NOT include \`\`\`json or \`\`\`. Just return the raw JSON object.

Consider the weather conditions carefully: ${temp}° temperature, ${condition} conditions, and ${highPollens.length > 0 ? 'high pollen levels' : 'current pollen levels'}.`;

    } else if (type === 'chat') {
      // Convert temperatures and units for chat context
      const chatTemp = isImperial ? weatherData.currentWeather.temperature : Math.round((weatherData.currentWeather.temperature - 32) * 5/9);
      const chatFeelsLike = isImperial ? weatherData.currentWeather.feelsLike : Math.round((weatherData.currentWeather.feelsLike - 32) * 5/9);
      const chatWindSpeed = isImperial ? weatherData.currentWeather.windSpeed : Math.round(weatherData.currentWeather.windSpeed * 1.60934);
      const chatVisibility = isImperial ? weatherData.currentWeather.visibility : Math.round(weatherData.currentWeather.visibility * 1.60934);
      
      systemPrompt = `You are an AI Weather Companion - friendly, knowledgeable, and helpful. You specialize in weather-related conversations and provide personalized advice based on current conditions.

Current Weather Context for ${location}:
- Temperature: ${chatTemp}°${isImperial ? 'F' : 'C'} (feels like ${chatFeelsLike}°${isImperial ? 'F' : 'C'})
- Condition: ${weatherData.currentWeather.condition}
- Humidity: ${weatherData.currentWeather.humidity}%
- Wind: ${chatWindSpeed} ${isImperial ? 'mph' : 'km/h'}
- UV Index: ${weatherData.currentWeather.uvIndex}
- Visibility: ${chatVisibility} ${isImperial ? 'miles' : 'km'}
${userRoutines && userRoutines.length > 0 ? `
User's Daily Routines:
${userRoutines.map((r: any) => `- ${r.name} at ${r.time} on ${r.days_of_week.join(', ')} (${r.activity_type} activity)`).join('\n')}
Consider these routines when providing weather advice.` : ''}

Guidelines:
- Be conversational and helpful
- Provide specific, actionable advice
- Reference current weather conditions when relevant
- Consider the user's routines and tailor advice accordingly
- Use emojis appropriately
- If asked about non-weather topics, gently redirect to weather
- Consider user's location and current conditions in all responses

Recent conversation context: ${conversationHistory?.map(msg => `${msg.role}: ${msg.content}`).join('\n') || 'None'}`;

      userPrompt = message;
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: type === 'proactive_insights' ? 500 : 800,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    console.log('AI response received:', aiResponse.substring(0, 100) + '...');

    if (type === 'morning_review') {
      try {
        // Strip markdown code blocks if present
        let cleanResponse = aiResponse.trim();
        if (cleanResponse.startsWith('```json')) {
          cleanResponse = cleanResponse.replace(/^```json\n?/, '').replace(/\n?```$/, '');
        } else if (cleanResponse.startsWith('```')) {
          cleanResponse = cleanResponse.replace(/^```\n?/, '').replace(/\n?```$/, '');
        }
        
        console.log('Cleaned response:', cleanResponse.substring(0, 100) + '...');
        
        const review = JSON.parse(cleanResponse);
        return new Response(JSON.stringify({ review }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (parseError) {
        console.error('Failed to parse morning review:', parseError);
        console.error('Raw AI response:', aiResponse);
        // Return a basic structure if parsing fails
        return new Response(JSON.stringify({ 
          review: {
            summary: "Good morning! Check the weather details below for your day.",
            outfit: "Warm jacket, long sleeves, comfortable trousers, and sturdy shoes for the current temperature.",
            pollenAlerts: [],
            activityRecommendation: "Check the hourly forecast and plan outdoor activities during the warmest parts of the day.",
            keyInsight: "Stay weather-aware and dress in layers for comfort!"
          }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    } else if (type === 'proactive_insights') {
      try {
        // Try to parse as JSON array
        const insights = JSON.parse(aiResponse);
        return new Response(JSON.stringify({ insights }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch {
        // If parsing fails, split by lines and clean up
        const insights = aiResponse
          .split('\n')
          .filter(line => line.trim() && !line.includes('```'))
          .map(line => line.replace(/^[-*]\s*/, '').trim())
          .filter(line => line.length > 10)
          .slice(0, 5);

        return new Response(JSON.stringify({ insights }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    } else {
      // For chat responses, try to extract any recommendations
      const recommendations = [];
      const lines = aiResponse.split('\n');
      
      for (const line of lines) {
        if (line.includes('💡') || line.includes('🔥') || line.includes('⚡') || 
            line.toLowerCase().includes('tip') || line.toLowerCase().includes('recommend')) {
          recommendations.push(line.trim());
        }
      }

      return new Response(JSON.stringify({ 
        response: aiResponse,
        recommendations: recommendations.slice(0, 3)
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  } catch (error) {
    console.error('Error in ai-weather-insights function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      fallback: type === 'proactive_insights' ? 
        ["Check the weather before heading out today!", "Stay hydrated and dress appropriately for the conditions"] :
        "I'm having trouble connecting right now, but I'm here to help with weather insights!"
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});