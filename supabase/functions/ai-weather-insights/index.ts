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
    const { type, message, weatherData, location, isImperial, conversationHistory } = await req.json();

    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    console.log('AI Weather Insights request:', { type, location, hasWeatherData: !!weatherData });

    let systemPrompt = '';
    let userPrompt = '';

    if (type === 'proactive_insights') {
      systemPrompt = `You are an AI Weather Companion that provides personalized, actionable weather insights. You analyze weather data and provide 3-5 specific, practical recommendations that help users make informed decisions about their day.

Key Guidelines:
- Focus on actionable advice (what to wear, when to travel, activities to plan/avoid)
- Consider comfort, safety, and optimization of daily activities
- Be concise but specific
- Include relevant emojis for visual appeal
- Consider both immediate and near-future conditions
- Adapt advice based on temperature unit preference (${isImperial ? 'Fahrenheit' : 'Celsius'})

Weather Data Context:
- Location: ${location}
- Current Temperature: ${weatherData.currentWeather.temperature}°${isImperial ? 'F' : 'C'}
- Condition: ${weatherData.currentWeather.condition}
- Humidity: ${weatherData.currentWeather.humidity}%
- Wind Speed: ${weatherData.currentWeather.windSpeed} ${isImperial ? 'mph' : 'km/h'}
- UV Index: ${weatherData.currentWeather.uvIndex}
- Feels Like: ${weatherData.currentWeather.feelsLike}°${isImperial ? 'F' : 'C'}`;

      userPrompt = `Generate 3-5 specific, actionable weather insights for today in ${location}. Return ONLY a JSON array of insight strings, no other text.

Examples of good insights:
- "🧥 Layer up! Temperature will drop 15°F this evening - perfect for a light jacket"
- "☀️ UV index is high (8/10) - apply SPF 30+ if spending more than 20 minutes outdoors"
- "🚗 Visibility might be reduced due to morning fog - allow extra commute time before 9 AM"
- "🏃‍♂️ Perfect running weather! Cool 65°F with low humidity - ideal for outdoor exercise"
- "📅 Rain likely after 3 PM - schedule outdoor activities for this morning"`;

    } else if (type === 'chat') {
      systemPrompt = `You are an AI Weather Companion - friendly, knowledgeable, and helpful. You specialize in weather-related conversations and provide personalized advice based on current conditions.

Current Weather Context for ${location}:
- Temperature: ${weatherData.currentWeather.temperature}°${isImperial ? 'F' : 'C'} (feels like ${weatherData.currentWeather.feelsLike}°${isImperial ? 'F' : 'C'})
- Condition: ${weatherData.currentWeather.condition}
- Humidity: ${weatherData.currentWeather.humidity}%
- Wind: ${weatherData.currentWeather.windSpeed} ${isImperial ? 'mph' : 'km/h'}
- UV Index: ${weatherData.currentWeather.uvIndex}
- Visibility: ${weatherData.currentWeather.visibility} ${isImperial ? 'miles' : 'km'}

Guidelines:
- Be conversational and helpful
- Provide specific, actionable advice
- Reference current weather conditions when relevant
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

    if (type === 'proactive_insights') {
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