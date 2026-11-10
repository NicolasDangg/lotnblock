"use client";

import { useState } from "react";

export interface Answer {
  label: string;
  text: string;
  /** Where the fragment comes from: a real lookup, or example wording. */
  provenance: string;
  /** The report's own component for this answer. */
  fragment: React.ReactNode;
}

/** The four answers a source can give. Each tab shows how the report prints that answer. */
export function Answers({ answers }: { answers: Answer[] }) {
  const [active, setActive] = useState(0);
  const a = answers[active];

  return (
    <div>
      <div role="tablist" aria-label="What a source can answer" className="grid grid-cols-2 gap-1 rounded-[28px] bg-[var(--field-input)] p-1.5 sm:flex sm:w-fit sm:max-w-full sm:flex-wrap">
        {answers.map((s, i) => (
          <button
            key={s.label}
            type="button"
            role="tab"
            id={`answer-tab-${i}`}
            aria-selected={i === active}
            aria-controls="answer-panel"
            onClick={() => setActive(i)}
            className={`press min-h-11 cursor-pointer rounded-full px-3 font-medium sm:px-5 transition-colors duration-[var(--t-hover)] ${
              i === active ? "bg-[var(--ink)] text-white" : "hover:bg-[var(--paper-2)]"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>
      <div id="answer-panel" role="tabpanel" aria-labelledby={`answer-tab-${active}`} key={active} className="arrive mt-8 max-w-[600px]">
        <p className="t-lead">{a.text}</p>
        <p className="mt-8 mb-3 text-[var(--muted)]">As a report prints it ({a.provenance})</p>
        <div data-ui>{a.fragment}</div>
      </div>
    </div>
  );
}
