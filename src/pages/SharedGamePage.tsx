import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ActiveGame } from './GamePage';
import { getSharedClue } from '../store/clueStore';
import type { ClueData } from '../types';
import '../App.css';

export function SharedGamePage() {
  const { code } = useParams<{ code: string }>();
  const [clue, setClue] = useState<ClueData | null | undefined>(undefined);

  useEffect(() => {
    if (!code) { setClue(null); return; }
    getSharedClue(code).then(setClue).catch(() => setClue(null));
  }, [code]);

  const shareUrl = code ? `${window.location.origin}${window.location.pathname.replace(/\/?$/, '')}#/p/${code}` : undefined;

  if (clue === undefined) {
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

  if (!clue) {
    return (
      <div className="app">
        <header className="app-header">
          <div className="header-info">
            <div className="header-date">Minut Críptic</div>
            <div className="header-author">pista compartida</div>
          </div>
        </header>
        <main className="app-main" style={{ justifyContent: 'center', paddingBottom: '40px' }}>
          <div className="clue-card" style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '18px', fontWeight: 700, color: 'var(--navy)', margin: 0 }}>
              Pista no trobada.
            </p>
            <p style={{ fontSize: '14px', color: 'var(--muted)', marginTop: '8px', marginBottom: 0 }}>
              L'enllaç pot ser incorrecte o ha expirat.
            </p>
          </div>
        </main>
      </div>
    );
  }

  return <ActiveGame clue={clue} shareUrl={shareUrl} />;
}
