import type { Plat } from "@/lib/plat";

/**
 * The block drawn as a plat sheet: neighbouring lots in ink outline, the subject lot filled.
 * `drawn` (0–1) animates it: outlines trace themselves in, then the subject lot fills.
 * `staggerMs` traces the lots one after another, so the block visibly draws itself.
 */
export function PlatDrawing({
  plat,
  label,
  drawn = 1,
  staggerMs = 0,
}: {
  plat: Plat;
  label: string;
  drawn?: number;
  staggerMs?: number;
}) {
  const [minX, minY, maxX, maxY] = plat.bbox;
  const w = maxX - minX;
  const h = maxY - minY;
  // State-plane y grows northward; SVG y grows down.
  const path = (rings: number[][][]) =>
    rings.map((r) => "M" + r.map(([x, y]) => `${(x - minX).toFixed(1)},${(maxY - y).toFixed(1)}`).join("L") + "Z").join("");
  const trace = Math.min(1, drawn / 0.7);
  const fill = Math.max(0, (drawn - 0.7) / 0.3);
  // Draw from the subject outward: nearest lots first.
  const order = plat.neighbours
    .map((rings, i) => {
      const [x, y] = rings[0][0];
      const [sx, sy] = plat.subject[0][0];
      return { i, d: Math.hypot(x - sx, y - sy) };
    })
    .sort((a, b) => a.d - b.d)
    .reduce<number[]>((acc, o, rank) => ((acc[o.i] = rank), acc), []);
  const lastDelay = staggerMs * plat.neighbours.length;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-full w-full" role="img" aria-label={label} preserveAspectRatio="xMidYMid slice">
      <g fill="none" stroke="var(--ink)" strokeWidth={1.25} strokeLinejoin="round">
        {plat.neighbours.map((rings, i) => (
          <path
            key={i}
            d={path(rings)}
            vectorEffect="non-scaling-stroke"
            pathLength={1}
            strokeDasharray={1}
            strokeDashoffset={1 - trace}
            style={{
              transition: "stroke-dashoffset 900ms var(--ease-out)",
              transitionDelay: `${staggerMs ? order[i] * staggerMs : (i % 12) * 40}ms`,
            }}
          />
        ))}
      </g>
      <path
        d={path(plat.subject)}
        fill="var(--accent)"
        stroke="var(--accent)"
        strokeWidth={2}
        vectorEffect="non-scaling-stroke"
        style={{ opacity: fill, transition: "opacity 700ms var(--ease-out)", transitionDelay: `${fill ? lastDelay + 300 : 0}ms` }}
      />
    </svg>
  );
}
