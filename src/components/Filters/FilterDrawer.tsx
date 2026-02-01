'use client';

import React, { useState } from 'react';
import { CategoryFilter } from './CategoryFilter';
import { SeriousnessFilter } from './SeriousnessFilter';
import { QuantitySelector } from './QuantitySelector';
import { SpinDurationSelector } from './SpinDurationSelector';
import { Button } from '../ui/Button';
import { QuestionEditor } from '../Wheel/QuestionEditor';
import { useFilter, useWheel } from '@/store/hooks';
import { useAppStore } from '@/store/useAppStore';
import { fetchQuestions } from '@/utils/api';
import { fetchWithMinDuration } from '@/utils/fetchWithMinDuration';
import { playGenerate } from '@/lib/uiSounds';
import type { Category } from '@/types';

interface FilterDrawerProps {
  categories: Category[];
}

type Tab = 'generate' | 'customize';
type AccordionSection = 'categories' | 'seriousness';
type OpenSections = Record<AccordionSection, boolean>;

export function FilterDrawer({ categories }: FilterDrawerProps) {
  const { state } = useFilter();
  const { state: wheelState, startGenerating, stopGenerating } = useWheel();
  const initialLoadReady = useAppStore((s) => s.initialLoadReady);
  const [activeTab, setActiveTab] = useState<Tab>('generate');
  const [openSections, setOpenSections] = useState<OpenSections>({
    categories: true,
    seriousness: true,
  });

  const toggleSection = (section: AccordionSection) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const handleGenerateQuestions = async () => {
    const previousQuestions = wheelState.questions;
    startGenerating();
    try {
      const questions = await fetchWithMinDuration(() =>
        fetchQuestions({
          categories: state.selectedCategories,
          seriousnessMin: state.seriousnessRange[0],
          seriousnessMax: state.seriousnessRange[1],
          limit: state.questionQuantity,
        }),
      );

      stopGenerating(questions);
    } catch (error) {
      console.error('Failed to generate questions:', error);
      stopGenerating(previousQuestions);
    }
  };

  return (
    <div className="flex flex-col gap-5 w-full">
      {/* Tab bar */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setActiveTab('generate')}
          className={`flex-1 pb-2 text-xs uppercase tracking-widest font-medium transition-colors cursor-pointer ${
            activeTab === 'generate'
              ? 'text-ink border-b-2 border-ink'
              : 'text-muted hover:text-ink'
          }`}
        >
          New
        </button>
        <button
          onClick={() => setActiveTab('customize')}
          className={`flex-1 pb-2 text-xs uppercase tracking-widest font-medium transition-colors cursor-pointer ${
            activeTab === 'customize'
              ? 'text-ink border-b-2 border-ink'
              : 'text-muted hover:text-ink'
          }`}
        >
          Edit
        </button>
      </div>

      {/* Tab content -- grid overlay keeps panel height stable across tabs */}
      <div className="grid">
        <div className={`col-start-1 row-start-1 flex flex-col gap-5 ${activeTab !== 'generate' ? 'invisible' : ''}`}>
          <div className={wheelState.isGenerating ? 'pointer-events-none opacity-50' : ''}>
            {/* Accordion filters */}
            <CategoryFilter
              categories={categories}
              isOpen={openSections.categories}
              onToggle={() => toggleSection('categories')}
            />
            <div className="border-t border-border mt-4 mb-4" />
            <SeriousnessFilter
              isOpen={openSections.seriousness}
              onToggle={() => toggleSection('seriousness')}
            />

            <div className="border-t border-border mt-4 mb-4" />

            {/* Always-visible settings */}
            <QuantitySelector />
            <div className="border-t border-border mt-4 mb-4" />
            <SpinDurationSelector />
          </div>
          <div className="border-t border-border" />

          <Button
            onClick={handleGenerateQuestions}
            onPointerDown={() => playGenerate()}
            className="w-full"
            size="lg"
            disabled={wheelState.isGenerating || !initialLoadReady}
          >
            {wheelState.isGenerating ? 'Generating...' : 'New Questions'}
          </Button>
        </div>

        <div className={`col-start-1 row-start-1 flex flex-col ${activeTab !== 'customize' ? 'invisible' : ''}`}>
          <QuestionEditor />
        </div>
      </div>
    </div>
  );
}
