/** A surveyor's range pole, the striped rod that measures a lot: alternating ink and paper bars. */
export function Pole({ bars = 40 }: { bars?: number }) {
  return (
    <div className="pole overflow-hidden" aria-hidden>
      {Array.from({ length: bars }, (_, i) => (
        <span key={i} />
      ))}
    </div>
  );
}
