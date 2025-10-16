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
    const unsplashToken = Deno.env.get('UNSPLASH_ACCESS_KEY');
    const huggingFaceToken = Deno.env.get('HUGGING_FACE_ACCESS_TOKEN');

    if (!unsplashToken) {
      console.error('UNSPLASH_ACCESS_KEY not configured');
      throw new Error('UNSPLASH_ACCESS_KEY not configured');
    }

    if (!huggingFaceToken) {
      console.error('HUGGING_FACE_ACCESS_TOKEN not configured');
      throw new Error('HUGGING_FACE_ACCESS_TOKEN not configured');
    }

    const fullLocation = location.trim();
    const cityName = location.split(',')[0].trim();
    console.log('Step 1: Identifying landmark using LLM for:', fullLocation);

    // Step 1: Use Hugging Face LLM to identify the most famous landmark
    const llmResponse = await fetch('https://api-inference.huggingface.co/models/microsoft/Phi-3-mini-4k-instruct', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${huggingFaceToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: `What is the most famous landmark in ${cityName}? Reply with ONLY the landmark name, nothing else.`,
        parameters: {
          max_new_tokens: 50,
          temperature: 0.3,
          return_full_text: false
        }
      }),
    });

    if (!llmResponse.ok) {
      const errorText = await llmResponse.text();
      console.error('Hugging Face LLM API error:', llmResponse.status, errorText);
      // Fallback to database if LLM fails
      const landmark = landmarkDatabase[cityName.toLowerCase()];
      if (landmark) {
        console.log('LLM failed, using database:', landmark.name);
      } else {
        throw new Error(`Hugging Face LLM API error: ${llmResponse.status}`);
      }
    }

    let landmarkName = cityName;
    
    if (llmResponse.ok) {
      const llmData = await llmResponse.json();
      const llmResult = llmData[0]?.generated_text?.trim() || '';
      console.log('LLM identified landmark:', llmResult);
      
      // Clean up the response - extract just the landmark name
      landmarkName = llmResult
        .replace(/^(The |A |An )/i, '')
        .replace(/\.$/, '')
        .replace(/landmark$/i, '')
        .replace(/in .+$/i, '')
        .trim();
      
      console.log('Cleaned landmark name:', landmarkName);
    }
    
    // Step 2: Search Unsplash for the identified landmark
    const searchQuery = `${landmarkName} ${cityName} landmark architecture`;
    console.log('Step 2: Searching Unsplash for:', searchQuery);

    // Known landmarks for major cities with detailed descriptions
    const landmarkDatabase: Record<string, { name: string; description: string }> = {
      'copenhagen': { name: 'The Little Mermaid statue at Langelinie pier', description: 'small bronze and granite sculpture of a mermaid sitting on a rock, created by Edvard Eriksen in 1913, beside the water with harbor background, iconic Danish fairytale monument' },
      'paris': { name: 'Eiffel Tower', description: 'massive wrought-iron lattice tower standing 330 meters tall, designed by Gustave Eiffel in 1889, brown-orange color, puddle iron construction, viewed from Trocadéro Gardens' },
      'london': { name: 'Big Ben Clock Tower', description: 'Elizabeth Tower with neo-Gothic architecture, 96 meters tall, golden clock faces, ornate Victorian stonework, four-sided illuminated clock dials, Houses of Parliament, Westminster' },
      'new york': { name: 'Statue of Liberty', description: 'colossal neoclassical copper statue, 93 meters tall with pedestal, green patina oxidized copper, holding torch and tablet, crown with seven spikes, Liberty Island, New York Harbor' },
      'rome': { name: 'Roman Colosseum', description: 'massive ancient amphitheater with three tiers of arched openings, weathered travertine limestone, elliptical structure 189 meters long, iconic Roman ruins, Flavian dynasty architecture from 80 AD' },
      'tokyo': { name: 'Tokyo Tower', description: 'bright orange and white lattice steel tower, 333 meters tall, inspired by Eiffel Tower design, main observation deck, red-orange international orange color, landmark against city skyline' },
      'sydney': { name: 'Sydney Opera House', description: 'modernist expressionist building with distinctive white sail-shaped roof shells, designed by Jørn Utzon, multi-venue performing arts center, harbor location, gleaming white ceramic tiles' },
      'dubai': { name: 'Burj Khalifa', description: 'supertall skyscraper 828 meters high, neo-futurism architecture with Y-shaped floor plan, glass and steel exterior, bundled tube structural system, tallest building in world, modern Dubai skyline' },
      'barcelona': { name: 'Sagrada Familia basilica', description: 'Antoni Gaudí masterpiece with soaring spires and organic forms, Gothic and Art Nouveau style, intricate stone facades depicting nativity and passion, unfinished cathedral with construction cranes, Barcelona' },
      'berlin': { name: 'Brandenburg Gate', description: 'neoclassical triumphal arch with six Doric columns, sandstone construction, topped with Quadriga sculpture of goddess Victoria in chariot, 26 meters tall, Pariser Platz, symbol of German unity' },
      'amsterdam': { name: 'Amsterdam canal houses', description: 'narrow 17th century Dutch Golden Age townhouses with ornate gables, red brick facades, large windows, leaning forward, alongside tree-lined canals, colorful boats, typical Amsterdam architecture' },
      'prague': { name: 'Prague Castle', description: 'sprawling castle complex with Gothic St. Vitus Cathedral spires, Romanesque and Baroque palace buildings, stone walls and towers, overlooking red-roofed Old Town, Czech Republic landmark' },
      'moscow': { name: 'Saint Basil\'s Cathedral', description: 'colorful Russian Orthodox church with nine onion-shaped domes in red, green, blue, and gold, intricate patterns, Muscovite style architecture from 1561, Red Square, uniquely vibrant medieval fortress' },
      'istanbul': { name: 'Hagia Sophia', description: 'massive Byzantine-Ottoman architectural masterpiece with enormous central dome 31 meters diameter, four minarets, red brick and stone exterior, Islamic calligraphy, former cathedral and mosque' },
      'athens': { name: 'Parthenon temple', description: 'ancient Greek Doric temple on Acropolis hill, white marble columns, pediments with sculptures, 447 BC construction, weathered ancient ruins, classical Greek architecture, Athens skyline backdrop' },
      'venice': { name: 'Rialto Bridge', description: 'iconic white limestone arch bridge across Grand Canal, Renaissance architecture with central portico, shops along sides, stone balustrades, single-span arch design from 1591' },
      'singapore': { name: 'Marina Bay Sands', description: 'luxury integrated resort with three 55-story towers connected by 340-meter SkyPark rooftop, distinctive ship-shaped top deck with infinity pool, modern glass and steel architecture' },
      'hong kong': { name: 'Victoria Harbour skyline', description: 'dramatic cityscape with modern glass skyscrapers reflecting in harbor waters, ICC tower, Bank of China, IFC towers, neon lights, mountains backdrop, dense urban forest of high-rises' },
      'beijing': { name: 'Forbidden City', description: 'massive imperial palace complex with traditional Chinese palatial architecture, yellow glazed roof tiles, red walls, 980 buildings, Meridian Gate entrance, Hall of Supreme Harmony, Ming dynasty design' },
      'san francisco': { name: 'Golden Gate Bridge', description: 'iconic Art Deco suspension bridge with international orange vermillion color, 2737 meters long, two main cables, Art Deco towers 227 meters tall, spanning San Francisco Bay' },
      'miami': { name: 'South Beach Art Deco District', description: 'pastel-colored Art Deco buildings from 1930s, streamline moderne architecture, white and pink facades, neon signs, Ocean Drive, tropical palm trees, Miami Beach architectural style' },
      'las vegas': { name: 'Las Vegas Strip at night', description: 'famous boulevard lined with enormous casino resort hotels, bright neon lights and LED displays, Bellagio fountains, Luxor pyramid, Eiffel Tower replica, spectacular nighttime illumination' },
      'chicago': { name: 'Cloud Gate sculpture in Millennium Park', description: 'massive reflective stainless steel bean-shaped sculpture by Anish Kapoor, 10 meters tall, highly polished mirror-finish surface reflecting Chicago skyline and visitors, public art landmark' },
      'los angeles': { name: 'Hollywood Sign on Mount Lee', description: 'iconic white block letters spelling HOLLYWOOD on hillside, each letter 13 meters tall, metal construction, Santa Monica Mountains, Los Angeles landmark visible across city' },
      'seattle': { name: 'Space Needle', description: 'futuristic observation tower with flying saucer-shaped top, 184 meters tall, built for 1962 World\'s Fair, rotating restaurant, white and orange colored structure, Seattle Center' },
      'boston': { name: 'Faneuil Hall Marketplace', description: 'historic brick building with copper grasshopper weathervane, Georgian colonial architecture, marketplace from 1742, meeting hall and shops, red brick facades, Boston Freedom Trail' },
      'washington': { name: 'Washington Monument', description: 'tall white marble obelisk, 169 meters high, neoclassical design, aluminum pyramid capstone, National Mall, reflecting pool, classical Egyptian-inspired American memorial' },
      'philadelphia': { name: 'Liberty Bell', description: 'iconic cracked bronze bell with visible crack, inscribed with biblical verse, symbol of American independence, housed in glass pavilion, Independence Mall, Philadelphia' },
      'toronto': { name: 'CN Tower', description: 'concrete communications tower 553 meters tall, distinctive needle design, observation decks with glass floor, revolving restaurant, Toronto skyline landmark, tallest freestanding structure in Western Hemisphere' },
      'vancouver': { name: 'Stanley Park seawall', description: 'scenic waterfront pathway around urban park, mountains and ocean views, dense temperate rainforest, totem poles, Lions Gate Bridge backdrop, Vancouver harbor and North Shore mountains' },
      'montreal': { name: 'Notre-Dame Basilica', description: 'stunning Gothic Revival church interior with brilliant blue vaulted ceiling covered in golden stars, intricate wood carvings, stained glass windows, ornate altar, dramatic blue and gold color scheme' },
      'rio de janeiro': { name: 'Christ the Redeemer statue', description: 'massive Art Deco statue of Jesus Christ with outstretched arms, 30 meters tall, white soapstone and reinforced concrete, atop Corcovado mountain, overlooking Rio de Janeiro and Guanabara Bay' },
      'buenos aires': { name: 'Obelisco de Buenos Aires', description: 'white concrete obelisk monument 67 meters tall, located on Avenida 9 de Julio, erected 1936, neoclassical design, city center landmark, Argentine national symbol' },
      'mexico city': { name: 'Palacio de Bellas Artes', description: 'magnificent art nouveau and art deco palace with white Carrara marble exterior, ornate copper dome with orange tiles, stained glass curtain depicting Mexican volcanoes, cultural center' },
      'mumbai': { name: 'Gateway of India', description: 'Indo-Saracenic arch monument 26 meters tall, yellow basalt and reinforced concrete, overlooking Arabian Sea, built 1924, Mumbai Harbor, intricate latticework, colonial architecture' },
      'delhi': { name: 'India Gate', description: 'war memorial arch 42 meters tall, red and yellow sandstone, inspired by Arc de Triomphe, names of 70000 soldiers inscribed, eternal flame Amar Jawan Jyoti, Rajpath boulevard' },
      'bangkok': { name: 'Wat Arun Temple of Dawn', description: 'Buddhist temple with towering central prang spire 70 meters tall, decorated with colorful Chinese porcelain and seashells, Khmer-style architecture, beside Chao Phraya River, ornate Thai design' },
      'seoul': { name: 'N Seoul Tower on Namsan Mountain', description: 'communication and observation tower 236 meters tall, distinctive tower design with observation deck, LED displays, cable car access, panoramic Seoul city views, iconic mountain-top landmark' },
      'melbourne': { name: 'Flinders Street Station', description: 'grand Victorian-era railway station with distinctive yellow facade, green copper dome, arched entrance, Edwardian Baroque architecture from 1909, Melbourne city landmark, clocks at entrance' },
      'auckland': { name: 'Sky Tower', description: 'telecommunications and observation tower 328 meters tall, concrete structure with observation decks, distinctive needle design, tallest freestanding structure in Southern Hemisphere, Auckland skyline' },
      'cairo': { name: 'Great Pyramid of Giza', description: 'ancient Egyptian pyramid 139 meters tall, massive limestone blocks, smooth casing stones partially remaining, 4500 years old, Giza plateau, Sahara desert backdrop, one of Seven Wonders' },
      'cape town': { name: 'Table Mountain', description: 'iconic flat-topped mountain 1085 meters high, sandstone cliffs, plateau summit, cable car, overlooking Cape Town and Atlantic Ocean, dramatic natural landmark, cloudy tablecloth phenomenon' },
      'lisbon': { name: 'Belém Tower', description: 'fortified limestone tower with Manueline architecture, decorative battlements, Renaissance loggia, built 1519 on Tagus River, white stone construction, ornate balconies, Portuguese maritime symbol' },
      'vienna': { name: 'Schönbrunn Palace', description: 'magnificent Baroque imperial palace with 1441 rooms, yellow ochre facades, formal gardens, Gloriette hilltop structure, rococo interiors, Habsburg summer residence, Vienna landmark' },
      'brussels': { name: 'Atomium', description: 'unique modernist building shaped like iron crystal molecule magnified 165 billion times, nine steel spheres connected by tubes, 102 meters tall, built for 1958 World\'s Fair, silver metallic finish' },
      'zurich': { name: 'Grossmünster twin towers', description: 'Romanesque Protestant church with distinctive twin towers, stone construction from 12th century, neo-Gothic tops added 1487, overlooking Limmat River, Zurich Old Town landmark' },
      'stockholm': { name: 'Stockholm City Hall', description: 'red brick building with 106-meter tower topped by three golden crowns, National Romantic architecture, waterfront location, Blue Hall interior, Nobel Prize banquet venue' },
      'oslo': { name: 'Oslo Opera House', description: 'modern white marble and glass building rising from Oslo Fjord, angular sloping roof for walking, Carrara marble and white granite, contemporary Scandinavian architecture, waterfront landmark' },
      'helsinki': { name: 'Helsinki Cathedral', description: 'neoclassical white cathedral with green domes, symmetrical design, Corinthian columns, grand staircase, Senate Square, bright white facade against sky, Lutheran church, Helsinki symbol' },
      'dublin': { name: 'Ha\'penny Bridge', description: 'cast-iron pedestrian bridge with graceful arch across River Liffey, white-painted metal, built 1816, ornate lamp posts, officially Wellington Bridge, iconic Dublin landmark' },
      'edinburgh': { name: 'Edinburgh Castle on Castle Rock', description: 'historic fortress perched on volcanic rock outcrop, medieval and early modern architecture, stone walls and battlements, Scottish Crown Jewels location, dominating Edinburgh skyline' },
      'maidenhead': { name: 'Maidenhead Railway Bridge', description: 'elegant brick railway bridge across River Thames with wide flat arches, designed by Isambard Kingdom Brunel 1838, red brick construction, graceful engineering, Great Western Railway' },
      'ørestad': { name: 'Bella Sky Hotel towers', description: 'two modern leaning glass towers connected by sky bridge, dramatic 15-degree tilt, contemporary Scandinavian architecture, 76 meters tall, distinctive angular design, Copenhagen landmark' },
      'ørestad syd': { name: 'Bella Sky Hotel towers', description: 'two modern leaning glass towers connected by sky bridge, dramatic 15-degree tilt, contemporary Scandinavian architecture, 76 meters tall, distinctive angular design, Copenhagen landmark' }
    };

    
    // Search Unsplash for real photos
    const unsplashResponse = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(searchQuery)}&per_page=5&orientation=portrait&content_filter=high`,
      {
        headers: {
          'Authorization': `Client-ID ${unsplashToken}`,
        },
      }
    );

    if (!unsplashResponse.ok) {
      const errorText = await unsplashResponse.text();
      console.error('Unsplash API error:', unsplashResponse.status, errorText);
      throw new Error(`Unsplash API error: ${unsplashResponse.status}`);
    }

    const unsplashData = await unsplashResponse.json();
    console.log('Found', unsplashData.results?.length || 0, 'photos');

    if (!unsplashData.results || unsplashData.results.length === 0) {
      console.log('No photos found, returning fallback');
      return new Response(
        JSON.stringify({ 
          image: null, 
          landmark: landmarkName,
          error: 'No photos found'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the first high-quality photo
    const photo = unsplashData.results[0];
    const imageUrl = photo.urls.regular; // High quality but not too large
    
    console.log('Successfully found photo for:', landmarkName);
    return new Response(
      JSON.stringify({ 
        image: imageUrl, 
        landmark: landmarkName,
        photographer: photo.user.name,
        photographerUrl: photo.user.links.html
      }),
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
