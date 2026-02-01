import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore } from '@/store/useAppStore';
import type { Question } from '@/types';

function makeQuestion(id: number, text = `Q${id}`): Question {
  return {
    id,
    text,
    seriousnessLevel: 3,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

describe('useAppStore', () => {
  beforeEach(() => {
    // Reset store to defaults before each test
    useAppStore.setState({
      selectedCategories: [],
      seriousnessRange: [1, 5],
      questionQuantity: 15,
      spinDuration: 2,
      questions: [],
      remainingQuestions: [],
      isSpinning: false,
      isGenerating: false,
      selectedQuestion: null,
      spinAngle: 0,
      revealPhase: 'idle',
      initialLoadReady: false,
    });
  });

  describe('default values', () => {
    it('has expected defaults', () => {
      const state = useAppStore.getState();
      expect(state.selectedCategories).toEqual([]);
      expect(state.seriousnessRange).toEqual([1, 5]);
      expect(state.questionQuantity).toBe(15);
      expect(state.spinDuration).toBe(2);
      expect(state.questions).toEqual([]);
      expect(state.isSpinning).toBe(false);
      expect(state.isGenerating).toBe(false);
      expect(state.selectedQuestion).toBeNull();
      expect(state.revealPhase).toBe('idle');
    });
  });

  describe('filter actions', () => {
    it('setCategories updates selectedCategories', () => {
      useAppStore.getState().setCategories(['Fun', 'Serious']);
      expect(useAppStore.getState().selectedCategories).toEqual(['Fun', 'Serious']);
    });

    it('setSeriousnessRange updates range', () => {
      useAppStore.getState().setSeriousnessRange([2, 4]);
      expect(useAppStore.getState().seriousnessRange).toEqual([2, 4]);
    });

    it('setQuestionQuantity updates quantity', () => {
      useAppStore.getState().setQuestionQuantity(20);
      expect(useAppStore.getState().questionQuantity).toBe(20);
    });

    it('setSpinDuration updates duration', () => {
      useAppStore.getState().setSpinDuration(4);
      expect(useAppStore.getState().spinDuration).toBe(4);
    });

    it('resetFilters restores defaults', () => {
      const store = useAppStore.getState();
      store.setCategories(['X']);
      store.setSeriousnessRange([3, 3]);
      store.setQuestionQuantity(5);
      store.setSpinDuration(1);

      useAppStore.getState().resetFilters();

      const state = useAppStore.getState();
      expect(state.selectedCategories).toEqual([]);
      expect(state.seriousnessRange).toEqual([1, 5]);
      expect(state.questionQuantity).toBe(15);
      expect(state.spinDuration).toBe(2);
    });
  });

  describe('wheel actions', () => {
    it('setQuestions resets related state', () => {
      const qs = [makeQuestion(1), makeQuestion(2)];
      useAppStore.getState().setQuestions(qs);

      const state = useAppStore.getState();
      expect(state.questions).toEqual(qs);
      expect(state.remainingQuestions).toEqual(qs);
      expect(state.selectedQuestion).toBeNull();
      expect(state.spinAngle).toBe(0);
    });

    it('completeSpin sets selectedQuestion and revealPhase', () => {
      const q = makeQuestion(1);
      useAppStore.getState().completeSpin(q, 720);

      const state = useAppStore.getState();
      expect(state.isSpinning).toBe(false);
      expect(state.selectedQuestion).toEqual(q);
      expect(state.spinAngle).toBe(720);
      expect(state.revealPhase).toBe('anticipating');
    });

    it('removeQuestion filters by id and clears selectedQuestion', () => {
      const qs = [makeQuestion(1), makeQuestion(2), makeQuestion(3)];
      useAppStore.getState().setQuestions(qs);
      useAppStore.getState().removeQuestion(2);

      const state = useAppStore.getState();
      expect(state.remainingQuestions.map((q) => q.id)).toEqual([1, 3]);
      expect(state.selectedQuestion).toBeNull();
    });

    it('dismissReveal clears revealPhase and selectedQuestion', () => {
      const q = makeQuestion(1);
      useAppStore.getState().completeSpin(q, 100);
      useAppStore.getState().dismissReveal();

      const state = useAppStore.getState();
      expect(state.revealPhase).toBe('idle');
      expect(state.selectedQuestion).toBeNull();
    });
  });

  describe('generating actions', () => {
    it('startGenerating sets isGenerating to true', () => {
      useAppStore.getState().startGenerating();
      expect(useAppStore.getState().isGenerating).toBe(true);
    });

    it('stopGenerating sets isGenerating false and loads questions', () => {
      useAppStore.getState().startGenerating();
      const qs = [makeQuestion(10)];
      useAppStore.getState().stopGenerating(qs);

      const state = useAppStore.getState();
      expect(state.isGenerating).toBe(false);
      expect(state.questions).toEqual(qs);
      expect(state.remainingQuestions).toEqual(qs);
      expect(state.selectedQuestion).toBeNull();
      expect(state.spinAngle).toBe(0);
    });
  });
});
