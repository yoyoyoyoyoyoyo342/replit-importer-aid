import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Play } from "lucide-react";

interface RainDodgeGameProps {
  onGameEnd?: (score: number) => void;
  disabled?: boolean;
}

interface Raindrop {
  x: number;
  y: number;
  speed: number;
  size: number;
}

export function RainDodgeGame({ onGameEnd, disabled }: RainDodgeGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<"idle" | "playing" | "gameOver">("idle");
  const [displayScore, setDisplayScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem("rainDodgeHighScore");
    return saved ? parseInt(saved, 10) : 0;
  });

  const gameDataRef = useRef({
    playerX: 50,
    raindrops: [] as Raindrop[],
    score: 0,
    lastTime: 0,
    scoreTimer: 0,
    spawnTimer: 0,
    difficulty: 1,
    keysPressed: new Set<string>(),
    touchX: null as number | null,
    backgroundDrops: [] as { x: number; y: number; speed: number; opacity: number }[],
  });

  const startGame = useCallback(() => {
    if (disabled) return;
    const data = gameDataRef.current;
    data.playerX = 50;
    data.raindrops = [];
    data.score = 0;
    data.lastTime = 0;
    data.scoreTimer = 0;
    data.spawnTimer = 0;
    data.difficulty = 1;
    
    // Background rain
    data.backgroundDrops = [];
    for (let i = 0; i < 50; i++) {
      data.backgroundDrops.push({
        x: Math.random() * 100,
        y: Math.random() * 100,
        speed: 0.3 + Math.random() * 0.3,
        opacity: 0.1 + Math.random() * 0.2,
      });
    }
    
    setDisplayScore(0);
    setGameState("playing");
  }, [disabled]);

  const endGame = useCallback(() => {
    const data = gameDataRef.current;
    setDisplayScore(data.score);
    
    if (data.score > highScore) {
      setHighScore(data.score);
      localStorage.setItem("rainDodgeHighScore", data.score.toString());
    }
    
    setGameState("gameOver");
    onGameEnd?.(data.score);
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
        data.score += 1;
        setDisplayScore(data.score);
        data.scoreTimer = 0;
        if (data.score % 5 === 0) {
          data.difficulty = Math.min(10, data.difficulty + 1);
        }
      }
      
      // Handle input
      const moveSpeed = 0.5 * deltaTime / 16;
      if (data.keysPressed.has("ArrowLeft")) {
        data.playerX = Math.max(8, data.playerX - moveSpeed);
      }
      if (data.keysPressed.has("ArrowRight")) {
        data.playerX = Math.min(92, data.playerX + moveSpeed);
      }
      if (data.touchX !== null) {
        const diff = data.touchX - data.playerX;
        data.playerX += diff * 0.2;
        data.playerX = Math.max(8, Math.min(92, data.playerX));
      }
      
      // Spawn raindrops
      data.spawnTimer += deltaTime;
      const spawnRate = Math.max(100, 300 - data.difficulty * 20);
      if (data.spawnTimer >= spawnRate) {
        data.raindrops.push({
          x: Math.random() * 90 + 5,
          y: -5,
          speed: 0.15 + data.difficulty * 0.02 + Math.random() * 0.05,
          size: 3 + Math.random() * 2,
        });
        data.spawnTimer = 0;
      }
      
      // Update raindrops
      for (const drop of data.raindrops) {
        drop.y += drop.speed * deltaTime;
      }
      
      // Check collisions
      const playerY = 85;
      for (const drop of data.raindrops) {
        if (
          drop.y >= playerY - 6 &&
          drop.y <= playerY + 8 &&
          Math.abs(drop.x - data.playerX) < 8
        ) {
          endGame();
          return;
        }
      }
      
      // Remove off-screen drops
      data.raindrops = data.raindrops.filter((d) => d.y < 105);
      
      // Update background rain
      for (const drop of data.backgroundDrops) {
        drop.y += drop.speed * deltaTime;
        if (drop.y > 100) {
          drop.y = -5;
          drop.x = Math.random() * 100;
        }
      }
      
      // Render
      const w = canvas.width;
      const h = canvas.height;
      
      // Storm gradient
      const gradient = ctx.createLinearGradient(0, 0, 0, h);
      gradient.addColorStop(0, "#1e293b");
      gradient.addColorStop(1, "#0f172a");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, w, h);
      
      // Background rain
      ctx.strokeStyle = "#94a3b8";
      ctx.lineWidth = 1;
      for (const drop of data.backgroundDrops) {
        ctx.globalAlpha = drop.opacity;
        ctx.beginPath();
        ctx.moveTo((drop.x / 100) * w, (drop.y / 100) * h);
        ctx.lineTo((drop.x / 100) * w, (drop.y / 100) * h + 8);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      
      // Raindrops
      for (const drop of data.raindrops) {
        const screenX = (drop.x / 100) * w;
        const screenY = (drop.y / 100) * h;
        
        // Glow
        const glow = ctx.createRadialGradient(screenX, screenY, 0, screenX, screenY, drop.size * 3);
        glow.addColorStop(0, "rgba(96, 165, 250, 0.4)");
        glow.addColorStop(1, "rgba(96, 165, 250, 0)");
        ctx.fillStyle = glow;
        ctx.fillRect(screenX - drop.size * 3, screenY - drop.size * 3, drop.size * 6, drop.size * 6);
        
        // Drop
        ctx.fillStyle = "#60a5fa";
        ctx.beginPath();
        ctx.ellipse(screenX, screenY, drop.size, drop.size * 1.5, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      
      // Ground
      ctx.fillStyle = "#334155";
      ctx.fillRect(0, h * 0.92, w, h * 0.08);
      
      // Puddles
      ctx.fillStyle = "rgba(96, 165, 250, 0.3)";
      ctx.beginPath();
      ctx.ellipse(w * 0.2, h * 0.95, 30, 5, 0, 0, Math.PI * 2);
      ctx.ellipse(w * 0.6, h * 0.94, 40, 6, 0, 0, Math.PI * 2);
      ctx.ellipse(w * 0.85, h * 0.96, 25, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      
      // Player
      const playerScreenX = (data.playerX / 100) * w;
      const playerScreenY = (playerY / 100) * h;
      
      // Umbrella
      ctx.fillStyle = "#f43f5e";
      ctx.beginPath();
      ctx.arc(playerScreenX, playerScreenY - 25, 20, Math.PI, 0);
      ctx.fill();
      
      ctx.strokeStyle = "#881337";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(playerScreenX, playerScreenY - 25);
      ctx.lineTo(playerScreenX, playerScreenY + 5);
      ctx.stroke();
      
      // Handle
      ctx.beginPath();
      ctx.arc(playerScreenX + 5, playerScreenY + 5, 5, 0, Math.PI);
      ctx.stroke();
      
      // Person
      ctx.fillStyle = "#fcd34d";
      ctx.beginPath();
      ctx.arc(playerScreenX, playerScreenY - 5, 6, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = "#3b82f6";
      ctx.fillRect(playerScreenX - 5, playerScreenY, 10, 12);
      
      animationId = requestAnimationFrame(gameLoop);
    };
    
    animationId = requestAnimationFrame(gameLoop);
    
    return () => cancelAnimationFrame(animationId);
  }, [gameState, endGame]);

  return (
    <Card className="border-blue-500/30 bg-gradient-to-b from-slate-700/80 to-slate-900/80 backdrop-blur">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-lg text-white">
          <span className="flex items-center gap-2">
            <span className="text-2xl">🌧️</span> Rain Dodge
          </span>
          <div className="flex gap-3 text-sm font-normal">
            <span className="bg-blue-500/30 px-2 py-0.5 rounded">{displayScore}s</span>
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
                <h3 className="text-xl font-bold mb-2">🌧️ Rain Dodge</h3>
                <p className="text-sm text-muted-foreground px-4">
                  Dodge the raindrops!<br />
                  Survive as long as you can.
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
                <p className="text-xl">Score: <span className="font-bold text-primary">{displayScore}</span></p>
                {displayScore >= highScore && displayScore > 0 && (
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
