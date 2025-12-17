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
  // Snow - SkiFree classic skiing game
  snow: {
    url: "https://basicallydan.github.io/skifree.js/",
    fallback: "https://basicallydan.github.io/skifree.js/",
    name: "Snow Skiing",
    description: "Ski down the snowy mountain! Use arrow keys or swipe to steer.",
  },
  // Rain - Flappy Bird style game (dodge the rain)
  rain: {
    url: "https://nebez.github.io/floppybird/",
    fallback: "https://nebez.github.io/floppybird/",
    name: "Rain Dodge",
    description: "Dodge the obstacles! Tap or click to flap and stay airborne.",
  },
  // Cloud - 2048 puzzle (match clouds)
  cloud: {
    url: "https://thedoggybrad.github.io/2048ontheweb/",
    fallback: "https://thedoggybrad.github.io/2048ontheweb/",
    name: "Cloud Match",
    description: "Match the tiles! Use arrow keys to slide and combine.",
  },
  // Lightning - HexGL fast racer (lightning speed)
  lightning: {
    url: "https://hexgl.bkcore.com/play/",
    fallback: "https://hexgl.bkcore.com/play/",
    name: "Lightning Racer",
    description: "Race at lightning speed! Use arrow keys to steer.",
  },
  // Wind - Tetris (falling blocks like wind gusts)
  wind: {
    url: "https://aerolab.github.io/blockrain.js/",
    fallback: "https://aerolab.github.io/blockrain.js/",
    name: "Wind Blocks",
    description: "Stack the falling blocks! Use arrow keys to move and rotate.",
  },
  // Sun - Cube Composer puzzle (bright and colorful)
  sun: {
    url: "https://david-peter.de/cube-composer/",
    fallback: "https://david-peter.de/cube-composer/",
    name: "Sunshine Puzzles",
    description: "Solve colorful puzzles! Click functions to transform cubes.",
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
