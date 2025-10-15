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
    const { location } = await req.json();
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    if (!openaiApiKey) {
      console.error('OPENAI_API_KEY not configured');
      throw new Error('OPENAI_API_KEY not configured');
    }

    if (!lovableApiKey) {
      console.error('LOVABLE_API_KEY not configured');
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Clean up location string - extract just the city name
    const cityName = location.split(',')[0].trim();
    console.log('Finding landmark for city:', cityName);

    // Step 1: Use ChatGPT to identify the most famous landmark
    const gptResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openaiApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a strict travel expert with encyclopedic knowledge of world landmarks. When given a city name, respond with ONLY the exact name of the single most famous, real, verifiable landmark that actually exists in that city. This must be an iconic monument, building, or structure that can be photographed. If the city is very small or obscure, return a landmark from the nearest major city. Be precise and accurate - only return real landmarks that definitely exist. Just the landmark name, nothing else."
          },
          {
            role: "user",
            content: `What is the single most iconic, photographable landmark that actually exists in ${cityName}? Provide only the exact landmark name.`
          }
        ],
        max_tokens: 30
      })
    });

    if (!gptResponse.ok) {
      const errorText = await gptResponse.text();
      console.error('OpenAI API error:', gptResponse.status, errorText);
      throw new Error(`OpenAI request failed: ${gptResponse.status}`);
    }

    const gptData = await gptResponse.json();
    const landmarkName = gptData.choices[0].message.content.trim();
    console.log('Identified landmark:', landmarkName);

    // Step 2: Generate a high-quality image using Lovable AI
    const imagePrompt = `Professional high-quality photograph of ${landmarkName} in ${cityName}. Photorealistic, beautiful lighting, iconic view, architectural photography, ultra detailed, 8k resolution.`;
    console.log('Generating image with prompt:', imagePrompt);

    const imageResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image-preview",
        messages: [
          {
            role: "user",
            content: imagePrompt
          }
        ],
        modalities: ["image", "text"]
      })
    });

    if (!imageResponse.ok) {
      const errorText = await imageResponse.text();
      console.error('Image generation error:', imageResponse.status, errorText);
      throw new Error(`Image generation failed: ${imageResponse.status}`);
    }

    const imageData = await imageResponse.json();
    const imageUrl = imageData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageUrl) {
      console.error('No image found in response');
      throw new Error('No image generated');
    }

    console.log('Successfully generated image for:', landmarkName);
    return new Response(
      JSON.stringify({ image: imageUrl, landmark: landmarkName }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error generating landmark image:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Unknown error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
