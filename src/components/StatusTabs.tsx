"use client";

import { useState } from "react";

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
 */
export function StatusTabs({ examples }: { examples: StatusExample[] }) {
  const [active, setActive] = useState(0);
  const ex = examples[active];

  return (
    <div>
      <div role="tablist" aria-label="What a source can answer" className="flex w-fit max-w-full flex-wrap gap-1 rounded-[24px] bg-[var(--paper-2)] p-1">
        {examples.map((s, i) => (
          <button
            key={s.label}
            role="tab"
            aria-selected={i === active}
            aria-controls="status-panel"
            onClick={() => setActive(i)}
            className={`press rounded-full px-4 py-2 text-left transition-colors duration-[var(--t-hover)] ${
              i === active ? "name bg-white text-[var(--accent)] shadow-[0_1px_3px_rgba(28,28,28,0.12)]" : "text-[var(--muted)] hover:bg-white/60"
            }`}
          >
            {s.label}
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
