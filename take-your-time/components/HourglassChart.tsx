
import React, { useMemo } from 'react';
import { TimeEntry, Category } from '../types';

interface HourglassChartProps {
    entries: TimeEntry[];
    categories: Category[];
}

const HourglassChart: React.FC<HourglassChartProps> = ({ entries, categories }) => {
    const width = 280;
    const height = 400;

    // Map Categories to Colors
    const colorMap = useMemo(() => {
        return categories.reduce((acc, cat) => {
            acc[cat.id] = cat.colorHex;
            return acc;
        }, {} as Record<string, string>);
    }, [categories]);

    // Calculate total duration to determine fill level
    const totalMinutes = entries.reduce((acc, e) => acc + e.durationMinutes, 0);
    // Let's say 12 hours fills the hourglass completely for visual purposes
    const maxCapacityMinutes = 12 * 60; 
    const fillPercentage = Math.min(totalMinutes / maxCapacityMinutes, 1.0);
    
    // Generate "Sand Grains" (Bubbles)
    const bubbles = useMemo(() => {
        const bubbleData: { color: string, size: number, x: number, y: number, id: string }[] = [];
        
        let bubbleCount = 0;
        const totalBubblesToRender = Math.floor(fillPercentage * 80); // Max 80 bubbles
        
        const sortedEntries = [...entries].sort((a, b) => b.durationMinutes - a.durationMinutes);
        
        const grains: string[] = [];
        sortedEntries.forEach(entry => {
            const weight = entry.durationMinutes; 
            const count = Math.ceil((weight / totalMinutes) * totalBubblesToRender);
            for(let i=0; i<count; i++) grains.push(entry.categoryId);
        });

        const centerX = width / 2;
        const bottomY = height - 50;
        
        grains.slice(0, totalBubblesToRender).forEach((catId, i) => {
            const layer = Math.floor(i / 8); 
            const offset = (i % 8) * 25;
            
            const rX = (Math.random() * 140) - 70;
            const rY = (Math.random() * 40);

            const x = centerX + rX; 
            const y = bottomY - (layer * 18) - rY + 20;

            bubbleData.push({
                id: `bubble-${i}`,
                color: colorMap[catId] || '#fff',
                size: 8 + Math.random() * 12, 
                x,
                y
            });
        });

        return bubbleData;
    }, [entries, fillPercentage, colorMap, totalMinutes]);

    return (
        <div className="relative flex items-center justify-center">
            <svg 
                width={width} 
                height={height} 
                viewBox={`0 0 ${width} ${height}`} 
                className="drop-shadow-2xl overflow-visible"
            >
                <defs>
                    <clipPath id="hourglassBottom">
                        <path d="M140 200 
                                 C140 200, 20 220, 30 290
                                 C35 340, 70 380, 140 380
                                 C210 380, 245 340, 250 290
                                 C260 220, 140 200, 140 200 Z" />
                    </clipPath>
                    
                    <linearGradient id="glassShine" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="white" stopOpacity="0.1" />
                        <stop offset="50%" stopColor="white" stopOpacity="0.0" />
                        <stop offset="100%" stopColor="white" stopOpacity="0.05" />
                    </linearGradient>
                </defs>

                {/* 1. The Sand (Inside) */}
                <g clipPath="url(#hourglassBottom)">
                    {bubbles.map((b) => (
                        <circle
                            key={b.id}
                            cx={b.x}
                            cy={b.y}
                            r={b.size}
                            fill={b.color}
                            className="transition-all duration-500 ease-out"
                            style={{ 
                                opacity: 0.9,
                                boxShadow: 'inset -2px -2px 4px rgba(0,0,0,0.2)' 
                            }}
                        />
                    ))}
                    {totalMinutes > 0 && (
                        <path 
                            d="M140 200 L140 320" 
                            stroke={bubbles[bubbles.length-1]?.color || '#fff'} 
                            strokeWidth="4" 
                            strokeDasharray="5,5" 
                            className="animate-pulse opacity-80"
                        />
                    )}
                </g>

                {/* 2. The Glass Container Outline (Stroke Removed) */}
                <path 
                    d="M50 40 
                       C50 40, 20 40, 20 70
                       C20 120, 90 150, 95 170
                       C100 185, 100 195, 95 210
                       C90 230, 20 260, 20 310
                       C20 360, 50 380, 140 380
                       C230 380, 260 360, 260 310
                       C260 260, 190 230, 185 210
                       C180 195, 180 185, 185 170
                       C190 150, 260 120, 260 70
                       C260 40, 230 40, 230 40
                       Z" 
                    fill="url(#glassShine)" 
                    stroke="none"
                    className="drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]"
                />

                {/* 3. Glass Reflections */}
                <path d="M40 80 Q 45 120 85 140" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="4" strokeLinecap="round" />
                <path d="M240 300 Q 235 340 195 360" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="4" strokeLinecap="round" />

            </svg>
        </div>
    );
};

export default HourglassChart;
