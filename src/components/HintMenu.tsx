import type { HintType } from '../types';

interface HintOption {
  type: HintType;
  label: string;
  color: string;
}

const HINT_OPTIONS: HintOption[] = [
  { type: 'indicator', label: 'indicador', color: '#FBCDD8' },
  { type: 'fodder',    label: 'fodder',    color: '#FDE8A0' },
  { type: 'definition',label: 'definició', color: '#D5C0FF' },
  { type: 'letter',    label: 'lletra',    color: '#FDE8A0' },
];

interface HintMenuProps {
  onSelect: (hint: HintType) => void;
  onClose: () => void;
  usedHints: Set<HintType>;
  noLettersLeft: boolean;
}

export function HintMenu({ onSelect, onClose, usedHints, noLettersLeft }: HintMenuProps) {
  return (
    <div className="hint-overlay" onClick={onClose}>
      <div className="hint-menu" onClick={(e) => e.stopPropagation()}>
        <div className="hint-menu-header">
          <span className="hint-menu-title">Selecciona una pista</span>
          <button type="button" className="hint-menu-close" onClick={onClose}>&#x2715;</button>
        </div>
        {HINT_OPTIONS.map(({ type, label, color }) => {
          const exhausted =
            (type !== 'letter' && usedHints.has(type)) ||
            (type === 'letter' && noLettersLeft);
          return (
            <button
              key={type}
              type="button"
              className={`hint-option${exhausted ? ' hint-option--used' : ''}`}
              onClick={() => !exhausted && onSelect(type)}
              disabled={exhausted}
            >
              <span className="hint-chip" style={{ background: color }} />
              <span className="hint-option-text">{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
