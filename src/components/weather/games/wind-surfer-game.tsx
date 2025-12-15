import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Play } from "lucide-react";

interface WindSurferGameProps {
  onGameEnd?: (score: number) => void;
  disabled?: boolean;
}

export function WindSurferGame({ onGameEnd, disabled }: WindSurferGameProps) {
  const [gameState, setGameState] = useState<"idle" | "playing" | "gameOver">("idle");
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem("windSurferHighScore");
    return saved ? parseInt(saved, 10) : 0;
  });
  const [playerX, setPlayerX] = useState(50);
  const [playerY, setPlayerY] = useState(50);
  const [windDirection, setWindDirection] = useState(0); // -1 left, 0 none, 1 right
  const [obstacles, setObstacles] = useState<Array<{ id: number; x: number; y: number; type: "tornado" | "debris" }>>([]);
  const gameRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();
  const obstacleIdRef = useRef(0);
  const scoreRef = useRef(0);

  const startGame = useCallback(() => {
    if (disabled) return;
    setGameState("playing");
    setScore(0);
    scoreRef.current = 0;
    setObstacles([]);
    setPlayerX(50);
    setPlayerY(50);
    setWindDirection(0);
  }, [disabled]);

  const endGame = useCallback(() => {
    setGameState("gameOver");
    const finalScore = scoreRef.current;
    if (finalScore > highScore) {
      setHighScore(finalScore);
      localStorage.setItem("windSurferHighScore", finalScore.toString());
    }
    onGameEnd?.(finalScore);
  }, [highScore, onGameEnd]);

  // Handle keyboard input
  useEffect(() => {
    if (gameState !== "playing") return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        setPlayerX((prev) => Math.max(5, prev - 6));
      } else if (e.key === "ArrowRight") {
        setPlayerX((prev) => Math.min(95, prev + 6));
      } else if (e.key === "ArrowUp") {
        setPlayerY((prev) => Math.max(10, prev - 6));
      } else if (e.key === "ArrowDown") {
        setPlayerY((prev) => Math.min(85, prev + 6));
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
    const touchY = e.touches[0].clientY - rect.top;
    const percentX = (touchX / rect.width) * 100;
    const percentY = (touchY / rect.height) * 100;
    setPlayerX(Math.max(5, Math.min(95, percentX)));
    setPlayerY(Math.max(10, Math.min(85, percentY)));
  }, [gameState]);

  // Game loop
  useEffect(() => {
    if (gameState !== "playing") return;

    let lastTime = 0;
    let spawnTimer = 0;
    let windTimer = 0;
    let scoreTimer = 0;
    let difficulty = 1;

    const gameLoop = (timestamp: number) => {
      const deltaTime = timestamp - lastTime;
      lastTime = timestamp;

      // Update score every second
      scoreTimer += deltaTime;
      if (scoreTimer >= 1000) {
        scoreRef.current += 1;
        setScore(scoreRef.current);
        scoreTimer = 0;
        if (scoreRef.current % 4 === 0) {
          difficulty = Math.min(10, difficulty + 1);
        }
      }

      // Change wind direction periodically
      windTimer += deltaTime;
      if (windTimer >= 3000) {
        setWindDirection(Math.floor(Math.random() * 3) - 1);
        windTimer = 0;
      }

      // Apply wind push to player
      setPlayerX((prev) => {
        const windForce = windDirection * 0.02 * deltaTime;
        const newX = prev + windForce;
        if (newX < 5 || newX > 95) {
          endGame();
          return prev;
        }
        return newX;
      });

      // Spawn obstacles
      spawnTimer += deltaTime;
      const spawnRate = Math.max(600, 1200 - difficulty * 60);
      if (spawnTimer >= spawnRate) {
        const newObstacle = {
          id: obstacleIdRef.current++,
          x: Math.random() * 80 + 10,
          y: 0,
          type: Math.random() > 0.7 ? "tornado" : "debris" as "tornado" | "debris",
        };
        setObstacles((prev) => [...prev, newObstacle]);
        spawnTimer = 0;
      }

      // Move obstacles and check collisions
      setObstacles((prev) => {
        const speed = 0.04 + difficulty * 0.005;
        const updated = prev
          .map((obs) => ({ ...obs, y: obs.y + deltaTime * speed }))
          .filter((obs) => obs.y < 100);

        // Check collision
        for (const obs of updated) {
          if (
            Math.abs(obs.y - playerY) < 10 &&
            Math.abs(obs.x - playerX) < 8
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
  }, [gameState, playerX, playerY, windDirection, endGame]);

  const getWindIndicator = () => {
    if (windDirection === -1) return "← Wind";
    if (windDirection === 1) return "Wind →";
    return "Calm";
  };

  return (
    <Card className="border-teal-500/30 bg-gradient-to-b from-teal-200 to-cyan-400 dark:from-teal-900 dark:to-cyan-950">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-lg">
          <span>🌬️ Wind Surfer</span>
          <div className="flex gap-4 text-sm font-normal">
            <span className="text-teal-700 dark:text-teal-300">{getWindIndicator()}</span>
            <span>Score: {score}</span>
            <span className="text-muted-foreground">Best: {highScore}</span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div
          ref={gameRef}
          className="relative h-64 bg-gradient-to-b from-teal-300 to-cyan-500 dark:from-teal-800 dark:to-cyan-900 rounded-lg overflow-hidden touch-none"
          onTouchMove={handleTouch}
          onTouchStart={handleTouch}
        >
          {/* Wind lines */}
          <div className="absolute inset-0 overflow-hidden opacity-30">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="absolute h-0.5 bg-white animate-pulse"
                style={{
                  width: `${30 + Math.random() * 40}%`,
                  left: windDirection === -1 ? "auto" : "0",
                  right: windDirection === -1 ? "0" : "auto",
                  top: `${10 + i * 12}%`,
                  transform: `translateX(${windDirection * 20}px)`,
                }}
              />
            ))}
          </div>

          {gameState === "idle" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-background/80 backdrop-blur-sm z-10">
              <p className="text-center text-sm text-muted-foreground px-4">
                Surf the wind and avoid obstacles!<br />
                Don't get pushed off screen. 1 point/second.
              </p>
              <Button onClick={startGame} className="gap-2" disabled={disabled}>
                <Play className="w-4 h-4" />
                {disabled ? "Already Played Today" : "Start Game"}
              </Button>
            </div>
          )}

          {gameState === "gameOver" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-background/80 backdrop-blur-sm z-10">
              <div className="text-center">
                <p className="text-2xl font-bold">Game Over!</p>
                <p className="text-lg">Score: {score} points</p>
                {score >= highScore && score > 0 && (
                  <p className="text-primary font-semibold">🎉 New High Score!</p>
                )}
              </div>
            </div>
          )}

          {/* Player */}
          <div
            className="absolute w-10 h-10 text-3xl transition-all duration-75"
            style={{ 
              left: `${playerX}%`, 
              top: `${playerY}%`, 
              transform: "translate(-50%, -50%)" 
            }}
          >
            🏄
          </div>

          {/* Obstacles */}
          {obstacles.map((obs) => (
            <div
              key={obs.id}
              className="absolute text-2xl"
              style={{
                left: `${obs.x}%`,
                top: `${obs.y}%`,
                transform: "translate(-50%, -50%)",
              }}
            >
              {obs.type === "tornado" ? "🌪️" : "🪵"}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
