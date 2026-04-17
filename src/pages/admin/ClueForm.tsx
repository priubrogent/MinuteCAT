import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { CluePart, PartType } from '../../types';
import { getClues, upsertClue, generateId, generateDateLabel } from '../../store/clueStore';
import './admin.css';

const PART_TYPES: { value: PartType; label: string }[] = [
  { value: 'linking', label: 'Nexe' },
  { value: 'fodder', label: 'Material' },
  { value: 'indicator', label: 'Indicador' },
  { value: 'definition', label: 'Definició' },
];

const TYPE_COLORS: Record<PartType, string> = {
  linking: '#E8EDF2',
  fodder: '#FDE8A0',
  indicator: '#FBCDD8',
  definition: '#D5C0FF',
};

interface FormState {
  parts: CluePart[];
  answer: string;
  par: number;
  date: string;
  dateLabel: string;
  solvers: number;
}

export function ClueForm() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const existing = isEdit ? getClues().find((c) => c.id === id) : null;

  const [form, setForm] = useState<FormState>(() => ({
    parts: existing?.parts ?? [{ text: '', type: 'linking' }],
    answer: existing?.answer ?? '',
    par: existing?.par ?? 3,
    date: existing?.date ?? '',
    dateLabel: existing?.dateLabel ?? '',
    solvers: existing?.solvers ?? 0,
  }));

  const [errors, setErrors] = useState<string[]>([]);

  const updatePart = (i: number, field: 'text' | 'type', value: string) => {
    setForm((prev) => {
      const parts = [...prev.parts];
      parts[i] = { ...parts[i], [field]: field === 'type' ? (value as PartType) : value };
      return { ...prev, parts };
    });
  };

  const addPart = () =>
    setForm((prev) => ({ ...prev, parts: [...prev.parts, { text: '', type: 'linking' }] }));

  const removePart = (i: number) =>
    setForm((prev) => ({ ...prev, parts: prev.parts.filter((_, idx) => idx !== i) }));

  const movePart = (i: number, dir: -1 | 1) => {
    setForm((prev) => {
      const parts = [...prev.parts];
      const j = i + dir;
      if (j < 0 || j >= parts.length) return prev;
      [parts[i], parts[j]] = [parts[j], parts[i]];
      return { ...prev, parts };
    });
  };

  const handleAnswerChange = (val: string) => {
    setForm((prev) => ({ ...prev, answer: val.toUpperCase(), }));
  };

  const handleDateChange = (val: string) => {
    setForm((prev) => ({
      ...prev,
      date: val,
      dateLabel: val ? generateDateLabel(val) : '',
    }));
  };

  const validate = (): string[] => {
    const errs: string[] = [];
    if (form.parts.length === 0) errs.push('Cal almenys una part de la pista.');
    if (form.parts.some((p) => !p.text.trim())) errs.push('Totes les parts han de tenir text.');
    if (!form.answer.trim()) errs.push('La resposta no pot estar buida.');
    if (!/^[A-Z]+$/.test(form.answer)) errs.push('La resposta només pot contenir lletres (A-Z).');
    if (form.par < 1) errs.push('El par ha de ser com a mínim 1.');
    return errs;
  };

  const handleSave = () => {
    const errs = validate();
    if (errs.length) { setErrors(errs); return; }

    upsertClue({
      id: existing?.id ?? generateId(),
      parts: form.parts,
      answer: form.answer,
      answerLength: form.answer.length,
      par: form.par,
      date: form.date,
      dateLabel: form.dateLabel,
      solvers: form.solvers,
    });
    navigate('/admin');
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

        {/* Parts editor */}
        <section className="admin-form-section">
          <h2 className="admin-form-section-title">Parts de la pista</h2>
          <p className="admin-form-hint">
            Divideix el text de la pista en segments i assigna'ls un rol.
          </p>

          <div className="parts-list">
            {form.parts.map((part, i) => (
              <div key={i} className="part-row">
                <div
                  className="part-type-dot"
                  style={{ background: TYPE_COLORS[part.type] }}
                  title={PART_TYPES.find((t) => t.value === part.type)?.label}
                />
                <select
                  className="admin-select part-type-select"
                  value={part.type}
                  onChange={(e) => updatePart(i, 'type', e.target.value)}
                >
                  {PART_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
                <input
                  className="admin-input part-text-input"
                  value={part.text}
                  onChange={(e) => updatePart(i, 'text', e.target.value)}
                  placeholder="text del segment…"
                />
                <div className="part-move-btns">
                  <button
                    type="button"
                    className="part-move-btn"
                    onClick={() => movePart(i, -1)}
                    disabled={i === 0}
                    title="Mou amunt"
                  >↑</button>
                  <button
                    type="button"
                    className="part-move-btn"
                    onClick={() => movePart(i, 1)}
                    disabled={i === form.parts.length - 1}
                    title="Mou avall"
                  >↓</button>
                </div>
                <button
                  type="button"
                  className="part-remove-btn"
                  onClick={() => removePart(i)}
                  disabled={form.parts.length <= 1}
                  title="Elimina"
                >✕</button>
              </div>
            ))}
          </div>

          <button type="button" className="admin-btn admin-btn--ghost admin-btn--sm" onClick={addPart}>
            + Afegir segment
          </button>

          {form.parts.length > 0 && (
            <div className="parts-preview">
              <span className="parts-preview-label">Previsualització:</span>{' '}
              {form.parts.map((p, i) => (
                <span
                  key={i}
                  style={{
                    background: TYPE_COLORS[p.type],
                    padding: '1px 4px',
                    borderRadius: '4px',
                    fontSize: '15px',
                    fontWeight: 600,
                  }}
                >
                  {p.text || '…'}
                </span>
              ))}
            </div>
          )}
        </section>

        {/* Answer */}
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
            <div className="admin-field admin-field--sm">
              <label className="admin-label">Participants</label>
              <input
                className="admin-input"
                type="number"
                min={0}
                value={form.solvers}
                onChange={(e) => setForm((prev) => ({ ...prev, solvers: Number(e.target.value) }))}
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
