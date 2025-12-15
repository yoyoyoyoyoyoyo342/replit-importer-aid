import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Play } from "lucide-react";

interface SunshineCollectorGameProps {
  onGameEnd?: (score: number) => void;
  disabled?: boolean;
}

interface Sunray {
  x: number;
  y: number;
  size: number;
  rotation: number;
}

interface Cloud {
  x: number;
  y: number;
  size: number;
  speed: number;
}

export function SunshineCollectorGame({ onGameEnd, disabled }: SunshineCollectorGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<"idle" | "playing" | "gameOver">("idle");
  const [displayScore, setDisplayScore] = useState(0);
  const [displayBonus, setDisplayBonus] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem("sunshineCollectorHighScore");
    return saved ? parseInt(saved, 10) : 0;
  });

  const gameDataRef = useRef({
    playerX: 50,
    sunrays: [] as Sunray[],
    clouds: [] as Cloud[],
    score: 0,
    bonus: 0,
    lastTime: 0,
    scoreTimer: 0,
    sunTimer: 0,
    cloudTimer: 0,
    difficulty: 1,
    keysPressed: new Set<string>(),
    touchX: null as number | null,
    particles: [] as { x: number; y: number; vx: number; vy: number; life: number; color: string }[],
  });

  const startGame = useCallback(() => {
    if (disabled) return;
    const data = gameDataRef.current;
    data.playerX = 50;
    data.sunrays = [];
    data.clouds = [];
    data.score = 0;
    data.bonus = 0;
    data.lastTime = 0;
    data.scoreTimer = 0;
    data.sunTimer = 0;
    data.cloudTimer = 0;
    data.difficulty = 1;
    data.particles = [];
    
    setDisplayScore(0);
    setDisplayBonus(0);
    setGameState("playing");
  }, [disabled]);

  const endGame = useCallback(() => {
    const data = gameDataRef.current;
    const totalScore = data.score + data.bonus;
    setDisplayScore(data.score);
    setDisplayBonus(data.bonus);
    
    if (totalScore > highScore) {
      setHighScore(totalScore);
      localStorage.setItem("sunshineCollectorHighScore", totalScore.toString());
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
        data.score += 1;
        setDisplayScore(data.score);
        data.scoreTimer = 0;
        if (data.score % 5 === 0) {
          data.difficulty = Math.min(8, data.difficulty + 1);
        }
      }
      
      // Handle input
      const moveSpeed = 0.5 * deltaTime / 16;
      if (data.keysPressed.has("ArrowLeft")) {
        data.playerX = Math.max(10, data.playerX - moveSpeed);
      }
      if (data.keysPressed.has("ArrowRight")) {
        data.playerX = Math.min(90, data.playerX + moveSpeed);
      }
      if (data.touchX !== null) {
        const diff = data.touchX - data.playerX;
        data.playerX += diff * 0.2;
        data.playerX = Math.max(10, Math.min(90, data.playerX));
      }
      
      // Spawn sunrays
      data.sunTimer += deltaTime;
      if (data.sunTimer >= 600) {
        data.sunrays.push({
          x: Math.random() * 80 + 10,
          y: -5,
          size: 10 + Math.random() * 6,
          rotation: Math.random() * Math.PI * 2,
        });
        data.sunTimer = 0;
      }
      
      // Spawn clouds
      data.cloudTimer += deltaTime;
      const cloudRate = Math.max(800, 1500 - data.difficulty * 80);
      if (data.cloudTimer >= cloudRate) {
        data.clouds.push({
          x: Math.random() * 80 + 10,
          y: -10,
          size: 20 + Math.random() * 15,
          speed: 0.04 + data.difficulty * 0.008,
        });
        data.cloudTimer = 0;
      }
      
      // Update sunrays
      const playerY = 82;
      const newSunrays: Sunray[] = [];
      for (const ray of data.sunrays) {
        ray.y += 0.05 * deltaTime;
        ray.rotation += 0.002 * deltaTime;
        
        // Check collection
        if (ray.y >= playerY - 8 && ray.y <= playerY + 8 && Math.abs(ray.x - data.playerX) < 12) {
          data.bonus += 1;
          setDisplayBonus(data.bonus);
          
          // Spawn particles
          for (let i = 0; i < 8; i++) {
            data.particles.push({
              x: ray.x,
              y: ray.y,
              vx: (Math.random() - 0.5) * 0.3,
              vy: -Math.random() * 0.2,
              life: 1,
              color: Math.random() > 0.5 ? "#fbbf24" : "#fcd34d",
            });
          }
          continue;
        }
        
        if (ray.y < 105) {
          newSunrays.push(ray);
        }
      }
      data.sunrays = newSunrays;
      
      // Update clouds
      for (const cloud of data.clouds) {
        cloud.y += cloud.speed * deltaTime;
      }
      
      // Check cloud collision
      for (const cloud of data.clouds) {
        if (
          cloud.y >= playerY - 10 &&
          cloud.y <= playerY + 10 &&
          Math.abs(cloud.x - data.playerX) < cloud.size / 2 + 8
        ) {
          endGame();
          return;
        }
      }
      
      data.clouds = data.clouds.filter((c) => c.y < 110);
      
      // Update particles
      for (const particle of data.particles) {
        particle.x += particle.vx * deltaTime;
        particle.y += particle.vy * deltaTime;
        particle.vy += 0.001 * deltaTime;
        particle.life -= 0.003 * deltaTime;
      }
      data.particles = data.particles.filter((p) => p.life > 0);
      
      // Render
      const w = canvas.width;
      const h = canvas.height;
      
      // Sky gradient
      const gradient = ctx.createLinearGradient(0, 0, 0, h);
      gradient.addColorStop(0, "#fef3c7");
      gradient.addColorStop(0.5, "#fde68a");
      gradient.addColorStop(1, "#92400e");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, w, h);
      
      // Sun
      const sunGlow = ctx.createRadialGradient(w * 0.85, 30, 0, w * 0.85, 30, 80);
      sunGlow.addColorStop(0, "rgba(251, 191, 36, 0.8)");
      sunGlow.addColorStop(0.5, "rgba(251, 191, 36, 0.2)");
      sunGlow.addColorStop(1, "rgba(251, 191, 36, 0)");
      ctx.fillStyle = sunGlow;
      ctx.fillRect(w * 0.5, 0, w * 0.5, 120);
      
      ctx.fillStyle = "#fbbf24";
      ctx.beginPath();
      ctx.arc(w * 0.85, 30, 25, 0, Math.PI * 2);
      ctx.fill();
      
      // Sunrays (falling)
      for (const ray of data.sunrays) {
        const screenX = (ray.x / 100) * w;
        const screenY = (ray.y / 100) * h;
        
        ctx.save();
        ctx.translate(screenX, screenY);
        ctx.rotate(ray.rotation);
        
        // Glow
        const rayGlow = ctx.createRadialGradient(0, 0, 0, 0, 0, ray.size * 2);
        rayGlow.addColorStop(0, "rgba(251, 191, 36, 0.6)");
        rayGlow.addColorStop(1, "rgba(251, 191, 36, 0)");
        ctx.fillStyle = rayGlow;
        ctx.beginPath();
        ctx.arc(0, 0, ray.size * 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Star shape
        ctx.fillStyle = "#fbbf24";
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
          const angle = (i / 8) * Math.PI * 2;
          const r = i % 2 === 0 ? ray.size : ray.size * 0.5;
          const x = Math.cos(angle) * r;
          const y = Math.sin(angle) * r;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
        
        ctx.restore();
      }
      
      // Clouds
      for (const cloud of data.clouds) {
        const screenX = (cloud.x / 100) * w;
        const screenY = (cloud.y / 100) * h;
        
        // Shadow
        ctx.fillStyle = "rgba(0,0,0,0.1)";
        ctx.beginPath();
        ctx.ellipse(screenX + 3, screenY + 5, cloud.size * 0.8, cloud.size * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Cloud body
        ctx.fillStyle = "#94a3b8";
        ctx.beginPath();
        ctx.ellipse(screenX - cloud.size * 0.3, screenY, cloud.size * 0.4, cloud.size * 0.35, 0, 0, Math.PI * 2);
        ctx.ellipse(screenX, screenY - cloud.size * 0.15, cloud.size * 0.5, cloud.size * 0.4, 0, 0, Math.PI * 2);
        ctx.ellipse(screenX + cloud.size * 0.3, screenY, cloud.size * 0.4, cloud.size * 0.35, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Highlight
        ctx.fillStyle = "#cbd5e1";
        ctx.beginPath();
        ctx.ellipse(screenX - cloud.size * 0.1, screenY - cloud.size * 0.2, cloud.size * 0.25, cloud.size * 0.15, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      
      // Particles
      for (const particle of data.particles) {
        ctx.globalAlpha = particle.life;
        ctx.fillStyle = particle.color;
        ctx.beginPath();
        ctx.arc((particle.x / 100) * w, (particle.y / 100) * h, 4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      
      // Ground
      ctx.fillStyle = "#65a30d";
      ctx.fillRect(0, h * 0.88, w, h * 0.12);
      
      // Grass details
      ctx.strokeStyle = "#84cc16";
      ctx.lineWidth = 2;
      for (let i = 0; i < 30; i++) {
        const grassX = (i / 30) * w + Math.sin(timestamp * 0.002 + i) * 2;
        ctx.beginPath();
        ctx.moveTo(grassX, h * 0.88);
        ctx.quadraticCurveTo(grassX + 3, h * 0.85, grassX + Math.sin(timestamp * 0.003 + i) * 3, h * 0.82);
        ctx.stroke();
      }
      
      // Player (basket)
      const playerScreenX = (data.playerX / 100) * w;
      const playerScreenY = (playerY / 100) * h;
      
      // Basket
      ctx.fillStyle = "#92400e";
      ctx.beginPath();
      ctx.moveTo(playerScreenX - 15, playerScreenY - 5);
      ctx.lineTo(playerScreenX - 12, playerScreenY + 10);
      ctx.lineTo(playerScreenX + 12, playerScreenY + 10);
      ctx.lineTo(playerScreenX + 15, playerScreenY - 5);
      ctx.closePath();
      ctx.fill();
      
      // Basket rim
      ctx.strokeStyle = "#78350f";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(playerScreenX, playerScreenY - 5, 15, 4, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = "#a16207";
      ctx.fill();
      
      // Basket weave pattern
      ctx.strokeStyle = "#78350f";
      ctx.lineWidth = 1;
      for (let i = -10; i <= 10; i += 5) {
        ctx.beginPath();
        ctx.moveTo(playerScreenX + i, playerScreenY - 3);
        ctx.lineTo(playerScreenX + i * 0.8, playerScreenY + 8);
        ctx.stroke();
      }
      
      animationId = requestAnimationFrame(gameLoop);
    };
    
    animationId = requestAnimationFrame(gameLoop);
    
    return () => cancelAnimationFrame(animationId);
  }, [gameState, endGame]);

  const totalScore = displayScore + displayBonus;

  return (
    <Card className="border-yellow-400/30 bg-gradient-to-b from-amber-200/80 to-orange-300/80 backdrop-blur dark:from-amber-900/80 dark:to-orange-950/80">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-lg">
          <span className="flex items-center gap-2">
            <span className="text-2xl">☀️</span> Sunshine Collector
          </span>
          <div className="flex gap-3 text-sm font-normal">
            <span className="bg-amber-500/20 px-2 py-0.5 rounded">{displayScore}s</span>
            <span className="bg-yellow-400/30 px-2 py-0.5 rounded">☀️ {displayBonus}</span>
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
                <h3 className="text-xl font-bold mb-2">☀️ Sunshine Collector</h3>
                <p className="text-sm text-muted-foreground px-4">
                  Collect sunrays, avoid clouds!<br />
                  1 point/second + 1 per sunray.
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
                <p className="text-xl">{displayScore}s + ☀️{displayBonus} = <span className="font-bold text-primary">{totalScore}</span></p>
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
