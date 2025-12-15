import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Play, RotateCcw } from "lucide-react";

interface RainDodgeGameProps {
  onScoreUpdate?: (score: number) => void;
}

export function RainDodgeGame({ onScoreUpdate }: RainDodgeGameProps) {
  const [gameState, setGameState] = useState<"idle" | "playing" | "gameOver">("idle");
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem("rainDodgeHighScore");
    return saved ? parseInt(saved, 10) : 0;
  });
  const [playerX, setPlayerX] = useState(50);
  const [raindrops, setRaindrops] = useState<Array<{ id: number; x: number; y: number }>>([]);
  const gameRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();
  const dropIdRef = useRef(0);

  const startGame = useCallback(() => {
    setGameState("playing");
    setScore(0);
    setRaindrops([]);
    setPlayerX(50);
  }, []);

  const endGame = useCallback(() => {
    setGameState("gameOver");
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem("rainDodgeHighScore", score.toString());
    }
    onScoreUpdate?.(score);
  }, [score, highScore, onScoreUpdate]);

  // Handle keyboard input
  useEffect(() => {
    if (gameState !== "playing") return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        setPlayerX((prev) => Math.max(10, prev - 8));
      } else if (e.key === "ArrowRight") {
        setPlayerX((prev) => Math.min(90, prev + 8));
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
    setPlayerX(Math.max(10, Math.min(90, percentX)));
  }, [gameState]);

  // Game loop
  useEffect(() => {
    if (gameState !== "playing") return;

    let lastTime = 0;
    let dropTimer = 0;
    let difficulty = 1;

    const gameLoop = (timestamp: number) => {
      const deltaTime = timestamp - lastTime;
      lastTime = timestamp;

      // Spawn raindrops
      dropTimer += deltaTime;
      const spawnRate = Math.max(200, 500 - difficulty * 10);
      if (dropTimer >= spawnRate) {
        const newDrop = {
          id: dropIdRef.current++,
          x: Math.random() * 90 + 5,
          y: 0,
        };
        setRaindrops((prev) => [...prev, newDrop]);
        dropTimer = 0;
      }

      // Move raindrops and check collisions
      setRaindrops((prev) => {
        const speed = 0.06 + difficulty * 0.005;
        const updated = prev
          .map((drop) => ({ ...drop, y: drop.y + deltaTime * speed }))
          .filter((drop) => {
            // Drop passed without hitting player - score point
            if (drop.y > 100) {
              setScore((s) => {
                const newScore = s + 1;
                // Increase difficulty every 10 points
                if (newScore % 10 === 0) {
                  difficulty = Math.min(20, difficulty + 1);
                }
                return newScore;
              });
              return false;
            }
            return true;
          });

        // Check collision with player
        const playerY = 85;
        for (const drop of updated) {
          if (
            drop.y >= playerY - 5 &&
            drop.y <= playerY + 8 &&
            Math.abs(drop.x - playerX) < 8
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
  }, [gameState, playerX, endGame]);

  return (
    <Card className="border-blue-500/30 bg-gradient-to-b from-slate-600 to-slate-800 dark:from-slate-800 dark:to-slate-950">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-lg text-white">
          <span>🌧️ Rain Dodge</span>
          <div className="flex gap-4 text-sm font-normal">
            <span>Score: {score}</span>
            <span className="text-white/60">Best: {highScore}</span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div
          ref={gameRef}
          className="relative h-64 bg-gradient-to-b from-slate-700 to-slate-900 rounded-lg overflow-hidden touch-none"
          onTouchMove={handleTouch}
          onTouchStart={handleTouch}
        >
          {/* Rain effect background */}
          <div className="absolute inset-0 opacity-20">
            {[...Array(15)].map((_, i) => (
              <div
                key={i}
                className="absolute w-0.5 h-4 bg-blue-300 animate-pulse"
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
                Dodge the raindrops!<br />
                Each raindrop avoided = 1 point.<br />
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

          {/* Player with umbrella */}
          <div
            className="absolute w-10 h-10 text-3xl transition-all duration-75"
            style={{ left: `${playerX}%`, bottom: "8%", transform: "translateX(-50%)" }}
          >
            🧍
          </div>

          {/* Raindrops */}
          {raindrops.map((drop) => (
            <div
              key={drop.id}
              className="absolute text-lg"
              style={{
                left: `${drop.x}%`,
                top: `${drop.y}%`,
                transform: "translateX(-50%)",
              }}
            >
              💧
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
