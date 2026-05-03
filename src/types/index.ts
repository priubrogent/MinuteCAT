export type PartType = 'fodder' | 'indicator' | 'definition' | 'linking';
export type HintType = 'fodder' | 'indicator' | 'definition' | 'letter';

export interface CluePart {
  text: string;
  type: PartType;
}

export interface ClueData {
  id: string;
  parts: CluePart[];
  answerLength: number;
  answer: string;
  par: number;
  solvers: number;
  date: string;   // ISO date: "2026-03-05"
  dateLabel: string; // "5 de març de 2026"
  message?: string; // optional popup message shown when clue card is tapped
}

export const HINT_COLORS: Record<Exclude<PartType, 'linking'>, string> = {
  fodder:    '#FDE8A0',   // butter yellow
  indicator: '#FBCDD8',   // blush rose
  definition:'#D5C0FF',  // soft lavender
};
