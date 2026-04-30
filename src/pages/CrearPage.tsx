import { useState, useRef } from 'react';
import type { PartType, CluePart } from '../types';
import { HINT_COLORS } from '../types';
import { createSharedClue } from '../store/clueStore';
import '../App.css';
import './crear.css';

const TYPE_OPTIONS: { value: PartType; label: string; color: string }[] = [
  { value: 'linking',    label: 'Nexe',      color: '#E8EDF2' },
  { value: 'indicator',  label: 'Indicador',  color: HINT_COLORS.indicator },
  { value: 'fodder',     label: 'Material',   color: HINT_COLORS.fodder },
  { value: 'definition', label: 'Definició',  color: HINT_COLORS.definition },
];

interface Annotation {
  start: number;
  end: number;
  type: PartType;
}

function computeParts(text: string, annotations: Annotation[]): CluePart[] {
  if (!text) return [];
  const sorted = [...annotations].sort((a, b) => a.start - b.start);
  const parts: CluePart[] = [];
  let pos = 0;
  for (const ann of sorted) {
    if (ann.start > pos) parts.push({ text: text.slice(pos, ann.start), type: 'linking' });
    parts.push({ text: text.slice(ann.start, ann.end), type: ann.type });
    pos = ann.end;
  }
  if (pos < text.length) parts.push({ text: text.slice(pos), type: 'linking' });
  return parts.filter((p) => p.text.length > 0);
}

export function CrearPage() {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [clueText, setClueText] = useState('');
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [selection, setSelection] = useState<{ start: number; end: number } | null>(null);
  const [answer, setAnswer] = useState('');
  const [par, setPar] = useState(3);
  const [shareCode, setShareCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  const handleTextChange = (val: string) => {
    setClueText(val);
    // Drop annotations that fall outside the new text length
    setAnnotations((prev) => prev.filter((a) => a.end <= val.length));
    setSelection(null);
    setShareCode(null);
  };

  const detectSelection = () => {
    const ta = textareaRef.current;
    if (!ta) return;
    const s = ta.selectionStart;
    const e = ta.selectionEnd;
    setSelection(s !== e ? { start: s, end: e } : null);
  };

  const assignType = (type: PartType) => {
    if (!selection) return;
    const { start, end } = selection;
    setAnnotations((prev) => [
      ...prev.filter((a) => a.end <= start || a.start >= end),
      { start, end, type },
    ]);
    setSelection(null);
    setShareCode(null);
  };

  const parts = computeParts(clueText, annotations);

  const handleCreate = async () => {
    const errs: string[] = [];
    if (!clueText.trim()) errs.push('Escriu el text de la pista.');
    if (!answer.trim()) errs.push('La resposta no pot estar buida.');
    if (answer && !/^[A-Z]+$/.test(answer)) errs.push('La resposta només pot contenir lletres (A-Z).');
    if (par < 1) errs.push('El par ha de ser com a mínim 1.');
    if (errs.length) { setErrors(errs); return; }
    setErrors([]);
    setLoading(true);
    try {
      const code = await createSharedClue({
        parts: parts.length > 0 ? parts : [{ text: clueText, type: 'linking' }],
        answer,
        answerLength: answer.length,
        par,
      });
      setShareCode(code);
    } catch {
      setErrors(['Error en crear la pista. Torna-ho a intentar.']);
    }
    setLoading(false);
  };

  const shareUrl = shareCode
    ? `${window.location.origin}${window.location.pathname}#/p/${shareCode}`
    : null;

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

          {/* 1 – Write the clue */}
          <section className="crear-section">
            <label className="crear-label">Text de la pista</label>
            <textarea
              ref={textareaRef}
              className="crear-textarea"
              value={clueText}
              onChange={(e) => handleTextChange(e.target.value)}
              onSelect={detectSelection}
              onMouseUp={detectSelection}
              onKeyUp={detectSelection}
              placeholder="Escriu la pista críptica aquí…"
              rows={3}
            />
          </section>

          {/* 2 – Assign types to selections */}
          {clueText.length > 0 && (
            <section className="crear-section">
              <label className="crear-label">
                {selection
                  ? `Assigna un tipus al text seleccionat`
                  : 'Selecciona un fragment per assignar-li un tipus'}
              </label>
              <div className="type-buttons">
                {TYPE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    className={`type-btn${selection ? ' type-btn--active' : ''}`}
                    style={{ background: opt.color }}
                    onClick={() => assignType(opt.value)}
                    disabled={!selection}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* 3 – Preview with annotations */}
          {clueText.length > 0 && (
            <section className="crear-section">
              <label className="crear-label">Previsualització</label>
              <div className="crear-preview">
                {parts.map((p, i) => {
                  const color =
                    p.type !== 'linking' ? HINT_COLORS[p.type as keyof typeof HINT_COLORS] : undefined;
                  return (
                    <span
                      key={i}
                      className="crear-part-chip"
                      style={color ? { background: color, border: '1px solid rgba(44,74,101,0.12)' } : undefined}
                      title={TYPE_OPTIONS.find((t) => t.value === p.type)?.label}
                    >
                      {p.text}
                    </span>
                  );
                })}
              </div>

              {annotations.length > 0 && (
                <div className="annotation-list">
                  {[...annotations]
                    .sort((a, b) => a.start - b.start)
                    .map((ann) => {
                      const opt = TYPE_OPTIONS.find((t) => t.value === ann.type)!;
                      return (
                        <div key={`${ann.start}-${ann.end}`} className="annotation-item">
                          <span className="annotation-swatch" style={{ background: opt.color }} />
                          <span className="annotation-text">
                            "{clueText.slice(ann.start, ann.end)}" → {opt.label}
                          </span>
                          <button
                            type="button"
                            className="annotation-remove"
                            onClick={() =>
                              setAnnotations((prev) =>
                                prev.filter((a) => !(a.start === ann.start && a.end === ann.end))
                              )
                            }
                          >
                            ✕
                          </button>
                        </div>
                      );
                    })}
                </div>
              )}
            </section>
          )}

          {/* 4 – Answer & par */}
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
          {!shareCode && (
            <button
              type="button"
              className="btn-create"
              onClick={handleCreate}
              disabled={loading}
            >
              {loading ? 'Creant…' : 'Crea i comparteix'}
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
