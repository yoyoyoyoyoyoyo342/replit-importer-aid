import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { HfInference } from "https://esm.sh/@huggingface/inference@2.3.2";

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
    const huggingFaceToken = Deno.env.get('HUGGING_FACE_ACCESS_TOKEN');

    if (!huggingFaceToken) {
      console.error('HUGGING_FACE_ACCESS_TOKEN not configured');
      throw new Error('HUGGING_FACE_ACCESS_TOKEN not configured');
    }

    const fullLocation = location.trim();
    const cityName = location.split(',')[0].trim();
    console.log('Step 1: Identifying landmark for:', fullLocation);

    // Step 1: Use Hugging Face LLM to identify the most famous landmark
    const landmarkIdentifyResponse = await fetch('https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.3', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${huggingFaceToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: `What is THE most famous, iconic, and recognizable landmark or building in ${fullLocation}? Reply with ONLY the landmark name and a brief architectural description in this exact format: "Name: [landmark name], Description: [brief description]". If this is a very small town with no famous landmarks, reply with exactly "FALLBACK"`,
        parameters: {
          max_new_tokens: 150,
          temperature: 0.7,
          return_full_text: false
        }
      }),
    });

    if (!landmarkIdentifyResponse.ok) {
      const errorText = await landmarkIdentifyResponse.text();
      console.error('Hugging Face LLM API error:', landmarkIdentifyResponse.status, errorText);
      throw new Error(`Hugging Face LLM API error: ${landmarkIdentifyResponse.status}`);
    }

    const landmarkData = await landmarkIdentifyResponse.json();
    const landmarkInfo = landmarkData[0]?.generated_text?.trim() || '';
    console.log('Hugging Face identified landmark:', landmarkInfo);

    // Step 2: Generate image prompt based on LLM response
    let imagePrompt: string;
    
    if (landmarkInfo.includes('FALLBACK') || landmarkInfo.length < 10) {
      // Fallback for small towns without famous landmarks
      console.log('Using fallback generic cityscape for:', cityName);
      imagePrompt = `Beautiful ${cityName} cityscape, charming local architecture, town center view, professional photograph, warm golden hour lighting, photorealistic, ultra detailed, 8k resolution`;
    } else {
      // Extract landmark name and description
      const nameMatch = landmarkInfo.match(/Name:\s*([^,]+)/i);
      const descMatch = landmarkInfo.match(/Description:\s*(.+)/i);
      
      const landmarkName = nameMatch ? nameMatch[1].trim() : landmarkInfo.split(',')[0];
      const description = descMatch ? descMatch[1].trim() : 'iconic architecture';
      
      console.log('Generating image for landmark:', landmarkName);
      imagePrompt = `Professional photograph of ${landmarkName}, ${description}, located in ${fullLocation}. Iconic view, architectural photography, golden hour lighting, photorealistic, ultra detailed, 8k resolution. This is the real ${landmarkName} landmark.`;
    }
    
    console.log('Step 2: Generating image with FLUX.1-schnell:', imagePrompt);

    const hf = new HfInference(huggingFaceToken);
    const image = await hf.textToImage({
      inputs: imagePrompt,
      model: 'black-forest-labs/FLUX.1-schnell',
    });

    // Convert the blob to a base64 string in chunks to avoid stack overflow
    const arrayBuffer = await image.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    let binaryString = '';
    const chunkSize = 8192;
    
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      const chunk = uint8Array.subarray(i, i + chunkSize);
      binaryString += String.fromCharCode.apply(null, Array.from(chunk));
    }
    
    const base64 = btoa(binaryString);
    const imageUrl = `data:image/png;base64,${base64}`;

    console.log('Successfully generated image for:', cityName);
    return new Response(
      JSON.stringify({ image: imageUrl, landmark: cityName }),
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
