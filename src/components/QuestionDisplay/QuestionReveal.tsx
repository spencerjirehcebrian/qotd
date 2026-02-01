"use client";

import React, { useRef, useEffect, useCallback } from "react";
import { useWheel } from "@/store/hooks";
import { useRevealSequence } from "@/hooks/useRevealSequence";
import { RevealOverlay } from "./RevealOverlay";
import { RevealCard } from "./RevealCard";
import { RevealActions } from "./RevealActions";
import { resetConfetti } from "@/lib/confetti";

export function QuestionReveal() {
  const { state, dismissReveal, setQuestions } = useWheel();
  const { play, kill } = useRevealSequence();

  const containerRef = useRef<HTMLDivElement>(null);
  const categoryRef = useRef<HTMLElement>(null);
  const questionTextRef = useRef<HTMLElement>(null);
  const actionsRef = useRef<HTMLElement>(null);

  const isOpen = state.selectedQuestion !== null;

  // Play reveal sequence when a question is selected
  useEffect(() => {
    if (!state.selectedQuestion) return;

    // Wait one frame so DOM has painted with new refs
    const frameId = requestAnimationFrame(() => {
      play({
        container: containerRef.current,
        categoryLabel: categoryRef.current,
        questionText: questionTextRef.current,
        actions: actionsRef.current,
      });
    });

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [state.selectedQuestion, play]);

  // Cleanup timeline on unmount
  useEffect(() => {
    return () => {
      kill();
    };
  }, [kill]);

  const handleSpinAgain = useCallback(() => {
    kill();
    resetConfetti();
    dismissReveal();
  }, [kill, dismissReveal]);

  const handleRemoveAndSpin = useCallback(() => {
    kill();
    resetConfetti();
    if (state.selectedQuestion) {
      const filtered = state.questions.filter(
        (q) => q.id !== state.selectedQuestion!.id
      );
      setQuestions(filtered);
    }
    dismissReveal();
  }, [kill, state.selectedQuestion, state.questions, setQuestions, dismissReveal]);

  const handleClose = useCallback(() => {
    kill();
    resetConfetti();
    dismissReveal();
  }, [kill, dismissReveal]);

  const canRemove = state.questions.length > 1;

  return (
    <RevealOverlay isOpen={isOpen} onClose={handleClose}>
      {state.selectedQuestion && (
        <div ref={containerRef}>
          <RevealCard
            question={state.selectedQuestion}
            categoryRef={categoryRef}
            questionTextRef={questionTextRef}
          />
          <RevealActions
            actionsRef={actionsRef}
            onSpinAgain={handleSpinAgain}
            onRemoveAndSpin={handleRemoveAndSpin}
            canRemove={canRemove}
          />
        </div>
      )}
    </RevealOverlay>
  );
}
