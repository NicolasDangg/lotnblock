"use client";

import { useState } from "react";
import type { ToolStep } from "@/lib/tools";

// Order is carried by colour: the darkest green first, each later stage a lighter flat tint.
const TINT = [
  { bg: "var(--green-deep)", fg: "#ffffff", code: "rgba(0,0,0,0.28)" },
  { bg: "var(--accent)", fg: "#ffffff", code: "rgba(0,0,0,0.22)" },
  { bg: "var(--green-soft)", fg: "var(--ink)", code: "rgba(255,255,255,0.6)" },
  { bg: "var(--accent-tint)", fg: "var(--ink)", code: "rgba(255,255,255,0.75)" },
];

/**
 * The four TinyFish tools as one accordion of tinted panels: the open stage shows the tool's job
 * and the exact request this site sends for the example address; the others wait as slivers with
 * their names. Stacks into bars on a phone. Without script, every stage is open.
 */
export function Tools({ tools }: { tools: ToolStep[] }) {
  const [open, setOpen] = useState(0);

  return (
    <div className="stages flex flex-col overflow-hidden rounded-[var(--r)] md:h-[600px] md:flex-row">
      {tools.map((t, i) => {
        const tint = TINT[i % TINT.length];
        const isOpen = i === open;
        return (
          <section
            key={t.name}
            aria-label={t.name}
            style={{ background: tint.bg, color: tint.fg }}
            className={`min-w-0 transition-[flex-grow] duration-[450ms] ease-[var(--ease-out)] md:basis-0 ${isOpen ? "md:grow-[7]" : "md:grow"}`}
          >
            {isOpen ? null : (
              <button
                type="button"
                onClick={() => setOpen(i)}
                aria-expanded={false}
                className="stage-toggle t-lead d-strong flex h-16 w-full cursor-pointer items-center px-6 text-left transition-opacity duration-[var(--t-hover)] hover:opacity-75 md:h-full md:items-end md:p-6"
              >
                <span className="md:rotate-180 md:[writing-mode:vertical-rl]">{t.name}</span>
              </button>
            )}
            <div className={`flex h-full flex-col gap-5 p-6 md:p-9 ${isOpen ? "arrive" : "stage-closed"}`}>
              <h3 className="d-title">{t.name}</h3>
              <p className="max-w-[52ch]">{t.job}</p>
              <pre
                data-ui
                style={{ background: tint.code }}
                className="mt-auto max-h-[260px] min-h-0 overflow-auto rounded-[var(--r)] p-5 text-[13px] leading-relaxed [overflow-wrap:anywhere] whitespace-pre-wrap md:max-h-none md:flex-1"
                tabIndex={0}
                aria-label={`The request this site sends to TinyFish ${t.name}`}
              >
                <code>{t.code}</code>
              </pre>
            </div>
          </section>
        );
      })}
    </div>
  );
}
