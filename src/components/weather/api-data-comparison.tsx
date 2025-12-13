import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RefreshCw, Database, Brain, AlertCircle, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ApiResponse {
  raw: any;
  timestamp: Date;
  source: string;
  status: 'success' | 'error';
  error?: string;
}

interface LlmResponse {
  data: any;
  timestamp: Date;
  model: string;
  status: 'success' | 'error';
  error?: string;
}

export function ApiDataComparison() {
  const [lat, setLat] = useState('55.68');
  const [lon, setLon] = useState('12.57');
  const [loading, setLoading] = useState(false);
  const [apiData, setApiData] = useState<ApiResponse[]>([]);
  const [llmData, setLlmData] = useState<LlmResponse | null>(null);
  const [chatResponse, setChatResponse] = useState<any>(null);
  const { toast } = useToast();

  const fetchData = async () => {
    setLoading(true);
    const responses: ApiResponse[] = [];

    try {
      // 1. Fetch from WeatherAPI.com via aggregate-weather
      console.log('Fetching aggregate weather data...');
      const { data: aggregateData, error: aggregateError } = await supabase.functions.invoke('aggregate-weather', {
        body: { latitude: parseFloat(lat), longitude: parseFloat(lon) }
      });

      if (aggregateError) {
        responses.push({
          raw: { error: aggregateError.message },
          timestamp: new Date(),
          source: 'aggregate-weather (All Sources)',
          status: 'error',
          error: aggregateError.message
        });
      } else {
        responses.push({
          raw: aggregateData,
          timestamp: new Date(),
          source: 'aggregate-weather (All Sources)',
          status: 'success'
        });
      }

      // 2. Fetch from Tomorrow.io hyperlocal
      console.log('Fetching hyperlocal weather data...');
      const { data: hyperlocalData, error: hyperlocalError } = await supabase.functions.invoke('fetch-hyperlocal-weather', {
        body: { latitude: parseFloat(lat), longitude: parseFloat(lon) }
      });

      if (hyperlocalError) {
        responses.push({
          raw: { error: hyperlocalError.message },
          timestamp: new Date(),
          source: 'Tomorrow.io (Hyperlocal)',
          status: 'error',
          error: hyperlocalError.message
        });
      } else {
        responses.push({
          raw: hyperlocalData,
          timestamp: new Date(),
          source: 'Tomorrow.io (Hyperlocal)',
          status: 'success'
        });
      }

      // 3. Fetch from Open-Meteo directly (air quality)
      console.log('Fetching Open-Meteo air quality...');
      try {
        const aqiResponse = await fetch(
          `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=european_aqi,pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,ozone`
        );
        const aqiData = await aqiResponse.json();
        responses.push({
          raw: aqiData,
          timestamp: new Date(),
          source: 'Open-Meteo (Air Quality)',
          status: 'success'
        });
      } catch (aqiErr) {
        responses.push({
          raw: { error: String(aqiErr) },
          timestamp: new Date(),
          source: 'Open-Meteo (Air Quality)',
          status: 'error',
          error: String(aqiErr)
        });
      }

      setApiData(responses);

      // 4. Test LLM forecast if we have aggregate data
      if (aggregateData?.sources && Array.isArray(aggregateData.sources)) {
        console.log('Calling LLM weather forecast...');
        const { data: llmResult, error: llmError } = await supabase.functions.invoke('llm-weather-forecast', {
          body: {
            sources: aggregateData.sources,
            location: `${lat}, ${lon}`
          }
        });

        if (llmError) {
          setLlmData({
            data: { error: llmError.message },
            timestamp: new Date(),
            model: 'Groq (llama-3.3-70b)',
            status: 'error',
            error: llmError.message
          });
        } else {
          setLlmData({
            data: llmResult,
            timestamp: new Date(),
            model: 'Groq (llama-3.3-70b)',
            status: 'success'
          });
        }
      }

      // 5. Test PAI chat
      console.log('Testing PAI chat...');
      const testWeatherData = aggregateData?.sources?.[0] || {
        currentWeather: {
          temperature: 43,
          feelsLike: 37,
          condition: 'Cloudy',
          humidity: 85,
          windSpeed: 13,
          uvIndex: 1,
          visibility: 6
        }
      };

      const { data: chatResult, error: chatError } = await supabase.functions.invoke('ai-weather-insights', {
        body: {
          type: 'chat',
          message: 'What should I wear today based on the weather?',
          weatherData: testWeatherData,
          location: `${lat}, ${lon}`,
          isImperial: false,
          language: 'en-GB'
        }
      });

      if (chatError) {
        setChatResponse({ error: chatError.message, status: 'error' });
      } else {
        setChatResponse({ ...chatResult, status: 'success' });
      }

      toast({
        title: 'Data fetched',
        description: `Loaded ${responses.length} API sources + LLM analysis`
      });

    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch comparison data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="w-5 h-5" />
          API vs AI Data Comparison (Live)
        </CardTitle>
        <CardDescription>
          Compare real-time API data with AI-processed output to verify data pipeline
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2 flex-wrap">
          <div className="flex gap-2 items-center">
            <span className="text-sm text-muted-foreground">Lat:</span>
            <Input
              value={lat}
              onChange={(e) => setLat(e.target.value)}
              placeholder="Latitude"
              className="w-24"
            />
          </div>
          <div className="flex gap-2 items-center">
            <span className="text-sm text-muted-foreground">Lon:</span>
            <Input
              value={lon}
              onChange={(e) => setLon(e.target.value)}
              placeholder="Longitude"
              className="w-24"
            />
          </div>
          <Button onClick={fetchData} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Fetch Live Data
          </Button>
        </div>

        <Tabs defaultValue="raw" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="raw" className="flex items-center gap-2">
              <Database className="w-4 h-4" />
              Raw APIs ({apiData.length})
            </TabsTrigger>
            <TabsTrigger value="llm" className="flex items-center gap-2">
              <Brain className="w-4 h-4" />
              LLM Output
            </TabsTrigger>
            <TabsTrigger value="chat" className="flex items-center gap-2">
              <Brain className="w-4 h-4" />
              PAI Chat
            </TabsTrigger>
          </TabsList>

          <TabsContent value="raw" className="mt-4 space-y-4">
            {apiData.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Click "Fetch Live Data" to load real API responses
              </div>
            ) : (
              apiData.map((api, index) => (
                <div key={index} className="space-y-2 border-b pb-4 last:border-0">
                  <div className="flex items-center gap-2">
                    <Badge variant={api.status === 'success' ? 'secondary' : 'destructive'}>
                      {api.source}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {api.timestamp.toLocaleTimeString()}
                    </span>
                    {api.status === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-500" />
                    )}
                  </div>
                  <pre className="bg-muted p-3 rounded-lg overflow-auto max-h-60 text-xs">
                    {JSON.stringify(api.raw, null, 2)}
                  </pre>
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent value="llm" className="mt-4">
            <div className="space-y-2">
              {llmData ? (
                <>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant={llmData.status === 'success' ? 'secondary' : 'destructive'}>
                      {llmData.model}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {llmData.timestamp.toLocaleTimeString()}
                    </span>
                    {llmData.status === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-500" />
                    )}
                  </div>
                  {llmData.status === 'success' && llmData.data?.modelAgreement && (
                    <div className="text-sm mb-2">
                      <span className="font-medium">Model Agreement:</span> {llmData.data.modelAgreement}%
                    </div>
                  )}
                  <pre className="bg-muted p-4 rounded-lg overflow-auto max-h-96 text-xs">
                    {JSON.stringify(llmData.data, null, 2)}
                  </pre>
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Click "Fetch Live Data" to load LLM-processed output
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="chat" className="mt-4">
            <div className="space-y-2">
              {chatResponse ? (
                <>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant={chatResponse.status === 'success' ? 'secondary' : 'destructive'}>
                      PAI (ai-weather-insights)
                    </Badge>
                    {chatResponse.status === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-500" />
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground mb-2">
                    Test query: "What should I wear today based on the weather?"
                  </div>
                  <pre className="bg-muted p-4 rounded-lg overflow-auto max-h-96 text-xs">
                    {JSON.stringify(chatResponse, null, 2)}
                  </pre>
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Click "Fetch Live Data" to test PAI chat response
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <div className="text-xs text-muted-foreground bg-muted p-3 rounded-lg">
          <p className="font-medium mb-1">Data Pipeline:</p>
          <p>1. <strong>aggregate-weather</strong> → WeatherAPI + 7 Open-Meteo models + Met.no</p>
          <p>2. <strong>fetch-hyperlocal-weather</strong> → Tomorrow.io minute-by-minute</p>
          <p>3. <strong>llm-weather-forecast</strong> → Groq (llama-3.3-70b) analysis</p>
          <p>4. <strong>ai-weather-insights</strong> → PAI chat with Groq + OpenAI fallback</p>
        </div>
      </CardContent>
    </Card>
  );
}