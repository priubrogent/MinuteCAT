import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { ActiveGame } from './GamePage';
import { decodeSharedClue } from '../store/clueStore';
import '../App.css';

export function SharedGamePage() {
  const { code } = useParams<{ code: string }>();

  const clue = useMemo(
    () => (code ? decodeSharedClue(code) : null),
    [code],
  );

  const shareUrl = code ? `${window.location.origin}/#/p/${code}` : undefined;

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
              L'enllaç pot ser incorrecte o no és vàlid.
            </p>
          </div>
        </main>
      </div>
    );
  }

  return <ActiveGame clue={clue} shareUrl={shareUrl} />;
}
