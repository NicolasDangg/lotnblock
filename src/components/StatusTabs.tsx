"use client";

import { useEffect, useRef, useState } from "react";

export interface StatusExample {
  label: string;
  text: string;
  /** Where the fragment comes from: a real lookup, or example wording. */
  provenance: string;
  /** The report's own component for this answer. */
  fragment: React.ReactNode;
}

/**
 * The four answers a source can give. Each tab shows how the report prints that answer.
 * Tabs advance on their own every few seconds until the visitor picks one.
 */
export function StatusTabs({ examples }: { examples: StatusExample[] }) {
  const [active, setActive] = useState(0);
  const [held, setHeld] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (held || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let visible = false;
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting), { threshold: 0.4 });
    if (root.current) io.observe(root.current);
    const t = setInterval(() => visible && setActive((a) => (a + 1) % examples.length), 5500);
    return () => {
      clearInterval(t);
      io.disconnect();
    };
  }, [held, examples.length]);

  const pick = (i: number) => {
    setHeld(true);
    setActive(i);
  };
  const ex = examples[active];

  return (
    <div ref={root}>
      <div role="tablist" aria-label="What a source can answer" className="flex flex-wrap gap-x-6 gap-y-2">
        {examples.map((s, i) => (
          <button
            key={s.label}
            role="tab"
            aria-selected={i === active}
            aria-controls="status-panel"
            onPointerDown={() => pick(i)}
            onClick={() => pick(i)}
            className={`press relative py-1 text-left text-[length:var(--step-body)] ${
              i === active ? "name text-[var(--ink)]" : "text-[var(--muted)]"
            }`}
          >
            {s.label}
            {/* The underline fills while a tab waits its turn, so the auto-advance is visible. */}
            <span aria-hidden className="absolute inset-x-0 -bottom-0.5 h-0.5 overflow-hidden">
              <span
                key={`${active}-${held}`}
                className={`block h-full origin-left bg-[var(--ink)] ${i === active && !held ? "tab-timer" : ""}`}
                style={{ transform: i !== active ? "scaleX(0)" : held ? "none" : undefined }}
              />
            </span>
          </button>
        ))}
      </div>
      <div id="status-panel" role="tabpanel" key={active} className="tool-in mt-10">
        <p className="max-w-[40ch] text-[var(--ink)]">{ex.text}</p>
        <p className="t-small mt-8 text-[var(--muted)]">In a report · {ex.provenance}</p>
        <div className="mt-3 max-w-[560px] bg-[var(--field-input)] p-6" data-ui>
          {ex.fragment}
        </div>
      </div>
    </div>
  );
}
