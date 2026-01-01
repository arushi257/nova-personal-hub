import rawTeasers from './brainly-teasers.json';

export interface BrainlyClue {
  prompt: string;
  pattern?: string;
  tier?: string;
}

export interface BrainlyTeaser {
  date: string; // YYYY-MM-DD
  title: string;
  category?: string;
  description?: string;
  source?: string;
  isDaily?: boolean;
  clues: BrainlyClue[];
}

// Static export so pages can import structured data without re-parsing the JSON.
export const brainlyTeasers: BrainlyTeaser[] = rawTeasers as BrainlyTeaser[];

export const getLatestBrainlyTeaser = (): BrainlyTeaser | undefined =>
  brainlyTeasers[brainlyTeasers.length - 1];

