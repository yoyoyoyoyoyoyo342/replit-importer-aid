import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Play } from "lucide-react";

interface LightningDodgeGameProps {
  onGameEnd?: (score: number) => void;
  disabled?: boolean;
}

interface Warning {
  id: number;
  x: number;
  countdown: number;
  width: number;
}

interface Strike {
  id: number;
  x: number;
  width: number;
  opacity: number;
  segments: { x: number; y: number }[];
}

export function LightningDodgeGame({ onGameEnd, disabled }: LightningDodgeGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<"idle" | "playing" | "gameOver">("idle");
  const [displayScore, setDisplayScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem("lightningDodgeHighScore");
    return saved ? parseInt(saved, 10) : 0;
  });

  const gameDataRef = useRef({
    playerX: 50,
    warnings: [] as Warning[],
    strikes: [] as Strike[],
    warningIdCounter: 0,
    score: 0,
    startTime: 0,
    spawnTimer: 0,
    difficulty: 1,
    flashIntensity: 0,
    keysPressed: new Set<string>(),
    touchX: null as number | null,
  });

  const generateLightningPath = (x: number, height: number): { x: number; y: number }[] => {
    const segments: { x: number; y: number }[] = [];
    let currentX = x;
    let currentY = 0;
    const segmentCount = 8 + Math.floor(Math.random() * 4);
    
    for (let i = 0; i <= segmentCount; i++) {
      segments.push({ x: currentX, y: currentY });
      currentX += (Math.random() - 0.5) * 15;
      currentY = (i / segmentCount) * height;
    }
    
    return segments;
  };

  const startGame = useCallback(() => {
    if (disabled) return;
    const data = gameDataRef.current;
    data.playerX = 50;
    data.warnings = [];
    data.strikes = [];
    data.warningIdCounter = 0;
    data.score = 0;
    data.startTime = Date.now();
    data.spawnTimer = 0;
    data.difficulty = 1;
    data.flashIntensity = 0;
    
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
      localStorage.setItem("lightningDodgeHighScore", elapsedSeconds.toString());
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
        if (elapsedSeconds % 5 === 0) {
          data.difficulty = Math.min(8, data.difficulty + 1);
        }
      }
      
      // Handle input
      const moveSpeed = 0.6 * deltaTime / 16;
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
      
      // Spawn warnings
      data.spawnTimer += deltaTime;
      const spawnRate = Math.max(800, 2000 - data.difficulty * 150);
      if (data.spawnTimer >= spawnRate) {
        data.warnings.push({
          id: data.warningIdCounter++,
          x: Math.random() * 80 + 10,
          countdown: 1200,
          width: 10 + Math.random() * 8,
        });
        data.spawnTimer = 0;
      }
      
      // Update warnings and create strikes
      const newWarnings: Warning[] = [];
      for (const warning of data.warnings) {
        warning.countdown -= deltaTime;
        
        if (warning.countdown <= 0) {
          // Create lightning strike
          data.strikes.push({
            id: warning.id,
            x: warning.x,
            width: warning.width,
            opacity: 1,
            segments: generateLightningPath(warning.x, 100),
          });
          data.flashIntensity = 0.8;
          
          // Check collision
          if (Math.abs(warning.x - data.playerX) < warning.width / 2 + 6) {
            endGame();
            return;
          }
        } else {
          newWarnings.push(warning);
        }
      }
      data.warnings = newWarnings;
      
      // Update strikes
      for (const strike of data.strikes) {
        strike.opacity -= deltaTime * 0.004;
      }
      data.strikes = data.strikes.filter((s) => s.opacity > 0);
      
      // Fade flash
      data.flashIntensity *= 0.9;
      
      // Render
      const w = canvas.width;
      const h = canvas.height;
      
      // Storm background
      const gradient = ctx.createLinearGradient(0, 0, 0, h);
      gradient.addColorStop(0, "#1e1b4b");
      gradient.addColorStop(0.5, "#312e81");
      gradient.addColorStop(1, "#1e1b4b");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, w, h);
      
      // Storm clouds
      ctx.fillStyle = "#0f172a";
      for (let i = 0; i < 5; i++) {
        const cloudX = (i * 25 + timestamp * 0.01) % 130 - 15;
        ctx.beginPath();
        ctx.ellipse((cloudX / 100) * w, 30, 60, 25, 0, 0, Math.PI * 2);
        ctx.ellipse((cloudX / 100) * w + 40, 35, 50, 20, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      
      // Warning zones
      for (const warning of data.warnings) {
        const screenX = (warning.x / 100) * w;
        const zoneWidth = (warning.width / 100) * w;
        const intensity = 1 - warning.countdown / 1200;
        
        // Pulsing danger zone
        ctx.fillStyle = `rgba(251, 191, 36, ${0.1 + intensity * 0.3 + Math.sin(timestamp * 0.01) * 0.1})`;
        ctx.fillRect(screenX - zoneWidth / 2, 0, zoneWidth, h);
        
        // Warning indicator
        ctx.fillStyle = `rgba(251, 191, 36, ${intensity})`;
        ctx.font = "bold 16px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("⚠️", screenX, 50);
      }
      
      // Lightning strikes
      for (const strike of data.strikes) {
        ctx.strokeStyle = `rgba(253, 224, 71, ${strike.opacity})`;
        ctx.lineWidth = 4;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        
        // Main bolt
        ctx.beginPath();
        for (let i = 0; i < strike.segments.length; i++) {
          const seg = strike.segments[i];
          const screenX = (seg.x / 100) * w;
          const screenY = (seg.y / 100) * h;
          if (i === 0) ctx.moveTo(screenX, screenY);
          else ctx.lineTo(screenX, screenY);
        }
        ctx.stroke();
        
        // Glow
        ctx.strokeStyle = `rgba(253, 224, 71, ${strike.opacity * 0.3})`;
        ctx.lineWidth = 12;
        ctx.stroke();
        
        // Branches
        ctx.strokeStyle = `rgba(253, 224, 71, ${strike.opacity * 0.6})`;
        ctx.lineWidth = 2;
        for (let i = 2; i < strike.segments.length - 1; i += 2) {
          if (Math.random() > 0.5) {
            const seg = strike.segments[i];
            ctx.beginPath();
            ctx.moveTo((seg.x / 100) * w, (seg.y / 100) * h);
            ctx.lineTo((seg.x / 100) * w + (Math.random() - 0.5) * 30, (seg.y / 100) * h + 15);
            ctx.stroke();
          }
        }
      }
      
      // Flash overlay
      if (data.flashIntensity > 0.01) {
        ctx.fillStyle = `rgba(253, 224, 71, ${data.flashIntensity * 0.3})`;
        ctx.fillRect(0, 0, w, h);
      }
      
      // Ground
      ctx.fillStyle = "#334155";
      ctx.fillRect(0, h * 0.88, w, h * 0.12);
      
      // Player
      const playerScreenX = (data.playerX / 100) * w;
      const playerScreenY = h * 0.85;
      
      // Person body
      ctx.fillStyle = "#3b82f6";
      ctx.beginPath();
      ctx.arc(playerScreenX, playerScreenY - 8, 8, 0, Math.PI * 2);
      ctx.fill();
      
      // Head
      ctx.fillStyle = "#fcd34d";
      ctx.beginPath();
      ctx.arc(playerScreenX, playerScreenY - 20, 6, 0, Math.PI * 2);
      ctx.fill();
      
      // Running legs
      const legOffset = Math.sin(timestamp * 0.01) * 4;
      ctx.strokeStyle = "#1e40af";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(playerScreenX - 3, playerScreenY);
      ctx.lineTo(playerScreenX - 3 - legOffset, playerScreenY + 10);
      ctx.moveTo(playerScreenX + 3, playerScreenY);
      ctx.lineTo(playerScreenX + 3 + legOffset, playerScreenY + 10);
      ctx.stroke();
      
      animationId = requestAnimationFrame(gameLoop);
    };
    
    animationId = requestAnimationFrame(gameLoop);
    
    return () => cancelAnimationFrame(animationId);
  }, [gameState, endGame]);

  return (
    <Card className="border-yellow-500/30 bg-gradient-to-b from-indigo-950/80 to-purple-950/80 backdrop-blur">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-lg text-white">
          <span className="flex items-center gap-2">
            <span className="text-2xl">⚡</span> Lightning Dodge
          </span>
          <div className="flex gap-3 text-sm font-normal">
            <span className="bg-yellow-500/30 px-2 py-0.5 rounded">{displayScore}s</span>
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
                <h3 className="text-xl font-bold mb-2">⚡ Lightning Dodge</h3>
                <p className="text-sm text-muted-foreground px-4">
                  Avoid the lightning strikes!<br />
                  Watch for warning zones.
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
