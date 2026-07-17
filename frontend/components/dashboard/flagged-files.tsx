'use client';

import React from 'react';
import Link from 'next/link';
import { FlaggedFile } from '@/types/dashboard';
import { AlertCircle, Code2, ArrowRight } from 'lucide-react';

interface FlaggedFilesProps {
  files: FlaggedFile[];
}

export function FlaggedFiles({ files }: FlaggedFilesProps) {
  const getGradeColor = (grade: string) => {
    switch (grade.toUpperCase()) {
      case 'A':
      case 'B':
        return 'text-emerald-400 bg-emerald-950/20 border-emerald-900/30';
      case 'C':
        return 'text-amber-400 bg-amber-950/20 border-amber-900/30';
      case 'D':
        return 'text-orange-400 bg-orange-950/20 border-orange-900/30';
      default:
        return 'text-rose-400 bg-rose-950/20 border-rose-900/30';
    }
  };

  const getLanguage = (path: string) => {
    if (path.endsWith('.ts') || path.endsWith('.tsx')) return 'TypeScript';
    if (path.endsWith('.py')) return 'Python';
    if (path.endsWith('.js') || path.endsWith('.jsx')) return 'JavaScript';
    return 'Other';
  };

  return (
    <div className="rounded-xl border border-slate-900 bg-slate-950/40 backdrop-blur-sm p-6 flex flex-col h-full">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-base font-bold text-white">Flagged Files</h3>
          <p className="text-xs text-slate-500 mt-1">High debt candidates flagged by static Radon analysis</p>
        </div>
        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
          {files.length} Files Flagged
        </span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4">
        {files.map((file) => {
          const fileName = file.file_path.split(/[\\/]/).pop() || '';
          const language = getLanguage(file.file_path);
          const estimatedFixTime = `${Math.max(1, Math.round(file.priority_score / 10))}h`;

          return (
            <div
              key={file.file_path}
              className="group p-4 rounded-lg border border-slate-900 hover:border-slate-800 bg-slate-950/60 hover:bg-slate-900/30 transition-all duration-200"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="p-2 rounded bg-slate-900 text-slate-400 mt-0.5">
                    <Code2 className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-200 truncate group-hover:text-white transition-colors" title={file.file_path}>
                      {fileName}
                    </p>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-1 flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" />
                      <span className="truncate">{file.reason}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="text-right">
                    <div className="text-xs font-semibold text-slate-400">Priority: {file.priority_score}</div>
                    <div className="text-[10px] text-slate-500 mt-1">Est. fix: {estimatedFixTime}</div>
                  </div>
                  <div className={`px-2 py-1 text-xs font-black rounded border ${getGradeColor(file.complexity_grade)}`}>
                    {file.complexity_grade}
                  </div>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-900/60 flex items-center justify-between text-[11px]">
                <span className="text-slate-500 truncate max-w-[180px]" title={file.file_path}>
                  Path: <span className="font-semibold text-slate-400">{file.file_path}</span>
                </span>
                
                <Link
                  href={`/code-review?file=${encodeURIComponent(file.file_path)}`}
                  className="flex items-center gap-1 text-violet-400 hover:text-violet-300 font-semibold transition-colors flex-shrink-0"
                >
                  <span>Review Suggestions</span>
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
