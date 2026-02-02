
import React, { useEffect, useRef, useMemo, useState } from 'react';
import { TimeEntry, Category, UserSettings, BallSkin, JarStyle } from '../types';

interface PhysicsHourglassProps {
    entries: TimeEntry[];
    categories: Category[];
    settings: UserSettings;
}

interface Ball {
    id: string;
    x: number;
    y: number;
    vx: number;
    vy: number;
    radius: number;
    color: string;
    baseMass: number; // Stored base mass
    restitution: number;
    isInside: boolean;
    rotation: number;
    isPomodoro?: boolean; // New prop
}

const PhysicsHourglass: React.FC<PhysicsHourglassProps> = ({ entries, categories, settings }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const requestRef = useRef<number>(0);
    const [scale, setScale] = useState(1);
    const [hasPermission, setHasPermission] = useState(false);
    
    const lastHapticTimeRef = useRef<number>(0);
    const audioCtxRef = useRef<AudioContext | null>(null);
    const lastSoundTimeRef = useRef<number>(0);

    // -- INTERACTION STATE --
    const dragRef = useRef<{ id: string | null, x: number, y: number, vx: number, vy: number }>({ id: null, x: 0, y: 0, vx: 0, vy: 0 });
    const lastDragPos = useRef<{ x: number, y: number, time: number }>({ x: 0, y: 0, time: 0 });

    // -- MECHANISM STATE --
    const isLidOpenRef = useRef(false);
    const lidProgressRef = useRef(0);
    const lidTimeoutRef = useRef<number | null>(null);

    // -- LOGICAL DIMENSIONS --
    const WIDTH = 400; 
    const HEIGHT = 400; 
    const CX = WIDTH / 2;
    
    // -- JAR GEOMETRY CONSTANTS --
    const CAPSULE_TOP_Y = 100; 
    const CAPSULE_BOTTOM_Y = HEIGHT - 40;
    const CAPSULE_RADIUS = 110; 
    const GLASS_THICKNESS = 18; 
    const CORNER_RADIUS = 34; 

    // -- HELPER: Jar Collision Geometry --
    const getContainerHalfWidth = (y: number) => {
        if (y < CAPSULE_TOP_Y) return CAPSULE_RADIUS; 
        if (y < CAPSULE_BOTTOM_Y - CORNER_RADIUS) return CAPSULE_RADIUS;
        if (y <= CAPSULE_BOTTOM_Y) {
            const dy = y - (CAPSULE_BOTTOM_Y - CORNER_RADIUS);
            const dx = Math.sqrt(Math.max(0, CORNER_RADIUS**2 - dy**2));
            return (CAPSULE_RADIUS - CORNER_RADIUS) + dx;
        }
        return 0;
    };

    // -- AUDIO SYNTHESIS 2.0 (Natural Physics) --
    const initAudio = () => {
        if (!settings.soundEnabled) return;
        if (!audioCtxRef.current) {
            audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        if (audioCtxRef.current.state === 'suspended') {
            audioCtxRef.current.resume();
        }
    };

    const playCollisionSound = (velocity: number) => {
        if (!settings.soundEnabled || !audioCtxRef.current) return;
        
        // Rate limit sounds very slightly to prevent shredding audio engine on heaps
        const now = audioCtxRef.current.currentTime;
        if (now - lastSoundTimeRef.current < 0.04) return;
        lastSoundTimeRef.current = now;

        const ctx = audioCtxRef.current;
        const impact = Math.min(velocity / 15, 1); // Normalized impact 0-1
        
        // 1. Create Nodes
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        // 2. Connect Graph: Osc -> Filter -> Gain -> Destination
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        // 3. Configure Sound based on Skin
        let freq = 800;
        let filterFreq = 1000;
        let decay = 0.1;
        let q = 1;

        if (settings.ballSkin === 'wood') {
            osc.type = 'triangle';
            freq = 200 + Math.random() * 50; 
            filterFreq = 400;
            decay = 0.08;
            q = 0;
        } else if (settings.ballSkin === 'metal') {
            osc.type = 'sine';
            freq = 1500 + Math.random() * 500;
            filterFreq = 3000;
            decay = 0.3;
            q = 10; // High resonance
        } else if (settings.ballSkin === 'jelly') {
            osc.type = 'sine';
            freq = 400;
            filterFreq = 600;
            decay = 0.1;
            osc.frequency.setValueAtTime(600, now);
            osc.frequency.exponentialRampToValueAtTime(100, now + decay);
        } else {
            // Default/Fire (Marble/Plastic)
            osc.type = 'sine';
            freq = 800 + Math.random() * 200;
            filterFreq = 1200;
            decay = 0.1;
        }

        // Apply randomized pitch variance
        if (settings.ballSkin !== 'jelly') {
            osc.frequency.setValueAtTime(freq, now);
        }

        // 4. Filter Envelope
        filter.type = 'lowpass';
        filter.Q.value = q;
        filter.frequency.setValueAtTime(filterFreq, now);
        filter.frequency.exponentialRampToValueAtTime(100, now + decay);

        // 5. Volume Envelope
        const vol = Math.min(impact * 0.5, 0.4); 
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(vol, now + 0.005);
        gain.gain.exponentialRampToValueAtTime(0.001, now + decay);

        osc.start(now);
        osc.stop(now + decay + 0.05);
    };

    // -- HAPTICS --
    const triggerHaptic = (force: number) => {
        if (!settings.hapticsEnabled) return;
        const now = Date.now();
        if (now - lastHapticTimeRef.current < 20) return; 
        lastHapticTimeRef.current = now;
        if (navigator.vibrate) {
            const duration = Math.min(10, Math.ceil(force));
            if (duration > 1) navigator.vibrate(duration); 
        }
    };

    // -- STATE --
    const balls = useRef<Ball[]>([]);
    const gravity = useRef({ x: 0, y: 0.9 }); 
    const processedEntryIds = useRef<Set<string>>(new Set());
    const isFirstRender = useRef(true);

    const categoryColorMap = useMemo(() => {
        return categories.reduce((acc, cat) => ({...acc, [cat.id]: cat.colorHex}), {} as Record<string, string>);
    }, [categories]);

    // -- SENSORS --
    const requestMotionPermission = async () => {
        initAudio(); 
        // @ts-ignore
        if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
            try {
                // @ts-ignore
                const permissionState = await DeviceOrientationEvent.requestPermission();
                if (permissionState === 'granted') {
                    setHasPermission(true);
                    startSensors();
                }
            } catch (e) { console.error(e); }
        } else {
            setHasPermission(true);
            startSensors();
        }
    };

    const startSensors = () => {
        window.addEventListener('deviceorientation', handleOrientation);
    };

    const handleOrientation = (e: DeviceOrientationEvent) => {
        let gx = 0;
        let gy = 0.9; 
        if (e.gamma !== null) gx = (e.gamma / 45) * 0.9; 
        if (e.beta !== null) {
            const rad = (e.beta * Math.PI) / 180;
            gy = Math.sin(rad) * 0.9;
        }
        gravity.current = { x: gx, y: gy };
    };

    // -- POINTER HANDLERS --
    const handlePointerDown = (e: React.PointerEvent) => {
        if (!canvasRef.current) return;
        initAudio();
        const rect = canvasRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left) * (WIDTH / rect.width);
        const y = (e.clientY - rect.top) * (HEIGHT / rect.height);

        let closestId: string | null = null;
        let minDist = Infinity;

        balls.current.forEach(b => {
            const dx = b.x - x;
            const dy = b.y - y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            if (dist < b.radius + 30 && dist < minDist) { 
                minDist = dist;
                closestId = b.id;
            }
        });

        if (closestId) {
            dragRef.current = { id: closestId, x, y, vx: 0, vy: 0 };
            lastDragPos.current = { x, y, time: Date.now() };
            (e.target as Element).setPointerCapture(e.pointerId);
        }
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!dragRef.current.id || !canvasRef.current) return;
        e.preventDefault(); 
        const rect = canvasRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left) * (WIDTH / rect.width);
        const y = (e.clientY - rect.top) * (HEIGHT / rect.height);
        
        const now = Date.now();
        const dt = now - lastDragPos.current.time;
        
        if (dt > 0) {
            const vx = (x - lastDragPos.current.x) / dt * 15; 
            const vy = (y - lastDragPos.current.y) / dt * 15;
            dragRef.current.vx = vx;
            dragRef.current.vy = vy;
        }

        dragRef.current.x = x;
        dragRef.current.y = y;
        lastDragPos.current = { x, y, time: now };
    };

    const handlePointerUp = (e: React.PointerEvent) => {
        if (dragRef.current.id) {
            const ball = balls.current.find(b => b.id === dragRef.current.id);
            if (ball) {
                ball.vx = Math.min(Math.max(dragRef.current.vx, -30), 30);
                ball.vy = Math.min(Math.max(dragRef.current.vy, -30), 30);
            }
        }
        dragRef.current.id = null;
        if ((e.target as Element).hasPointerCapture(e.pointerId)) {
            (e.target as Element).releasePointerCapture(e.pointerId);
        }
    };

    useEffect(() => {
        // @ts-ignore
        if (typeof DeviceOrientationEvent === 'undefined' || typeof DeviceOrientationEvent.requestPermission !== 'function') {
            setHasPermission(true);
            startSensors();
        }
        if (settings.soundEnabled) initAudio();
        return () => window.removeEventListener('deviceorientation', handleOrientation);
    }, [settings.soundEnabled]);

    // -- ADD BALLS --
    useEffect(() => {
        const newBallsToAdd: Ball[] = [];
        let hasNewEntries = false;

        // Skin Physics Params
        let restitution = 0.75; 
        let density = 1;
        
        if (settings.ballSkin === 'wood') { restitution = 0.5; density = 0.8; }
        if (settings.ballSkin === 'metal') { restitution = 0.4; density = 2.0; }
        if (settings.ballSkin === 'jelly') { restitution = 0.9; density = 0.9; }

        entries.forEach(entry => {
            if (!processedEntryIds.current.has(entry.id)) {
                processedEntryIds.current.add(entry.id);
                const isNew = !isFirstRender.current;
                if (isNew) hasNewEntries = true;

                let remainingMinutes = entry.durationMinutes;
                const color = categoryColorMap[entry.categoryId] || '#fff';

                while (remainingMinutes > 0) {
                    let minsForThisBall = 0;
                    let radius = 0;
                    if (remainingMinutes >= 60) { minsForThisBall = 60; radius = 22; } 
                    else if (remainingMinutes >= 30) { minsForThisBall = 30; radius = 18; } 
                    else { minsForThisBall = remainingMinutes; radius = 12 + (remainingMinutes / 30) * 4; }
                    
                    remainingMinutes -= minsForThisBall;
                    const spawnX = CX + (Math.random() - 0.5) * (CAPSULE_RADIUS * 0.8);
                    
                    newBallsToAdd.push({
                        id: `${entry.id}-${remainingMinutes}-${Math.random()}`,
                        x: isNew ? spawnX : CX + (Math.random() - 0.5) * 100,
                        y: isNew ? -60 - (Math.random() * 100) : HEIGHT - 50 - (Math.random() * 150),
                        vx: (Math.random() - 0.5) * 1.5, 
                        vy: isNew ? Math.random() * 5 + 5 : 0, 
                        radius: radius,
                        color: color,
                        baseMass: (radius * 3) * density,
                        restitution: restitution,
                        isInside: !isNew,
                        rotation: Math.random() * Math.PI * 2,
                        isPomodoro: entry.isPomodoro // Pass flag
                    });
                }
            }
        });

        if (newBallsToAdd.length > 0) {
            balls.current = [...balls.current, ...newBallsToAdd];
        }

        if (hasNewEntries) {
            initAudio();
            isLidOpenRef.current = true;
            if (lidTimeoutRef.current) clearTimeout(lidTimeoutRef.current);
            lidTimeoutRef.current = window.setTimeout(() => {
                isLidOpenRef.current = false;
            }, 3500);
        }

        isFirstRender.current = false;
    }, [entries, categoryColorMap, settings.ballSkin]);

    // -- ANIMATION LOOP --
    const animate = () => {
        const ctx = canvasRef.current?.getContext('2d');
        if (!ctx) return;

        // Logic
        const targetProgress = isLidOpenRef.current ? 1 : 0;
        const diff = targetProgress - lidProgressRef.current;
        lidProgressRef.current += diff * 0.08; 
        
        const isLidPhysicallyClosed = lidProgressRef.current < 0.2;
        const activeBalls = balls.current;
        
        // --- APPLY GRAVITY SETTING ---
        const gravityMultiplier = settings.physicsGravity || 1.0;
        const G = { 
            x: gravity.current.x * gravityMultiplier, 
            y: gravity.current.y * gravityMultiplier 
        };
        const FRICTION = 0.99; 
        const SUB_STEPS = 8; 
        const lidSurfaceY = CAPSULE_TOP_Y; 
        
        // Mass multiplier
        const weightMultiplier = settings.physicsWeight || 1.0;

        // -- PHYSICS STEPS --
        for (let step = 0; step < SUB_STEPS; step++) {
            
            // Drag
            if (dragRef.current.id && step === 0) {
                const draggedBall = activeBalls.find(b => b.id === dragRef.current.id);
                if (draggedBall) {
                    const k = 0.15; 
                    const dx = dragRef.current.x - draggedBall.x;
                    const dy = dragRef.current.y - draggedBall.y;
                    draggedBall.vx += dx * k;
                    draggedBall.vy += dy * k;
                    draggedBall.vx *= 0.7; 
                    draggedBall.vy *= 0.7;
                }
            }

            activeBalls.forEach((b) => {
                if (b.id !== dragRef.current.id) {
                    b.vx += G.x / SUB_STEPS;
                    b.vy += G.y / SUB_STEPS;
                }
                b.x += b.vx / SUB_STEPS;
                b.y += b.vy / SUB_STEPS;
                b.rotation += (b.vx * 0.05);

                // Entrance Logic
                if (!b.isInside && b.y > lidSurfaceY + b.radius + 10) {
                    b.isInside = true;
                }

                // Lid Collision
                if (isLidPhysicallyClosed) {
                    if (b.isInside) {
                        // Ceiling
                        if (b.y - b.radius < lidSurfaceY) {
                            if (b.y > lidSurfaceY - 25) { 
                                b.y = lidSurfaceY + b.radius;
                                b.vy = Math.abs(b.vy) * 0.4; 
                                b.vx *= 0.95;
                            }
                        }
                    } else {
                        // Floor (External)
                        if (b.y + b.radius > lidSurfaceY - 4) {
                             if (b.y < lidSurfaceY + 20) {
                                b.y = lidSurfaceY - 4 - b.radius;
                                b.vy = -Math.abs(b.vy) * 0.3;
                                b.vx *= 0.9;
                            }
                        }
                    }
                }

                // Walls
                const innerWidth = getContainerHalfWidth(b.y);
                const leftWall = CX - innerWidth + GLASS_THICKNESS;
                const rightWall = CX + innerWidth - GLASS_THICKNESS;

                let collided = false;
                let impactForce = 0;

                if (b.y > -50) { 
                    if (b.x - b.radius < leftWall) {
                        b.x = leftWall + b.radius;
                        b.vx *= -0.6; 
                        b.vy *= 0.95;
                        collided = true;
                        impactForce = Math.abs(b.vx);
                    } else if (b.x + b.radius > rightWall) {
                        b.x = rightWall - b.radius;
                        b.vx *= -0.6;
                        b.vy *= 0.95;
                        collided = true;
                        impactForce = Math.abs(b.vx);
                    }
                }

                const floorY = CAPSULE_BOTTOM_Y - GLASS_THICKNESS;
                if (b.y > floorY - b.radius) {
                    b.y = floorY - b.radius;
                    b.vy *= -0.5; 
                    b.vx *= 0.9;
                    collided = true;
                    impactForce = Math.abs(b.vy);
                } 

                if (collided && step === 0 && impactForce > 2) {
                     triggerHaptic(impactForce);
                     if (impactForce > 4) playCollisionSound(impactForce);
                }
                
                if (b.x < -200) b.x = CX;
                if (b.x > WIDTH + 200) b.x = CX;
                if (b.y > HEIGHT + 200) { b.y = HEIGHT - 100; b.vy = 0; b.isInside = true; }
            });

            // Ball-to-Ball
            for (let i = 0; i < activeBalls.length; i++) {
                for (let j = i + 1; j < activeBalls.length; j++) {
                    const b1 = activeBalls[i];
                    const b2 = activeBalls[j];
                    const dx = b2.x - b1.x;
                    const dy = b2.y - b1.y;
                    const distSq = dx*dx + dy*dy;
                    const minDist = b1.radius + b2.radius;

                    if (distSq < minDist * minDist) {
                        const dist = Math.sqrt(distSq);
                        const overlap = minDist - dist;
                        const nx = dx / dist;
                        const ny = dy / dist;
                        
                        // Apply Weight Setting to Mass calculation
                        const mass1 = b1.baseMass * weightMultiplier;
                        const mass2 = b2.baseMass * weightMultiplier;
                        const totalMass = mass1 + mass2;
                        
                        const m1 = mass2 / totalMass;
                        const m2 = mass1 / totalMass;
                        
                        b1.x -= nx * overlap * m1;
                        b1.y -= ny * overlap * m1;
                        b2.x += nx * overlap * m2;
                        b2.y += ny * overlap * m2;

                        const rvx = b2.vx - b1.vx;
                        const rvy = b2.vy - b1.vy;
                        const velAlongNormal = rvx * nx + rvy * ny;

                        if (velAlongNormal < 0) {
                            const restitution = Math.min(b1.restitution, b2.restitution);
                            const jVal = -(1 + restitution) * velAlongNormal;
                            b1.vx -= (jVal * m1 * nx);
                            b1.vy -= (jVal * m1 * ny);
                            b2.vx += (jVal * m2 * nx);
                            b2.vy += (jVal * m2 * ny);
                            
                            const impact = Math.abs(velAlongNormal);
                            // Adjusted impact threshold for sound to be less sensitive on pile-ups
                            if (impact > 1.0 && step === 0) {
                                triggerHaptic(impact);
                                // Don't play sound for every tiny jitter in the pile
                                if (impact > 2.5) playCollisionSound(impact);
                            }
                        }
                    }
                }
            }
        }
        
        activeBalls.forEach(b => {
            b.vx *= FRICTION;
            b.vy *= FRICTION;
        });

        // --- RENDER ---
        ctx.clearRect(0, 0, WIDTH, HEIGHT);
        
        // Render Balls (Same as before)
        balls.current.forEach(b => {
            const cx = b.x;
            const cy = b.y;
            const r = b.radius;
            const skin = settings.ballSkin;

            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(b.rotation);

            if (b.isPomodoro) {
                // *** GOLDEN BALL RENDER ***
                // Outer Glow
                ctx.shadowBlur = 15;
                ctx.shadowColor = '#FFD700';
                
                // Main Sphere
                ctx.beginPath();
                ctx.arc(0, 0, r, 0, Math.PI * 2);
                const grad = ctx.createRadialGradient(-r*0.3, -r*0.3, 0, 0, 0, r);
                grad.addColorStop(0, '#FFF5C3'); // Bright pale gold highlight
                grad.addColorStop(0.3, '#FFD700'); // Gold
                grad.addColorStop(1, '#B8860B'); // Dark goldenrod shadow
                ctx.fillStyle = grad;
                ctx.fill();
                
                // Shine Reflection
                ctx.shadowBlur = 0;
                ctx.beginPath();
                ctx.ellipse(-r*0.4, -r*0.4, r*0.25, r*0.15, Math.PI/4, 0, Math.PI*2);
                ctx.fillStyle = "rgba(255,255,255,0.9)";
                ctx.fill();

                // Sparkle (Tiny cross)
                ctx.beginPath();
                ctx.moveTo(0, -r*0.6); ctx.lineTo(0, -r*0.2);
                ctx.moveTo(-r*0.2, -r*0.4); ctx.lineTo(r*0.2, -r*0.4);
                ctx.strokeStyle = "white";
                ctx.lineWidth = 1;
                ctx.stroke();

            } else {
                // *** STANDARD SKINS RENDER ***
                if (skin === 'wood') {
                    ctx.beginPath();
                    ctx.arc(0, 0, r, 0, Math.PI * 2);
                    const grad = ctx.createRadialGradient(-r*0.3, -r*0.3, 0, 0, 0, r);
                    grad.addColorStop(0, '#D2B48C');
                    grad.addColorStop(1, '#8B4513');
                    ctx.fillStyle = grad;
                    ctx.fill();
                    ctx.strokeStyle = "rgba(100, 60, 20, 0.3)";
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.arc(0, 0, r*0.6, 0, Math.PI);
                    ctx.stroke();
                } else if (skin === 'metal') {
                    ctx.beginPath();
                    ctx.arc(0, 0, r, 0, Math.PI * 2);
                    const grad = ctx.createRadialGradient(-r*0.3, -r*0.3, 0, 0, 0, r);
                    grad.addColorStop(0, '#FFFFFF');
                    grad.addColorStop(0.3, '#E0E0E0');
                    grad.addColorStop(1, '#606060');
                    ctx.fillStyle = grad;
                    ctx.fill();
                    ctx.beginPath();
                    ctx.arc(-r*0.4, -r*0.4, r*0.15, 0, Math.PI*2);
                    ctx.fillStyle = "white";
                    ctx.fill();
                } else if (skin === 'jelly') {
                    ctx.globalAlpha = 0.6;
                    ctx.beginPath();
                    ctx.arc(0, 0, r, 0, Math.PI * 2);
                    ctx.fillStyle = b.color;
                    ctx.fill();
                    ctx.globalAlpha = 1.0;
                    ctx.beginPath();
                    ctx.arc(0, 0, r*0.4, 0, Math.PI*2);
                    ctx.fillStyle = "rgba(255,255,255,0.3)";
                    ctx.fill();
                    ctx.strokeStyle = "rgba(255,255,255,0.5)";
                    ctx.lineWidth = 1;
                    ctx.stroke();
                } else if (skin === 'fire') {
                    ctx.shadowBlur = 15;
                    ctx.shadowColor = b.color;
                    ctx.beginPath();
                    ctx.arc(0, 0, r, 0, Math.PI * 2);
                    const grad = ctx.createRadialGradient(0,0,0,0,0,r);
                    grad.addColorStop(0, '#FFFF00');
                    grad.addColorStop(0.5, b.color);
                    grad.addColorStop(1, 'rgba(255,0,0,0)');
                    ctx.fillStyle = grad;
                    ctx.fill();
                    ctx.shadowBlur = 0;
                } else {
                    // Default
                    ctx.beginPath();
                    ctx.arc(0, 0, r, 0, Math.PI * 2);
                    ctx.fillStyle = adjustBrightness(b.color, -20);
                    ctx.fill();
                    const grad = ctx.createRadialGradient(0, -r*0.3, r * 0.2, 0, 0, r);
                    grad.addColorStop(0, adjustBrightness(b.color, 40));
                    grad.addColorStop(1, 'transparent');
                    ctx.fillStyle = grad;
                    ctx.fill();
                    ctx.beginPath();
                    ctx.ellipse(-r*0.3, -r*0.3, r*0.2, r*0.12, Math.PI/4, 0, Math.PI*2);
                    ctx.fillStyle = "rgba(255,255,255,0.9)";
                    ctx.fill();
                }
            }

            if (b.id === dragRef.current.id) {
                ctx.strokeStyle = "rgba(255,255,255,0.8)";
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(0, 0, r + 2, 0, Math.PI * 2);
                ctx.stroke();
            }

            ctx.restore();
        });

        // Render Lid (Dynamic Styles)
        const progress = lidProgressRef.current;
        ctx.save();
        ctx.translate(CX, CAPSULE_TOP_Y);
        const lift = Math.min(progress, 0.1) * (1 / 0.1) * -4;
        const slide = Math.max(0, progress - 0.05) * (180 / 0.95);
        ctx.translate(slide, lift);
        const lidW = CAPSULE_RADIUS * 2; const lidH = 28;
        const xLid = -lidW/2; const yLid = -lidH + 4; 
        
        // Lid Gradients based on Style
        let lidGrad = ctx.createLinearGradient(xLid, 0, xLid + lidW, 0); 
        
        if (settings.jarStyle === 'golden') {
            lidGrad.addColorStop(0, '#B8860B'); 
            lidGrad.addColorStop(0.2, '#FFD700'); 
            lidGrad.addColorStop(0.5, '#FFFACD'); 
            lidGrad.addColorStop(0.8, '#FFD700'); 
            lidGrad.addColorStop(1, '#B8860B'); 
        } else if (settings.jarStyle === 'vintage') {
            lidGrad.addColorStop(0, '#3E2723'); 
            lidGrad.addColorStop(0.5, '#8D6E63'); 
            lidGrad.addColorStop(1, '#3E2723');
        } else if (settings.jarStyle === 'cyber') {
            lidGrad.addColorStop(0, '#000'); 
            lidGrad.addColorStop(0.5, '#333'); 
            lidGrad.addColorStop(1, '#000');
        } else {
            // Default Metal
            lidGrad.addColorStop(0, '#111'); 
            lidGrad.addColorStop(0.5, '#333'); 
            lidGrad.addColorStop(1, '#111');    
        }
        
        ctx.fillStyle = lidGrad;
        ctx.beginPath();
        ctx.roundRect(xLid, yLid, lidW, lidH, 6);
        ctx.fill();

        // Lid Accents
        if (settings.jarStyle === 'cyber') {
            ctx.strokeStyle = '#00FFFF';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.shadowColor = '#00FFFF';
            ctx.shadowBlur = 10;
        }

        ctx.restore();

        requestRef.current = requestAnimationFrame(animate);
    };

    const adjustBrightness = (hex: string, percent: number) => {
        const num = parseInt(hex.replace("#",""), 16),
        amt = Math.round(2.55 * percent),
        R = (num >> 16) + amt,
        G = (num >> 8 & 0x00FF) + amt,
        B = (num & 0x0000FF) + amt;
        return "#" + (0x1000000 + (R<255?R<1?0:R:255)*0x10000 + (G<255?G<1?0:G:255)*0x100 + (B<255?B<1?0:B:255)).toString(16).slice(1);
    };

    useEffect(() => {
        requestRef.current = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(requestRef.current);
    }, [settings.hapticsEnabled, settings.physicsGravity, settings.physicsWeight]);

    useEffect(() => {
        const handleResize = () => {
            if (containerRef.current) {
                const s = Math.min(
                    containerRef.current.clientWidth / WIDTH, 
                    containerRef.current.clientHeight / HEIGHT
                );
                setScale(s);
            }
        };
        window.addEventListener('resize', handleResize);
        handleResize();
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // -- SVG GEOMETRY & STYLE (CLASSIC CAPSULE) --
    // CX is 200
    const pTopLeft = `${CX - CAPSULE_RADIUS} ${CAPSULE_TOP_Y}`;
    const pBotLeftStart = `${CX - CAPSULE_RADIUS} ${CAPSULE_BOTTOM_Y - CORNER_RADIUS}`;
    const pBotLeftEnd = `${CX - CAPSULE_RADIUS + CORNER_RADIUS} ${CAPSULE_BOTTOM_Y}`;
    const pBotRightStart = `${CX + CAPSULE_RADIUS - CORNER_RADIUS} ${CAPSULE_BOTTOM_Y}`;
    const pBotRightEnd = `${CX + CAPSULE_RADIUS} ${CAPSULE_BOTTOM_Y - CORNER_RADIUS}`;
    const pTopRight = `${CX + CAPSULE_RADIUS} ${CAPSULE_TOP_Y}`;

    const jarOutline = `
        M ${pTopLeft}
        L ${pBotLeftStart}
        A ${CORNER_RADIUS} ${CORNER_RADIUS} 0 0 0 ${pBotLeftEnd}
        L ${pBotRightStart}
        A ${CORNER_RADIUS} ${CORNER_RADIUS} 0 0 0 ${pBotRightEnd}
        L ${pTopRight}
        Z
    `;

    // Define Glass Colors based on Style
    let glassFillId = "volumetricGlass";
    let glassStroke = "rgba(255,255,255,0.05)";
    
    // We define gradients in the SVG defs below
    // ID mapping
    const styleId = settings.jarStyle === 'default' ? 'volumetricGlass' : `glass-${settings.jarStyle}`;

    return (
        <div 
            ref={containerRef} 
            className="w-full h-full flex items-center justify-center relative touch-none"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
        >
            {!hasPermission && (
                <button 
                    onClick={requestMotionPermission}
                    className="absolute top-0 right-4 z-50 bg-white/5 hover:bg-white/10 p-3 rounded-full text-white/30 hover:text-white transition-all backdrop-blur-md border border-white/5"
                >
                    <span className="material-symbols-outlined text-xl animate-pulse">screen_rotation</span>
                </button>
            )}

            <div 
                style={{ width: WIDTH, height: HEIGHT, transform: `scale(${scale})` }} 
                className="relative shrink-0 origin-center select-none"
            >
                {/* 1. BACK GLASS LAYER (Volumetric) */}
                <svg width={WIDTH} height={HEIGHT} className="absolute inset-0 z-0 overflow-visible">
                    <defs>
                        {/* Default Dark Glass */}
                        <linearGradient id="volumetricGlass" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#000" stopOpacity="0.8" />
                            <stop offset="10%" stopColor="#000" stopOpacity="0.3" />
                            <stop offset="50%" stopColor="#000" stopOpacity="0.05" /> 
                            <stop offset="90%" stopColor="#000" stopOpacity="0.3" />
                            <stop offset="100%" stopColor="#000" stopOpacity="0.8" />
                        </linearGradient>

                        {/* Vintage (Amber/Warm) */}
                        <linearGradient id="glass-vintage" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#3E2723" stopOpacity="0.6" />
                            <stop offset="50%" stopColor="#5D4037" stopOpacity="0.1" /> 
                            <stop offset="100%" stopColor="#3E2723" stopOpacity="0.6" />
                        </linearGradient>

                        {/* Obsidian (Blackout) */}
                        <linearGradient id="glass-obsidian" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#000" stopOpacity="0.95" />
                            <stop offset="50%" stopColor="#000" stopOpacity="0.4" /> 
                            <stop offset="100%" stopColor="#000" stopOpacity="0.95" />
                        </linearGradient>

                        {/* Golden (Yellow Tint) */}
                        <linearGradient id="glass-golden" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#FFD700" stopOpacity="0.4" />
                            <stop offset="50%" stopColor="#FFD700" stopOpacity="0.05" /> 
                            <stop offset="100%" stopColor="#FFD700" stopOpacity="0.4" />
                        </linearGradient>

                        {/* Cyber (Digital Grid hint?) */}
                        <linearGradient id="glass-cyber" x1="0%" y1="0%" x2="100%" y2="0%">
                             <stop offset="0%" stopColor="#00FFFF" stopOpacity="0.2" />
                             <stop offset="50%" stopColor="#000" stopOpacity="0.1" />
                             <stop offset="100%" stopColor="#FF00FF" stopOpacity="0.2" />
                        </linearGradient>
                    </defs>

                    <path d={jarOutline} fill={`url(#${styleId})`} />
                    
                    {/* Thread Detail */}
                     <path d={`M ${CX-CAPSULE_RADIUS+2} ${CAPSULE_TOP_Y+12} L ${CX+CAPSULE_RADIUS-2} ${CAPSULE_TOP_Y+12}`} stroke="rgba(255,255,255,0.05)" strokeWidth="2" strokeDasharray="3 3" />
                </svg>

                {/* 2. CANVAS LAYER */}
                <canvas 
                    ref={canvasRef}
                    width={WIDTH}
                    height={HEIGHT}
                    className="absolute inset-0 z-10"
                />

                {/* 3. FRONT REFLECTION LAYER */}
                <svg width={WIDTH} height={HEIGHT} className="absolute inset-0 z-20 pointer-events-none overflow-visible">
                     <defs>
                        <linearGradient id="softReflection" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="rgba(255,255,255,0.05)" /> 
                            <stop offset="30%" stopColor="rgba(255,255,255,0.08)" />
                            <stop offset="50%" stopColor="rgba(255,255,255,0)" />
                            <stop offset="100%" stopColor="rgba(255,255,255,0.02)" />
                        </linearGradient>
                    </defs>

                    {/* Rim Highlight - Color depends on style */}
                    <path 
                        d={`M ${CX - CAPSULE_RADIUS} ${CAPSULE_TOP_Y} L ${CX + CAPSULE_RADIUS} ${CAPSULE_TOP_Y}`}
                        stroke={
                            settings.jarStyle === 'golden' ? '#FFD700' : 
                            settings.jarStyle === 'cyber' ? '#00FFFF' : 
                            settings.jarStyle === 'vintage' ? '#8D6E63' : 
                            "rgba(255,255,255,0.2)"
                        }
                        strokeWidth="2"
                    />

                    {/* Cyber Glow */}
                    {settings.jarStyle === 'cyber' && (
                        <path d={jarOutline} fill="none" stroke="#00FFFF" strokeWidth="1" strokeOpacity="0.5" style={{filter: 'drop-shadow(0 0 5px cyan)'}} />
                    )}

                     {/* Golden Glow */}
                     {settings.jarStyle === 'golden' && (
                        <path d={jarOutline} fill="none" stroke="#FFD700" strokeWidth="1" strokeOpacity="0.3" />
                    )}

                    <path d={jarOutline} fill="url(#softReflection)" style={{mixBlendMode: 'overlay'}} />
                    
                </svg>
            </div>
        </div>
    );
};

export default PhysicsHourglass;
