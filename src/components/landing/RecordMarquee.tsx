"use client";

import { useEffect, useRef, useState } from "react";

/**
 * A ribbon of real records from the example lookup, running like a ticker of receipts.
 * Pauses on hover and focus, stops while off screen, and sits still under reduced motion.
 */
export function RecordMarquee({ items, label }: { items: string[]; label: string }) {
  const root = useRef<HTMLDivElement>(null);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    const io = new IntersectionObserver(([e]) => setRunning(e.isIntersecting));
    if (root.current) io.observe(root.current);
    return () => io.disconnect();
  }, []);

  const row = (hidden: boolean) => (
    <ul className="flex shrink-0 items-center" aria-hidden={hidden || undefined}>
      {items.map((t, i) => (
        <li key={i} className="flex items-center whitespace-nowrap">
          <span className="px-6">{t}</span>
          <span aria-hidden className="inline-block size-1.5 rounded-full bg-[var(--field-sage)]" />
        </li>
      ))}
    </ul>
  );

  return (
    <div
      ref={root}
      className="marquee group overflow-hidden bg-[var(--ink)] py-5 text-[var(--paper)]"
      data-running={running || undefined}
      aria-label={label}
      role="region"
    >
      <div className="marquee-track t-lead flex w-max">
        {row(false)}
        {row(true)}
      </div>
    </div>
  );
}
