'use client';

import { useState, useEffect } from 'react';
import { FilterDrawer } from '@/components/Filters/FilterDrawer';
import { SpinningWheel } from '@/components/Wheel/SpinningWheel';
import { QuestionReveal } from '@/components/QuestionDisplay/QuestionReveal';
import { fetchCategories } from '@/utils/api';
import { useAutoFetchQuestions } from '@/hooks/useAutoFetchQuestions';
import { useAppStore } from '@/store/useAppStore';
import { Category } from '@/types';

export default function Home() {
  const [categories, setCategories] = useState<Category[]>([]);

  const initialLoadReady = useAppStore((s) => s.initialLoadReady);

  useAutoFetchQuestions();

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const fetchedCategories = await fetchCategories();
        setCategories(fetchedCategories);
      } catch (error) {
        console.error('Failed to load categories:', error);
      }
    };

    loadCategories();
  }, []);

  return (
    <div className="h-[100vh] h-[100svh] flex flex-col overflow-hidden bg-canvas">
      <header className="shrink-0 text-center pt-6 pb-2 px-4">
        <a
          href="https://spencerjireh.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm md:text-base font-display text-ink/40 tracking-wide cursor-default"
        >
          Spencer&apos;s Question of the Day
        </a>
      </header>

      <main className="flex-1 flex items-center justify-center min-h-0 px-4 pb-4">
        <div className="flex flex-col md:flex-row md:items-center md:gap-10 gap-6 w-full max-w-[960px]">
          {/* Wheel -- takes center stage */}
          <div
            className="flex-1 flex items-center justify-center min-h-0"
            style={{
              opacity: initialLoadReady ? 1 : 0,
              transition: 'opacity 0.4s ease-out',
            }}
          >
            <SpinningWheel />
          </div>

          {/* Filters -- always visible, beside wheel on desktop */}
          <div className="shrink-0 md:w-80 w-full">
            <FilterDrawer categories={categories} />
          </div>
        </div>
      </main>

      {/* Question Reveal */}
      <QuestionReveal />
    </div>
  );
}
