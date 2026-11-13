
export enum Timing {
  PERFECT = 'PERFECT',
  GOOD = 'GOOD',
  MISS = 'MISS',
}

export interface TimingRating {
  text: string;
  color: string;
  points: number;
}

export const TIMING_RATINGS: Record<Timing, TimingRating> = {
  [Timing.PERFECT]: { text: 'PERFECT', color: 'text-cyan-400 shadow-cyan-400/50', points: 100 },
  [Timing.GOOD]: { text: 'GOOD', color: 'text-emerald-400 shadow-emerald-400/50', points: 70 },
  [Timing.MISS]: { text: 'MISS', color: 'text-rose-500 shadow-rose-500/50', points: 0 },
};

export type PerformanceGrade = 'S' | 'A' | 'B' | 'C' | 'D';

export interface PerformanceStats {
  perfects: number;
  goods: number;
  misses: number;
  maxCombo: number;
  totalNotes: number;
}
