import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { CluePart } from '../../types';
import { getClues, upsertClue, generateId, generateDateLabel } from '../../store/clueStore';
import { ClueEditor } from '../../components/ClueEditor';
import './admin.css';

interface HintMessages {
  indicator: string;
  fodder: string;
  definition: string;
}

interface FormState {
  parts: CluePart[];
  answer: string;
  par: number;
  date: string;
  dateLabel: string;
  hintMessages: HintMessages;
}

const DEFAULT_FORM: FormState = {
  parts: [],
  answer: '',
  par: 3,
  date: '',
  dateLabel: '',
  hintMessages: { indicator: '', fodder: '', definition: '' },
};

const HINT_FIELDS: { key: keyof HintMessages; label: string; color: string }[] = [
  { key: 'indicator',  label: 'Indicador',  color: '#FBCDD8' },
  { key: 'fodder',     label: 'Fodder',     color: '#FDE8A0' },
  { key: 'definition', label: 'Definició',  color: '#D5C0FF' },
];

export function ClueForm() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(isEdit);
  const [existingId, setExistingId] = useState<string | undefined>(undefined);
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [errors, setErrors] = useState<string[]>([]);
  // Key used to reset ClueEditor when loaded data arrives
  const [editorKey, setEditorKey] = useState(0);

  useEffect(() => {
    if (!isEdit || !id) return;
    getClues().then((clues) => {
      const existing = clues.find((c) => c.id === id);
      if (existing) {
        setExistingId(existing.id);
        setForm({
          parts: existing.parts,
          answer: existing.answer,
          par: existing.par,
          date: existing.date,
          dateLabel: existing.dateLabel,
          hintMessages: {
            indicator:  existing.messages?.indicator  ?? '',
            fodder:     existing.messages?.fodder     ?? '',
            definition: existing.messages?.definition ?? '',
          },
        });
        setEditorKey((k) => k + 1); // force ClueEditor to reinitialize
      }
      setLoading(false);
    });
  }, [id, isEdit]);

  if (loading) {
    return (
      <div className="admin-wrap">
        <p style={{ padding: '2rem', color: '#6B8BA5' }}>Carregant…</p>
      </div>
    );
  }

  const handleAnswerChange = (val: string) => {
    setForm((prev) => ({ ...prev, answer: val.toUpperCase().replace(/[^A-Z]/g, '') }));
  };

  const handleDateChange = (val: string) => {
    setForm((prev) => ({
      ...prev,
      date: val,
      dateLabel: val ? generateDateLabel(val) : '',
    }));
  };

  const handleHintMessageChange = (key: keyof HintMessages, val: string) => {
    setForm((prev) => ({
      ...prev,
      hintMessages: { ...prev.hintMessages, [key]: val },
    }));
  };

  const validate = (): string[] => {
    const errs: string[] = [];
    if (form.parts.length === 0) errs.push('Cal almenys una part de la pista.');
    if (!form.answer.trim()) errs.push('La resposta no pot estar buida.');
    if (!/^[A-Z]+$/.test(form.answer)) errs.push('La resposta només pot contenir lletres (A-Z).');
    if (form.par < 1) errs.push('El par ha de ser com a mínim 1.');
    return errs;
  };

  const handleSave = () => {
    const errs = validate();
    if (errs.length) { setErrors(errs); return; }

    const messages: Record<string, string> = {};
    for (const { key } of HINT_FIELDS) {
      const val = form.hintMessages[key].trim();
      if (val) messages[key] = val;
    }

    upsertClue({
      id: existingId ?? generateId(),
      parts: form.parts,
      answer: form.answer,
      answerLength: form.answer.length,
      par: form.par,
      date: form.date,
      dateLabel: form.dateLabel,
      solvers: 0,
      ...(Object.keys(messages).length ? { messages } : {}),
    }).then(() => navigate('/admin'));
  };

  return (
    <div className="admin-wrap">
      <header className="admin-header">
        <div>
          <h1 className="admin-title">{isEdit ? 'Edita pista' : 'Nova pista'}</h1>
          <p className="admin-subtitle">Minut Críptic</p>
        </div>
        <button className="admin-btn admin-btn--ghost" onClick={() => navigate('/admin')}>
          ← Tornar
        </button>
      </header>

      <div className="admin-form">

        {/* Clue text editor */}
        <section className="admin-form-section">
          <h2 className="admin-form-section-title">Text de la pista</h2>
          <p className="admin-form-hint">
            Escriu la pista i selecciona fragments per assignar-los un tipus.
          </p>
          <ClueEditor
            key={editorKey}
            initialParts={form.parts}
            onChange={(parts) => setForm((prev) => ({ ...prev, parts }))}
            variant="admin"
          />
        </section>

        {/* Answer & par */}
        <section className="admin-form-section">
          <h2 className="admin-form-section-title">Resposta</h2>
          <div className="admin-field-row">
            <div className="admin-field">
              <label className="admin-label">Resposta (majúscules)</label>
              <input
                className="admin-input"
                value={form.answer}
                onChange={(e) => handleAnswerChange(e.target.value)}
                placeholder="EXEMPLE"
                maxLength={20}
              />
              {form.answer && (
                <span className="admin-field-hint">{form.answer.length} lletres</span>
              )}
            </div>
            <div className="admin-field admin-field--sm">
              <label className="admin-label">Par</label>
              <input
                className="admin-input"
                type="number"
                min={1}
                max={20}
                value={form.par}
                onChange={(e) => setForm((prev) => ({ ...prev, par: Number(e.target.value) }))}
              />
            </div>
          </div>
        </section>

        {/* Date */}
        <section className="admin-form-section">
          <h2 className="admin-form-section-title">Data de publicació</h2>
          <div className="admin-field-row">
            <div className="admin-field">
              <label className="admin-label">Data (AAAA-MM-DD)</label>
              <input
                className="admin-input"
                type="date"
                value={form.date}
                onChange={(e) => handleDateChange(e.target.value)}
              />
            </div>
            <div className="admin-field admin-field--lg">
              <label className="admin-label">Etiqueta de data (Català)</label>
              <input
                className="admin-input"
                value={form.dateLabel}
                onChange={(e) => setForm((prev) => ({ ...prev, dateLabel: e.target.value }))}
                placeholder="17 d'abril de 2026"
              />
            </div>
          </div>
        </section>

        {/* Per-hint messages */}
        <section className="admin-form-section">
          <h2 className="admin-form-section-title">Missatges per pista (opcional)</h2>
          <p className="admin-form-hint">
            Si s'omple, apareixerà un popup quan l'usuari reveli aquella pista. Deixa en blanc per no mostrar res.
          </p>
          <div className="admin-hint-messages">
            {HINT_FIELDS.map(({ key, label, color }) => (
              <div key={key} className="admin-field">
                <label className="admin-label">
                  <span className="admin-hint-dot" style={{ background: color }} />
                  {label}
                </label>
                <textarea
                  className="admin-textarea"
                  rows={2}
                  value={form.hintMessages[key]}
                  onChange={(e) => handleHintMessageChange(key, e.target.value)}
                  placeholder={`Missatge quan es revela l'${label.toLowerCase()}…`}
                />
              </div>
            ))}
          </div>
        </section>

        {errors.length > 0 && (
          <div className="admin-errors">
            {errors.map((e, i) => <p key={i} className="admin-error-msg">⚠ {e}</p>)}
          </div>
        )}

        <div className="admin-form-actions">
          <button className="admin-btn admin-btn--ghost" onClick={() => navigate('/admin')}>
            Cancel·la
          </button>
          <button className="admin-btn admin-btn--primary" onClick={handleSave}>
            {isEdit ? 'Desa canvis' : 'Crea pista'}
          </button>
        </div>
      </div>
    </div>
  );
}
