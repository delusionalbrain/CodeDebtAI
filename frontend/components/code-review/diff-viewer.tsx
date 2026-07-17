'use client';

import React, { useState } from 'react';
import { Columns, Eye, Code2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DiffLine } from '@/types/code-review';

interface DiffViewerProps {
  diff: DiffLine[];
  original: string;
  suggested: string;
  language: string;
}

export function DiffViewer({ diff, original, suggested, language }: DiffViewerProps) {
  const [viewMode, setViewMode] = useState<'split' | 'original' | 'suggested' | 'unified'>('split');

  // Align diff rows side-by-side for Split View
  const alignedRows: Array<{
    left?: { content: string; type: string; lineNum?: number };
    right?: { content: string; type: string; lineNum?: number };
  }> = [];

  let leftLineNum = 1;
  let rightLineNum = 1;
  let i = 0;

  while (i < diff.length) {
    const current = diff[i];

    if (current.type === 'context') {
      alignedRows.push({
        left: { content: current.content, type: 'context', lineNum: leftLineNum++ },
        right: { content: current.content, type: 'context', lineNum: rightLineNum++ }
      });
      i++;
    } else if (current.type === 'remove') {
      // Lookahead to see if we can pair this remove with a subsequent add
      if (i + 1 < diff.length && diff[i + 1].type === 'add') {
        alignedRows.push({
          left: { content: current.content, type: 'remove', lineNum: leftLineNum++ },
          right: { content: diff[i + 1].content, type: 'add', lineNum: rightLineNum++ }
        });
        i += 2;
      } else {
        alignedRows.push({
          left: { content: current.content, type: 'remove', lineNum: leftLineNum++ },
          right: undefined
        });
        i++;
      }
    } else if (current.type === 'add') {
      alignedRows.push({
        left: undefined,
        right: { content: current.content, type: 'add', lineNum: rightLineNum++ }
      });
      i++;
    } else {
      alignedRows.push({
        left: { content: current.content, type: 'context', lineNum: leftLineNum++ },
        right: { content: current.content, type: 'context', lineNum: rightLineNum++ }
      });
      i++;
    }
  }

  const originalLines = original.split('\n');
  const suggestedLines = suggested.split('\n');

  return (
    <div className="rounded-xl border border-slate-900 bg-slate-950/40 backdrop-blur-sm overflow-hidden flex flex-col h-full min-h-[480px]">
      {/* Diff Toolbar */}
      <div className="bg-slate-950 border-b border-slate-900 px-6 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Code2 className="w-4 h-4 text-slate-500" />
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Code Comparison ({language})
          </span>
        </div>

        {/* View Toggles */}
        <div className="flex rounded-lg bg-slate-900 p-0.5 border border-slate-850">
          <button
            onClick={() => setViewMode('split')}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer",
              viewMode === 'split' ? "bg-slate-800 text-white" : "text-slate-500 hover:text-slate-350"
            )}
          >
            <Columns className="w-3.5 h-3.5" />
            <span>Split Diff</span>
          </button>
          <button
            onClick={() => setViewMode('unified')}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer",
              viewMode === 'unified' ? "bg-slate-800 text-white" : "text-slate-500 hover:text-slate-350"
            )}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Unified Diff</span>
          </button>
          <button
            onClick={() => setViewMode('original')}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer",
              viewMode === 'original' ? "bg-slate-800 text-white" : "text-slate-500 hover:text-slate-350"
            )}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Original</span>
          </button>
          <button
            onClick={() => setViewMode('suggested')}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer",
              viewMode === 'suggested' ? "bg-slate-800 text-white" : "text-slate-500 hover:text-slate-350"
            )}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Suggested</span>
          </button>
        </div>
      </div>

      {/* Code Container */}
      <div className="flex-1 overflow-auto p-4 font-mono text-[12px] leading-6 bg-[#06080d]">
        {viewMode === 'split' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full min-w-[700px]">
            {/* Original Left Panel */}
            <div className="border border-slate-900 bg-slate-950/20 rounded-lg overflow-hidden flex flex-col h-full">
              <div className="bg-red-950/10 border-b border-slate-900 px-4 py-1.5 text-[10px] font-bold text-red-400 uppercase tracking-widest flex items-center justify-between">
                <span>Original Code</span>
              </div>
              <div className="p-4 overflow-x-auto flex-1 font-mono">
                <table className="w-full border-collapse">
                  <tbody>
                    {alignedRows.map((row, idx) => (
                      <tr
                        key={idx}
                        className={cn(
                          "hover:bg-slate-900/20",
                          row.left?.type === 'remove' ? "bg-red-950/20" : ""
                        )}
                      >
                        <td className="w-8 text-right pr-4 select-none text-slate-700 font-medium border-r border-slate-900/50">
                          {row.left?.lineNum || ''}
                        </td>
                        <td
                          className={cn(
                            "pl-4 whitespace-pre font-mono",
                            row.left?.type === 'remove' ? "text-red-300 font-semibold" : "text-slate-400"
                          )}
                        >
                          {row.left?.content || ' '}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Suggested Right Panel */}
            <div className="border border-slate-900 bg-slate-950/20 rounded-lg overflow-hidden flex flex-col h-full">
              <div className="bg-emerald-950/10 border-b border-slate-900 px-4 py-1.5 text-[10px] font-bold text-emerald-400 uppercase tracking-widest flex items-center justify-between">
                <span>Refactored Fix</span>
              </div>
              <div className="p-4 overflow-x-auto flex-1 font-mono">
                <table className="w-full border-collapse">
                  <tbody>
                    {alignedRows.map((row, idx) => (
                      <tr
                        key={idx}
                        className={cn(
                          "hover:bg-slate-900/20",
                          row.right?.type === 'add' ? "bg-emerald-950/15" : ""
                        )}
                      >
                        <td className="w-8 text-right pr-4 select-none text-slate-700 font-medium border-r border-slate-900/50">
                          {row.right?.lineNum || ''}
                        </td>
                        <td
                          className={cn(
                            "pl-4 whitespace-pre font-mono",
                            row.right?.type === 'add' ? "text-emerald-350 font-semibold" : "text-slate-400"
                          )}
                        >
                          {row.right?.content || ' '}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {viewMode === 'unified' && (
          <div className="border border-slate-900 bg-slate-950/20 rounded-lg overflow-hidden h-full">
            <div className="bg-slate-900/20 border-b border-slate-900 px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Unified Code Diff
            </div>
            <div className="p-4 overflow-x-auto h-full font-mono">
              <table className="w-full border-collapse">
                <tbody>
                  {diff.map((line, idx) => {
                    const isAdd = line.type === 'add';
                    const isRemove = line.type === 'remove';
                    return (
                      <tr
                        key={idx}
                        className={cn(
                          "hover:bg-slate-900/20",
                          isAdd ? "bg-emerald-950/15" : isRemove ? "bg-red-950/20" : ""
                        )}
                      >
                        <td className="w-6 text-center select-none text-slate-700 font-medium border-r border-slate-900/50">
                          {isAdd ? '+' : isRemove ? '-' : ' '}
                        </td>
                        <td
                          className={cn(
                            "pl-4 whitespace-pre font-mono",
                            isAdd ? "text-emerald-350 font-semibold" : isRemove ? "text-red-350 font-semibold" : "text-slate-400"
                          )}
                        >
                          {line.content || ' '}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {viewMode === 'original' && (
          <div className="border border-slate-900 bg-slate-950/20 rounded-lg overflow-hidden h-full">
            <div className="bg-red-950/10 border-b border-slate-900 px-4 py-2 text-[10px] font-bold text-red-400 uppercase tracking-widest">
              Original Code Snapshot
            </div>
            <div className="p-4 overflow-x-auto h-full font-mono">
              <table className="w-full border-collapse">
                <tbody>
                  {originalLines.map((line, idx) => (
                    <tr key={idx} className="hover:bg-slate-900/20">
                      <td className="w-8 text-right pr-4 select-none text-slate-700 border-r border-slate-900/50">
                        {idx + 1}
                      </td>
                      <td className="pl-4 whitespace-pre text-slate-300">
                        {line || ' '}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {viewMode === 'suggested' && (
          <div className="border border-slate-900 bg-slate-950/20 rounded-lg overflow-hidden h-full">
            <div className="bg-emerald-950/10 border-b border-slate-900 px-4 py-2 text-[10px] font-bold text-emerald-400 uppercase tracking-widest">
              AI Refactored Code Snapshot
            </div>
            <div className="p-4 overflow-x-auto h-full font-mono">
              <table className="w-full border-collapse">
                <tbody>
                  {suggestedLines.map((line, idx) => (
                    <tr key={idx} className="hover:bg-slate-900/20">
                      <td className="w-8 text-right pr-4 select-none text-slate-700 border-r border-slate-900/50">
                        {idx + 1}
                      </td>
                      <td className="pl-4 whitespace-pre text-slate-350">
                        {line || ' '}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
