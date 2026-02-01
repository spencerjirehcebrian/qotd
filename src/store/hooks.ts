'use client';

import { useShallow } from 'zustand/react/shallow';
import { useAppStore } from './useAppStore';
import { FilterState, WheelState, Question, SpinDuration } from '@/types';

interface FilterHook {
  state: FilterState;
  setCategories: (categories: string[]) => void;
  setSeriousnessRange: (range: [number, number]) => void;
  setQuestionQuantity: (quantity: number) => void;
  setSpinDuration: (duration: SpinDuration) => void;
  resetFilters: () => void;
}

export function useFilter(): FilterHook {
  const state: FilterState = useAppStore(useShallow((s) => ({
    selectedCategories: s.selectedCategories,
    seriousnessRange: s.seriousnessRange,
    questionQuantity: s.questionQuantity,
    spinDuration: s.spinDuration,
  })));

  const setCategories = useAppStore((s) => s.setCategories);
  const setSeriousnessRange = useAppStore((s) => s.setSeriousnessRange);
  const setQuestionQuantity = useAppStore((s) => s.setQuestionQuantity);
  const setSpinDuration = useAppStore((s) => s.setSpinDuration);
  const resetFilters = useAppStore((s) => s.resetFilters);

  return { state, setCategories, setSeriousnessRange, setQuestionQuantity, setSpinDuration, resetFilters };
}

interface WheelHook {
  state: WheelState;
  setQuestions: (questions: Question[]) => void;
  startSpin: () => void;
  completeSpin: (question: Question, angle: number) => void;
  resetWheel: () => void;
  removeQuestion: (questionId: number) => void;
  startReveal: () => void;
  dismissReveal: () => void;
  startGenerating: () => void;
  stopGenerating: (questions: Question[]) => void;
}

export function useWheel(): WheelHook {
  const state: WheelState = useAppStore(useShallow((s) => ({
    questions: s.questions,
    isSpinning: s.isSpinning,
    isGenerating: s.isGenerating,
    selectedQuestion: s.selectedQuestion,
    spinAngle: s.spinAngle,
    remainingQuestions: s.remainingQuestions,
    revealPhase: s.revealPhase,
  })));

  const setQuestions = useAppStore((s) => s.setQuestions);
  const startSpin = useAppStore((s) => s.startSpin);
  const completeSpin = useAppStore((s) => s.completeSpin);
  const resetWheel = useAppStore((s) => s.resetWheel);
  const removeQuestion = useAppStore((s) => s.removeQuestion);
  const startReveal = useAppStore((s) => s.startReveal);
  const dismissReveal = useAppStore((s) => s.dismissReveal);
  const startGenerating = useAppStore((s) => s.startGenerating);
  const stopGenerating = useAppStore((s) => s.stopGenerating);

  return {
    state,
    setQuestions,
    startSpin,
    completeSpin,
    resetWheel,
    removeQuestion,
    startReveal,
    dismissReveal,
    startGenerating,
    stopGenerating,
  };
}
