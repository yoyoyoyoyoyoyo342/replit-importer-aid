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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<"idle" | "playing" | "gameOver">("idle");
  const [displayScore, setDisplayScore] = useState(0);
  const [displayCoins, setDisplayCoins] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem("cloudJumpHighScore");
    return saved ? parseInt(saved, 10) : 0;
  });

  const gameDataRef = useRef({
    playerX: 50,
    playerY: 80,
    velocityY: 0,
    cameraY: 0,
    clouds: [] as Cloud[],
    cloudIdCounter: 0,
    seconds: 0,
    coins: 0,
    lastTime: 0,
    scoreTimer: 0,
    keysPressed: new Set<string>(),
    touchX: null as number | null,
  });

  const generateCloud = useCallback((y: number): Cloud => {
    const data = gameDataRef.current;
    return {
      id: data.cloudIdCounter++,
      x: Math.random() * 70 + 15,
      y,
      width: 60 + Math.random() * 30,
      hasCoin: Math.random() > 0.7,
    };
  }, []);

  const startGame = useCallback(() => {
    if (disabled) return;
    const data = gameDataRef.current;
    data.playerX = 50;
    data.playerY = 80;
    data.velocityY = -12;
    data.cameraY = 0;
    data.seconds = 0;
    data.coins = 0;
    data.lastTime = 0;
    data.scoreTimer = 0;
    data.clouds = [];
    
    for (let i = 0; i < 10; i++) {
      data.clouds.push(generateCloud(85 - i * 12));
    }
    
    setDisplayScore(0);
    setDisplayCoins(0);
    setGameState("playing");
  }, [generateCloud, disabled]);

  const endGame = useCallback(() => {
    const data = gameDataRef.current;
    const totalScore = data.seconds + data.coins;
    setDisplayScore(data.seconds);
    setDisplayCoins(data.coins);
    
    if (totalScore > highScore) {
      setHighScore(totalScore);
      localStorage.setItem("cloudJumpHighScore", totalScore.toString());
    }
    
    setGameState("gameOver");
    onGameEnd?.(totalScore);
  }, [highScore, onGameEnd]);

  // Input handlers
  useEffect(() => {
    if (gameState !== "playing") return;
    
    const data = gameDataRef.current;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      data.keysPressed.add(e.key);
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      data.keysPressed.delete(e.key);
    };
    
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      data.keysPressed.clear();
    };
  }, [gameState]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (gameState !== "playing") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const touchX = e.touches[0].clientX - rect.left;
    gameDataRef.current.touchX = (touchX / rect.width) * 100;
  }, [gameState]);

  // Game loop
  useEffect(() => {
    if (gameState !== "playing") return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    let animationId: number;
    const data = gameDataRef.current;
    
    const gameLoop = (timestamp: number) => {
      if (data.lastTime === 0) data.lastTime = timestamp;
      const deltaTime = Math.min(timestamp - data.lastTime, 32);
      data.lastTime = timestamp;
      
      // Score timer
      data.scoreTimer += deltaTime;
      if (data.scoreTimer >= 1000) {
        data.seconds += 1;
        setDisplayScore(data.seconds);
        data.scoreTimer = 0;
      }
      
      // Handle input
      if (data.keysPressed.has("ArrowLeft")) {
        data.playerX = Math.max(8, data.playerX - 0.4 * deltaTime / 16);
      }
      if (data.keysPressed.has("ArrowRight")) {
        data.playerX = Math.min(92, data.playerX + 0.4 * deltaTime / 16);
      }
      if (data.touchX !== null) {
        const diff = data.touchX - data.playerX;
        data.playerX += diff * 0.15;
        data.playerX = Math.max(8, Math.min(92, data.playerX));
      }
      
      // Physics
      data.velocityY += 0.4 * deltaTime / 16;
      data.playerY += data.velocityY * deltaTime / 16;
      
      // Camera follow
      if (data.playerY < data.cameraY + 40) {
        data.cameraY = data.playerY - 40;
      }
      
      // Check if player fell
      if (data.playerY > data.cameraY + 110) {
        endGame();
        return;
      }
      
      // Cloud collision
      for (const cloud of data.clouds) {
        const relY = cloud.y - data.cameraY;
        const playerRelY = data.playerY - data.cameraY;
        
        if (
          data.velocityY > 0 &&
          playerRelY >= relY - 8 &&
          playerRelY <= relY + 4 &&
          Math.abs(cloud.x - data.playerX) < cloud.width / 2 + 5
        ) {
          data.velocityY = -12;
          if (cloud.hasCoin) {
            data.coins += 1;
            setDisplayCoins(data.coins);
            cloud.hasCoin = false;
          }
          break;
        }
      }
      
      // Remove old clouds, add new ones
      data.clouds = data.clouds.filter((c) => c.y > data.cameraY - 20);
      const highestY = Math.min(...data.clouds.map((c) => c.y));
      if (highestY > data.cameraY - 80) {
        for (let y = highestY - 12; y > data.cameraY - 100; y -= 12) {
          data.clouds.push(generateCloud(y));
        }
      }
      
      // Render
      const w = canvas.width;
      const h = canvas.height;
      
      // Sky gradient
      const gradient = ctx.createLinearGradient(0, 0, 0, h);
      gradient.addColorStop(0, "#38bdf8");
      gradient.addColorStop(1, "#6366f1");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, w, h);
      
      // Clouds
      for (const cloud of data.clouds) {
        const screenY = ((cloud.y - data.cameraY) / 100) * h;
        const screenX = (cloud.x / 100) * w;
        const cloudW = (cloud.width / 100) * w;
        
        // Cloud shadow
        ctx.fillStyle = "rgba(255,255,255,0.3)";
        ctx.beginPath();
        ctx.ellipse(screenX, screenY + 4, cloudW / 2, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Cloud body
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.ellipse(screenX - cloudW * 0.2, screenY, cloudW * 0.25, 14, 0, 0, Math.PI * 2);
        ctx.ellipse(screenX, screenY - 5, cloudW * 0.3, 18, 0, 0, Math.PI * 2);
        ctx.ellipse(screenX + cloudW * 0.2, screenY, cloudW * 0.25, 14, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Coin
        if (cloud.hasCoin) {
          ctx.fillStyle = "#fbbf24";
          ctx.beginPath();
          ctx.arc(screenX, screenY - 25, 8, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = "#f59e0b";
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      }
      
      // Player
      const playerScreenX = (data.playerX / 100) * w;
      const playerScreenY = ((data.playerY - data.cameraY) / 100) * h;
      
      // Player shadow
      ctx.fillStyle = "rgba(0,0,0,0.2)";
      ctx.beginPath();
      ctx.ellipse(playerScreenX, playerScreenY + 12, 10, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      
      // Player body
      ctx.fillStyle = "#3b82f6";
      ctx.beginPath();
      ctx.arc(playerScreenX, playerScreenY - 8, 10, 0, Math.PI * 2);
      ctx.fill();
      
      // Player head
      ctx.fillStyle = "#fcd34d";
      ctx.beginPath();
      ctx.arc(playerScreenX, playerScreenY - 20, 8, 0, Math.PI * 2);
      ctx.fill();
      
      // Eyes
      ctx.fillStyle = "#1e293b";
      ctx.beginPath();
      ctx.arc(playerScreenX - 3, playerScreenY - 21, 2, 0, Math.PI * 2);
      ctx.arc(playerScreenX + 3, playerScreenY - 21, 2, 0, Math.PI * 2);
      ctx.fill();
      
      animationId = requestAnimationFrame(gameLoop);
    };
    
    animationId = requestAnimationFrame(gameLoop);
    
    return () => cancelAnimationFrame(animationId);
  }, [gameState, endGame, generateCloud]);

  const totalScore = displayScore + displayCoins;

  return (
    <Card className="border-indigo-500/30 bg-gradient-to-b from-sky-400/80 to-indigo-500/80 backdrop-blur">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-lg text-white">
          <span className="flex items-center gap-2">
            <span className="text-2xl">☁️</span> Cloud Jump
          </span>
          <div className="flex gap-3 text-sm font-normal">
            <span className="bg-white/20 px-2 py-0.5 rounded">{displayScore}s</span>
            <span className="bg-yellow-400/30 px-2 py-0.5 rounded">🪙 {displayCoins}</span>
            <span className="text-white/60">Best: {highScore}</span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative rounded-lg overflow-hidden">
          <canvas
            ref={canvasRef}
            width={400}
            height={300}
            className="w-full h-64 touch-none"
            onTouchMove={handleTouchMove}
            onTouchStart={handleTouchMove}
            onTouchEnd={() => { gameDataRef.current.touchX = null; }}
          />
          
          {gameState === "idle" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-background/90 backdrop-blur-sm">
              <div className="text-center">
                <h3 className="text-xl font-bold mb-2">☁️ Cloud Jump</h3>
                <p className="text-sm text-muted-foreground px-4">
                  Jump on clouds to climb higher!<br />
                  Collect coins for bonus points.
                </p>
              </div>
              <Button onClick={startGame} size="lg" className="gap-2" disabled={disabled}>
                <Play className="w-5 h-5" />
                {disabled ? "Already Played Today" : "Start Game"}
              </Button>
            </div>
          )}

          {gameState === "gameOver" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-background/90 backdrop-blur-sm">
              <div className="text-center">
                <p className="text-3xl font-bold mb-2">Game Over!</p>
                <p className="text-xl">{displayScore}s + 🪙{displayCoins} = <span className="font-bold text-primary">{totalScore}</span></p>
                {totalScore >= highScore && totalScore > 0 && (
                  <p className="text-primary font-semibold text-lg mt-2">🎉 New High Score!</p>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
