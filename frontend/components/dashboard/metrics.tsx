'use client';

import React from 'react';
import { FileText, Flag, Award } from 'lucide-react';
import { InfoTooltip } from '@/components/ui/info-tooltip';

interface MetricsProps {
  healthScore: number;
  totalDebtScore: number;
  flaggedFilesCount: number;
  filesScannedCount: number;
}

export function Metrics({ 
  healthScore, 
  totalDebtScore, 
  flaggedFilesCount, 
  filesScannedCount 
}: MetricsProps) {

  // SVG parameters for Health Score circular loader gauge
  const radius = 28;
  const stroke = 5;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (healthScore / 100) * circumference;

  const getDebtLevel = (score: number) => {
    if (score > 150) return { label: 'High', color: 'text-rose-500' };
    if (score > 80) return { label: 'Medium', color: 'text-amber-500' };
    return { label: 'Low', color: 'text-emerald-500' };
  };

  const debtLevel = getDebtLevel(totalDebtScore);

  // Common card hover effect classes (without overflow-hidden to allow tooltips to overlay bounds)
  const cardClassName = "rounded-xl border border-slate-900 bg-slate-950/40 backdrop-blur-xl p-5 shadow-lg relative transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-violet-500/25 hover:bg-slate-900/60 hover:shadow-[0_12px_30px_rgba(139,92,246,0.06)] hover:brightness-105 group";

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
      {/* 1. Health Score Card */}
      <div className={cardClassName}>
        <div className="flex items-center justify-between mb-3 text-slate-400">
          <span className="text-[10px] font-bold uppercase tracking-wider">Health Score</span>
          <InfoTooltip content="Represents the overall quality and maintainability of the repository. A higher score indicates a cleaner codebase." />
        </div>

        <div className="flex items-center gap-4 mt-2">
          {/* SVG Circular progress circle */}
          <div className="relative w-16 h-16 flex items-center justify-center flex-shrink-0">
            <svg className="w-full h-full -rotate-90">
              <circle
                cx="32"
                cy="32"
                r={radius}
                className="stroke-slate-900 fill-none"
                strokeWidth={stroke}
              />
              <circle
                cx="32"
                cy="32"
                r={radius}
                className="stroke-emerald-500 fill-none transition-all duration-1000"
                strokeWidth={stroke}
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute text-xs font-black text-white">{healthScore}</span>
          </div>

          <div>
            <div className="text-xl font-extrabold text-white flex items-baseline gap-1">
              <span>{healthScore}</span>
              <span className="text-slate-500 text-xs font-medium">/100</span>
            </div>
            <div className="text-xs font-semibold text-emerald-400 mt-0.5">Good</div>
            <p className="text-[10px] text-slate-500 mt-1 leading-normal font-medium">Your codebase is in good health.</p>
          </div>
        </div>
      </div>

      {/* 2. Total Debt Score Card */}
      <div className={cardClassName}>
        <div className="flex items-center justify-between mb-3 text-slate-400">
          <span className="text-[10px] font-bold uppercase tracking-wider">Total Debt Score</span>
          <InfoTooltip content="Overall technical debt accumulated across flagged files, calculated based on code complexity and duplication." />
        </div>

        <div className="flex items-center gap-4 mt-2">
          <div className="w-12 h-12 rounded-xl bg-violet-950/30 border border-violet-900/30 text-violet-400 flex items-center justify-center flex-shrink-0">
            <Award className="w-5 h-5" />
          </div>

          <div>
            <h3 className="text-2xl font-extrabold text-white tracking-tight">{totalDebtScore}</h3>
            <div className={`text-xs font-semibold mt-0.5 ${debtLevel.color}`}>{debtLevel.label}</div>
            <p className="text-[10px] text-slate-500 mt-1 leading-normal font-medium">Assessed code debt rating</p>
          </div>
        </div>
      </div>

      {/* 3. Flagged Code Areas Card (Renamed from Flagged Files) */}
      <div className={cardClassName}>
        <div className="flex items-center justify-between mb-3 text-slate-400">
          <span className="text-[10px] font-bold uppercase tracking-wider">Flagged Code Areas</span>
          <InfoTooltip content="Total flagged issues across the repository that require review or refactoring." />
        </div>

        <div className="flex items-center gap-4 mt-2">
          <div className="w-12 h-12 rounded-xl bg-rose-950/30 border border-rose-900/30 text-rose-400 flex items-center justify-center flex-shrink-0">
            <Flag className="w-5 h-5" />
          </div>

          <div>
            <h3 className="text-2xl font-extrabold text-white tracking-tight">{flaggedFilesCount}</h3>
            <div className="text-xs font-semibold text-slate-400 mt-0.5">Flagged issues</div>
            <p className="text-[10px] text-slate-500 mt-1 leading-normal font-medium">Requiring refactoring</p>
          </div>
        </div>
      </div>

      {/* 4. Files Scanned Card */}
      <div className={cardClassName}>
        <div className="flex items-center justify-between mb-3 text-slate-400">
          <span className="text-[10px] font-bold uppercase tracking-wider">Files Scanned</span>
          <InfoTooltip content="Total number of source files scanned and analyzed inside the repository workspace." />
        </div>

        <div className="flex items-center gap-4 mt-2">
          <div className="w-12 h-12 rounded-xl bg-blue-950/30 border border-blue-900/30 text-blue-400 flex items-center justify-center flex-shrink-0">
            <FileText className="w-5 h-5" />
          </div>

          <div>
            <h3 className="text-2xl font-extrabold text-white tracking-tight">{filesScannedCount}</h3>
            <div className="text-xs font-semibold text-slate-400 mt-0.5">Total files scanned</div>
            <p className="text-[10px] text-slate-500 mt-1 leading-normal font-medium">Inside scanned workspace</p>
          </div>
        </div>
      </div>
    </div>
  );
}
