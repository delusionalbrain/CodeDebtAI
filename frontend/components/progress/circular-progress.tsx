'use client';

import React from 'react';

interface CircularProgressProps {
  value: number; // 0 to 100
  size?: number;
  strokeWidth?: number;
  className?: string;
  glow?: boolean;
}

export function CircularProgress({
  value,
  size = 120,
  strokeWidth = 10,
  className,
  glow = true
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Glow effect filter */}
        {glow && (
          <defs>
            <filter id="glow-violet" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#8b5cf6" floodOpacity="0.4" />
            </filter>
          </defs>
        )}

        {/* Background Track Circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="#0f172a" // slate-900
          strokeWidth={strokeWidth}
          className="transition-all duration-300"
        />

        {/* Foreground Active Circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="url(#gradient-purple-blue)"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          filter={glow ? 'url(#glow-violet)' : undefined}
          className="transition-all duration-500 ease-out"
        />

        {/* Gradients */}
        <defs>
          <linearGradient id="gradient-purple-blue" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8b5cf6" /> {/* violet-500 */}
            <stop offset="100%" stopColor="#3b82f6" /> {/* blue-500 */}
          </linearGradient>
        </defs>
      </svg>

      {/* Inner Label */}
      <div className="absolute flex flex-col items-center justify-center">
        <span className="text-2xl font-black text-white leading-none tracking-tight">
          {value}
        </span>
        <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mt-1.5">
          Score
        </span>
      </div>
    </div>
  );
}
