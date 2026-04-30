import { useState } from 'react';
import { ClueEditor } from '../components/ClueEditor';
import type { CluePart } from '../types';
import { encodeSharedClue } from '../store/clueStore';
import '../App.css';
import './crear.css';

export function CrearPage() {
  const [parts, setParts] = useState<CluePart[]>([]);
  const [answer, setAnswer] = useState('');
  const [par, setPar] = useState(3);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  const fullText = parts.map((p) => p.text).join('');

  const handleCreate = () => {
    const errs: string[] = [];
    if (!fullText.trim()) errs.push('Escriu el text de la pista.');
    if (!answer.trim()) errs.push('La resposta no pot estar buida.');
    if (answer && !/^[A-Z]+$/.test(answer)) errs.push('La resposta només pot contenir lletres (A-Z).');
    if (par < 1) errs.push('El par ha de ser com a mínim 1.');
    if (errs.length) { setErrors(errs); return; }
    setErrors([]);

    const encoded = encodeSharedClue({
      parts: parts.length > 0 ? parts : [{ text: fullText, type: 'linking' }],
      answer,
      answerLength: answer.length,
      par,
    });
    setShareUrl(`${window.location.origin}/#/p/${encoded}`);
  };

  const handleCopy = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-info">
          <div className="header-date">Crea una pista</div>
          <div className="header-author">Minut Críptic</div>
        </div>
      </header>

      <main className="app-main crear-main">
        <div className="crear-card">

          {/* Clue text editor */}
          <section className="crear-section">
            <label className="crear-label">Text de la pista</label>
            <ClueEditor
              onChange={(p) => { setParts(p); setShareUrl(null); }}
              variant="app"
            />
          </section>

          {/* Answer & par */}
          <section className="crear-section">
            <div className="crear-field-row">
              <div className="crear-field">
                <label className="crear-label">Resposta</label>
                <input
                  className="crear-input"
                  value={answer}
                  onChange={(e) =>
                    setAnswer(e.target.value.toUpperCase().replace(/[^A-Z]/g, ''))
                  }
                  placeholder="RESPOSTA"
                  maxLength={20}
                />
                {answer && (
                  <span className="crear-field-hint">{answer.length} lletres</span>
                )}
              </div>
              <div className="crear-field crear-field--sm">
                <label className="crear-label">Par</label>
                <input
                  className="crear-input"
                  type="number"
                  min={1}
                  max={20}
                  value={par}
                  onChange={(e) => setPar(Number(e.target.value))}
                />
              </div>
            </div>
          </section>

          {/* Errors */}
          {errors.length > 0 && (
            <div className="crear-errors">
              {errors.map((e, i) => (
                <p key={i} className="crear-error">⚠ {e}</p>
              ))}
            </div>
          )}

          {/* Create button */}
          {!shareUrl && (
            <button type="button" className="btn-create" onClick={handleCreate}>
              Crea i comparteix
            </button>
          )}

          {/* Share result */}
          {shareUrl && (
            <div className="share-result">
              <p className="share-result-label">Pista creada! Aquí tens l'enllaç:</p>
              <div className="share-url-row">
                <span className="share-url">{shareUrl}</span>
                <button type="button" className="btn-copy" onClick={handleCopy}>
                  {copied ? 'copiat!' : 'copia'}
                </button>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
