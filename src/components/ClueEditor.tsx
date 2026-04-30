import { useState, useRef, useEffect } from 'react';
import type { CluePart, PartType } from '../types';
import { HINT_COLORS } from '../types';
import './ClueEditor.css';

export const TYPE_OPTIONS: { value: PartType; label: string; color: string }[] = [
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

function partsToState(parts: CluePart[]): { text: string; annotations: Annotation[] } {
  const text = parts.map((p) => p.text).join('');
  const annotations: Annotation[] = [];
  let pos = 0;
  for (const part of parts) {
    if (part.type !== 'linking') {
      annotations.push({ start: pos, end: pos + part.text.length, type: part.type });
    }
    pos += part.text.length;
  }
  return { text, annotations };
}

export function computeParts(text: string, annotations: Annotation[]): CluePart[] {
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

interface ClueEditorProps {
  initialParts?: CluePart[];
  onChange: (parts: CluePart[]) => void;
  /** Visual style: 'app' (game UI palette) | 'admin' (admin panel palette) */
  variant?: 'app' | 'admin';
}

export function ClueEditor({ initialParts = [], onChange, variant = 'app' }: ClueEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Initialize from initialParts (may arrive async in admin edit mode)
  const [initialized, setInitialized] = useState(false);
  const [fullText, setFullText] = useState('');
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [selection, setSelection] = useState<{ start: number; end: number } | null>(null);

  useEffect(() => {
    if (!initialized && initialParts.length > 0) {
      const { text, annotations: anns } = partsToState(initialParts);
      setFullText(text);
      setAnnotations(anns);
      setInitialized(true);
    }
  }, [initialParts, initialized]);

  const handleTextChange = (val: string) => {
    const newAnns = annotations.filter((a) => a.end <= val.length);
    setFullText(val);
    setAnnotations(newAnns);
    setSelection(null);
    onChange(computeParts(val, newAnns));
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
    const newAnns: Annotation[] = [
      ...annotations.filter((a) => a.end <= start || a.start >= end),
      { start, end, type },
    ];
    setAnnotations(newAnns);
    setSelection(null);
    onChange(computeParts(fullText, newAnns));
  };

  const removeAnnotation = (ann: Annotation) => {
    const newAnns = annotations.filter((a) => !(a.start === ann.start && a.end === ann.end));
    setAnnotations(newAnns);
    onChange(computeParts(fullText, newAnns));
  };

  const parts = computeParts(fullText, annotations);
  const cls = `clue-editor clue-editor--${variant}`;

  return (
    <div className={cls}>
      {/* Textarea */}
      <textarea
        ref={textareaRef}
        className="ce-textarea"
        value={fullText}
        onChange={(e) => handleTextChange(e.target.value)}
        onSelect={detectSelection}
        onMouseUp={detectSelection}
        onKeyUp={detectSelection}
        placeholder="Escriu la pista críptica aquí…"
        rows={3}
      />

      {/* Type buttons */}
      {fullText.length > 0 && (
        <div className="ce-assign-row">
          <span className="ce-assign-label">
            {selection ? 'Assigna un tipus:' : 'Selecciona text per assignar-li un tipus'}
          </span>
          <div className="ce-type-buttons">
            {TYPE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={`ce-type-btn${selection ? ' ce-type-btn--active' : ''}`}
                style={{ background: opt.color }}
                onClick={() => assignType(opt.value)}
                disabled={!selection}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Preview */}
      {fullText.length > 0 && (
        <div className="ce-preview-wrap">
          <span className="ce-preview-label">Previsualització</span>
          <div className="ce-preview">
            {parts.map((p, i) =>
              p.type === 'linking' ? (
                <span key={i}>{p.text}</span>
              ) : (
                <span
                  key={i}
                  className="ce-part"
                  style={{
                    background: HINT_COLORS[p.type as keyof typeof HINT_COLORS],
                    border: '1px solid rgba(44,74,101,0.12)',
                  }}
                  title={TYPE_OPTIONS.find((t) => t.value === p.type)?.label}
                >
                  {p.text}
                </span>
              )
            )}
          </div>

          {annotations.length > 0 && (
            <div className="ce-ann-list">
              {[...annotations]
                .sort((a, b) => a.start - b.start)
                .map((ann) => {
                  const opt = TYPE_OPTIONS.find((t) => t.value === ann.type)!;
                  return (
                    <div key={`${ann.start}-${ann.end}`} className="ce-ann-item">
                      <span className="ce-ann-swatch" style={{ background: opt.color }} />
                      <span className="ce-ann-text">
                        "{fullText.slice(ann.start, ann.end)}" → {opt.label}
                      </span>
                      <button
                        type="button"
                        className="ce-ann-remove"
                        onClick={() => removeAnnotation(ann)}
                      >
                        ✕
                      </button>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
