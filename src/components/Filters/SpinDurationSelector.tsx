'use client';

import React from 'react';
import { useFilter } from '@/store/hooks';
import { SPIN_DURATION_LABELS, SpinDuration } from '@/types';

const STEPS: SpinDuration[] = [1, 2, 3, 4];

export function SpinDurationSelector() {
  const { state, setSpinDuration } = useFilter();

  const handleChange = (value: SpinDuration) => {
    setSpinDuration(value);
  };

  return (
    <div className="space-y-3">
      <h3 className="text-xs uppercase tracking-widest text-muted font-medium">
        Spin Duration
      </h3>

      <div className="flex gap-1.5">
        {STEPS.map((step) => (
          <button
            key={step}
            type="button"
            onClick={() => handleChange(step)}
            className={`flex-1 px-2 py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
              state.spinDuration === step
                ? 'bg-ink text-canvas border-ink'
                : 'border-border text-muted hover:text-ink hover:bg-ink/5'
            }`}
          >
            {SPIN_DURATION_LABELS[step]}
          </button>
        ))}
      </div>
    </div>
  );
}
