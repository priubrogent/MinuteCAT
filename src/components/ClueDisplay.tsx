import type { CluePart, PartType } from '../types';
import { HINT_COLORS } from '../types';

interface ClueDisplayProps {
  parts: CluePart[];
  answerLength: number;
  revealedHints: Set<PartType>;
}

export function ClueDisplay({ parts, answerLength, revealedHints }: ClueDisplayProps) {
  return (
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
    </div>
  );
}
