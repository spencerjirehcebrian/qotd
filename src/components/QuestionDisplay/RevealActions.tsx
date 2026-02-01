"use client";

import React from "react";
import { Button } from "@/components/ui/Button";

interface RevealActionsProps {
  actionsRef: React.RefObject<HTMLElement | null>;
  onSpinAgain: () => void;
  onRemoveAndSpin: () => void;
  canRemove: boolean;
}

export function RevealActions({
  actionsRef,
  onSpinAgain,
  onRemoveAndSpin,
  canRemove,
}: RevealActionsProps) {
  return (
    <div
      ref={actionsRef as React.RefObject<HTMLDivElement>}
      className="flex gap-3 justify-center mt-6 pb-8"
      style={{ opacity: 0 }}
    >
      <Button variant="default" size="md" className="w-44" onClick={onSpinAgain}>
        Spin Again
      </Button>
      {canRemove && (
        <Button variant="outline" size="md" className="w-44" onClick={onRemoveAndSpin}>
          Remove Question
        </Button>
      )}
    </div>
  );
}
