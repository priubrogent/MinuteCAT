import { useState } from 'react';

interface SuccessCardProps {
  hintsUsed: number;
  totalHints: number;
  par: number;
  shareText: string;
}

export function SuccessCard({ hintsUsed, totalHints, par, shareText }: SuccessCardProps) {
  const [copied, setCopied] = useState(false);

  const diff = par - hintsUsed;
  const parText =
    diff > 0 ? `${diff} per sota del par` :
    diff === 0 ? 'en par' :
    `${-diff} per sobre del par`;

  const handleShare = async () => {
    await navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="success-card">
      <div className="success-bubbles">
        {Array.from({ length: totalHints }, (_, i) => (
          <div
            key={i}
            className={`bubble ${i < hintsUsed ? 'bubble--used-solid' : 'bubble--outline'}`}
          />
        ))}
      </div>
      <h2 className="success-title">Ho has encertat!</h2>
      <p className="success-hints-count">
        {hintsUsed === 0 ? 'cap pista' : hintsUsed === 1 ? '1 pista' : `${hintsUsed} pistes`}
      </p>
      <p className="success-par">{parText}</p>
      <button type="button" className="btn-share" onClick={handleShare}>
        {copied ? 'copiat!' : 'comparteix'}
      </button>
    </div>
  );
}
