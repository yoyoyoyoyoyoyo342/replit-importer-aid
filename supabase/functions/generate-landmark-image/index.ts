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

    // Step 1: Use GPT-5 Mini to identify the most famous real landmark
    const gptResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openaiApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-5-mini-2025-08-07",
        messages: [
          {
            role: "system",
            content: "You are a precise geography and architecture expert with access to verified landmark databases. Your task is CRITICAL: return ONLY landmarks that physically exist and can be verified. When given a city name, you must:\n\n1. Identify ONE real landmark physically located INSIDE that city's boundaries\n2. The landmark MUST be verifiable (real building, monument, or structure)\n3. It MUST be within the actual city limits, NOT in nearby towns or suburbs\n4. If you are not 100% certain the landmark exists in that exact city, respond with 'City Center' or 'Town Square'\n5. Return ONLY the landmark name, nothing else\n\nDo NOT invent landmarks. Do NOT return landmarks from nearby areas. Accuracy is critical."
          },
          {
            role: "user",
            content: `What is the single most iconic landmark that PHYSICALLY EXISTS and is located INSIDE the city boundaries of ${cityName}? Only return the name if you are absolutely certain it's a real landmark in that exact city.`
          }
        ],
        max_completion_tokens: 30
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
