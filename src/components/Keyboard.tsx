const ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['Z', 'X', 'C', 'V', 'B', 'N', 'M', '⌫'],
];

interface KeyboardProps {
  onKey: (key: string) => void;
}

export function Keyboard({ onKey }: KeyboardProps) {
  return (
    <div className="keyboard">
      {ROWS.map((row, ri) => (
        <div key={ri} className="keyboard-row">
          {row.map((key) => (
            <button
              key={key}
              type="button"
              className={`keyboard-key${key === '⌫' ? ' keyboard-key--backspace' : ''}`}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => onKey(key)}
            >
              {key}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}
