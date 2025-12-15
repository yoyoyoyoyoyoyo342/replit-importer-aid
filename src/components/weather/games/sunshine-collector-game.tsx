import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Play } from "lucide-react";

interface SunshineCollectorGameProps {
  onGameEnd?: (score: number) => void;
  disabled?: boolean;
}

export function SunshineCollectorGame({ onGameEnd, disabled }: SunshineCollectorGameProps) {
  const [gameState, setGameState] = useState<"idle" | "playing" | "gameOver">("idle");
  const [score, setScore] = useState(0);
  const [bonus, setBonus] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem("sunshineCollectorHighScore");
    return saved ? parseInt(saved, 10) : 0;
  });
  const [playerX, setPlayerX] = useState(50);
  const [sunrays, setSunrays] = useState<Array<{ id: number; x: number; y: number }>>([]);
  const [clouds, setClouds] = useState<Array<{ id: number; x: number; y: number }>>([]);
  const gameRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();
  const itemIdRef = useRef(0);
  const scoreRef = useRef(0);
  const bonusRef = useRef(0);

  const startGame = useCallback(() => {
    if (disabled) return;
    setGameState("playing");
    setScore(0);
    setBonus(0);
    scoreRef.current = 0;
    bonusRef.current = 0;
    setSunrays([]);
    setClouds([]);
    setPlayerX(50);
  }, [disabled]);

  const endGame = useCallback(() => {
    setGameState("gameOver");
    const finalScore = scoreRef.current + bonusRef.current;
    if (finalScore > highScore) {
      setHighScore(finalScore);
      localStorage.setItem("sunshineCollectorHighScore", finalScore.toString());
    }
    onGameEnd?.(finalScore);
  }, [highScore, onGameEnd]);

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
    let sunTimer = 0;
    let cloudTimer = 0;
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
        if (scoreRef.current % 5 === 0) {
          difficulty = Math.min(8, difficulty + 1);
        }
      }

      // Spawn sunrays (collectible)
      sunTimer += deltaTime;
      if (sunTimer >= 800) {
        const newSun = {
          id: itemIdRef.current++,
          x: Math.random() * 80 + 10,
          y: 0,
        };
        setSunrays((prev) => [...prev, newSun]);
        sunTimer = 0;
      }

      // Spawn clouds (obstacles)
      cloudTimer += deltaTime;
      const cloudRate = Math.max(1000, 2000 - difficulty * 100);
      if (cloudTimer >= cloudRate) {
        const newCloud = {
          id: itemIdRef.current++,
          x: Math.random() * 80 + 10,
          y: 0,
        };
        setClouds((prev) => [...prev, newCloud]);
        cloudTimer = 0;
      }

      // Move and handle sunrays
      setSunrays((prev) => {
        const updated: typeof prev = [];
        for (const ray of prev) {
          const newY = ray.y + deltaTime * 0.06;
          
          // Check if collected
          if (newY >= 80 && newY <= 95 && Math.abs(ray.x - playerX) < 10) {
            bonusRef.current += 1;
            setBonus(bonusRef.current);
            continue;
          }
          
          if (newY < 100) {
            updated.push({ ...ray, y: newY });
          }
        }
        return updated;
      });

      // Move and handle clouds
      setClouds((prev) => {
        const speed = 0.05 + difficulty * 0.005;
        const updated = prev
          .map((cloud) => ({ ...cloud, y: cloud.y + deltaTime * speed }))
          .filter((cloud) => cloud.y < 100);

        // Check collision
        for (const cloud of updated) {
          if (
            cloud.y >= 75 &&
            cloud.y <= 95 &&
            Math.abs(cloud.x - playerX) < 12
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

  const totalScore = score + bonus;

  return (
    <Card className="border-yellow-400/30 bg-gradient-to-b from-yellow-100 to-orange-200 dark:from-yellow-900 dark:to-orange-950">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-lg">
          <span>☀️ Sunshine Collector</span>
          <div className="flex gap-4 text-sm font-normal">
            <span>Time: {score}s</span>
            <span>☀️ {bonus}</span>
            <span className="text-muted-foreground">Best: {highScore}</span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div
          ref={gameRef}
          className="relative h-64 bg-gradient-to-b from-yellow-200 to-orange-300 dark:from-yellow-800 dark:to-orange-900 rounded-lg overflow-hidden touch-none"
          onTouchMove={handleTouch}
          onTouchStart={handleTouch}
        >
          {gameState === "idle" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-background/80 backdrop-blur-sm z-10">
              <p className="text-center text-sm text-muted-foreground px-4">
                Collect sunrays, avoid clouds!<br />
                1 point/second + 1 per sunray.
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
                <p className="text-lg">{score}s + ☀️{bonus} = {totalScore} points</p>
                {totalScore >= highScore && totalScore > 0 && (
                  <p className="text-primary font-semibold">🎉 New High Score!</p>
                )}
              </div>
            </div>
          )}

          {/* Sunrays */}
          {sunrays.map((ray) => (
            <div
              key={ray.id}
              className="absolute text-2xl"
              style={{
                left: `${ray.x}%`,
                top: `${ray.y}%`,
                transform: "translateX(-50%)",
              }}
            >
              ☀️
            </div>
          ))}

          {/* Clouds */}
          {clouds.map((cloud) => (
            <div
              key={cloud.id}
              className="absolute text-3xl"
              style={{
                left: `${cloud.x}%`,
                top: `${cloud.y}%`,
                transform: "translateX(-50%)",
              }}
            >
              ☁️
            </div>
          ))}

          {/* Player */}
          <div
            className="absolute w-10 h-10 text-3xl transition-all duration-75"
            style={{ left: `${playerX}%`, bottom: "8%", transform: "translateX(-50%)" }}
          >
            🧺
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
