import { useState, useRef, useEffect } from "react";
import { Send, Bot, TrendingUp, Brain, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { WeatherSource } from "@/types/weather";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/contexts/language-context";

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
  const [userRoutines, setUserRoutines] = useState<any[]>([]);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const { language } = useLanguage();

  // Fetch user routines
  useEffect(() => {
    const fetchRoutines = async () => {
      if (!user) return;
      try {
        const { data } = await supabase
          .from('user_routines' as any)
          .select('*')
          .eq('user_id', user.id);
        if (data) setUserRoutines(data);
      } catch (error) {
        console.error('Error fetching routines:', error);
      }
    };
    fetchRoutines();
  }, [user]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: 'smooth'
      });
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
          isImperial,
          userRoutines,
          language
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
          conversationHistory: messages.slice(-5), // Last 5 messages for context
          userRoutines,
          language
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
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-border flex-shrink-0 bg-card">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
          <Brain className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="text-base font-semibold">AI Weather Companion</h3>
          <p className="text-xs text-muted-foreground">Online</p>
        </div>
        <Badge variant="secondary" className="text-xs">
          <Sparkles className="w-3 h-3 mr-1" />
          Beta
        </Badge>
      </div>
      
      {/* Messages Area - iMessage style */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3" ref={scrollAreaRef}>
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex gap-2 max-w-[75%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              {/* Avatar - only show for assistant */}
              {message.role === 'assistant' && (
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0 self-end">
                  <Bot className="w-4 h-4 text-white" />
                </div>
              )}
              
              {/* Message Bubble */}
              <div className={`rounded-2xl px-4 py-2 ${
                message.role === 'user' 
                  ? 'bg-primary text-primary-foreground rounded-tr-sm' 
                  : 'bg-muted text-foreground rounded-tl-sm'
              }`}>
                <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{message.content}</p>
                
                {/* Insights */}
                {message.insights && message.insights.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {message.insights.map((insight, index) => (
                      <div key={index} className="flex items-start gap-2 p-2 bg-background/50 rounded-lg">
                        <TrendingUp className="w-3 h-3 text-primary mt-0.5 flex-shrink-0" />
                        <span className="text-xs">{insight}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        
        {/* Loading indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex gap-2 max-w-[75%]">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0 self-end">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3">
                <div className="flex space-x-1.5">
                  <div className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-border flex-shrink-0 bg-card">
        <div className="flex gap-2 items-center">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Message..."
            className="flex-1 rounded-full bg-muted border-0 h-10 text-sm px-4"
            disabled={isLoading}
          />
          <Button 
            onClick={sendMessage} 
            disabled={!input.trim() || isLoading}
            size="icon"
            className="rounded-full h-10 w-10 flex-shrink-0"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}