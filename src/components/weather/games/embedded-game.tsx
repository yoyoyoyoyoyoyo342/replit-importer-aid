import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ExternalLink, RefreshCw, Smartphone } from "lucide-react";

interface EmbeddedGameProps {
  gameUrl: string;
  gameName: string;
  fallbackUrl: string;
  onGameEnd?: (score: number) => void;
  disabled?: boolean;
}

// Mobile-friendly embeddable game URLs (all have "mobile" tag with touch controls)
export const GAME_URLS = {
  // Snow Skiing - Jeep racing on terrain (mobile-friendly physics game)
  snow: {
    url: "https://www.onlinegames.io/games/2023/freezenova.com/jeep-racing/index.html",
    fallback: "https://www.onlinegames.io/games/jeep-racing/",
    name: "Snow Rider",
  },
  // Rain Dodge - Dinosaur endless runner (mobile-friendly, tap to jump)
  rain: {
    url: "https://www.onlinegames.io/games/2023/q2/dinosaur-game/index.html",
    fallback: "https://www.onlinegames.io/games/dinosaur-game/",
    name: "Rain Dash",
  },
  // Cloud Jump - Stickman physics/jumping (mobile-friendly tap controls)
  cloud: {
    url: "https://www.onlinegames.io/games/2023/construct/185/crazy-stickman-physics/index.html",
    fallback: "https://www.onlinegames.io/games/crazy-stickman-physics/",
    name: "Cloud Bounce",
  },
  // Lightning Dodge - Zombie Sniper fast reaction (mobile-friendly tap to shoot)
  lightning: {
    url: "https://www.onlinegames.io/games/2022/construct/116/zombie-sniper/index.html",
    fallback: "https://www.onlinegames.io/games/zombie-sniper/",
    name: "Storm Shooter",
  },
  // Wind Surfer - Football King movement game (mobile-friendly touch)
  wind: {
    url: "https://www.onlinegames.io/games/2024/construct/226/football-king/index.html",
    fallback: "https://www.onlinegames.io/games/football-king/",
    name: "Wind Kick",
  },
  // Sunshine Collector - Capybara Clicker (mobile-friendly tap game)
  sun: {
    url: "https://www.onlinegames.io/games/2023/q2/capybara-clicker-pro/index.html",
    fallback: "https://www.onlinegames.io/games/capybara-clicker-pro/",
    name: "Sun Tapper",
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
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{gameName}</CardTitle>
            <div className="flex items-center gap-1 text-xs text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400 px-2 py-1 rounded-full">
              <Smartphone className="w-3 h-3" />
              Mobile Ready
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center h-[350px] sm:h-[400px] text-center gap-4">
          <p className="text-muted-foreground">
            Ready to play? Tap start to begin your weather-themed adventure!
          </p>
          <Button onClick={handleStartGame} size="lg" className="min-w-[150px]">
            Start Game
          </Button>
          <p className="text-xs text-muted-foreground">
            Play for 30 seconds to earn 50 points
          </p>
          <p className="text-xs text-muted-foreground/70">
            Works on desktop & mobile with touch controls
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
        <CardContent className="flex flex-col items-center justify-center h-[350px] sm:h-[400px] text-center gap-4">
          <p className="text-muted-foreground">
            Unable to load the game. You can try again or play on the original site.
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
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
      <CardHeader className="pb-2 px-3 sm:px-6">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <CardTitle className="text-base sm:text-lg truncate">{gameName}</CardTitle>
            <div className="hidden sm:flex items-center gap-1 text-xs text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400 px-2 py-0.5 rounded-full">
              <Smartphone className="w-3 h-3" />
              Mobile
            </div>
          </div>
          <Button variant="ghost" size="sm" asChild className="shrink-0">
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
          className="w-full h-[400px] sm:h-[450px] border-0 rounded-b-lg"
          onLoad={handleIframeLoad}
          onError={handleIframeError}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
          style={{ touchAction: 'manipulation' }}
        />
      </CardContent>
    </Card>
  );
}
