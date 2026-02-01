export interface Question {
  id: number;
  text: string;
  seriousnessLevel: number;
  createdAt: Date;
  updatedAt: Date;
  categories?: Category[];
}

export interface Category {
  id: number;
  name: string;
  color: string;
  createdAt: Date;
}

export interface QuestionCategory {
  questionId: number;
  categoryId: number;
}

export type SpinDuration = 1 | 2 | 3 | 4;

export const SPIN_DURATION_LABELS: Record<SpinDuration, string> = {
  1: 'Quick',
  2: 'Normal',
  3: 'Long',
  4: 'Extra Long',
};

export interface FilterState {
  selectedCategories: string[];
  seriousnessRange: [number, number];
  questionQuantity: number;
  spinDuration: SpinDuration;
}

export type RevealPhase = 'idle' | 'anticipating' | 'revealing' | 'revealed';

export interface WheelState {
  questions: Question[];
  isSpinning: boolean;
  isGenerating: boolean;
  selectedQuestion: Question | null;
  spinAngle: number;
  remainingQuestions: Question[];
  revealPhase: RevealPhase;
}

export type SeriousnessLevel = 1 | 2 | 3 | 4 | 5;

export const SERIOUSNESS_LABELS: Record<SeriousnessLevel, string> = {
  1: 'Very Unserious',
  2: 'Unserious',
  3: 'Neutral',
  4: 'Serious',
  5: 'Very Serious'
};

export const SERIOUSNESS_SHORT_LABELS: Record<SeriousnessLevel, string> = {
  1: 'Very Unserious',
  2: 'Unserious',
  3: 'Neutral',
  4: 'Serious',
  5: 'Very Serious',
};

