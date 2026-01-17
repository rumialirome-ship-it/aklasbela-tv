
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

const REVEAL_DURATION = 30000; // Adjusted to 30 seconds for better tension

const ResultRevealOverlay: React.FC<ResultRevealOverlayProps> = ({ gameName, winningNumber, onClose }) => {
  const [phase, setPhase] = useState<'IDLE' | 'PORTAL' | 'REVEAL'>('PORTAL');
  const [progress, setProgress] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const startTimeRef = useRef<number>(Date.now());

  // Initialize 100 balls with a technical obsidian palette
  const balls = useMemo(() => {
    const arr: BallState[] = [];
    const colors = ['#6366f1', '#4f46e5', '#4338ca', '#3730a3', '#312e81', '#1e1b4b'];
    for (let i = 0; i < 100; i++) {
      arr.push({
        id: i,
        x: Math.random() * 400,
        y: Math.random() * 400,
        vx: (Math.random() - 0.5) * 6,
        vy: (Math.random() - 0.5) * 6,
        radius: 16,
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

      // Dynamic friction and acceleration
      const speedMultiplier = 0.5 + Math.pow(t, 2) * 25; 

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw Grid Backdrop in Canvas
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.05)';
      ctx.lineWidth = 1;
      for (let i = 0; i < canvas.width; i += 40) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, canvas.height); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(canvas.width, i); ctx.stroke();
      }

      balls.forEach(ball => {
        ball.x += ball.vx * speedMultiplier;
        ball.y += ball.vy * speedMultiplier;

        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const dist = Math.sqrt((ball.x - centerX) ** 2 + (ball.y - centerY) ** 2);
        const maxDist = canvas.width / 2 - ball.radius;

        if (dist > maxDist) {
          const angle = Math.atan2(ball.y - centerY, ball.x - centerX);
          ball.x = centerX + Math.cos(angle) * maxDist;
          ball.y = centerY + Math.sin(angle) * maxDist;

          const nx = Math.cos(angle);
          const ny = Math.sin(angle);
          const dot = ball.vx * nx + ball.vy * ny;
          ball.vx -= 2 * dot * nx;
          ball.vy -= 2 * dot * ny;
        }

        // Draw Technical Ball
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        ctx.fillStyle = ball.color;
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.2)';
        ctx.stroke();

        ctx.fillStyle = 'white';
        ctx.font = 'bold 10px JetBrains Mono';
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
    <div className="fixed inset-0 z-[1000] bg-black/98 flex flex-col items-center justify-center p-6 backdrop-blur-3xl selection:bg-accent-indigo/30">
      {/* Game Header */}
      <div className="absolute top-16 text-center animate-fade-in">
        <h1 className="text-5xl md:text-8xl font-black text-white uppercase tracking-tighter mb-4 leading-none">
          {gameName}
        </h1>
        <div className="inline-block px-6 py-1.5 bg-accent-indigo/10 border border-accent-indigo/20 rounded-full text-[10px] font-black text-accent-indigo uppercase tracking-[0.6em]">
          Target Result Decryption Active
        </div>
      </div>

      {phase === 'PORTAL' && (
        <div className="flex flex-col items-center gap-16 w-full max-w-4xl">
          <div className="relative w-[320px] h-[320px] sm:w-[600px] sm:h-[600px] rounded-full overflow-hidden border border-white/5 bg-slate-950 shadow-[0_0_100px_rgba(99,102,241,0.1)]">
            <div className="absolute inset-0 bg-gradient-to-t from-accent-indigo/10 to-transparent"></div>
            <canvas 
              ref={canvasRef} 
              width={600} 
              height={600} 
              className="w-full h-full relative z-10"
            />
            {/* Spinning Rings */}
            <div className="absolute inset-0 border-[20px] border-white/5 rounded-full animate-spin-slow pointer-events-none"></div>
            <div className="absolute inset-10 border border-accent-indigo/10 rounded-full animate-pulse pointer-events-none"></div>
          </div>
          
          {/* Progress / Tension Bar */}
          <div className="w-full max-w-lg space-y-6">
             <div className="flex justify-between items-end">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Decryption Status</p>
                  <p className="text-xs font-mono font-bold text-accent-indigo uppercase animate-pulse">Syncing_Protocol_Stream...</p>
                </div>
                <span className="text-3xl font-mono font-black text-white">{Math.floor(progress)}%</span>
             </div>
             <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden border border-white/5 p-0.5">
                <div 
                  className="h-full bg-accent-indigo rounded-full transition-all duration-100 ease-linear shadow-[0_0_15px_rgba(99,102,241,0.5)]"
                  style={{ width: `${progress}%` }}
                />
             </div>
          </div>
        </div>
      )}

      {phase === 'REVEAL' && (
        <div className="flex flex-col items-center animate-fade-in scale-up">
          <div className="text-[11px] text-accent-indigo font-black mb-12 uppercase tracking-[0.8em] animate-pulse">
            Protocol_Verified_Winner_Node
          </div>
          
          <div className="relative mb-20 group">
            <div className="absolute -inset-20 bg-accent-indigo/20 blur-[120px] rounded-full animate-pulse"></div>
            <div className="winning-ball-reveal text-black relative z-10 scale-110">
              {winningNumber}
            </div>
            {/* Pulsing decoration */}
            <div className="absolute -inset-8 border-2 border-white/10 rounded-full animate-ping opacity-30"></div>
          </div>

          <button 
            onClick={onClose}
            className="btn-primary h-20 text-lg sm:text-xl rounded-[2.5rem] px-24 transform hover:scale-105 active:scale-95 transition-all"
          >
            Confirm Audit Result
          </button>
        </div>
      )}

      {/* Footer Info */}
      <div className="absolute bottom-12 text-[9px] text-slate-700 font-black uppercase tracking-[0.8em] text-center opacity-40">
        AKLASBELA-TV EXCHANGE SECURE PROTOCOL • GRID_NODE_STABLE_VERIFIED
      </div>
    </div>
  );
};

export default ResultRevealOverlay;
