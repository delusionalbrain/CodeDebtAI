'use client';

import React from 'react';
import { FlaggedFile } from '@/types/dashboard';
import { TrendingDown, BarChart3 } from 'lucide-react';

interface AnalyticsProps {
  files: FlaggedFile[];
}

export function Analytics({ files }: AnalyticsProps) {
  // Categorize files into priority brackets
  // Critical (Score > 40), Medium (Score 20-40), Low (Score < 20)
  const criticalCount = files.filter(f => f.priority_score > 40).length;
  const mediumCount = files.filter(f => f.priority_score >= 20 && f.priority_score <= 40).length;
  const lowCount = files.filter(f => f.priority_score < 20).length;

  const total = files.length || 1;
  const criticalPct = (criticalCount / total) * 100;
  const mediumPct = (mediumCount / total) * 100;
  const lowPct = (lowCount / total) * 100;

  return (
    <div className="rounded-xl border border-slate-900 bg-slate-950/40 backdrop-blur-sm p-6 flex flex-col h-full">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-violet-500" />
            <span>Priority Risk Distribution</span>
          </h3>
          <p className="text-xs text-slate-500 mt-1">Vulnerability severity segmentation based on backend priority scores</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold px-2.5 py-1 rounded bg-rose-950/20 border border-rose-900/30 text-rose-450">
          <TrendingDown className="w-3.5 h-3.5" />
          <span>{criticalCount} Critical Files</span>
        </div>
      </div>

      {/* Visual Bar representation */}
      <div className="flex-1 w-full bg-slate-950/60 border border-slate-900 rounded-lg p-6 flex flex-col justify-center gap-6 min-h-[220px]">
        {/* Tier 1: Critical Risk */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-rose-400">Critical Priority (&gt; 40)</span>
            <span className="text-slate-400">{criticalCount} file(s) ({Math.round(criticalPct)}%)</span>
          </div>
          <div className="h-3 w-full bg-slate-900 rounded-full overflow-hidden">
            <div
              style={{ width: `${criticalPct}%` }}
              className="bg-gradient-to-r from-rose-600 to-red-500 h-full rounded-full transition-all duration-500"
            />
          </div>
        </div>

        {/* Tier 2: Medium Risk */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-amber-400">Medium Priority (20-40)</span>
            <span className="text-slate-400">{mediumCount} file(s) ({Math.round(mediumPct)}%)</span>
          </div>
          <div className="h-3 w-full bg-slate-900 rounded-full overflow-hidden">
            <div
              style={{ width: `${mediumPct}%` }}
              className="bg-gradient-to-r from-amber-600 to-orange-500 h-full rounded-full transition-all duration-500"
            />
          </div>
        </div>

        {/* Tier 3: Low Risk */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-emerald-450">Low Priority (&lt; 20)</span>
            <span className="text-slate-400">{lowCount} file(s) ({Math.round(lowPct)}%)</span>
          </div>
          <div className="h-3 w-full bg-slate-900 rounded-full overflow-hidden">
            <div
              style={{ width: `${lowPct}%` }}
              className="bg-gradient-to-r from-emerald-600 to-teal-500 h-full rounded-full transition-all duration-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
