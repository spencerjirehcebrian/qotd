"use client";

import React from "react";
import { Question } from "@/types";
import { getCategoryVividColor } from "@/lib/categoryColors";

interface RevealCardProps {
  question: Question;
  categoryRef: React.RefObject<HTMLElement | null>;
  questionTextRef: React.RefObject<HTMLElement | null>;
}

export function RevealCard({ question, categoryRef, questionTextRef }: RevealCardProps) {
  const categories = question.categories && question.categories.length > 0
    ? question.categories
    : [{ name: "Question" }];

  return (
    <div className="p-8 md:p-12 text-center">
      <div
        ref={categoryRef as React.RefObject<HTMLDivElement>}
        className="flex flex-wrap items-center justify-center gap-2"
        style={{ opacity: 0 }}
      >
        {categories.map((cat) => {
          const color = getCategoryVividColor(cat.name);
          return (
            <span
              key={cat.name}
              className="inline-flex items-center px-3 py-1.5 text-sm font-medium uppercase tracking-widest rounded-full"
              style={{
                color,
              }}
            >
              {cat.name}
            </span>
          );
        })}
      </div>

      <h2
        ref={questionTextRef as React.RefObject<HTMLHeadingElement>}
        className="text-3xl md:text-4xl font-display text-ink leading-snug mt-4"
        style={{ opacity: 0 }}
      >
        {question.text}
      </h2>

      <hr className="border-border mt-6 mx-auto max-w-[120px]" />
    </div>
  );
}
