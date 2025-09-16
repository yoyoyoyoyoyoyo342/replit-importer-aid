import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Sparkles, TrendingUp, Brain } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { WeatherSource } from "@/types/weather";

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  insights?: string[];
}

interface AIWeatherCompanionProps {
  weatherData: WeatherSource;
  location: string;
  isImperial: boolean;
}

export function AIWeatherCompanion({ weatherData, location, isImperial }: AIWeatherCompanionProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: `👋 Hi! I'm your AI Weather Companion. I've analyzed the weather in ${location} and I'm ready to provide personalized insights, recommendations, and answer any weather-related questions you have!`,
      role: 'assistant',
      timestamp: new Date(),
      insights: ['Smart Recommendations', 'Personalized Insights', 'Proactive Alerts']
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  // Generate proactive insights when weather data changes
  useEffect(() => {
    if (weatherData) {
      generateProactiveInsights();
    }
  }, [weatherData, location]);

  const generateProactiveInsights = async () => {
    try {
      const response = await supabase.functions.invoke('ai-weather-insights', {
        body: {
          type: 'proactive_insights',
          weatherData,
          location,
          isImperial
        }
      });

      if (response.data?.insights && response.data.insights.length > 0) {
        const insightMessage: Message = {
          id: Date.now().toString(),
          content: "💡 Here are some personalized insights for today:",
          role: 'assistant',
          timestamp: new Date(),
          insights: response.data.insights
        };
        
        setMessages(prev => [...prev.slice(0, 1), insightMessage, ...prev.slice(1)]);
      }
    } catch (error) {
      console.error('Error generating proactive insights:', error);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      role: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await supabase.functions.invoke('ai-weather-insights', {
        body: {
          type: 'chat',
          message: input,
          weatherData,
          location,
          isImperial,
          conversationHistory: messages.slice(-5) // Last 5 messages for context
        }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response.data.response,
        role: 'assistant',
        timestamp: new Date(),
        insights: response.data.recommendations
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "AI Companion Unavailable",
        description: "Please try again in a moment.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <div className="p-2 bg-primary/10 rounded-full">
            <Brain className="w-5 h-5 text-primary" />
          </div>
          AI Weather Companion
          <Badge variant="secondary" className="ml-auto text-xs">
            <Sparkles className="w-3 h-3 mr-1" />
            Beta
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <ScrollArea className="h-80 pr-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            {messages.map((message) => (
              <div key={message.id} className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex gap-2 max-w-[85%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    message.role === 'user' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-gradient-to-br from-accent to-primary text-white'
                  }`}>
                    {message.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>
                  <div className={`rounded-lg p-3 ${
                    message.role === 'user' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-card border border-border'
                  }`}>
                    <p className="text-sm leading-relaxed">{message.content}</p>
                    {message.insights && message.insights.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {message.insights.map((insight, index) => (
                          <div key={index} className="flex items-start gap-2 p-2 bg-primary/5 rounded border border-primary/10">
                            <TrendingUp className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                            <span className="text-xs text-foreground">{insight}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent to-primary flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-card border border-border rounded-lg p-3">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about weather, get recommendations, or chat..."
            className="flex-1"
            disabled={isLoading}
          />
          <Button 
            onClick={sendMessage} 
            disabled={!input.trim() || isLoading}
            size="sm"
            className="px-3"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>

        <div className="text-xs text-muted-foreground text-center">
          Your AI companion learns from your preferences and provides personalized weather insights
        </div>
      </CardContent>
    </Card>
  );
}