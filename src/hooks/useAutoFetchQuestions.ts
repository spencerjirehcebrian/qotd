'use client';

import { useEffect, useRef } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { fetchQuestions } from '@/utils/api';
import { fetchWithMinDuration } from '@/utils/fetchWithMinDuration';

export function useAutoFetchQuestions() {
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;

    const tryFetch = () => {
      const {
        questions,
        selectedCategories,
        seriousnessRange,
        questionQuantity,
        startGenerating,
        stopGenerating,
      } = useAppStore.getState();

      if (questions.length > 0 || fired.current) {
        useAppStore.getState().setInitialLoadReady();
        return;
      }
      fired.current = true;

      startGenerating();

      fetchWithMinDuration(() =>
        fetchQuestions({
          categories: selectedCategories,
          seriousnessMin: seriousnessRange[0],
          seriousnessMax: seriousnessRange[1],
          limit: questionQuantity,
        }),
      )
        .then((fetched) => {
          stopGenerating(fetched.length > 0 ? fetched : []);
          useAppStore.getState().setInitialLoadReady();
        })
        .catch((err) => {
          console.error('Auto-fetch questions failed:', err);
          stopGenerating([]);
          useAppStore.getState().setInitialLoadReady();
        });
    };

    // Wait for Zustand hydration before checking state
    const unsub = useAppStore.persist.onFinishHydration(tryFetch);

    // If already hydrated, fire immediately
    if (useAppStore.persist.hasHydrated()) {
      tryFetch();
    }

    return () => {
      unsub();
    };
  }, []);
}
