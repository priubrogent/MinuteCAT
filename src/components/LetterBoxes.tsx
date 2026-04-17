interface LetterBoxesProps {
  letters: string[];
  activeIndex: number;
  onBoxClick: (index: number) => void;
  solved?: boolean;
  shaking?: boolean;
}

export function LetterBoxes({ letters, activeIndex, onBoxClick, solved, shaking }: LetterBoxesProps) {
  let wrapperCls = 'letter-boxes';
  if (shaking) wrapperCls += ' letter-boxes--shake';

  return (
    <div className={wrapperCls}>
      {letters.map((letter, i) => {
        let cls = 'letter-box';
        if (solved) cls += ' letter-box--solved';
        else if (i === activeIndex) cls += ' letter-box--active';
        return (
          <div key={i} className={cls} onClick={() => !solved && onBoxClick(i)}>
            {letter}
          </div>
        );
      })}
    </div>
  );
}
