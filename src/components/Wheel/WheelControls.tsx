'use client';

import React from 'react';
import { Button } from '../ui/Button';
import { useWheel } from '@/store/hooks';

interface WheelControlsProps {
  spin: () => void;
  isSpinning: boolean;
}

export function WheelControls({ spin, isSpinning }: WheelControlsProps) {
  const { state } = useWheel();

  const handleSpin = () => {
    if (state.questions.length === 0 || isSpinning) return;
    spin();
  };

  return (
    <Button
      onClick={handleSpin}
      disabled={state.questions.length === 0 || isSpinning}
      className="w-full h-full rounded-full font-display tracking-widest text-2xl font-bold uppercase shadow-[0_2px_12px_rgba(30,30,50,0.10)] flex items-center justify-center p-0"
    >
      <span className={!isSpinning ? 'animate-[pulse-gentle_2.5s_ease-in-out_infinite]' : ''}>
        SPIN
      </span>
    </Button>
  );
}
