"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Assessed value per tax year as filled bars that grow in left to right when they arrive.
 * Without JS (or with reduced motion) the bars are simply drawn at full height.
 */
export function ValueBars({ values }: { values: { year: number; total: number }[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [grown, setGrown] = useState(true);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !ref.current) return;
    setGrown(false);
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        setGrown(true);
        io.disconnect();
      }
    }, { threshold: 0.4 });
    io.observe(ref.current);
    return () => io.disconnect();
  }, []);

  const max = Math.max(...values.map((v) => v.total));
  const first = values[0];
  const last = values.at(-1)!;
  const growth = first.total ? last.total / first.total : null;

  return (
    <figure className="flex h-[280px] flex-col md:h-[340px]">
      <figcaption className="t-lead">
        Assessed value, {first.year} to {last.year}
        {growth ? <span className="block text-[var(--muted)]">{growth.toFixed(1)}× over {values.length} tax years</span> : null}
      </figcaption>
      <div
        ref={ref}
        className="mt-8 flex flex-1 items-end gap-[3px]"
        role="img"
        aria-label={`Bar chart of assessed value from ${first.year} (${first.total.toLocaleString("en-US")} dollars) to ${last.year} (${last.total.toLocaleString("en-US")} dollars)`}
      >
        {values.map((v, i) => (
          <div key={v.year} className="flex h-full flex-1 items-end">
            <div
              className="w-full origin-bottom"
              title={`${v.year}: $${v.total.toLocaleString("en-US")}`}
              style={{
                height: `${Math.max(1.5, (v.total / max) * 100)}%`,
                background: i === values.length - 1 ? "var(--accent)" : "var(--field-slate)",
                transform: grown ? "scaleY(1)" : "scaleY(0)",
                transition: "transform 900ms var(--ease-out)",
                transitionDelay: `${i * 35}ms`,
              }}
            />
          </div>
        ))}
      </div>
      <div className="t-small mt-3 flex justify-between text-[var(--muted)]">
        <span>{first.year}</span>
        <span>{last.year}</span>
      </div>
    </figure>
  );
}
