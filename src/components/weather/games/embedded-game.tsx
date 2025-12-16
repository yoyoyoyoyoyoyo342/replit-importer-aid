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

// Known embeddable game URLs for each weather theme
export const GAME_URLS = {
  // Snow Skiing - Ski themed endless runner
  snow: {
    url: "https://www.onlinegames.io/games/2021/3/police-chase-drifter/index.html",
    fallback: "https://www.onlinegames.io/games/police-chase-drifter/",
    name: "Snow Drifter",
  },
  // Rain Dodge - Dodging game
  rain: {
    url: "https://www.onlinegames.io/games/2023/q2/geometry-dash-freezenova/index.html",
    fallback: "https://www.onlinegames.io/games/geometry-dash-freezenova/",
    name: "Rain Runner",
  },
  // Cloud Jump - Platformer jumping game  
  cloud: {
    url: "https://www.onlinegames.io/games/2024/code/6/get-on-top/index.html",
    fallback: "https://www.onlinegames.io/games/get-on-top/",
    name: "Cloud Hopper",
  },
  // Lightning Dodge - Fast reaction game
  lightning: {
    url: "https://cloud.onlinegames.io/games/2024/construct/299/geometry-escape/index-og.html",
    fallback: "https://www.onlinegames.io/games/geometry-escape/",
    name: "Lightning Escape",
  },
  // Wind Surfer - Racing/movement game
  wind: {
    url: "https://cloud.onlinegames.io/games/2024/construct/219/stickman-parkour/index-og.html",
    fallback: "https://www.onlinegames.io/games/stickman-parkour/",
    name: "Wind Runner",
  },
  // Sunshine Collector - Collection/clicker game
  sun: {
    url: "https://www.onlinegames.io/games/2023/q2/capybara-clicker-pro/index.html",
    fallback: "https://www.onlinegames.io/games/capybara-clicker-pro/",
    name: "Sun Collector",
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
  const [gameStarted, setGameStarted] = useState(false);

  useEffect(() => {
    // Reset states when URL changes
    setIsLoading(true);
    setHasError(false);
  }, [gameUrl]);

  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  const handleIframeError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  const handleStartGame = () => {
    setGameStarted(true);
    // Simulate game end after play session (user plays in iframe)
    // Since we can't track iframe game scores, we award points for playing
    if (onGameEnd && !disabled) {
      // Award base points for playing
      setTimeout(() => {
        onGameEnd(50); // Base points for playing an embedded game
      }, 30000); // After 30 seconds of play time
    }
  };

  const handleRefresh = () => {
    setIsLoading(true);
    setHasError(false);
    // Force iframe reload by updating key
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

  if (!gameStarted) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-lg">{gameName}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center h-[400px] text-center gap-4">
          <p className="text-muted-foreground">
            Ready to play? Click start to begin your weather-themed adventure!
          </p>
          <Button onClick={handleStartGame} size="lg">
            Start Game
          </Button>
          <p className="text-xs text-muted-foreground">
            Play for 30 seconds to earn 50 points
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
          <CardTitle className="text-lg">{gameName}</CardTitle>
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
          className="w-full h-[450px] border-0 rounded-b-lg"
          onLoad={handleIframeLoad}
          onError={handleIframeError}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
        />
      </CardContent>
    </Card>
  );
}
