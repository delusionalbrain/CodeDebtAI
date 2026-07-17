'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

interface InfoTooltipProps {
  content: string;
}

export function InfoTooltip({ content }: InfoTooltipProps) {
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number; position: 'top' | 'bottom' } | null>(null);
  const iconRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const handleMouseEnter = () => {
    if (!iconRef.current) return;
    const rect = iconRef.current.getBoundingClientRect();
    
    // Calculate page offsets
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

    // Detect vertical space (prefer top, fallback to bottom if space is restricted)
    const position = rect.top < 130 ? 'bottom' : 'top';
    
    let tooltipTop = 0;
    // Centered horizontally relative to icon
    let tooltipLeft = rect.left + rect.width / 2 + scrollLeft;

    if (position === 'top') {
      tooltipTop = rect.top + scrollTop - 8;
    } else {
      tooltipTop = rect.bottom + scrollTop + 8;
    }

    // Boundary checking: shift horizontally if near left/right window edges
    const tooltipWidth = 256; // matches width class w-64
    const horizontalMargin = 16;
    
    if (rect.left + rect.width / 2 < tooltipWidth / 2 + horizontalMargin) {
      // Near left boundary
      tooltipLeft = tooltipWidth / 2 + horizontalMargin;
    } else if (window.innerWidth - (rect.left + rect.width / 2) < tooltipWidth / 2 + horizontalMargin) {
      // Near right boundary
      tooltipLeft = window.innerWidth - tooltipWidth / 2 - horizontalMargin;
    }

    setCoords({
      top: tooltipTop,
      left: tooltipLeft,
      position
    });
    setVisible(true);
  };

  const handleMouseLeave = () => {
    setVisible(false);
  };

  return (
    <div 
      ref={iconRef}
      className="inline-flex items-center ml-1.5 cursor-help select-none"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleMouseEnter}
      onBlur={handleMouseLeave}
    >
      <Info className="w-3.5 h-3.5 text-slate-500 hover:text-slate-400 transition-colors" />
      
      {mounted && visible && coords && createPortal(
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: coords.position === 'top' ? 4 : -4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: coords.position === 'top' ? 4 : -4, scale: 0.95 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            style={{
              position: 'absolute',
              top: `${coords.top}px`,
              left: `${coords.left}px`,
              transform: coords.position === 'top' ? 'translate(-50%, -100%)' : 'translate(-50%, 0)',
              zIndex: 9999,
            }}
            className="w-64 bg-slate-950/95 border border-slate-800 text-slate-200 text-[11px] rounded-lg p-2.5 shadow-2xl backdrop-blur-md pointer-events-none text-center font-normal tracking-normal normal-case leading-normal font-sans"
          >
            {content}
            {/* arrow indicator */}
            <div 
              className={cn(
                "absolute left-1/2 -translate-x-1/2 border-4 border-transparent",
                coords.position === 'top' 
                  ? "top-full border-t-slate-950/95" 
                  : "bottom-full border-b-slate-950/95"
              )} 
            />
          </motion.div>
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}
