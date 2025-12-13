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
}

interface LlmResponse {
  data: any;
  timestamp: Date;
  model: string;
}

export function ApiDataComparison() {
  const [location, setLocation] = useState('Copenhagen, Denmark');
  const [loading, setLoading] = useState(false);
  const [apiData, setApiData] = useState<ApiResponse | null>(null);
  const [llmData, setLlmData] = useState<LlmResponse | null>(null);
  const [chatResponse, setChatResponse] = useState<any>(null);
  const { toast } = useToast();

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch raw weather data
      const weatherApiKey = 'demo'; // Use actual key in production
      const weatherUrl = `https://api.weatherapi.com/v1/forecast.json?key=${weatherApiKey}&q=${encodeURIComponent(location)}&days=3&aqi=yes`;
      
      // For demo, we'll create mock raw data
      const mockRawData = {
        location: { name: location, country: 'Denmark', lat: 55.68, lon: 12.57 },
        current: {
          temp_c: 6,
          temp_f: 43,
          feelslike_c: 3,
          feelslike_f: 37,
          condition: { text: 'Cloudy', code: 1003 },
          humidity: 85,
          wind_kph: 21,
          wind_mph: 13,
          uv: 1,
          vis_km: 10,
          pressure_mb: 1015
        },
        forecast: {
          forecastday: [
            { date: new Date().toISOString().split('T')[0], day: { maxtemp_c: 8, mintemp_c: 4 } }
          ]
        }
      };

      setApiData({
        raw: mockRawData,
        timestamp: new Date(),
        source: 'WeatherAPI.com (Demo)'
      });

      // Fetch LLM-processed forecast
      const { data: llmResult, error: llmError } = await supabase.functions.invoke('llm-weather-forecast', {
        body: {
          sources: [{
            name: 'WeatherAPI',
            data: mockRawData
          }],
          location
        }
      });

      if (llmError) {
        console.error('LLM forecast error:', llmError);
        setLlmData({
          data: { error: llmError.message || 'Failed to fetch LLM data' },
          timestamp: new Date(),
          model: 'Groq (llama-3.3-70b)'
        });
      } else {
        setLlmData({
          data: llmResult,
          timestamp: new Date(),
          model: 'Groq (llama-3.3-70b)'
        });
      }

      // Test PAI chat
      const { data: chatResult, error: chatError } = await supabase.functions.invoke('ai-weather-insights', {
        body: {
          type: 'chat',
          message: 'What is the weather like today?',
          weatherData: {
            currentWeather: {
              temperature: 43,
              feelsLike: 37,
              condition: 'Cloudy',
              humidity: 85,
              windSpeed: 13,
              uvIndex: 1,
              visibility: 6
            }
          },
          location,
          isImperial: false,
          language: 'en-GB'
        }
      });

      if (chatError) {
        console.error('Chat error:', chatError);
        setChatResponse({ error: chatError.message || 'Chat failed' });
      } else {
        setChatResponse(chatResult);
      }

      toast({
        title: 'Data fetched',
        description: 'API and LLM data loaded successfully'
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
          API vs AI Data Comparison
        </CardTitle>
        <CardDescription>
          Compare raw API data with AI-processed output to verify data pipeline
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Enter location..."
            className="flex-1"
          />
          <Button onClick={fetchData} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Fetch Data
          </Button>
        </div>

        <Tabs defaultValue="raw" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="raw" className="flex items-center gap-2">
              <Database className="w-4 h-4" />
              Raw API
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

          <TabsContent value="raw" className="mt-4">
            <div className="space-y-2">
              {apiData ? (
                <>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary">{apiData.source}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {apiData.timestamp.toLocaleTimeString()}
                    </span>
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  </div>
                  <pre className="bg-muted p-4 rounded-lg overflow-auto max-h-96 text-xs">
                    {JSON.stringify(apiData.raw, null, 2)}
                  </pre>
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Click "Fetch Data" to load raw API response
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="llm" className="mt-4">
            <div className="space-y-2">
              {llmData ? (
                <>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary">{llmData.model}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {llmData.timestamp.toLocaleTimeString()}
                    </span>
                    {llmData.data?.error ? (
                      <AlertCircle className="w-4 h-4 text-red-500" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    )}
                  </div>
                  <pre className="bg-muted p-4 rounded-lg overflow-auto max-h-96 text-xs">
                    {JSON.stringify(llmData.data, null, 2)}
                  </pre>
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Click "Fetch Data" to load LLM-processed output
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="chat" className="mt-4">
            <div className="space-y-2">
              {chatResponse ? (
                <>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary">PAI (ai-weather-insights)</Badge>
                    {chatResponse.error ? (
                      <AlertCircle className="w-4 h-4 text-red-500" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    )}
                  </div>
                  <pre className="bg-muted p-4 rounded-lg overflow-auto max-h-96 text-xs">
                    {JSON.stringify(chatResponse, null, 2)}
                  </pre>
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Click "Fetch Data" to test PAI chat response
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <div className="text-xs text-muted-foreground">
          <p><strong>Pipeline Flow:</strong></p>
          <p>1. Raw API → WeatherAPI.com, Open-Meteo, Tomorrow.io</p>
          <p>2. Aggregation → weather-api.ts combines sources</p>
          <p>3. LLM Processing → llm-weather-forecast (Groq)</p>
          <p>4. Chat AI → ai-weather-insights (Groq primary, OpenAI fallback)</p>
        </div>
      </CardContent>
    </Card>
  );
}