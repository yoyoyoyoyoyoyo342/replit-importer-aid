import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ExternalLink, RefreshCw } from "lucide-react";

interface EmbeddedGameProps {
  gameUrl: string;
  gameName: string;
  fallbackUrl: string;
  description?: string;
  onGameEnd?: (score: number) => void;
  disabled?: boolean;
}

// Known embeddable game URLs for each weather theme - all ad-free GitHub hosted games
export const GAME_URLS = {
  // Snow - Falling Objects (catch falling snowflakes)
  snow: {
    url: "https://phaser.io/examples/v3/view/arcade/falling-objects",
    fallback: "https://phaser.io/examples/v3/view/arcade/falling-objects",
    name: "Snowflake Catcher",
    description: "Catch the falling snowflakes! Move to collect them.",
  },
  // Rain - Flood Runner (endless runner with rising water/rain)
  rain: {
    url: "https://phaser.io/examples/v3/view/arcade/endless-runner",
    fallback: "https://phaser.io/examples/v3/view/arcade/endless-runner",
    name: "Flood Runner",
    description: "Run from the rising flood! Tap or press space to jump.",
  },
  // Cloud - Cloud Jumper (vertical platformer jumping between clouds)
  cloud: {
    url: "https://phaser.io/examples/v3/view/arcade/platformer",
    fallback: "https://phaser.io/examples/v3/view/arcade/platformer",
    name: "Cloud Jumper",
    description: "Jump between clouds! Use arrow keys to move and jump.",
  },
  // Lightning - Timed Events (react fast like lightning)
  lightning: {
    url: "https://phaser.io/examples/v3/view/time/timed-events",
    fallback: "https://phaser.io/examples/v3/view/time/timed-events",
    name: "Lightning Reflexes",
    description: "React fast like lightning! Click at the right moment.",
  },
  // Wind Surfer - Velocity from angle (ride the wind currents)
  wind: {
    url: "https://phaser.io/examples/v3/view/arcade/velocity-from-angle",
    fallback: "https://phaser.io/examples/v3/view/arcade/velocity-from-angle",
    name: "Wind Rider",
    description: "Ride the wind currents! Use mouse to control direction.",
  },
  // Sun - Collect Stars (collect sunshine rays)
  sun: {
    url: "https://phaser.io/examples/v3/view/arcade/collect-stars",
    fallback: "https://phaser.io/examples/v3/view/arcade/collect-stars",
    name: "Sunshine Collector",
    description: "Collect the sunshine! Move around to gather rays.",
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
