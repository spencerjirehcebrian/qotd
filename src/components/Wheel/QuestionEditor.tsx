'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useWheel } from '@/store/hooks';
import { Question } from '@/types';

export function QuestionEditor() {
  const { state, setQuestions } = useWheel();
  const [text, setText] = useState(() =>
    state.questions.map((q) => q.text).join('\n')
  );
  const isLocalEdit = useRef(false);

  // Sync from external question changes (e.g. Generate tab)
  useEffect(() => {
    if (isLocalEdit.current) {
      isLocalEdit.current = false;
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional sync from Zustand store
    setText(state.questions.map((q) => q.text).join('\n'));
  }, [state.questions]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const raw = e.target.value;
      setText(raw);

      const nonBlankLines = raw.split('\n').filter((l) => l.trim().length > 0);
      const questions: Question[] = nonBlankLines.map((line, i) => {
        const existing = state.questions[i];
        return {
          id: existing ? existing.id : -(i + 1),
          text: line,
          seriousnessLevel: existing?.seriousnessLevel ?? 3,
          createdAt: existing?.createdAt ?? new Date(),
          updatedAt: new Date(),
          categories: existing?.categories,
        };
      });

      isLocalEdit.current = true;
      setQuestions(questions);
    },
    [state.questions, setQuestions]
  );

  const questionCount = state.questions.length;

  return (
    <div className="flex flex-col gap-3 h-full">
      <textarea
        className="w-full flex-1 min-h-0 resize-none rounded-lg border border-border bg-canvas p-3 text-sm font-mono text-ink placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-ink/20"
        placeholder="One question per line..."
        value={text}
        onChange={handleChange}
        spellCheck={false}
      />
      <p className="text-xs text-muted text-right">
        {questionCount} question{questionCount !== 1 ? 's' : ''}
      </p>
    </div>
  );
}
