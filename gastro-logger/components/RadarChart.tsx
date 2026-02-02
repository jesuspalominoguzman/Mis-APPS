
import React from 'react';
import { ReviewDimensions } from '../types';

interface RadarChartProps {
  scores: ReviewDimensions;
  size?: number;
}

const RadarChart: React.FC<RadarChartProps> = ({ scores, size = 64 }) => {
  const radius = 40;
  const centerX = 50;
  const centerY = 50;
  const totalSteps = 8;

  // Order of axes
  const keys: (keyof ReviewDimensions)[] = [
    'flavor', 'texture', 'creativity', 'service', 
    'acoustics', 'lighting', 'quality', 'value'
  ];

  const points = keys.map((key, i) => {
    const angle = (Math.PI * 2 * i) / totalSteps - Math.PI / 2;
    const value = scores[key] / 10;
    return {
      x: centerX + radius * value * Math.cos(angle),
      y: centerY + radius * value * Math.sin(angle)
    };
  });

  const polyPoints = points.map(p => `${p.x},${p.y}`).join(' ');

  // Guide lines (web)
  const guides = [0.5, 1.0].map(scale => {
    return keys.map((_, i) => {
      const angle = (Math.PI * 2 * i) / totalSteps - Math.PI / 2;
      const x = centerX + radius * scale * Math.cos(angle);
      const y = centerY + radius * scale * Math.sin(angle);
      return `${x},${y}`;
    }).join(' ');
  });

  return (
    <div style={{ width: size, height: size }} className="opacity-100">
      <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
        {/* Guides - Grises muy sutiles para elegancia */}
        {guides.map((g, i) => (
          <polygon key={i} points={g} fill="none" stroke="#E5E7EB" strokeWidth="0.5" />
        ))}
        {/* Axis Lines */}
        {points.map((_, i) => {
           const angle = (Math.PI * 2 * i) / totalSteps - Math.PI / 2;
           const x = centerX + radius * Math.cos(angle);
           const y = centerY + radius * Math.sin(angle);
           return <line key={i} x1={centerX} y1={centerY} x2={x} y2={y} stroke="#E5E7EB" strokeWidth="0.5" />;
        })}
        
        {/* Data - Morado Elegante */}
        <polygon 
          points={polyPoints} 
          fill="rgba(107, 33, 168, 0.15)" 
          stroke="#6B21A8" 
          strokeWidth="1.2" 
          strokeLinejoin="round"
        />
        
        {/* Dots */}
        {points.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r="1.2" fill="#6B21A8" />
        ))}
      </svg>
    </div>
  );
};

export default RadarChart;
