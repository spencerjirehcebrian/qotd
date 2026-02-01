'use client';

import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Category } from '@/types';
import { useFilter } from '@/store/hooks';
import { cn } from '@/lib/utils';
import { getCategoryColor } from '@/lib/categoryColors';
import { TWEENS } from '@/lib/motion';

interface CategoryFilterProps {
  categories: Category[];
  isOpen: boolean;
  onToggle: () => void;
}

export function CategoryFilter({ categories = [], isOpen, onToggle }: CategoryFilterProps) {
  const { state, setCategories } = useFilter();

  const handleCategoryToggle = (categoryName: string) => {
    let newCategories: string[];
    if (state.selectedCategories.length === 0) {
      // Nothing selected (all implicit) -- select just this one
      newCategories = [categoryName];
    } else if (state.selectedCategories.includes(categoryName)) {
      newCategories = state.selectedCategories.filter((c) => c !== categoryName);
    } else {
      newCategories = [...state.selectedCategories, categoryName];
    }

    // If all categories selected explicitly, reset to empty (all implicit)
    if (newCategories.length === categories.length) {
      newCategories = [];
    }

    setCategories(newCategories);
  };

  const handleClear = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCategories([]);
  };

  return (
    <div>
      {/* Accordion header */}
      <button
        type="button"
        onClick={onToggle}
        className="flex items-center justify-between w-full py-3 cursor-pointer group"
      >
        <span className="text-xs uppercase tracking-widest text-muted font-medium">Categories</span>
        <div className="flex items-center gap-2">
          {state.selectedCategories.length > 0 && (
            <span
              role="button"
              tabIndex={0}
              onClick={handleClear}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleClear(e as unknown as React.MouseEvent); }}
              className="text-xs text-muted hover:text-ink transition-colors px-1 cursor-pointer"
            >
              Clear
            </span>
          )}
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            className={cn(
              'text-muted transition-transform duration-200',
              isOpen && 'rotate-180'
            )}
          >
            <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </button>

      {/* Collapsible body */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={TWEENS.gentle}
            className="overflow-hidden"
          >
            <div role="group" aria-label="Category filter" className="flex flex-wrap gap-2 pb-3">
              {categories.map((category) => {
                const isSelected = state.selectedCategories.length === 0 || state.selectedCategories.includes(category.name);
                return (
                  <button
                    key={category.id}
                    onClick={() => handleCategoryToggle(category.name)}
                    aria-pressed={isSelected}
                    className={cn(
                      'inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer border',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/20 focus-visible:ring-offset-2',
                      isSelected
                        ? 'text-ink'
                        : 'text-muted hover:bg-ink/5'
                    )}
                    style={{
                      borderColor: isSelected
                        ? getCategoryColor(category.name)
                        : 'transparent',
                    }}
                  >
                    {category.name}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
