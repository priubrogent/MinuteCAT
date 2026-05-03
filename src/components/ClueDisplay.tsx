import { useState } from 'react';
import type { CluePart, PartType } from '../types';
import { HINT_COLORS } from '../types';

interface ClueDisplayProps {
  parts: CluePart[];
  answerLength: number;
  revealedHints: Set<PartType>;
  message?: string;
}

export function ClueDisplay({ parts, answerLength, revealedHints, message }: ClueDisplayProps) {
  const [showMessage, setShowMessage] = useState(false);

  return (
    <>
      <div className="clue-card">
        <p className="clue-text">
          {parts.map((part, i) => {
            const isHighlighted = part.type !== 'linking' && revealedHints.has(part.type);
            return isHighlighted ? (
              <span
                key={i}
                style={{
                  backgroundColor: HINT_COLORS[part.type as Exclude<PartType, 'linking'>],
                  borderRadius: '3px',
                  padding: '1px 3px',
                }}
              >
                {part.text}
              </span>
            ) : (
              <span key={i}>{part.text}</span>
            );
          })}
          {' '}({answerLength})
        </p>
        {message && (
          <button
            type="button"
            className="clue-message-btn"
            onClick={() => setShowMessage(true)}
            aria-label="Veure missatge"
          >
            i
          </button>
        )}
      </div>

      {showMessage && message && (
        <div className="clue-msg-overlay" onClick={() => setShowMessage(false)}>
          <div className="clue-msg-popup" onClick={(e) => e.stopPropagation()}>
            <p className="clue-msg-text">{message}</p>
            <button
              type="button"
              className="clue-msg-close"
              onClick={() => setShowMessage(false)}
            >
              Tanca
            </button>
          </div>
        </div>
      )}
    </>
  );
}
