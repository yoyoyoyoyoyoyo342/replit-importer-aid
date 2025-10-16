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
    const cityName = location.split(',')[0].trim().toLowerCase();
    console.log('Generating landmark for:', fullLocation);

    // Known landmarks for major cities
    const landmarkDatabase: Record<string, { name: string; description: string }> = {
      'copenhagen': { name: 'The Little Mermaid statue', description: 'bronze statue on a rock by the waterside' },
      'paris': { name: 'Eiffel Tower', description: 'iconic iron lattice tower' },
      'london': { name: 'Big Ben', description: 'famous clock tower' },
      'new york': { name: 'Statue of Liberty', description: 'neoclassical sculpture' },
      'rome': { name: 'Colosseum', description: 'ancient amphitheater' },
      'tokyo': { name: 'Tokyo Tower', description: 'red lattice tower' },
      'sydney': { name: 'Sydney Opera House', description: 'distinctive sail-shaped building' },
      'dubai': { name: 'Burj Khalifa', description: 'tallest building in the world' },
      'barcelona': { name: 'Sagrada Familia', description: 'Gaudi\'s unfinished basilica' },
      'berlin': { name: 'Brandenburg Gate', description: 'neoclassical triumphal arch' },
      'amsterdam': { name: 'Amsterdam Canal Houses', description: 'historic canal architecture' },
      'prague': { name: 'Prague Castle', description: 'historic castle complex' },
      'moscow': { name: 'Saint Basil\'s Cathedral', description: 'colorful onion-domed church' },
      'istanbul': { name: 'Hagia Sophia', description: 'Byzantine-Ottoman architecture' },
      'athens': { name: 'Parthenon', description: 'ancient Greek temple' },
      'venice': { name: 'Rialto Bridge', description: 'iconic bridge over Grand Canal' },
      'singapore': { name: 'Marina Bay Sands', description: 'luxury hotel with rooftop infinity pool' },
      'hong kong': { name: 'Victoria Harbour', description: 'skyline with skyscrapers' },
      'beijing': { name: 'Forbidden City', description: 'imperial palace complex' },
      'san francisco': { name: 'Golden Gate Bridge', description: 'iconic suspension bridge' },
      'miami': { name: 'South Beach', description: 'art deco architecture and beach' },
      'las vegas': { name: 'Las Vegas Strip', description: 'iconic casino hotels' },
      'chicago': { name: 'Cloud Gate', description: 'reflective bean sculpture' },
      'los angeles': { name: 'Hollywood Sign', description: 'iconic white letters on hillside' },
      'seattle': { name: 'Space Needle', description: 'futuristic observation tower' },
      'boston': { name: 'Faneuil Hall', description: 'historic meeting hall' },
      'washington': { name: 'Washington Monument', description: 'marble obelisk' },
      'philadelphia': { name: 'Liberty Bell', description: 'historic bell' },
      'toronto': { name: 'CN Tower', description: 'concrete communications tower' },
      'vancouver': { name: 'Stanley Park', description: 'urban park with seawall' },
      'montreal': { name: 'Notre-Dame Basilica', description: 'Gothic Revival church' },
      'rio de janeiro': { name: 'Christ the Redeemer', description: 'art deco statue' },
      'buenos aires': { name: 'Obelisk', description: 'historic monument' },
      'mexico city': { name: 'Palacio de Bellas Artes', description: 'art nouveau palace' },
      'mumbai': { name: 'Gateway of India', description: 'arch monument' },
      'delhi': { name: 'India Gate', description: 'war memorial arch' },
      'bangkok': { name: 'Wat Arun', description: 'Buddhist temple' },
      'seoul': { name: 'N Seoul Tower', description: 'communication tower on mountain' },
      'melbourne': { name: 'Flinders Street Station', description: 'Victorian railway station' },
      'auckland': { name: 'Sky Tower', description: 'telecommunications tower' },
      'cairo': { name: 'Great Pyramid of Giza', description: 'ancient pyramid' },
      'cape town': { name: 'Table Mountain', description: 'flat-topped mountain' },
      'lisbon': { name: 'Belém Tower', description: 'fortified tower' },
      'vienna': { name: 'Schönbrunn Palace', description: 'baroque palace' },
      'brussels': { name: 'Atomium', description: 'modernist building' },
      'zurich': { name: 'Grossmünster', description: 'romanesque church' },
      'stockholm': { name: 'City Hall', description: 'red brick building with tower' },
      'oslo': { name: 'Oslo Opera House', description: 'modern white marble building' },
      'helsinki': { name: 'Helsinki Cathedral', description: 'white neoclassical cathedral' },
      'dublin': { name: 'Ha\'penny Bridge', description: 'pedestrian iron bridge' },
      'edinburgh': { name: 'Edinburgh Castle', description: 'historic fortress' },
      'maidenhead': { name: 'Maidenhead Bridge', description: 'historic Thames bridge' },
      'ørestad': { name: 'Bella Sky Hotel', description: 'modern leaning twin towers' },
      'ørestad syd': { name: 'Bella Sky Hotel', description: 'modern leaning twin towers' }
    };

    let imagePrompt: string;
    const landmark = landmarkDatabase[cityName];
    
    if (landmark) {
      console.log('Using known landmark:', landmark.name);
      imagePrompt = `Professional photograph of ${landmark.name}, ${landmark.description}, located in ${fullLocation}. Iconic view, architectural photography, golden hour lighting, photorealistic, ultra detailed, 8k resolution. This is the real famous ${landmark.name} landmark.`;
    } else {
      console.log('Using generic cityscape for:', cityName);
      imagePrompt = `Beautiful ${cityName} cityscape, iconic architecture, city center view, professional photograph, warm golden hour lighting, photorealistic, ultra detailed, 8k resolution`;
    }
    
    console.log('Generating image with FLUX.1-schnell:', imagePrompt);

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
