import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, Check, Zap, Globe, Brain, Shield } from "lucide-react";

export default function Api() {
  const [copiedEndpoint, setCopiedEndpoint] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedEndpoint(id);
    setTimeout(() => setCopiedEndpoint(null), 2000);
  };

  const endpoint = "https://ohwtbkudpkfbakynikyj.supabase.co/functions/v1/llm-weather-forecast";

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto px-4 py-12 max-w-5xl">
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-4">Weather API</Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
            Rainz Weather API
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Access LLM-enhanced weather forecasts with multi-model aggregation and intelligent analysis.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card className="border-primary/20">
            <CardHeader className="text-center">
              <Brain className="h-10 w-10 mx-auto text-primary mb-2" />
              <CardTitle className="text-lg">AI-Enhanced</CardTitle>
            </CardHeader>
            <CardContent className="text-center text-sm text-muted-foreground">
              LLM analyzes data from multiple weather models for unified predictions
            </CardContent>
          </Card>
          <Card className="border-primary/20">
            <CardHeader className="text-center">
              <Globe className="h-10 w-10 mx-auto text-primary mb-2" />
              <CardTitle className="text-lg">Multi-Source</CardTitle>
            </CardHeader>
            <CardContent className="text-center text-sm text-muted-foreground">
              Aggregates ECMWF, GFS, DWD ICON, Met.no, and more
            </CardContent>
          </Card>
          <Card className="border-primary/20">
            <CardHeader className="text-center">
              <Zap className="h-10 w-10 mx-auto text-primary mb-2" />
              <CardTitle className="text-lg">Fast & Reliable</CardTitle>
            </CardHeader>
            <CardContent className="text-center text-sm text-muted-foreground">
              Fallback to raw data if AI is unavailable for 100% uptime
            </CardContent>
          </Card>
        </div>

        <Card className="mb-8 border-2 border-primary/30 bg-gradient-to-r from-primary/5 to-transparent">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">Pricing</CardTitle>
                <CardDescription>Simple, transparent pricing</CardDescription>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-primary">€0.01</div>
                <div className="text-sm text-muted-foreground">per API call</div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Badge variant="outline" className="py-1">
                <Shield className="h-3 w-3 mr-1" /> Secure API Key
              </Badge>
              <Badge variant="outline" className="py-1">No monthly minimum</Badge>
              <Badge variant="outline" className="py-1">Pay as you go</Badge>
              <Badge variant="outline" className="py-1">Volume discounts available</Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>API Endpoint</CardTitle>
            <CardDescription>POST request to get LLM-enhanced weather data</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg font-mono text-sm overflow-x-auto">
              <span className="text-primary font-semibold">POST</span>
              <code className="flex-1">{endpoint}</code>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(endpoint, "endpoint")}
              >
                {copiedEndpoint === "endpoint" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="request" className="mb-8">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="request">Request</TabsTrigger>
            <TabsTrigger value="response">Response</TabsTrigger>
          </TabsList>
          <TabsContent value="request">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Request Body</CardTitle>
                <CardDescription>Send weather source data for LLM analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="p-4 bg-muted rounded-lg overflow-x-auto text-sm">
{`{
  "location": "New York, NY",
  "sources": [
    {
      "source": "WeatherAPI",
      "currentWeather": {
        "temperature": 72,
        "condition": "Partly Cloudy",
        "humidity": 65,
        "windSpeed": 8,
        "feelsLike": 74,
        "pressure": 1015
      },
      "hourlyForecast": [
        {
          "time": "2024-01-15T14:00:00Z",
          "temperature": 73,
          "condition": "Cloudy",
          "precipitation": 10
        }
      ],
      "dailyForecast": [
        {
          "day": "Monday",
          "condition": "Partly Cloudy",
          "highTemp": 75,
          "lowTemp": 58,
          "precipitation": 20
        }
      ]
    }
  ]
}`}</pre>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="response">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Response</CardTitle>
                <CardDescription>LLM-enhanced unified forecast with confidence levels</CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="p-4 bg-muted rounded-lg overflow-x-auto text-sm">
{`{
  "current": {
    "temperature": 72,
    "feelsLike": 74,
    "condition": "Partly Cloudy",
    "description": "Mild conditions with some cloud cover",
    "humidity": 65,
    "windSpeed": 8,
    "pressure": 1015,
    "confidence": 92
  },
  "hourly": [...],
  "daily": [...],
  "summary": "Pleasant day with increasing clouds...",
  "modelAgreement": 87,
  "insights": [
    "High pressure system maintaining stable conditions",
    "Slight chance of evening showers"
  ]
}`}</pre>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Card>
          <CardHeader>
            <CardTitle>Get Started</CardTitle>
            <CardDescription>Contact us for API access</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              To get an API key and start using the Rainz Weather API, please contact us at:
            </p>
            <a 
              href="mailto:api@rainz.net" 
              className="inline-flex items-center gap-2 text-primary hover:underline font-medium"
            >
              api@rainz.net
            </a>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
