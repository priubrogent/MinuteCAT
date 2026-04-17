import type { ClueData } from '../types';

const CLUES_KEY = 'minutecat:clues';
const SOLVED_PREFIX = 'minutecat:solved:';
const ADMIN_AUTH_KEY = 'minutecat:admin:auth';
const ADMIN_PASSWORD = 'minutecat';

const SEED_CLUES: ClueData[] = [
  {
    id: 'seed-1',
    parts: [
      { text: 'Al ', type: 'linking' },
      { text: 'cabirolet', type: 'fodder' },
      { text: " s'", type: 'linking' },
      { text: 'amaga', type: 'indicator' },
      { text: ' la ', type: 'linking' },
      { text: 'primavera', type: 'definition' },
    ],
    answerLength: 5,
    answer: 'ABRIL',
    par: 3,
    solvers: 12480,
    date: '2026-04-17',
    dateLabel: "17 d'abril de 2026",
  },
];

export function getClues(): ClueData[] {
  const raw = localStorage.getItem(CLUES_KEY);
  if (!raw) {
    localStorage.setItem(CLUES_KEY, JSON.stringify(SEED_CLUES));
    return SEED_CLUES;
  }
  try { return JSON.parse(raw) as ClueData[]; } catch { return SEED_CLUES; }
}

export function saveClues(clues: ClueData[]): void {
  localStorage.setItem(CLUES_KEY, JSON.stringify(clues));
}

export function getTodaysClue(): ClueData | null {
  const today = new Date().toISOString().slice(0, 10);
  return getClues().find((c) => c.date === today) ?? null;
}

export interface SolvedRecord {
  hintsUsed: number;
  solvedAt: string;
}

export function getSolvedRecord(clueId: string): SolvedRecord | null {
  const raw = localStorage.getItem(SOLVED_PREFIX + clueId);
  try { return raw ? (JSON.parse(raw) as SolvedRecord) : null; } catch { return null; }
}

export function saveSolvedRecord(clueId: string, hintsUsed: number): void {
  localStorage.setItem(
    SOLVED_PREFIX + clueId,
    JSON.stringify({ hintsUsed, solvedAt: new Date().toISOString() })
  );
}

export function upsertClue(clue: ClueData): void {
  const clues = getClues();
  const idx = clues.findIndex((c) => c.id === clue.id);
  if (idx >= 0) clues[idx] = clue;
  else clues.push(clue);
  saveClues(clues);
}

export function removeClue(id: string): void {
  saveClues(getClues().filter((c) => c.id !== id));
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export function exportCluesJson(): string {
  return JSON.stringify(getClues(), null, 2);
}

export function importCluesJson(json: string): void {
  const parsed = JSON.parse(json) as ClueData[];
  saveClues(parsed);
}

export function checkAdminAuth(): boolean {
  return sessionStorage.getItem(ADMIN_AUTH_KEY) === 'ok';
}

export function adminLogin(password: string): boolean {
  if (password === ADMIN_PASSWORD) {
    sessionStorage.setItem(ADMIN_AUTH_KEY, 'ok');
    return true;
  }
  return false;
}

export function adminLogout(): void {
  sessionStorage.removeItem(ADMIN_AUTH_KEY);
}

export function generateDateLabel(isoDate: string): string {
  try {
    const d = new Date(isoDate + 'T12:00:00');
    return d.toLocaleDateString('ca-ES', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch {
    return isoDate;
  }
}
