import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Play, RotateCcw } from "lucide-react";

interface SnowSkiingGameProps {
  onScoreUpdate?: (score: number) => void;
}

export function SnowSkiingGame({ onScoreUpdate }: SnowSkiingGameProps) {
  const [gameState, setGameState] = useState<"idle" | "playing" | "gameOver">("idle");
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem("snowSkiingHighScore");
    return saved ? parseInt(saved, 10) : 0;
  });
  const [skierX, setSkierX] = useState(50);
  const [obstacles, setObstacles] = useState<Array<{ id: number; x: number; y: number; type: "tree" | "rock" }>>([]);
  const gameRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();
  const obstacleIdRef = useRef(0);

  const startGame = useCallback(() => {
    setGameState("playing");
    setScore(0);
    setObstacles([]);
    setSkierX(50);
  }, []);

  const endGame = useCallback(() => {
    setGameState("gameOver");
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem("snowSkiingHighScore", score.toString());
    }
    onScoreUpdate?.(score);
  }, [score, highScore, onScoreUpdate]);

  // Handle keyboard input
  useEffect(() => {
    if (gameState !== "playing") return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        setSkierX((prev) => Math.max(10, prev - 8));
      } else if (e.key === "ArrowRight") {
        setSkierX((prev) => Math.min(90, prev + 8));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [gameState]);

  // Handle touch input
  const handleTouch = useCallback((e: React.TouchEvent) => {
    if (gameState !== "playing" || !gameRef.current) return;
    
    const rect = gameRef.current.getBoundingClientRect();
    const touchX = e.touches[0].clientX - rect.left;
    const percentX = (touchX / rect.width) * 100;
    setSkierX(Math.max(10, Math.min(90, percentX)));
  }, [gameState]);

  // Game loop
  useEffect(() => {
    if (gameState !== "playing") return;

    let lastTime = 0;
    let obstacleTimer = 0;
    let scoreTimer = 0;

    const gameLoop = (timestamp: number) => {
      const deltaTime = timestamp - lastTime;
      lastTime = timestamp;

      // Update score every second
      scoreTimer += deltaTime;
      if (scoreTimer >= 1000) {
        setScore((prev) => prev + 1);
        scoreTimer = 0;
      }

      // Spawn obstacles
      obstacleTimer += deltaTime;
      if (obstacleTimer >= 800) {
        const newObstacle = {
          id: obstacleIdRef.current++,
          x: Math.random() * 80 + 10,
          y: 0,
          type: Math.random() > 0.5 ? "tree" : "rock" as "tree" | "rock",
        };
        setObstacles((prev) => [...prev, newObstacle]);
        obstacleTimer = 0;
      }

      // Move obstacles and check collisions
      setObstacles((prev) => {
        const updated = prev
          .map((obs) => ({ ...obs, y: obs.y + deltaTime * 0.08 }))
          .filter((obs) => obs.y < 100);

        // Check collision
        const skierY = 80;
        for (const obs of updated) {
          if (
            obs.y >= skierY - 8 &&
            obs.y <= skierY + 8 &&
            Math.abs(obs.x - skierX) < 10
          ) {
            endGame();
            return [];
          }
        }

        return updated;
      });

      animationRef.current = requestAnimationFrame(gameLoop);
    };

    animationRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [gameState, skierX, endGame]);

  return (
    <Card className="border-sky-500/30 bg-gradient-to-b from-sky-100 to-white dark:from-sky-950 dark:to-background">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-lg">
          <span>⛷️ Snow Skiing</span>
          <div className="flex gap-4 text-sm font-normal">
            <span>Score: {score}</span>
            <span className="text-muted-foreground">Best: {highScore}</span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div
          ref={gameRef}
          className="relative h-64 bg-gradient-to-b from-sky-200 to-white dark:from-sky-900 dark:to-sky-950 rounded-lg overflow-hidden touch-none"
          onTouchMove={handleTouch}
          onTouchStart={handleTouch}
        >
          {/* Snow effect */}
          <div className="absolute inset-0 opacity-50">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 2}s`,
                }}
              />
            ))}
          </div>

          {gameState === "idle" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-background/80 backdrop-blur-sm z-10">
              <p className="text-center text-sm text-muted-foreground px-4">
                Ski down the mountain and avoid trees!<br />
                Use arrow keys or touch to move.
              </p>
              <Button onClick={startGame} className="gap-2">
                <Play className="w-4 h-4" />
                Start Game
              </Button>
            </div>
          )}

          {gameState === "gameOver" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-background/80 backdrop-blur-sm z-10">
              <div className="text-center">
                <p className="text-2xl font-bold">Game Over!</p>
                <p className="text-lg">Score: {score}</p>
                {score >= highScore && score > 0 && (
                  <p className="text-primary font-semibold">🎉 New High Score!</p>
                )}
              </div>
              <Button onClick={startGame} className="gap-2">
                <RotateCcw className="w-4 h-4" />
                Play Again
              </Button>
            </div>
          )}

          {/* Skier */}
          <div
            className="absolute w-8 h-8 text-2xl transition-all duration-75"
            style={{ left: `${skierX}%`, bottom: "15%", transform: "translateX(-50%)" }}
          >
            ⛷️
          </div>

          {/* Obstacles */}
          {obstacles.map((obs) => (
            <div
              key={obs.id}
              className="absolute w-6 h-6 text-xl"
              style={{
                left: `${obs.x}%`,
                top: `${obs.y}%`,
                transform: "translateX(-50%)",
              }}
            >
              {obs.type === "tree" ? "🌲" : "🪨"}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
