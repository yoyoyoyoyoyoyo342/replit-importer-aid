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
    console.log('Generating landmark image for:', fullLocation);

    // Create a detailed prompt for FLUX to generate accurate landmark
    const imagePrompt = `Professional architectural photograph of the most famous landmark in ${cityName}. Show the iconic building or monument that ${cityName} is known for worldwide. Photorealistic, golden hour lighting, perfect composition, ultra detailed, 8k resolution, architectural photography style. The landmark should be instantly recognizable and authentic to ${cityName}.`;
    
    console.log('Image generation prompt:', imagePrompt);

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
