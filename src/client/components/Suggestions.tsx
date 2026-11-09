export function Suggestions({ items, onPick }: { items: string[]; onPick(text: string): void }) {
  return (
    <div className="chips">
      {items.map((s) => (
        <button key={s} type="button" onClick={() => onPick(s)}>
          {s}
        </button>
      ))}
    </div>
  );
}
