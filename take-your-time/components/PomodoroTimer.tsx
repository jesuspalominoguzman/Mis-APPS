
import React, { useEffect, useRef, useState } from 'react';
import { Category, UserSettings } from '../types';
import { TRANSLATIONS } from '../constants';

interface PomodoroTimerProps {
    durationMinutes: number;
    category: Category;
    onComplete: () => void;
    onCancel: () => void;
    settings: UserSettings;
}

const PomodoroTimer: React.FC<PomodoroTimerProps> = ({ durationMinutes, category, onComplete, onCancel, settings }) => {
    // State for UI display only. Logic uses Refs.
    const [displayTime, setDisplayTime] = useState(durationMinutes * 60);
    
    const t = TRANSLATIONS[settings.language] || TRANSLATIONS.en;

    // Refs for logic to prevent closure staleness and re-renders
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const requestRef = useRef<number>(0);
    const endTimeRef = useRef<number>(0);
    const totalDuration = durationMinutes * 60;
    const timeLeftRef = useRef(totalDuration); 
    
    // Wake Lock Ref
    const wakeLockRef = useRef<any>(null);

    // 1. WAKE LOCK: Keep screen on while timer is active
    useEffect(() => {
        const requestWakeLock = async () => {
            if ('wakeLock' in navigator) {
                try {
                    // @ts-ignore
                    wakeLockRef.current = await navigator.wakeLock.request('screen');
                } catch (err) {
                    console.warn('Wake Lock failed:', err);
                }
            }
        };

        requestWakeLock();
        
        // Re-acquire lock if visibility changes
        const handleVisibilityChange = async () => {
             if (document.visibilityState === 'visible' && !wakeLockRef.current) {
                requestWakeLock();
             }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            if (wakeLockRef.current) {
                 // @ts-ignore
                wakeLockRef.current.release();
            }
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, []);

    // 2. ROBUST TIMER LOGIC
    useEffect(() => {
        endTimeRef.current = Date.now() + durationMinutes * 60 * 1000;

        const interval = setInterval(() => {
            const now = Date.now();
            const diffMs = endTimeRef.current - now;
            const diffSec = Math.ceil(diffMs / 1000);
            
            timeLeftRef.current = Math.max(0, diffSec);

            if (diffSec <= 0) {
                setDisplayTime(0);
                clearInterval(interval);
                onComplete();
            } else {
                setDisplayTime(diffSec);
            }
        }, 500);

        return () => clearInterval(interval);
    }, [durationMinutes, onComplete]);

    // 3. OPTIMIZED CANVAS ANIMATION
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const particles: {x: number, y: number, angle: number, dist: number, speed: number, size: number, color: string}[] = [];

        const handleResize = () => {
             const width = window.innerWidth;
             const height = window.innerHeight; 
             canvas.width = width;
             canvas.height = height;
        };
        
        window.addEventListener('resize', handleResize);
        handleResize();

        const animate = () => {
            const width = canvas.width;
            const height = canvas.height;
            const cx = width / 2;
            const cy = height * 0.45;

            ctx.fillStyle = 'rgba(28, 28, 30, 0.25)'; 
            ctx.fillRect(0, 0, width, height);

            const secondsLeft = timeLeftRef.current;
            const progress = 1 - (secondsLeft / totalDuration);
            const coreSize = 15 + (progress * 100); 

            if (particles.length < 150) {
                const angle = Math.random() * Math.PI * 2;
                const dist = Math.max(width, height) * 0.8; 
                particles.push({
                    x: cx + Math.cos(angle) * dist,
                    y: cy + Math.sin(angle) * dist,
                    angle: angle,
                    dist: dist,
                    speed: 2 + Math.random() * 4,
                    size: Math.random() * 3 + 1,
                    color: category.colorHex
                });
            }

            ctx.globalCompositeOperation = 'lighter';
            
            for (let i = particles.length - 1; i >= 0; i--) {
                const p = particles[i];
                p.dist -= p.speed * (1 + progress * 3); 
                p.angle += 0.02 + (progress * 0.05); 
                p.x = cx + Math.cos(p.angle) * p.dist;
                p.y = cy + Math.sin(p.angle) * p.dist;

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fillStyle = p.color;
                ctx.globalAlpha = Math.min(1, p.dist / 200); 
                ctx.fill();

                if (p.dist < coreSize) particles.splice(i, 1);
            }

            ctx.globalCompositeOperation = 'source-over';
            ctx.globalAlpha = 1;
            
            const glow = ctx.createRadialGradient(cx, cy, coreSize * 0.4, cx, cy, coreSize * 2.5);
            glow.addColorStop(0, '#FFD700'); 
            glow.addColorStop(0.4, category.colorHex);
            glow.addColorStop(1, 'transparent');
            
            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(cx, cy, coreSize * 2.5, 0, Math.PI * 2);
            ctx.fill();

            ctx.beginPath();
            ctx.arc(cx, cy, coreSize, 0, Math.PI * 2);
            ctx.fillStyle = '#FFD700'; 
            ctx.fill();
            
            ctx.beginPath();
            ctx.ellipse(cx - coreSize*0.3, cy - coreSize*0.3, coreSize*0.2, coreSize*0.1, Math.PI/4, 0, Math.PI*2);
            ctx.fillStyle = 'rgba(255,255,255,0.9)';
            ctx.fill();

            requestRef.current = requestAnimationFrame(animate);
        };

        requestRef.current = requestAnimationFrame(animate);

        return () => {
            cancelAnimationFrame(requestRef.current);
            window.removeEventListener('resize', handleResize);
        };
    }, [category.colorHex, totalDuration]); 

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    return (
        <div className="fixed inset-0 z-[100] bg-[#1C1C1E] animate-[fadeIn_0.5s] touch-none overflow-hidden">
            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block z-0" />

            <div className="relative z-10 h-full flex flex-col justify-between pb-10 safe-area-bottom pointer-events-none">
                <div className="flex-1 flex items-center justify-center">
                    <h1 className="text-8xl font-black text-white tracking-tighter drop-shadow-2xl font-mono select-none opacity-90">
                        {formatTime(displayTime)}
                    </h1>
                </div>

                <div className="w-full px-8 flex flex-col gap-6 shrink-0 pointer-events-auto">
                    <div className="text-center">
                        <div className="inline-flex items-center gap-2 bg-black/40 backdrop-blur-md border border-white/10 px-4 py-2 rounded-full mb-4 shadow-xl">
                            <span className="material-symbols-outlined text-sm animate-spin text-primary">sync</span>
                            <span className="text-xs font-bold uppercase tracking-widest text-white/90">{t.forging}</span>
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-1 drop-shadow-md">{category.name}</h2>
                        <p className="text-gray-300 text-sm drop-shadow-sm font-medium">{t.focusActive}</p>
                    </div>

                    <button 
                        onClick={onCancel}
                        className="w-full py-5 rounded-[24px] bg-[#1C1C1E]/80 backdrop-blur-xl border-2 border-red-500/30 text-red-400 font-bold hover:bg-red-500/20 transition-all active:scale-95 touch-manipulation shadow-2xl"
                    >
                        {t.giveUp}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PomodoroTimer;
