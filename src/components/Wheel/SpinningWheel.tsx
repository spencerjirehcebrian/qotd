'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { WheelSegment } from './WheelSegment';
import { WheelPointer } from './WheelPointer';
import { WheelControls } from './WheelControls';
import { useWheel, useFilter } from '@/store/hooks';
import type { SpinDuration } from '@/types';

const SPIN_CONFIGS: Record<SpinDuration, { velocity: number; friction: number }> = {
  1: { velocity: 0.4, friction: 0.955 },
  2: { velocity: 1.0, friction: 0.970 },
  3: { velocity: 2.0, friction: 0.982 },
  4: { velocity: 3.0, friction: 0.988 },
};
import { useWheelPhysics } from '@/hooks/useWheelPhysics';
import { useWheelSound } from '@/hooks/useWheelSound';
import { useGenerateAnimation } from '@/hooks/useGenerateAnimation';
export function SpinningWheel() {
  const { state, startSpin, completeSpin } = useWheel();
  const { state: filterState } = useFilter();

  // Reduced-motion detection
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initializes from browser media query on mount
    setPrefersReducedMotion(mql.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  // Reduced-motion fade state
  const [showReducedResult, setShowReducedResult] = useState(false);

  const { onSegmentCross, onLand } = useWheelSound();

  // Segment crossing just fires sound -- pointer physics are handled by the sim
  const handleSegmentCross = useCallback(
    (index: number) => {
      onSegmentCross(index);
    },
    [onSegmentCross]
  );

  const handleSpinStart = useCallback(() => {
    startSpin();
  }, [startSpin]);

  // Flashing segment index after landing
  const [flashingIndex, setFlashingIndex] = useState<number | null>(null);

  const handleSpinComplete = useCallback(
    (segmentIndex: number) => {
      const winningQuestion = state.questions[segmentIndex];
      if (winningQuestion) {
        onLand();
        setFlashingIndex(segmentIndex);
        setTimeout(() => {
          setFlashingIndex(null);
          completeSpin(winningQuestion, 0);
        }, 900);
      }
    },
    [state.questions, onLand, completeSpin]
  );

  const { wheelRef, spin, isSpinning, pointerAngle, sim } = useWheelPhysics({
    segmentCount: state.questions.length,
    onSegmentCross: handleSegmentCross,
    onSpinStart: handleSpinStart,
    onSpinComplete: handleSpinComplete,
    enabled: !prefersReducedMotion,
    velocityScale: SPIN_CONFIGS[filterState.spinDuration].velocity,
    friction: SPIN_CONFIGS[filterState.spinDuration].friction,
  });

  const { isGenerating } = useGenerateAnimation(wheelRef, sim);

  // Snapshot selected categories when questions change (not on every filter toggle)
  const [categoriesAtFetch, setCategoriesAtFetch] = useState<string[]>(filterState.selectedCategories);
  useEffect(() => {
    setCategoriesAtFetch(filterState.selectedCategories);
  }, [state.questions]); // eslint-disable-line react-hooks/exhaustive-deps -- intentionally captures filter at question-load time

  // Reduced-motion spin: immediately pick a random segment, no physics
  const spinReduced = useCallback(() => {
    if (state.questions.length === 0) return;
    startSpin();
    const randomIndex = Math.floor(Math.random() * state.questions.length);
    const winningQuestion = state.questions[randomIndex];
    if (winningQuestion) {
      setShowReducedResult(true);
      setTimeout(() => {
        onLand();
        completeSpin(winningQuestion, 0);
      }, 150);
    }
  }, [state.questions, startSpin, onLand, completeSpin]);

  // Reset fade state when questions change
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- resets derived UI state when source data changes
    setShowReducedResult(false);
  }, [state.questions]);

  const effectiveSpin = prefersReducedMotion ? spinReduced : spin;

  // Tooltip state
  const [tooltipIndex, setTooltipIndex] = useState<number | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const tooltipTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingIndexRef = useRef<number | null>(null);

  const handleSegmentHoverStart = useCallback((index: number) => {
    if (isSpinning) return;
    pendingIndexRef.current = index;
    if (tooltipTimerRef.current) clearTimeout(tooltipTimerRef.current);
    tooltipTimerRef.current = setTimeout(() => {
      setTooltipIndex(pendingIndexRef.current);
    }, 400);
  }, [isSpinning]);

  const handleSegmentHoverEnd = useCallback(() => {
    pendingIndexRef.current = null;
    if (tooltipTimerRef.current) {
      clearTimeout(tooltipTimerRef.current);
      tooltipTimerRef.current = null;
    }
    setTooltipIndex(null);
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (tooltipIndex !== null || pendingIndexRef.current !== null) {
      setTooltipPos({
        x: e.clientX,
        y: e.clientY,
      });
    }
  }, [tooltipIndex]);

  // Hide tooltip while spinning and clean up timer
  useEffect(() => {
    if (isSpinning) {
      if (tooltipTimerRef.current) {
        clearTimeout(tooltipTimerRef.current);
        tooltipTimerRef.current = null;
      }
      pendingIndexRef.current = null;
      // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional cleanup when spinning starts
      setTooltipIndex(null);
    }
  }, [isSpinning]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (tooltipTimerRef.current) clearTimeout(tooltipTimerRef.current);
    };
  }, []);

  const tooltipQuestion = tooltipIndex !== null ? state.questions[tooltipIndex] : null;

  const radius = 200;
  const centerX = radius;
  const centerY = radius;

  // During generation, show placeholder segments even if questions are empty
  const segmentCount = isGenerating
    ? (state.questions.length > 0 ? state.questions.length : filterState.questionQuantity)
    : state.questions.length;

  // Build placeholder question stubs for rendering during generation
  const placeholderQuestions: import('@/types').Question[] = isGenerating && state.questions.length === 0
    ? Array.from({ length: segmentCount }, (_, i) => ({
        id: -(i + 1),
        text: '',
        seriousnessLevel: 3,
        createdAt: new Date(),
        updatedAt: new Date(),
      }))
    : [];

  const displayQuestions = isGenerating
    ? (state.questions.length > 0 ? state.questions : placeholderQuestions)
    : state.questions;

  // Compute peg positions at segment boundaries (on the outer rim)
  const pegRadius = radius - 2;
  const pegs = displayQuestions.map((_, index) => {
    const angle = (index * (360 / displayQuestions.length) - 90) * (Math.PI / 180);
    return {
      x: centerX + pegRadius * Math.cos(angle),
      y: centerY + pegRadius * Math.sin(angle),
    };
  });

  if (state.questions.length === 0 && !isGenerating) {
    return (
      <div className="flex flex-col items-center justify-center h-80 w-full max-w-md rounded-xl border border-dashed border-border">
        <div className="text-center px-6">
          <h3 className="text-lg font-display text-ink mb-2">
            No Questions Yet
          </h3>
          <p className="text-sm text-muted">
            Generate questions to start spinning
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <div
        ref={containerRef}
        className="relative"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleSegmentHoverEnd}
        style={
          prefersReducedMotion && showReducedResult
            ? { opacity: 0.7, transition: 'opacity 0.3s ease' }
            : { opacity: 1, transition: 'opacity 0.3s ease' }
        }
      >
        <WheelPointer angle={pointerAngle} />

        <div
          ref={wheelRef}
          className="w-[min(90vw,600px)] aspect-square mx-auto"
          style={{ transformOrigin: 'center center' }}
        >
          <svg
            viewBox="0 0 400 400"
            className="w-full h-full"
            style={{
              filter: isGenerating
                ? 'drop-shadow(0 2px 20px rgba(30, 30, 50, 0.08)) saturate(0.15) brightness(1.05)'
                : 'drop-shadow(0 2px 20px rgba(30, 30, 50, 0.08)) saturate(1) brightness(1)',
              transition: 'filter 0.4s ease-in-out',
            }}
          >
            {displayQuestions.map((question, index) => (
              <WheelSegment
                key={question.id}
                question={question}
                index={index}
                totalSegments={displayQuestions.length}
                radius={radius}
                centerX={centerX}
                centerY={centerY}
                isWinner={!isGenerating && state.selectedQuestion?.id === question.id}
                isFlashing={!isGenerating && flashingIndex === index}
                isPlaceholder={isGenerating}
                selectedCategories={categoriesAtFetch}
                onHoverStart={isGenerating ? undefined : handleSegmentHoverStart}
                onHoverEnd={isGenerating ? undefined : handleSegmentHoverEnd}
              />
            ))}

            {/* Pegs at segment boundaries */}
            {pegs.map((peg, i) => (
              <g key={`peg-${i}`}>
                {/* Peg shadow */}
                <circle
                  cx={peg.x + 0.3}
                  cy={peg.y + 0.3}
                  r="2.8"
                  fill="rgba(0,0,0,0.15)"
                />
                {/* Peg body */}
                <circle
                  cx={peg.x}
                  cy={peg.y}
                  r="2.8"
                  fill="#e8e8e0"
                  stroke="#c0c0b8"
                  strokeWidth="0.6"
                />
                {/* Peg highlight */}
                <circle
                  cx={peg.x - 0.6}
                  cy={peg.y - 0.6}
                  r="0.9"
                  fill="rgba(255,255,255,0.5)"
                />
              </g>
            ))}

            {/* Center circle (seat for spin button) */}
            <circle
              cx={centerX}
              cy={centerY}
              r="36"
              fill="#fafaf9"
              stroke="#2a2a35"
              strokeWidth="1.5"
            />
          </svg>
        </div>

        {/* Center spin button overlay */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="pointer-events-auto" style={{ width: '18%', aspectRatio: '1' }}>
            <WheelControls spin={effectiveSpin} isSpinning={isSpinning || isGenerating} />
          </div>
        </div>

        {/* Custom tooltip */}
        {tooltipQuestion && (
          <div
            className="fixed z-[9999] pointer-events-none
              max-w-[260px] px-3.5 py-2.5
              bg-canvas/95 backdrop-blur-sm
              border border-border rounded-lg
              shadow-soft"
            style={{
              left: tooltipPos.x,
              top: tooltipPos.y,
              transform: 'translate(-50%, calc(-100% - 12px))',
            }}
          >
            <span className="block text-sm font-body text-ink leading-snug">
              {tooltipQuestion.text}
            </span>
          </div>
        )}
      </div>

    </div>
  );
}
