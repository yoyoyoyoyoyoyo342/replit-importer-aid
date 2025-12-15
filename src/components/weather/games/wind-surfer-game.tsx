import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Play } from "lucide-react";

interface WindSurferGameProps {
  onGameEnd?: (score: number) => void;
  disabled?: boolean;
}

interface Obstacle {
  x: number;
  y: number;
  type: "tornado" | "debris";
  rotation: number;
}

export function WindSurferGame({ onGameEnd, disabled }: WindSurferGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<"idle" | "playing" | "gameOver">("idle");
  const [displayScore, setDisplayScore] = useState(0);
  const [displayWind, setDisplayWind] = useState("Calm");
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem("windSurferHighScore");
    return saved ? parseInt(saved, 10) : 0;
  });

  const gameDataRef = useRef({
    playerX: 50,
    playerY: 50,
    playerAngle: 0,
    obstacles: [] as Obstacle[],
    windDirection: 0,
    windStrength: 0,
    score: 0,
    lastTime: 0,
    scoreTimer: 0,
    spawnTimer: 0,
    windTimer: 0,
    difficulty: 1,
    waves: [] as { x: number; y: number; phase: number }[],
    splashes: [] as { x: number; y: number; life: number }[],
    keysPressed: new Set<string>(),
    touchX: null as number | null,
    touchY: null as number | null,
  });

  const startGame = useCallback(() => {
    if (disabled) return;
    const data = gameDataRef.current;
    data.playerX = 50;
    data.playerY = 50;
    data.playerAngle = 0;
    data.obstacles = [];
    data.windDirection = 0;
    data.windStrength = 0;
    data.score = 0;
    data.lastTime = 0;
    data.scoreTimer = 0;
    data.spawnTimer = 0;
    data.windTimer = 0;
    data.difficulty = 1;
    data.splashes = [];
    
    // Generate waves
    data.waves = [];
    for (let i = 0; i < 20; i++) {
      data.waves.push({
        x: Math.random() * 100,
        y: Math.random() * 100,
        phase: Math.random() * Math.PI * 2,
      });
    }
    
    setDisplayScore(0);
    setDisplayWind("Calm");
    setGameState("playing");
  }, [disabled]);

  const endGame = useCallback(() => {
    const data = gameDataRef.current;
    setDisplayScore(data.score);
    
    if (data.score > highScore) {
      setHighScore(data.score);
      localStorage.setItem("windSurferHighScore", data.score.toString());
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
    const touchY = e.touches[0].clientY - rect.top;
    gameDataRef.current.touchX = (touchX / rect.width) * 100;
    gameDataRef.current.touchY = (touchY / rect.height) * 100;
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
        if (data.score % 4 === 0) {
          data.difficulty = Math.min(10, data.difficulty + 1);
        }
      }
      
      // Change wind
      data.windTimer += deltaTime;
      if (data.windTimer >= 2500) {
        data.windDirection = (Math.random() - 0.5) * 2;
        data.windStrength = 0.5 + Math.random() * 0.5;
        
        if (Math.abs(data.windDirection) < 0.3) {
          setDisplayWind("Calm");
        } else if (data.windDirection < 0) {
          setDisplayWind("← Strong");
        } else {
          setDisplayWind("Strong →");
        }
        data.windTimer = 0;
      }
      
      // Handle input
      const moveSpeed = 0.35 * deltaTime / 16;
      if (data.keysPressed.has("ArrowLeft")) {
        data.playerX = Math.max(8, data.playerX - moveSpeed);
        data.playerAngle = -20;
      }
      if (data.keysPressed.has("ArrowRight")) {
        data.playerX = Math.min(92, data.playerX + moveSpeed);
        data.playerAngle = 20;
      }
      if (data.keysPressed.has("ArrowUp")) {
        data.playerY = Math.max(10, data.playerY - moveSpeed);
      }
      if (data.keysPressed.has("ArrowDown")) {
        data.playerY = Math.min(85, data.playerY + moveSpeed);
      }
      
      if (!data.keysPressed.has("ArrowLeft") && !data.keysPressed.has("ArrowRight")) {
        data.playerAngle *= 0.9;
      }
      
      if (data.touchX !== null && data.touchY !== null) {
        const diffX = data.touchX - data.playerX;
        const diffY = data.touchY - data.playerY;
        data.playerX += diffX * 0.1;
        data.playerY += diffY * 0.1;
        data.playerX = Math.max(8, Math.min(92, data.playerX));
        data.playerY = Math.max(10, Math.min(85, data.playerY));
        data.playerAngle = Math.max(-25, Math.min(25, diffX * 0.3));
      }
      
      // Apply wind
      const windForce = data.windDirection * data.windStrength * 0.015 * deltaTime;
      data.playerX += windForce;
      
      // Check boundaries
      if (data.playerX < 5 || data.playerX > 95) {
        endGame();
        return;
      }
      
      // Spawn obstacles
      data.spawnTimer += deltaTime;
      const spawnRate = Math.max(500, 1000 - data.difficulty * 50);
      if (data.spawnTimer >= spawnRate) {
        data.obstacles.push({
          x: Math.random() * 80 + 10,
          y: -10,
          type: Math.random() > 0.7 ? "tornado" : "debris",
          rotation: 0,
        });
        data.spawnTimer = 0;
      }
      
      // Update obstacles
      const speed = 0.04 + data.difficulty * 0.006;
      for (const obs of data.obstacles) {
        obs.y += speed * deltaTime;
        obs.rotation += (obs.type === "tornado" ? 0.1 : 0.02) * deltaTime;
      }
      
      // Check collisions
      for (const obs of data.obstacles) {
        const hitRadius = obs.type === "tornado" ? 10 : 7;
        if (
          Math.abs(obs.y - data.playerY) < hitRadius &&
          Math.abs(obs.x - data.playerX) < hitRadius
        ) {
          endGame();
          return;
        }
      }
      
      data.obstacles = data.obstacles.filter((o) => o.y < 110);
      
      // Add splashes
      if (Math.random() > 0.9) {
        data.splashes.push({
          x: data.playerX + (Math.random() - 0.5) * 10,
          y: data.playerY + 5,
          life: 1,
        });
      }
      
      // Update splashes
      for (const splash of data.splashes) {
        splash.life -= 0.02 * deltaTime / 16;
        splash.y -= 0.02 * deltaTime / 16;
      }
      data.splashes = data.splashes.filter((s) => s.life > 0);
      
      // Render
      const w = canvas.width;
      const h = canvas.height;
      
      // Ocean gradient
      const gradient = ctx.createLinearGradient(0, 0, 0, h);
      gradient.addColorStop(0, "#0ea5e9");
      gradient.addColorStop(0.5, "#0284c7");
      gradient.addColorStop(1, "#0369a1");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, w, h);
      
      // Waves
      ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
      for (const wave of data.waves) {
        const waveX = (wave.x / 100) * w;
        const waveY = ((wave.y + Math.sin(timestamp * 0.002 + wave.phase) * 3) / 100) * h;
        ctx.beginPath();
        ctx.ellipse(waveX, waveY, 30, 5, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      
      // Wind lines
      ctx.strokeStyle = `rgba(255, 255, 255, ${0.1 + data.windStrength * 0.2})`;
      ctx.lineWidth = 2;
      for (let i = 0; i < 6; i++) {
        const lineY = (i * 18 + (timestamp * 0.02 * data.windStrength) % 100) / 100 * h;
        const lineX = data.windDirection > 0 ? 0 : w;
        const lineEndX = data.windDirection > 0 ? w * 0.3 * data.windStrength : w - w * 0.3 * data.windStrength;
        
        ctx.beginPath();
        ctx.moveTo(lineX, lineY);
        ctx.lineTo(lineEndX, lineY + data.windDirection * 10);
        ctx.stroke();
      }
      
      // Splashes
      ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
      for (const splash of data.splashes) {
        ctx.globalAlpha = splash.life;
        ctx.beginPath();
        ctx.arc((splash.x / 100) * w, (splash.y / 100) * h, 3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      
      // Obstacles
      for (const obs of data.obstacles) {
        const screenX = (obs.x / 100) * w;
        const screenY = (obs.y / 100) * h;
        
        ctx.save();
        ctx.translate(screenX, screenY);
        ctx.rotate(obs.rotation);
        
        if (obs.type === "tornado") {
          // Tornado
          ctx.fillStyle = "#64748b";
          ctx.beginPath();
          ctx.moveTo(0, -20);
          ctx.bezierCurveTo(-15, -10, -10, 10, -5, 20);
          ctx.lineTo(5, 20);
          ctx.bezierCurveTo(10, 10, 15, -10, 0, -20);
          ctx.fill();
          
          // Swirl lines
          ctx.strokeStyle = "#94a3b8";
          ctx.lineWidth = 2;
          for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.arc(0, -10 + i * 10, 8 - i * 2, 0, Math.PI);
            ctx.stroke();
          }
        } else {
          // Debris/log
          ctx.fillStyle = "#78350f";
          ctx.beginPath();
          ctx.ellipse(0, 0, 15, 6, 0, 0, Math.PI * 2);
          ctx.fill();
          
          // Wood grain
          ctx.strokeStyle = "#451a03";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(-10, -2);
          ctx.lineTo(10, -2);
          ctx.moveTo(-8, 2);
          ctx.lineTo(8, 2);
          ctx.stroke();
        }
        
        ctx.restore();
      }
      
      // Player (surfer)
      const playerScreenX = (data.playerX / 100) * w;
      const playerScreenY = (data.playerY / 100) * h;
      
      ctx.save();
      ctx.translate(playerScreenX, playerScreenY);
      ctx.rotate((data.playerAngle * Math.PI) / 180);
      
      // Surfboard
      ctx.fillStyle = "#f97316";
      ctx.beginPath();
      ctx.ellipse(0, 8, 18, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      
      // Board stripe
      ctx.fillStyle = "#ea580c";
      ctx.beginPath();
      ctx.ellipse(0, 8, 12, 2, 0, 0, Math.PI * 2);
      ctx.fill();
      
      // Surfer body
      ctx.fillStyle = "#3b82f6";
      ctx.beginPath();
      ctx.arc(0, -5, 8, 0, Math.PI * 2);
      ctx.fill();
      
      // Head
      ctx.fillStyle = "#fcd34d";
      ctx.beginPath();
      ctx.arc(0, -16, 6, 0, Math.PI * 2);
      ctx.fill();
      
      // Hair
      ctx.fillStyle = "#1e293b";
      ctx.beginPath();
      ctx.arc(0, -19, 5, Math.PI, 0);
      ctx.fill();
      
      // Arms (balance pose)
      ctx.strokeStyle = "#fcd34d";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-6, -8);
      ctx.lineTo(-15, -15);
      ctx.moveTo(6, -8);
      ctx.lineTo(15, -15);
      ctx.stroke();
      
      ctx.restore();
      
      animationId = requestAnimationFrame(gameLoop);
    };
    
    animationId = requestAnimationFrame(gameLoop);
    
    return () => cancelAnimationFrame(animationId);
  }, [gameState, endGame]);

  return (
    <Card className="border-teal-500/30 bg-gradient-to-b from-cyan-400/80 to-blue-500/80 backdrop-blur dark:from-cyan-900/80 dark:to-blue-950/80">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-lg text-white">
          <span className="flex items-center gap-2">
            <span className="text-2xl">🏄</span> Wind Surfer
          </span>
          <div className="flex gap-3 text-sm font-normal">
            <span className="bg-cyan-500/30 px-2 py-0.5 rounded">{displayWind}</span>
            <span className="bg-white/20 px-2 py-0.5 rounded">{displayScore}s</span>
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
            onTouchEnd={() => { 
              gameDataRef.current.touchX = null; 
              gameDataRef.current.touchY = null; 
            }}
          />
          
          {gameState === "idle" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-background/90 backdrop-blur-sm">
              <div className="text-center">
                <h3 className="text-xl font-bold mb-2">🏄 Wind Surfer</h3>
                <p className="text-sm text-muted-foreground px-4">
                  Surf the waves, fight the wind!<br />
                  Don't get pushed off screen.
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
