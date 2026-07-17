'use client';

import React from 'react';
import { InfoTooltip } from '@/components/ui/info-tooltip';
import { SeverityDistribution } from '@/types/dashboard';

interface AnalyticsSectionProps {
  severityDistribution: SeverityDistribution;
  summary: string;
}

export function AnalyticsSection({ severityDistribution, summary }: AnalyticsSectionProps) {
  const criticalCount = severityDistribution.critical;
  const highCount = severityDistribution.high;
  const mediumCount = severityDistribution.medium;
  const lowCount = severityDistribution.low;
  
  const totalCount = criticalCount + highCount + mediumCount + lowCount;
  const safeTotal = totalCount || 1;

  // Percentage calculations
  const criticalPct = ((criticalCount / safeTotal) * 100).toFixed(1);
  const highPct = ((highCount / safeTotal) * 100).toFixed(1);
  const mediumPct = ((mediumCount / safeTotal) * 100).toFixed(1);
  const lowPct = ((lowCount / safeTotal) * 100).toFixed(1);

  // SVG parameters for the Donut Chart circle
  const radius = 40;
  const strokeWidth = 12;
  const circumference = 2 * Math.PI * radius; // ~251.32

  // Segment stroke lengths
  const criticalLen = (criticalCount / safeTotal) * circumference;
  const highLen = (highCount / safeTotal) * circumference;
  const mediumLen = (mediumCount / safeTotal) * circumference;
  const lowLen = (lowCount / safeTotal) * circumference;

  // Accumulative offset calculations
  const criticalOffset = 0;
  const highOffset = -criticalLen;
  const mediumOffset = -(criticalLen + highLen);
  const lowOffset = -(criticalLen + highLen + mediumLen);

  // Reusable card container styles with hover lift and without overflow hidden to allow tooltips to overlay
  const cardClassName = "rounded-xl border border-slate-900 bg-slate-950/40 backdrop-blur-xl p-5 md:p-6 shadow-lg flex flex-col relative transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-violet-500/25 hover:bg-slate-900/60 hover:shadow-[0_12px_30px_rgba(139,92,246,0.06)] hover:brightness-105 group";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-6">
      {/* Column 1: Severity Distribution Donut Chart */}
      <div className={cardClassName}>
        <div className="flex items-center justify-between mb-6 text-slate-400">
          <span className="text-[10px] font-bold uppercase tracking-wider">Severity Distribution</span>
          <InfoTooltip content="Categorizes technical debt issues into Critical, High, Medium, or Low severity levels based on their potential impact." />
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-8 md:gap-12 py-4">
          {/* Custom SVG Donut Chart */}
          <div className="relative w-36 h-36 flex items-center justify-center flex-shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              {/* Critical slice */}
              {criticalCount > 0 && (
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  className="stroke-rose-600 fill-none transition-all duration-500"
                  strokeWidth={strokeWidth}
                  strokeDasharray={`${criticalLen} ${circumference}`}
                  strokeDashoffset={criticalOffset}
                />
              )}
              {/* High slice */}
              {highCount > 0 && (
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  className="stroke-orange-500 fill-none transition-all duration-500"
                  strokeWidth={strokeWidth}
                  strokeDasharray={`${highLen} ${circumference}`}
                  strokeDashoffset={highOffset}
                />
              )}
              {/* Medium slice */}
              {mediumCount > 0 && (
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  className="stroke-yellow-500 fill-none transition-all duration-500"
                  strokeWidth={strokeWidth}
                  strokeDasharray={`${mediumLen} ${circumference}`}
                  strokeDashoffset={mediumOffset}
                />
              )}
              {/* Low slice */}
              {lowCount > 0 && (
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  className="stroke-emerald-500 fill-none transition-all duration-500"
                  strokeWidth={strokeWidth}
                  strokeDasharray={`${lowLen} ${circumference}`}
                  strokeDashoffset={lowOffset}
                />
              )}
            </svg>
            
            {/* Center text overlay */}
            <div className="absolute text-center flex flex-col">
              <span className="text-2xl font-black text-white tracking-tight">{totalCount}</span>
              <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">Total</span>
            </div>
          </div>

          {/* Legend and stats */}
          <div className="flex-1 w-full space-y-3">
            {/* Critical Row */}
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-600" />
                <span className="text-slate-400 font-medium">Critical</span>
              </div>
              <div className="flex items-center gap-4 text-right font-mono">
                <span className="text-white font-bold">{criticalCount}</span>
                <span className="text-slate-500 w-12">{criticalPct}%</span>
              </div>
            </div>

            {/* High Row */}
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                <span className="text-slate-400 font-medium">High</span>
              </div>
              <div className="flex items-center gap-4 text-right font-mono">
                <span className="text-white font-bold">{highCount}</span>
                <span className="text-slate-500 w-12">{highPct}%</span>
              </div>
            </div>

            {/* Medium Row */}
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                <span className="text-slate-400 font-medium">Medium</span>
              </div>
              <div className="flex items-center gap-4 text-right font-mono">
                <span className="text-white font-bold">{mediumCount}</span>
                <span className="text-slate-500 w-12">{mediumPct}%</span>
              </div>
            </div>

            {/* Low Row */}
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-slate-400 font-medium">Low</span>
              </div>
              <div className="flex items-center gap-4 text-right font-mono">
                <span className="text-white font-bold">{lowCount}</span>
                <span className="text-slate-500 w-12">{lowPct}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Column 2: Repository Summary (AI Summary) */}
      <div className={cardClassName}>
        {/* Background glow node just for summary panel */}
        <div className="absolute top-0 right-0 w-[200px] h-[200px] rounded-full bg-violet-950/10 filter blur-[80px] pointer-events-none translate-x-[20%] translate-y-[-20%]" />

        <div className="flex items-center justify-between mb-4 text-slate-400 relative z-10">
          <span className="text-[10px] font-bold uppercase tracking-wider">Repository Summary</span>
          <InfoTooltip content="AI-generated summary explaining the codebase health and key areas requiring optimization." />
        </div>

        <div className="flex-1 flex items-center relative z-10">
          <p className="text-slate-400 text-sm leading-relaxed font-medium">
            {summary}
          </p>
        </div>
      </div>
    </div>
  );
}
