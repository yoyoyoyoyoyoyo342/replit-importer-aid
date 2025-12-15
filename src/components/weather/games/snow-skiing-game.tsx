import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Play } from "lucide-react";

interface SnowSkiingGameProps {
  onGameEnd?: (score: number) => void;
  disabled?: boolean;
}

interface Obstacle {
  x: number;
  y: number;
  type: "tree" | "rock";
  size: number;
}

export function SnowSkiingGame({ onGameEnd, disabled }: SnowSkiingGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<"idle" | "playing" | "gameOver">("idle");
  const [displayScore, setDisplayScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem("snowSkiingHighScore");
    return saved ? parseInt(saved, 10) : 0;
  });

  const gameDataRef = useRef({
    skierX: 50,
    skierAngle: 0,
    obstacles: [] as Obstacle[],
    score: 0,
    startTime: 0,
    spawnTimer: 0,
    speed: 0.08,
    snowflakes: [] as { x: number; y: number; size: number; speed: number }[],
    trails: [] as { x: number; y: number; opacity: number }[],
    keysPressed: new Set<string>(),
    touchX: null as number | null,
  });

  const startGame = useCallback(() => {
    if (disabled) return;
    const data = gameDataRef.current;
    data.skierX = 50;
    data.skierAngle = 0;
    data.obstacles = [];
    data.score = 0;
    data.startTime = Date.now();
    data.spawnTimer = 0;
    data.speed = 0.08;
    data.trails = [];
    
    // Snowflakes
    data.snowflakes = [];
    for (let i = 0; i < 60; i++) {
      data.snowflakes.push({
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: 1 + Math.random() * 2,
        speed: 0.05 + Math.random() * 0.05,
      });
    }
    
    setDisplayScore(0);
    setGameState("playing");
  }, [disabled]);

  const endGame = useCallback(() => {
    const data = gameDataRef.current;
    const elapsedSeconds = Math.floor((Date.now() - data.startTime) / 1000);
    data.score = elapsedSeconds;
    setDisplayScore(elapsedSeconds);
    
    if (elapsedSeconds > highScore) {
      setHighScore(elapsedSeconds);
      localStorage.setItem("snowSkiingHighScore", elapsedSeconds.toString());
    }
    
    setGameState("gameOver");
    onGameEnd?.(elapsedSeconds);
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
    
    let lastFrameTime = performance.now();
    
    const gameLoop = (timestamp: number) => {
      const deltaTime = Math.min(timestamp - lastFrameTime, 32);
      lastFrameTime = timestamp;
      
      // Update score based on elapsed time
      const elapsedSeconds = Math.floor((Date.now() - data.startTime) / 1000);
      if (elapsedSeconds !== data.score) {
        data.score = elapsedSeconds;
        setDisplayScore(elapsedSeconds);
        data.speed = Math.min(0.2, 0.08 + elapsedSeconds * 0.005);
      }
      
      // Handle input
      const moveSpeed = 0.4 * deltaTime / 16;
      if (data.keysPressed.has("ArrowLeft")) {
        data.skierX = Math.max(8, data.skierX - moveSpeed);
        data.skierAngle = -15;
      } else if (data.keysPressed.has("ArrowRight")) {
        data.skierX = Math.min(92, data.skierX + moveSpeed);
        data.skierAngle = 15;
      } else {
        data.skierAngle *= 0.9;
      }
      
      if (data.touchX !== null) {
        const diff = data.touchX - data.skierX;
        data.skierX += diff * 0.15;
        data.skierX = Math.max(8, Math.min(92, data.skierX));
        data.skierAngle = Math.max(-20, Math.min(20, diff * 0.5));
      }
      
      // Add ski trail
      if (Math.random() > 0.7) {
        data.trails.push({ x: data.skierX - 2, y: 78, opacity: 0.6 });
        data.trails.push({ x: data.skierX + 2, y: 78, opacity: 0.6 });
      }
      
      // Spawn obstacles
      data.spawnTimer += deltaTime;
      const spawnRate = Math.max(400, 800 - data.score * 20);
      if (data.spawnTimer >= spawnRate) {
        data.obstacles.push({
          x: Math.random() * 80 + 10,
          y: -10,
          type: Math.random() > 0.4 ? "tree" : "rock",
          size: 0.8 + Math.random() * 0.4,
        });
        data.spawnTimer = 0;
      }
      
      // Update obstacles
      for (const obs of data.obstacles) {
        obs.y += data.speed * deltaTime;
      }
      
      // Update trails
      for (const trail of data.trails) {
        trail.y += data.speed * deltaTime * 0.8;
        trail.opacity -= 0.01;
      }
      data.trails = data.trails.filter((t) => t.opacity > 0 && t.y < 100);
      
      // Check collisions
      const skierY = 80;
      for (const obs of data.obstacles) {
        const hitRadius = obs.type === "tree" ? 6 : 5;
        if (
          Math.abs(obs.y - skierY) < 8 &&
          Math.abs(obs.x - data.skierX) < hitRadius
        ) {
          endGame();
          return;
        }
      }
      
      // Remove off-screen obstacles
      data.obstacles = data.obstacles.filter((o) => o.y < 110);
      
      // Update snowflakes
      for (const flake of data.snowflakes) {
        flake.y += flake.speed * deltaTime;
        flake.x += Math.sin(timestamp * 0.001 + flake.y) * 0.02;
        if (flake.y > 100) {
          flake.y = -5;
          flake.x = Math.random() * 100;
        }
      }
      
      // Render
      const w = canvas.width;
      const h = canvas.height;
      
      // Snow gradient
      const gradient = ctx.createLinearGradient(0, 0, 0, h);
      gradient.addColorStop(0, "#e0f2fe");
      gradient.addColorStop(1, "#f8fafc");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, w, h);
      
      // Ski trails
      ctx.fillStyle = "rgba(203, 213, 225, 0.5)";
      for (const trail of data.trails) {
        ctx.globalAlpha = trail.opacity;
        ctx.beginPath();
        ctx.ellipse((trail.x / 100) * w, (trail.y / 100) * h, 2, 8, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      
      // Obstacles
      for (const obs of data.obstacles) {
        const screenX = (obs.x / 100) * w;
        const screenY = (obs.y / 100) * h;
        const scale = obs.size;
        
        if (obs.type === "tree") {
          // Shadow
          ctx.fillStyle = "rgba(0,0,0,0.1)";
          ctx.beginPath();
          ctx.ellipse(screenX + 5, screenY + 20 * scale, 12 * scale, 4, 0, 0, Math.PI * 2);
          ctx.fill();
          
          // Trunk
          ctx.fillStyle = "#78350f";
          ctx.fillRect(screenX - 3, screenY + 5 * scale, 6, 15 * scale);
          
          // Tree layers
          ctx.fillStyle = "#166534";
          ctx.beginPath();
          ctx.moveTo(screenX, screenY - 25 * scale);
          ctx.lineTo(screenX - 15 * scale, screenY);
          ctx.lineTo(screenX + 15 * scale, screenY);
          ctx.fill();
          
          ctx.fillStyle = "#15803d";
          ctx.beginPath();
          ctx.moveTo(screenX, screenY - 35 * scale);
          ctx.lineTo(screenX - 12 * scale, screenY - 10 * scale);
          ctx.lineTo(screenX + 12 * scale, screenY - 10 * scale);
          ctx.fill();
          
          // Snow on tree
          ctx.fillStyle = "#fff";
          ctx.beginPath();
          ctx.ellipse(screenX, screenY - 30 * scale, 5, 3, 0, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Shadow
          ctx.fillStyle = "rgba(0,0,0,0.1)";
          ctx.beginPath();
          ctx.ellipse(screenX + 3, screenY + 8 * scale, 10 * scale, 4, 0, 0, Math.PI * 2);
          ctx.fill();
          
          // Rock
          ctx.fillStyle = "#64748b";
          ctx.beginPath();
          ctx.ellipse(screenX, screenY, 10 * scale, 7 * scale, 0, 0, Math.PI * 2);
          ctx.fill();
          
          ctx.fillStyle = "#94a3b8";
          ctx.beginPath();
          ctx.ellipse(screenX - 2, screenY - 2, 6 * scale, 4 * scale, -0.3, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      
      // Skier
      const skierScreenX = (data.skierX / 100) * w;
      const skierScreenY = (skierY / 100) * h;
      
      ctx.save();
      ctx.translate(skierScreenX, skierScreenY);
      ctx.rotate((data.skierAngle * Math.PI) / 180);
      
      // Skis
      ctx.fillStyle = "#1d4ed8";
      ctx.fillRect(-12, 8, 24, 4);
      
      // Body
      ctx.fillStyle = "#ef4444";
      ctx.beginPath();
      ctx.arc(0, -5, 8, 0, Math.PI * 2);
      ctx.fill();
      
      // Head
      ctx.fillStyle = "#fcd34d";
      ctx.beginPath();
      ctx.arc(0, -16, 6, 0, Math.PI * 2);
      ctx.fill();
      
      // Goggles
      ctx.fillStyle = "#1e293b";
      ctx.fillRect(-5, -18, 10, 3);
      
      // Poles
      ctx.strokeStyle = "#71717a";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-8, -2);
      ctx.lineTo(-15, 10);
      ctx.moveTo(8, -2);
      ctx.lineTo(15, 10);
      ctx.stroke();
      
      ctx.restore();
      
      // Snowflakes
      ctx.fillStyle = "#fff";
      for (const flake of data.snowflakes) {
        ctx.beginPath();
        ctx.arc((flake.x / 100) * w, (flake.y / 100) * h, flake.size, 0, Math.PI * 2);
        ctx.fill();
      }
      
      animationId = requestAnimationFrame(gameLoop);
    };
    
    animationId = requestAnimationFrame(gameLoop);
    
    return () => cancelAnimationFrame(animationId);
  }, [gameState, endGame]);

  return (
    <Card className="border-sky-400/30 bg-gradient-to-b from-sky-100/80 to-white/80 backdrop-blur dark:from-sky-950/80 dark:to-background/80">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-lg">
          <span className="flex items-center gap-2">
            <span className="text-2xl">⛷️</span> Snow Skiing
          </span>
          <div className="flex gap-3 text-sm font-normal">
            <span className="bg-sky-500/20 px-2 py-0.5 rounded">{displayScore}s</span>
            <span className="text-muted-foreground">Best: {highScore}</span>
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
                <h3 className="text-xl font-bold mb-2">⛷️ Snow Skiing</h3>
                <p className="text-sm text-muted-foreground px-4">
                  Ski down the mountain!<br />
                  Avoid trees and rocks.
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
