'use client';

import React, { useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useFilter } from '@/store/hooks';
import { SERIOUSNESS_SHORT_LABELS, SeriousnessLevel } from '@/types';
import { cn } from '@/lib/utils';
import { TWEENS } from '@/lib/motion';

const LEVELS: SeriousnessLevel[] = [1, 2, 3, 4, 5];

/** CSS variable references for each seriousness level */
const LEVEL_COLORS: Record<SeriousnessLevel, string> = {
  1: 'var(--color-serious-1)',
  2: 'var(--color-serious-2)',
  3: 'var(--color-serious-3)',
  4: 'var(--color-serious-4)',
  5: 'var(--color-serious-5)',
};

interface SeriousnessFilterProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function SeriousnessFilter({ isOpen, onToggle }: SeriousnessFilterProps) {
  const { state, setSeriousnessRange } = useFilter();
  const [min, max] = state.seriousnessRange;

  const handleLevelTap = (level: number) => {
    let newMin = min;
    let newMax = max;

    if (level < min) {
      newMin = level;
    } else if (level > max) {
      newMax = level;
    } else if (level === min && min === max) {
      newMin = 1;
      newMax = 5;
    } else if (level === min) {
      const next = min + 1;
      if (next > max) {
        newMin = 1;
        newMax = 5;
      } else {
        newMin = next;
      }
    } else if (level === max) {
      const prev = max - 1;
      if (prev < min) {
        newMin = 1;
        newMax = 5;
      } else {
        newMax = prev;
      }
    } else {
      const distToMin = level - min;
      const distToMax = max - level;
      if (distToMin < distToMax) {
        newMin = level;
      } else {
        newMax = level;
      }
    }

    setSeriousnessRange([newMin, newMax] as [number, number]);
  };

  /** Build a gradient string spanning only the active range */
  const gradientStyle = useMemo(() => {
    const minColor = LEVEL_COLORS[min as SeriousnessLevel];
    const maxColor = LEVEL_COLORS[max as SeriousnessLevel];

    // Each button occupies 20% of the row width
    const leftPct = ((min - 1) / LEVELS.length) * 100;
    const rightPct = (max / LEVELS.length) * 100;

    return {
      background: `linear-gradient(to right, ${minColor}, ${maxColor})`,
      left: `${leftPct}%`,
      width: `${rightPct - leftPct}%`,
    };
  }, [min, max]);

  return (
    <div>
      {/* Accordion header */}
      <button
        type="button"
        onClick={onToggle}
        className="flex items-center justify-between w-full py-3 cursor-pointer group"
      >
        <span className="text-xs uppercase tracking-widest text-muted font-medium">Seriousness</span>
        <div className="flex items-center gap-2">
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            className={cn(
              'text-muted transition-transform duration-200',
              isOpen && 'rotate-180'
            )}
          >
            <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </button>

      {/* Collapsible body */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={TWEENS.gentle}
            className="overflow-hidden"
          >
            <div
              role="group"
              aria-label="Seriousness level"
              className="relative flex rounded-lg border border-border overflow-hidden mb-3"
            >
              {/* Animated gradient fill behind active range */}
              <motion.div
                className="absolute inset-y-0 rounded-sm pointer-events-none"
                style={gradientStyle}
                layout
                transition={TWEENS.gentle}
              />

              {LEVELS.map((level, i) => {
                const isInRange = level >= min && level <= max;
                return (
                  <button
                    key={level}
                    onClick={() => handleLevelTap(level)}
                    aria-pressed={isInRange}
                    title={SERIOUSNESS_SHORT_LABELS[level]}
                    className={cn(
                      'relative z-10 flex-1 text-center text-xs font-medium py-2.5 transition-colors duration-150 cursor-pointer',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/20 focus-visible:ring-inset',
                      i < LEVELS.length - 1 && 'border-r border-border',
                      isInRange
                        ? 'text-ink/80'
                        : 'text-muted hover:bg-ink/5'
                    )}
                  >
                    {SERIOUSNESS_SHORT_LABELS[level]}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
