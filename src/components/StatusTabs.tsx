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
      <div role="tablist" aria-label="What a source can answer" className="flex w-fit max-w-full flex-wrap gap-1 rounded-[24px] bg-[var(--ink)]/[0.07] p-1">
        {examples.map((s, i) => (
          <button
            key={s.label}
            role="tab"
            aria-selected={i === active}
            aria-controls="status-panel"
            onPointerDown={() => pick(i)}
            onClick={() => pick(i)}
            className={`press relative overflow-hidden rounded-full px-4 py-2 text-left transition-colors duration-[var(--t-hover)] ${
              i === active ? "name bg-[var(--paper)] text-[var(--ink)]" : "text-[var(--muted)] hover:bg-[var(--paper)]/50"
            }`}
          >
            {s.label}
            {/* A thin bar fills inside the active pill while it waits its turn, so the auto-advance is visible. */}
            {i === active && !held ? (
              <span aria-hidden className="absolute inset-x-4 bottom-1 h-0.5 overflow-hidden rounded-full bg-[var(--ink)]/10">
                <span key={active} className="tab-timer block h-full origin-left bg-[var(--ink)]/50" />
              </span>
            ) : null}
          </button>
        ))}
      </div>
      <div id="status-panel" role="tabpanel" key={active} className="tool-in mt-8 max-w-[560px]">
        <p className="text-[var(--ink)]">{ex.text}</p>
        <p className="t-small mt-8 mb-3 text-[var(--muted)]">In a report · {ex.provenance}</p>
        <div data-ui>{ex.fragment}</div>
      </div>
    </div>
  );
}
