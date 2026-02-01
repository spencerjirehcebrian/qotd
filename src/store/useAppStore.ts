'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Question, RevealPhase, SpinDuration } from '@/types';

interface AppState {
  // Persisted — filter
  selectedCategories: string[];
  seriousnessRange: [number, number];
  questionQuantity: number;
  spinDuration: SpinDuration;

  // Persisted — wheel data
  questions: Question[];
  remainingQuestions: Question[];

  // Transient — wheel UI
  isSpinning: boolean;
  isGenerating: boolean;
  selectedQuestion: Question | null;
  spinAngle: number;
  revealPhase: RevealPhase;
  initialLoadReady: boolean;

  // Filter actions
  setCategories: (categories: string[]) => void;
  setSeriousnessRange: (range: [number, number]) => void;
  setQuestionQuantity: (quantity: number) => void;
  setSpinDuration: (duration: SpinDuration) => void;
  resetFilters: () => void;

  // Wheel actions
  setQuestions: (questions: Question[]) => void;
  startSpin: () => void;
  completeSpin: (question: Question, angle: number) => void;
  resetWheel: () => void;
  removeQuestion: (questionId: number) => void;
  startReveal: () => void;
  dismissReveal: () => void;
  startGenerating: () => void;
  stopGenerating: (questions: Question[]) => void;
  setInitialLoadReady: () => void;
}

const DEFAULT_FILTERS = {
  selectedCategories: [] as string[],
  seriousnessRange: [1, 5] as [number, number],
  questionQuantity: 15,
  spinDuration: 2 as SpinDuration,
};

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // Filter state
      ...DEFAULT_FILTERS,

      // Wheel data
      questions: [],
      remainingQuestions: [],

      // Transient
      isSpinning: false,
      isGenerating: false,
      selectedQuestion: null,
      spinAngle: 0,
      revealPhase: 'idle' as RevealPhase,
      initialLoadReady: false,

      // Filter actions
      setCategories: (categories) => set({ selectedCategories: categories }),
      setSeriousnessRange: (range) => set({ seriousnessRange: range }),
      setQuestionQuantity: (quantity) => set({ questionQuantity: quantity }),
      setSpinDuration: (duration) => set({ spinDuration: duration }),
      resetFilters: () => set(DEFAULT_FILTERS),

      // Wheel actions
      setQuestions: (questions) =>
        set({
          questions,
          remainingQuestions: questions,
          selectedQuestion: null,
          spinAngle: 0,
        }),
      startSpin: () => set({ isSpinning: true }),
      completeSpin: (question, angle) =>
        set({
          isSpinning: false,
          selectedQuestion: question,
          spinAngle: angle,
          revealPhase: 'anticipating',
        }),
      resetWheel: () =>
        set({
          questions: [],
          isSpinning: false,
          selectedQuestion: null,
          spinAngle: 0,
          remainingQuestions: [],
          revealPhase: 'idle',
        }),
      removeQuestion: (questionId) =>
        set((s) => ({
          remainingQuestions: s.remainingQuestions.filter((q) => q.id !== questionId),
          selectedQuestion: null,
        })),
      startReveal: () => set({ revealPhase: 'anticipating' }),
      dismissReveal: () => set({ revealPhase: 'idle', selectedQuestion: null }),
      startGenerating: () => set({ isGenerating: true }),
      stopGenerating: (questions) =>
        set({
          isGenerating: false,
          questions,
          remainingQuestions: questions,
          selectedQuestion: null,
          spinAngle: 0,
        }),
      setInitialLoadReady: () => set({ initialLoadReady: true }),
    }),
    {
      name: 'qotd-app-store',
      partialize: (state) => ({
        selectedCategories: state.selectedCategories,
        seriousnessRange: state.seriousnessRange,
        questionQuantity: state.questionQuantity,
        spinDuration: state.spinDuration,
        questions: state.questions,
        remainingQuestions: state.remainingQuestions,
      }),
      onRehydrateStorage: () => {
        return (_state, error) => {
          if (error) return;
          // Migrate old localStorage key if present
          if (typeof window !== 'undefined') {
            const old = localStorage.getItem('qotd-user-preferences');
            if (old) {
              try {
                const parsed = JSON.parse(old);
                useAppStore.setState({
                  selectedCategories: parsed.selectedCategories ?? [],
                  seriousnessRange: parsed.seriousnessRange ?? [1, 5],
                  questionQuantity: parsed.questionQuantity ?? 15,
                });
              } catch {
                // ignore malformed data
              }
              localStorage.removeItem('qotd-user-preferences');
            }
          }
        };
      },
    }
  )
);
