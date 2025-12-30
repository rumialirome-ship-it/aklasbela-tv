
import React, { useState, useEffect, useRef, useMemo } from 'react';

interface ResultRevealOverlayProps {
  gameName: string;
  winningNumber: string;
  onClose: () => void;
}

interface BallState {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  label: string;
  color: string;
}

const REVEAL_DURATION = 40000; // 40 seconds as requested

const ResultRevealOverlay: React.FC<ResultRevealOverlayProps> = ({ gameName, winningNumber, onClose }) => {
  const [phase, setPhase] = useState<'IDLE' | 'PORTAL' | 'REVEAL'>('PORTAL');
  const [progress, setProgress] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Fix: animationRef was initialized without an argument, but useRef<number> expects an initial value in some TypeScript environments.
  const animationRef = useRef<number>(0);
  const startTimeRef = useRef<number>(Date.now());

  // Initialize 100 balls
  const balls = useMemo(() => {
    const arr: BallState[] = [];
    const colors = ['#e11d48', '#be123c', '#9f1239', '#881337', '#fb7185', '#f43f5e'];
    for (let i = 0; i < 100; i++) {
      arr.push({
        id: i,
        x: Math.random() * 400,
        y: Math.random() * 400,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4,
        radius: 18,
        label: i.toString().padStart(2, '0'),
        color: colors[i % colors.length]
      });
    }
    return arr;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || phase !== 'PORTAL') return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const update = () => {
      const now = Date.now();
      const elapsed = now - startTimeRef.current;
      const t = Math.min(elapsed / REVEAL_DURATION, 1);
      setProgress(t * 100);

      if (t >= 1) {
        setPhase('REVEAL');
        return;
      }

      // Acceleration logic: motion starts slow and gets very fast
      const speedMultiplier = 1 + (t * 15); // Accelerates over time

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      balls.forEach(ball => {
        ball.x += ball.vx * speedMultiplier;
        ball.y += ball.vy * speedMultiplier;

        // Bounce off circular boundary
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const dist = Math.sqrt((ball.x - centerX) ** 2 + (ball.y - centerY) ** 2);
        const maxDist = canvas.width / 2 - ball.radius;

        if (dist > maxDist) {
          const angle = Math.atan2(ball.y - centerY, ball.x - centerX);
          ball.x = centerX + Math.cos(angle) * maxDist;
          ball.y = centerY + Math.sin(angle) * maxDist;

          // Reflect velocity
          const nx = Math.cos(angle);
          const ny = Math.sin(angle);
          const dot = ball.vx * nx + ball.vy * ny;
          ball.vx -= 2 * dot * nx;
          ball.vy -= 2 * dot * ny;
        }

        // Draw Ball
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        ctx.fillStyle = ball.color;
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'white';
        ctx.stroke();

        ctx.fillStyle = 'white';
        ctx.font = 'bold 12px Russo One';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(ball.label, ball.x, ball.y);
      });

      animationRef.current = requestAnimationFrame(update);
    };

    update();
    return () => cancelAnimationFrame(animationRef.current!);
  }, [phase, balls]);

  return (
    <div className="fixed inset-0 z-[1000] bg-black/95 flex flex-col items-center justify-center p-4">
      {/* Game Header */}
      <div className="absolute top-10 text-center animate-fade-in">
        <h1 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter mb-2">
          {gameName}
        </h1>
        <p className="text-evening-red-400 font-bold tracking-[0.5em] uppercase text-xs">
          Terminal Result Decryption
        </p>
      </div>

      {phase === 'PORTAL' && (
        <div className="flex flex-col items-center gap-12">
          <div className="portal-container animate-portal-pulse">
            <div className="vortex-bg"></div>
            <canvas 
              ref={canvasRef} 
              width={600} 
              height={600} 
              className="w-full h-full relative z-10"
            />
          </div>
          
          {/* Progress / Tension Bar */}
          <div className="w-full max-w-md space-y-3">
             <div className="flex justify-between text-[10px] font-black text-rose-300 uppercase tracking-widest">
                <span>Synchronizing...</span>
                <span>{Math.floor(progress)}%</span>
             </div>
             <div className="h-1.5 w-full bg-rose-950 rounded-full overflow-hidden border border-rose-900/30">
                <div 
                  className="h-full bg-gradient-to-r from-evening-red-600 to-rose-400 transition-all duration-100 ease-linear"
                  style={{ width: `${progress}%` }}
                />
             </div>
          </div>
        </div>
      )}

      {phase === 'REVEAL' && (
        <div className="flex flex-col items-center animate-swing-down">
          <div className="text-xl text-rose-200 font-black mb-8 uppercase tracking-[0.4em]">
            Winning Number Selected
          </div>
          
          <div className="relative mb-12">
            <div className="absolute -inset-10 bg-red-600/30 blur-3xl animate-pulse"></div>
            <div className="winning-ball-reveal animate-blink-fast">
              {winningNumber}
            </div>
            {/* Blinking highlight circles */}
            <div className="absolute -inset-4 border-4 border-white/20 rounded-full animate-ping"></div>
          </div>

          <button 
            onClick={onClose}
            className="group relative px-12 py-5 bg-white rounded-2xl overflow-hidden transform hover:scale-105 active:scale-95 transition-all shadow-2xl"
          >
            <span className="relative z-10 text-black font-black text-xl uppercase tracking-widest">
              Confirm Result
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-rose-400 opacity-0 group-hover:opacity-10 transition-opacity" />
          </button>
        </div>
      )}

      {/* Decorative portal bottom info */}
      <div className="absolute bottom-10 text-[10px] text-rose-900 font-bold uppercase tracking-widest text-center opacity-40">
        AKLASBELA-TV EXCHANGE SECURE PROTOCOL • GRID_772_NODE
      </div>
    </div>
  );
};

export default ResultRevealOverlay;
