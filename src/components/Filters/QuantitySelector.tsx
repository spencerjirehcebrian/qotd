'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useFilter } from '@/store/hooks';

const MIN = 1;
const MAX = 30;

export function QuantitySelector() {
  const { state, setQuestionQuantity } = useFilter();
  const [draft, setDraft] = useState(String(state.questionQuantity));

  useEffect(() => {
    setDraft(String(state.questionQuantity));
  }, [state.questionQuantity]);

  const commit = useCallback(
    (raw: string) => {
      const n = parseInt(raw, 10);
      if (isNaN(n) || n < MIN) {
        setQuestionQuantity(MIN);
        setDraft(String(MIN));
      } else if (n > MAX) {
        setQuestionQuantity(MAX);
        setDraft(String(MAX));
      } else {
        setQuestionQuantity(n);
        setDraft(String(n));
      }
    },
    [setQuestionQuantity]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    if (v === '' || /^\d+$/.test(v)) {
      setDraft(v);
    }
  };

  const handleBlur = () => commit(draft);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      commit(draft);
      (e.target as HTMLInputElement).blur();
    }
  };

  const handleQuantityChange = (value: number) => {
    setQuestionQuantity(value);
  };

  const canDecrease = state.questionQuantity > MIN;
  const canIncrease = state.questionQuantity < MAX;

  return (
    <div className="space-y-3">
      <h3 className="text-xs uppercase tracking-widest text-muted font-medium">Questions</h3>

      <div className="flex items-center gap-3">
        <button
          type="button"
          disabled={!canDecrease}
          onClick={() => handleQuantityChange(state.questionQuantity - 1)}
          aria-label="Decrease question count"
          className={`w-9 h-9 rounded-lg border border-border hover:bg-ink/5 flex items-center justify-center text-base font-medium text-ink transition-colors ${
            !canDecrease ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'
          }`}
        >
          &minus;
        </button>

        <input
          type="text"
          inputMode="numeric"
          value={draft}
          onChange={handleChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          aria-label="Question count"
          className="text-xl font-medium font-display text-ink tabular-nums w-10 text-center bg-transparent border-none outline-none p-0 m-0 appearance-none"
        />

        <button
          type="button"
          disabled={!canIncrease}
          onClick={() => handleQuantityChange(state.questionQuantity + 1)}
          aria-label="Increase question count"
          className={`w-9 h-9 rounded-lg border border-border hover:bg-ink/5 flex items-center justify-center text-base font-medium text-ink transition-colors ${
            !canIncrease ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'
          }`}
        >
          +
        </button>
      </div>
    </div>
  );
}
