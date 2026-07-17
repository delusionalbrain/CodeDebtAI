'use client';

import React from 'react';
import { FlaggedFile } from '@/types/dashboard';

interface SummaryProps {
  files: FlaggedFile[];
}

export function Summary({ files }: SummaryProps) {
  // Compute complexity grade breakdown dynamically from backend response files list
  const grades = {
    A: files.filter(f => f.complexity_grade.toUpperCase() === 'A').length,
    B: files.filter(f => f.complexity_grade.toUpperCase() === 'B').length,
    C: files.filter(f => f.complexity_grade.toUpperCase() === 'C').length,
    D: files.filter(f => f.complexity_grade.toUpperCase() === 'D').length,
    E: files.filter(f => f.complexity_grade.toUpperCase() === 'E').length,
    F: files.filter(f => f.complexity_grade.toUpperCase() === 'F').length,
  };

  const totalGrades = files.length || 1;

  const getComplexityGradeColor = (grade: string) => {
    switch (grade) {
      case 'A': return 'bg-emerald-500';
      case 'B': return 'bg-teal-500';
      case 'C': return 'bg-amber-500';
      case 'D': return 'bg-orange-500';
      case 'E': return 'bg-rose-400';
      default: return 'bg-rose-600';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Radon Grade Distribution */}
      <div className="rounded-xl border border-slate-900 bg-slate-950/40 backdrop-blur-sm p-6">
        <h3 className="text-base font-bold text-white mb-1">Complexity Grade Distribution</h3>
        <p className="text-xs text-slate-500 mb-6">File counts segmented by Radon complexity grades</p>
        
        <div className="space-y-4">
          {/* Stacked progress bar representing distribution */}
          <div className="h-3 w-full rounded-full bg-slate-900 flex overflow-hidden">
            {Object.entries(grades).map(([grade, count]) => {
              if (count === 0) return null;
              const pct = (count / totalGrades) * 100;
              return (
                <div
                  key={grade}
                  style={{ width: `${pct}%` }}
                  className={`${getComplexityGradeColor(grade)} h-full transition-all duration-300`}
                  title={`Grade ${grade}: ${count} files (${pct.toFixed(1)}%)`}
                />
              );
            })}
          </div>

          {/* Legend Grid */}
          <div className="grid grid-cols-3 gap-3">
            {Object.entries(grades).map(([grade, count]) => {
              const pct = (count / totalGrades) * 100;
              return (
                <div key={grade} className="flex items-center gap-2 p-2 rounded-lg bg-slate-950 border border-slate-900">
                  <span className={`w-2.5 h-2.5 rounded ${getComplexityGradeColor(grade)}`} />
                  <div>
                    <div className="text-xs font-black text-white">Grade {grade}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      {count} files ({Math.round(pct)}%)
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Analysis Reason Details */}
      <div className="rounded-xl border border-slate-900 bg-slate-950/40 backdrop-blur-sm p-6">
        <h3 className="text-base font-bold text-white mb-1">Issue Overview</h3>
        <p className="text-xs text-slate-500 mb-6">Static code analysis reasoning breakdown</p>

        <div className="space-y-4 max-h-[160px] overflow-y-auto pr-1">
          {files.map((file, idx) => {
            const fileName = file.file_path.split(/[\\/]/).pop() || '';
            return (
              <div key={idx} className="flex justify-between items-start gap-4 p-3 rounded-lg bg-slate-950 border border-slate-900">
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-200 truncate">{fileName}</div>
                  <div className="text-[10px] text-slate-500 mt-1 truncate">{file.reason}</div>
                </div>
                <span className="text-[10px] font-semibold text-rose-450 bg-rose-950/20 border border-rose-900/30 px-2 py-0.5 rounded flex-shrink-0">
                  Priority {file.priority_score}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
