import type { ClueData, CluePart } from '../types';

const SOLVED_PREFIX = 'minutecat:solved:';
const ADMIN_AUTH_KEY = 'minutecat:admin:auth';
const ADMIN_PASSWORD = 'minutecat';

// ---------------------------------------------------------------------------
// Clue API (shared backend)
// ---------------------------------------------------------------------------

export async function getClues(): Promise<ClueData[]> {
  const res = await fetch('/api/clues');
  if (!res.ok) throw new Error('Failed to fetch clues');
  return res.json();
}

export async function getTodaysClue(): Promise<ClueData | null> {
  const clues = await getClues();
  const today = new Date().toISOString().slice(0, 10);
  return clues.find((c) => c.date === today) ?? null;
}

export async function upsertClue(clue: ClueData): Promise<void> {
  const res = await fetch(`/api/clues/${clue.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(clue),
  });
  if (!res.ok) throw new Error('Failed to save clue');
}

export async function removeClue(id: string): Promise<void> {
  const res = await fetch(`/api/clues/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete clue');
}

export async function exportCluesJson(): Promise<string> {
  const clues = await getClues();
  return JSON.stringify(clues, null, 2);
}

// ---------------------------------------------------------------------------
// Shared clues — encoded entirely in the URL (no server storage needed)
// ---------------------------------------------------------------------------

export interface SharedCluePayload {
  parts: CluePart[];
  answer: string;
  answerLength: number;
  par: number;
}

export function encodeSharedClue(payload: SharedCluePayload): string {
  const json = JSON.stringify(payload);
  const bytes = new TextEncoder().encode(json);
  let binary = '';
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  // base64url (no padding, URL-safe chars)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

export function decodeSharedClue(encoded: string): ClueData | null {
  try {
    const base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length).map((_, i) => binary.charCodeAt(i));
    const payload = JSON.parse(new TextDecoder().decode(bytes)) as SharedCluePayload;
    return {
      id: encoded,
      parts: payload.parts,
      answer: payload.answer,
      answerLength: payload.answerLength,
      par: payload.par,
      solvers: 0,
      date: '',
      dateLabel: 'Pista compartida',
    };
  } catch {
    return null;
  }
}

export async function importCluesJson(json: string): Promise<void> {
  const parsed = JSON.parse(json) as ClueData[];
  const res = await fetch('/api/clues/import', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(parsed),
  });
  if (!res.ok) throw new Error('Failed to import clues');
}

// ---------------------------------------------------------------------------
// Solved records (kept in localStorage — per user, not shared)
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Admin auth (session-only, no sharing needed)
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export function generateDateLabel(isoDate: string): string {
  try {
    const d = new Date(isoDate + 'T12:00:00');
    return d.toLocaleDateString('ca-ES', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch {
    return isoDate;
  }
}
