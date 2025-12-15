import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Play } from "lucide-react";

interface LightningDodgeGameProps {
  onGameEnd?: (score: number) => void;
  disabled?: boolean;
}

export function LightningDodgeGame({ onGameEnd, disabled }: LightningDodgeGameProps) {
  const [gameState, setGameState] = useState<"idle" | "playing" | "gameOver">("idle");
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem("lightningDodgeHighScore");
    return saved ? parseInt(saved, 10) : 0;
  });
  const [playerX, setPlayerX] = useState(50);
  const [warnings, setWarnings] = useState<Array<{ id: number; x: number; countdown: number }>>([]);
  const [strikes, setStrikes] = useState<Array<{ id: number; x: number; opacity: number }>>([]);
  const gameRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();
  const strikeIdRef = useRef(0);
  const scoreRef = useRef(0);

  const startGame = useCallback(() => {
    if (disabled) return;
    setGameState("playing");
    setScore(0);
    scoreRef.current = 0;
    setWarnings([]);
    setStrikes([]);
    setPlayerX(50);
  }, [disabled]);

  const endGame = useCallback(() => {
    setGameState("gameOver");
    const finalScore = scoreRef.current;
    if (finalScore > highScore) {
      setHighScore(finalScore);
      localStorage.setItem("lightningDodgeHighScore", finalScore.toString());
    }
    onGameEnd?.(finalScore);
  }, [highScore, onGameEnd]);

  // Handle keyboard input
  useEffect(() => {
    if (gameState !== "playing") return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        setPlayerX((prev) => Math.max(10, prev - 10));
      } else if (e.key === "ArrowRight") {
        setPlayerX((prev) => Math.min(90, prev + 10));
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
    let spawnTimer = 0;
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

      // Spawn warning zones
      spawnTimer += deltaTime;
      const spawnRate = Math.max(800, 2000 - difficulty * 150);
      if (spawnTimer >= spawnRate) {
        const newWarning = {
          id: strikeIdRef.current++,
          x: Math.random() * 80 + 10,
          countdown: 1500, // 1.5 seconds warning
        };
        setWarnings((prev) => [...prev, newWarning]);
        spawnTimer = 0;
      }

      // Update warnings and create strikes
      setWarnings((prev) => {
        const updated: typeof prev = [];
        
        for (const warning of prev) {
          const newCountdown = warning.countdown - deltaTime;
          
          if (newCountdown <= 0) {
            // Create lightning strike
            setStrikes((s) => [...s, { id: warning.id, x: warning.x, opacity: 1 }]);
            
            // Check if player is hit
            if (Math.abs(warning.x - playerX) < 12) {
              endGame();
              return [];
            }
          } else {
            updated.push({ ...warning, countdown: newCountdown });
          }
        }
        
        return updated;
      });

      // Fade out strikes
      setStrikes((prev) => 
        prev
          .map((s) => ({ ...s, opacity: s.opacity - deltaTime * 0.003 }))
          .filter((s) => s.opacity > 0)
      );

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
    <Card className="border-yellow-500/30 bg-gradient-to-b from-slate-800 to-purple-950 dark:from-slate-900 dark:to-purple-950">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-lg text-white">
          <span>⚡ Lightning Dodge</span>
          <div className="flex gap-4 text-sm font-normal">
            <span>Score: {score}</span>
            <span className="text-white/60">Best: {highScore}</span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div
          ref={gameRef}
          className="relative h-64 bg-gradient-to-b from-slate-700 to-purple-900 rounded-lg overflow-hidden touch-none"
          onTouchMove={handleTouch}
          onTouchStart={handleTouch}
        >
          {gameState === "idle" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-background/80 backdrop-blur-sm z-10">
              <p className="text-center text-sm text-muted-foreground px-4">
                Avoid the lightning strikes!<br />
                Watch for warning zones. 1 point/second.
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

          {/* Warning zones */}
          {warnings.map((warning) => (
            <div
              key={warning.id}
              className="absolute top-0 h-full w-6 bg-yellow-500/30 animate-pulse"
              style={{
                left: `${warning.x}%`,
                transform: "translateX(-50%)",
              }}
            />
          ))}

          {/* Lightning strikes */}
          {strikes.map((strike) => (
            <div
              key={strike.id}
              className="absolute top-0 h-full w-2 bg-yellow-300"
              style={{
                left: `${strike.x}%`,
                transform: "translateX(-50%)",
                opacity: strike.opacity,
                boxShadow: "0 0 20px 5px rgba(253, 224, 71, 0.5)",
              }}
            />
          ))}

          {/* Player */}
          <div
            className="absolute w-10 h-10 text-3xl transition-all duration-75"
            style={{ left: `${playerX}%`, bottom: "10%", transform: "translateX(-50%)" }}
          >
            🧍
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
