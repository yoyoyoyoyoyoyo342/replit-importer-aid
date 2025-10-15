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

    if (!openaiApiKey) {
      console.error('OPENAI_API_KEY not configured');
      throw new Error('OPENAI_API_KEY not configured');
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
            content: "You are a travel expert. When given a city name, respond with ONLY the name of the single most famous, iconic landmark in that city. Just the landmark name, nothing else."
          },
          {
            role: "user",
            content: `Most famous landmark in ${cityName}`
          }
        ],
        max_tokens: 20
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

    // Step 2: Search Wikimedia Commons for images
    const searchQuery = encodeURIComponent(`${landmarkName} ${cityName}`);
    const wikimediaSearchUrl = `https://commons.wikimedia.org/w/api.php?action=query&format=json&generator=search&gsrnamespace=6&gsrsearch=${searchQuery}&gsrlimit=10&prop=imageinfo&iiprop=url&iiurlwidth=1024`;
    
    console.log('Searching Wikimedia for:', landmarkName);
    const wikiResponse = await fetch(wikimediaSearchUrl);
    
    if (!wikiResponse.ok) {
      throw new Error('Wikimedia search failed');
    }

    const wikiData = await wikiResponse.json();
    const pages = wikiData.query?.pages;
    
    if (!pages) {
      throw new Error('No images found on Wikimedia Commons');
    }

    // Get the first valid image
    let imageUrl = null;
    for (const pageId in pages) {
      const page = pages[pageId];
      if (page.imageinfo && page.imageinfo[0]?.thumburl) {
        imageUrl = page.imageinfo[0].thumburl;
        break;
      }
    }

    if (!imageUrl) {
      throw new Error('No suitable images found');
    }

    console.log('Successfully found image:', imageUrl);
    return new Response(
      JSON.stringify({ image: imageUrl, landmark: landmarkName }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error finding landmark image:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Unknown error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
