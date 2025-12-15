import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Play } from "lucide-react";

interface CloudJumpGameProps {
  onGameEnd?: (score: number) => void;
  disabled?: boolean;
}

interface Cloud {
  id: number;
  x: number;
  y: number;
  width: number;
  hasCoin: boolean;
}

export function CloudJumpGame({ onGameEnd, disabled }: CloudJumpGameProps) {
  const [gameState, setGameState] = useState<"idle" | "playing" | "gameOver">("idle");
  const [seconds, setSeconds] = useState(0);
  const [coins, setCoins] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem("cloudJumpHighScore");
    return saved ? parseInt(saved, 10) : 0;
  });
  const [playerX, setPlayerX] = useState(50);
  const [playerY, setPlayerY] = useState(80);
  const [velocityY, setVelocityY] = useState(0);
  const [clouds, setClouds] = useState<Cloud[]>([]);
  const [cameraY, setCameraY] = useState(0);
  const gameRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();
  const cloudIdRef = useRef(0);
  const secondsRef = useRef(0);
  const coinsRef = useRef(0);

  const generateCloud = useCallback((y: number): Cloud => {
    return {
      id: cloudIdRef.current++,
      x: Math.random() * 70 + 15,
      y,
      width: 15 + Math.random() * 10,
      hasCoin: Math.random() > 0.7,
    };
  }, []);

  const startGame = useCallback(() => {
    if (disabled) return;
    setGameState("playing");
    setSeconds(0);
    setCoins(0);
    secondsRef.current = 0;
    coinsRef.current = 0;
    setPlayerX(50);
    setPlayerY(80);
    setVelocityY(-8);
    setCameraY(0);
    
    // Generate initial clouds
    const initialClouds: Cloud[] = [];
    for (let i = 0; i < 8; i++) {
      initialClouds.push(generateCloud(90 - i * 15));
    }
    setClouds(initialClouds);
  }, [generateCloud, disabled]);

  const endGame = useCallback(() => {
    setGameState("gameOver");
    const totalScore = secondsRef.current + coinsRef.current;
    if (totalScore > highScore) {
      setHighScore(totalScore);
      localStorage.setItem("cloudJumpHighScore", totalScore.toString());
    }
    onGameEnd?.(totalScore);
  }, [highScore, onGameEnd]);

  // Handle keyboard input
  useEffect(() => {
    if (gameState !== "playing") return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        setPlayerX((prev) => Math.max(5, prev - 5));
      } else if (e.key === "ArrowRight") {
        setPlayerX((prev) => Math.min(95, prev + 5));
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
    setPlayerX(Math.max(5, Math.min(95, percentX)));
  }, [gameState]);

  // Game loop - 1 point per second + bonus coins
  useEffect(() => {
    if (gameState !== "playing") return;

    let lastTime = 0;
    let scoreTimer = 0;

    const gameLoop = (timestamp: number) => {
      const deltaTime = Math.min(timestamp - lastTime, 32);
      lastTime = timestamp;

      // Update seconds every second (1 point per second)
      scoreTimer += deltaTime;
      if (scoreTimer >= 1000) {
        secondsRef.current += 1;
        setSeconds(secondsRef.current);
        scoreTimer = 0;
      }

      // Apply gravity
      setVelocityY((prev) => prev + 0.3);

      // Update player position
      setPlayerY((prevY) => {
        const newY = prevY + velocityY * 0.5;

        // Check if player fell below screen
        if (newY > 100 + cameraY) {
          endGame();
          return prevY;
        }

        return newY;
      });

      // Move camera up as player goes higher
      setPlayerY((currentPlayerY) => {
        if (currentPlayerY < cameraY + 40) {
          const newCameraY = currentPlayerY - 40;
          setCameraY(newCameraY);
        }
        return currentPlayerY;
      });

      // Check cloud collisions
      setClouds((prevClouds) => {
        let jumped = false;
        const updatedClouds = prevClouds.map((cloud) => {
          const relativeCloudY = cloud.y - cameraY;
          const relativePlayerY = playerY - cameraY;

          // Check if player lands on cloud (only when falling)
          if (
            velocityY > 0 &&
            !jumped &&
            relativePlayerY >= relativeCloudY - 8 &&
            relativePlayerY <= relativeCloudY + 5 &&
            Math.abs(cloud.x - playerX) < cloud.width / 2 + 5
          ) {
            setVelocityY(-10);
            jumped = true;

            // Collect coin (+1 bonus point)
            if (cloud.hasCoin) {
              coinsRef.current += 1;
              setCoins(coinsRef.current);
              return { ...cloud, hasCoin: false };
            }
          }
          return cloud;
        });

        // Remove clouds that are too far below and add new ones above
        const filtered = updatedClouds.filter((cloud) => cloud.y > cameraY - 20);
        
        // Add new clouds above
        const highestCloud = Math.min(...filtered.map((c) => c.y));
        if (highestCloud > cameraY - 100) {
          const newClouds = [];
          for (let y = highestCloud - 15; y > cameraY - 120; y -= 15) {
            newClouds.push(generateCloud(y));
          }
          return [...filtered, ...newClouds];
        }

        return filtered;
      });

      animationRef.current = requestAnimationFrame(gameLoop);
    };

    animationRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [gameState, playerX, playerY, velocityY, cameraY, endGame, generateCloud]);

  const totalScore = seconds + coins;

  return (
    <Card className="border-indigo-500/30 bg-gradient-to-b from-sky-300 to-indigo-400 dark:from-indigo-900 dark:to-purple-950">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-lg text-white">
          <span>☁️ Cloud Jump</span>
          <div className="flex gap-4 text-sm font-normal">
            <span>Time: {seconds}s</span>
            <span>🪙 {coins}</span>
            <span className="text-white/60">Best: {highScore}</span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div
          ref={gameRef}
          className="relative h-64 bg-gradient-to-b from-sky-400 to-indigo-500 dark:from-sky-800 dark:to-indigo-900 rounded-lg overflow-hidden touch-none"
          onTouchMove={handleTouch}
          onTouchStart={handleTouch}
        >
          {gameState === "idle" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-background/80 backdrop-blur-sm z-10">
              <p className="text-center text-sm text-muted-foreground px-4">
                Jump on clouds to stay alive!<br />
                1 point/second + 1 bonus per coin.
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
                <p className="text-lg">{seconds}s + 🪙{coins} = {totalScore} points</p>
                {totalScore >= highScore && totalScore > 0 && (
                  <p className="text-primary font-semibold">🎉 New High Score!</p>
                )}
              </div>
            </div>
          )}

          {/* Clouds */}
          {clouds.map((cloud) => (
            <div
              key={cloud.id}
              className="absolute flex flex-col items-center"
              style={{
                left: `${cloud.x}%`,
                top: `${cloud.y - cameraY}%`,
                transform: "translateX(-50%)",
              }}
            >
              {cloud.hasCoin && (
                <span className="text-lg -mb-2">🪙</span>
              )}
              <span className="text-3xl">☁️</span>
            </div>
          ))}

          {/* Player */}
          {gameState === "playing" && (
            <div
              className="absolute w-8 h-8 text-2xl transition-[left] duration-75"
              style={{
                left: `${playerX}%`,
                top: `${playerY - cameraY}%`,
                transform: "translateX(-50%)",
              }}
            >
              🧍
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
