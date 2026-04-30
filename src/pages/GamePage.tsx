import { useState, useCallback, useEffect } from 'react';
import { ClueDisplay } from '../components/ClueDisplay';
import { LetterBoxes } from '../components/LetterBoxes';
import { HintBubbles } from '../components/HintBubbles';
import { HintMenu } from '../components/HintMenu';
import { Keyboard } from '../components/Keyboard';
import { SuccessCard } from '../components/SuccessCard';
import type { ClueData, HintType, PartType } from '../types';
import { getTodaysClue, getSolvedRecord, saveSolvedRecord } from '../store/clueStore';
import '../App.css';

function buildShareText(clue: ClueData, hintsUsed: number, totalHints: number): string {
  const phrase = clue.parts.map((p) => p.text).join('').trim();
  const circles = '🟣'.repeat(totalHints);
  const diff = clue.par - hintsUsed;
  const parStr =
    diff > 0 ? `${diff} per sota del par` :
    diff === 0 ? 'en par' :
    `${-diff} per sobre del par`;
  const hintsStr = hintsUsed === 1 ? '1 pista' : `${hintsUsed} pistes`;
  return [
    `Minut Críptic – ${clue.dateLabel}`,
    `"${phrase}" (${clue.answerLength})`,
    circles,
    `🏆 ${hintsStr} – ${parStr} de la comunitat (${clue.solvers.toLocaleString('ca')} participants fins ara).`,
    `https://www.minutecryptic.com/archive/${clue.date}?utm_source=share`,
  ].join('\n');
}

function NoClueView() {
  return (
    <div className="app">
      <header className="app-header">
        <div className="header-info">
          <div className="header-date">Minut Críptic</div>
          <div className="header-author">endevinalla críptica diària</div>
        </div>
      </header>
      <main className="app-main" style={{ justifyContent: 'center', paddingBottom: '40px' }}>
        <div className="clue-card" style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '18px', fontWeight: 700, color: 'var(--navy)', margin: 0 }}>
            Avui no hi ha cap endevinalla.
          </p>
          <p style={{ fontSize: '14px', color: 'var(--muted)', marginTop: '8px', marginBottom: 0 }}>
            Torna demà per a una nova pista críptica!
          </p>
        </div>
      </main>
    </div>
  );
}

// Rendered only once clue is guaranteed non-null
function ActiveGame({ clue }: { clue: ClueData }) {
  const existingRecord = getSolvedRecord(clue.id);
  const alreadySolved = existingRecord !== null;

  const [letters, setLetters] = useState<string[]>(() => {
    if (alreadySolved) return clue.answer.split('');
    return Array(clue.answerLength).fill('');
  });
  const [activeIndex, setActiveIndex] = useState(0);
  const [revealedParts, setRevealedParts] = useState<Set<PartType>>(new Set());
  const [revealedLetterIndices, setRevealedLetterIndices] = useState<Set<number>>(() => {
    if (alreadySolved) {
      return new Set(Array.from({ length: clue.answerLength }, (_, i) => i));
    }
    return new Set();
  });
  const [hintsUsed, setHintsUsed] = useState(() => existingRecord?.hintsUsed ?? 0);
  const [isHintMenuOpen, setIsHintMenuOpen] = useState(false);
  const [usedHintTypes, setUsedHintTypes] = useState<Set<HintType>>(new Set());
  const [solved, setSolved] = useState(alreadySolved);
  const [shaking, setShaking] = useState(false);

  const totalHints = 3 + clue.answerLength;
  const noLettersLeft = revealedLetterIndices.size >= clue.answerLength;
  const allFilled = letters.every((l) => l !== '');

  const handleKey = useCallback((key: string) => {
    if (solved) return;
    if (key === '⌫') {
      if (revealedLetterIndices.has(activeIndex)) return;
      if (letters[activeIndex]) {
        setLetters((prev) => { const n = [...prev]; n[activeIndex] = ''; return n; });
      } else if (activeIndex > 0) {
        const prev = activeIndex - 1;
        if (!revealedLetterIndices.has(prev)) {
          setLetters((l) => { const n = [...l]; n[prev] = ''; return n; });
        }
        setActiveIndex(prev);
      }
    } else {
      setLetters((prev) => { const n = [...prev]; n[activeIndex] = key; return n; });
      let next = activeIndex + 1;
      while (next < clue.answerLength && revealedLetterIndices.has(next)) next++;
      if (next < clue.answerLength) setActiveIndex(next);
    }
  }, [activeIndex, letters, revealedLetterIndices, clue.answerLength, solved]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === 'Backspace') { e.preventDefault(); handleKey('⌫'); }
      else if (/^[a-zA-Z]$/.test(e.key)) handleKey(e.key.toUpperCase());
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleKey]);

  const handleCheck = useCallback(() => {
    if (!allFilled || solved) return;
    if (letters.join('') === clue.answer) {
      setSolved(true);
      saveSolvedRecord(clue.id, hintsUsed);
    } else {
      setShaking(true);
      setTimeout(() => setShaking(false), 550);
    }
  }, [allFilled, solved, letters, clue.answer, clue.id, hintsUsed]);

  useEffect(() => {
    const onEnter = (e: KeyboardEvent) => {
      if (e.key === 'Enter') handleCheck();
    };
    window.addEventListener('keydown', onEnter);
    return () => window.removeEventListener('keydown', onEnter);
  }, [handleCheck]);

  const handleHintSelect = (type: HintType) => {
    if (hintsUsed >= totalHints) return;

    if (type === 'letter') {
      const nextIdx = Array.from({ length: clue.answerLength }, (_, i) => i).find(
        (i) => !revealedLetterIndices.has(i)
      );
      if (nextIdx === undefined) return;
      const newRevealed = new Set(revealedLetterIndices);
      newRevealed.add(nextIdx);
      setRevealedLetterIndices(newRevealed);
      const newLetters = [...letters];
      newLetters[nextIdx] = clue.answer[nextIdx];
      setLetters(newLetters);
      setHintsUsed((h) => h + 1);
    } else {
      if (usedHintTypes.has(type)) return;
      setRevealedParts((prev) => new Set(prev).add(type as PartType));
      setUsedHintTypes((prev) => new Set(prev).add(type));
      setHintsUsed((h) => h + 1);
    }

    setIsHintMenuOpen(false);
  };

  const handleBoxClick = (index: number) => {
    if (!revealedLetterIndices.has(index)) setActiveIndex(index);
  };

  const shareText = buildShareText(clue, hintsUsed, totalHints);

  return (
    <div className="app">
      <header className="app-header">
        <button type="button" className="header-btn-back" aria-label="Enrere">&#8592;</button>
        <div className="header-info">
          <div className="header-date">{clue.dateLabel}</div>
          <div className="header-author">De membre: Exemple</div>
        </div>
        <div className="header-actions">
          <button type="button" className="header-btn-icon" aria-label="Informació">&#9432;</button>
          <button type="button" className="header-btn-icon" aria-label="Menú">
            <span className="menu-icon">&#9776;</span>
          </button>
        </div>
      </header>

      <main className="app-main">
        <ClueDisplay
          parts={clue.parts}
          answerLength={clue.answerLength}
          revealedHints={revealedParts}
        />

        <LetterBoxes
          letters={letters}
          activeIndex={activeIndex}
          onBoxClick={handleBoxClick}
          solved={solved}
          shaking={shaking}
        />

        {!solved && (
          <>
            <HintBubbles total={totalHints} used={hintsUsed} />
            <div className="action-buttons">
              <button type="button" className="btn-hints" onClick={() => setIsHintMenuOpen(true)}>
                pistes
              </button>
              <button
                type="button"
                className={`btn-check${allFilled ? ' btn-check--active' : ''}`}
                onClick={handleCheck}
                disabled={!allFilled}
              >
                comprova
              </button>
            </div>
          </>
        )}

        {solved && (
          <SuccessCard
            hintsUsed={hintsUsed}
            totalHints={totalHints}
            par={clue.par}
            shareText={shareText}
          />
        )}
      </main>

      {!solved && <Keyboard onKey={handleKey} />}

      {isHintMenuOpen && (
        <HintMenu
          onSelect={handleHintSelect}
          onClose={() => setIsHintMenuOpen(false)}
          usedHints={usedHintTypes}
          noLettersLeft={noLettersLeft}
        />
      )}
    </div>
  );
}

export function GamePage() {
  const [clue, setClue] = useState<ClueData | null | undefined>(undefined);

  useEffect(() => {
    getTodaysClue().then(setClue).catch(() => setClue(null));
  }, []);

  if (clue === undefined) {
    // Loading
    return (
      <div className="app">
        <header className="app-header">
          <div className="header-info">
            <div className="header-date">Minut Críptic</div>
          </div>
        </header>
        <main className="app-main" style={{ justifyContent: 'center' }}>
          <p style={{ color: 'var(--muted)' }}>Carregant…</p>
        </main>
      </div>
    );
  }

  if (!clue) return <NoClueView />;
  return <ActiveGame clue={clue} />;
}
