interface HintBubblesProps {
  total: number;
  used: number;
}

export function HintBubbles({ total, used }: HintBubblesProps) {
  return (
    <div className="hint-bubbles">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={`bubble ${i < used ? 'bubble--used' : 'bubble--empty'}`}
        />
      ))}
    </div>
  );
}
