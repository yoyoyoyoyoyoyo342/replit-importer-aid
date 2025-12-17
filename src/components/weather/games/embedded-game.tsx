import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ExternalLink, RefreshCw } from "lucide-react";

interface EmbeddedGameProps {
  gameUrl: string;
  gameName: string;
  fallbackUrl: string;
  onGameEnd?: (score: number) => void;
  disabled?: boolean;
}

// Known embeddable game URLs for each weather theme - all ad-free GitHub hosted games
export const GAME_URLS = {
  // Snow Skiing - Classic SkiFree game
  snow: {
    url: "https://basicallydan.github.io/skifree.js/",
    fallback: "https://basicallydan.github.io/skifree.js/",
    name: "SkiFree",
  },
  // Rain Dodge - T-Rex runner dodge game
  rain: {
    url: "https://wayou.github.io/t-rex-runner/",
    fallback: "https://wayou.github.io/t-rex-runner/",
    name: "Rain Runner",
  },
  // Cloud Jump - Flappy Bird style game
  cloud: {
    url: "https://elmejdki.github.io/FlappyBird/",
    fallback: "https://elmejdki.github.io/FlappyBird/",
    name: "Cloud Flapper",
  },
  // Lightning Dodge - Fast reaction dino game
  lightning: {
    url: "https://chrome-dino-game.github.io/",
    fallback: "https://chrome-dino-game.github.io/",
    name: "Lightning Dash",
  },
  // Wind Surfer - Another T-Rex runner variant
  wind: {
    url: "https://wayou.github.io/t-rex-runner/",
    fallback: "https://wayou.github.io/t-rex-runner/",
    name: "Wind Runner",
  },
  // Sunshine Collector - Simple clicker game
  sun: {
    url: "https://nicofilips.github.io/CookieClicker.io/",
    fallback: "https://nicofilips.github.io/CookieClicker.io/",
    name: "Sun Clicker",
  },
};

export function EmbeddedGame({ 
  gameUrl, 
  gameName, 
  fallbackUrl, 
  onGameEnd, 
  disabled 
}: EmbeddedGameProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    // Reset states when URL changes
    setIsLoading(true);
    setHasError(false);
    
    // Award points after 30 seconds of playing
    if (onGameEnd && !disabled) {
      const timer = setTimeout(() => {
        onGameEnd(50);
      }, 30000);
      return () => clearTimeout(timer);
    }
  }, [gameUrl, onGameEnd, disabled]);

  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  const handleIframeError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  const handleRefresh = () => {
    setIsLoading(true);
    setHasError(false);
    const iframe = document.getElementById('game-iframe') as HTMLIFrameElement;
    if (iframe) {
      iframe.src = iframe.src;
    }
  };

  if (disabled) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-lg">{gameName}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center h-[400px] text-center">
          <p className="text-muted-foreground mb-4">
            You've already played today! Come back tomorrow for another game.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (hasError) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-lg">{gameName}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center h-[400px] text-center gap-4">
          <p className="text-muted-foreground">
            Unable to load the game. You can try again or play on the original site.
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleRefresh}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
            <Button asChild>
              <a href={fallbackUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4 mr-2" />
                Open Game
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{gameName}</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Play for 30 seconds to earn 50 points
            </p>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <a href={fallbackUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-4 h-4" />
            </a>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0 relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Loading game...</p>
            </div>
          </div>
        )}
        <iframe
          id="game-iframe"
          src={gameUrl}
          title={gameName}
          className="w-full h-[450px] border-0 rounded-b-lg bg-white"
          onLoad={handleIframeLoad}
          onError={handleIframeError}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
        />
      </CardContent>
    </Card>
  );
}
