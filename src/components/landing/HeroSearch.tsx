"use client";

import Link from "next/link";
import { useId, useRef, useState } from "react";

const MODES = {
  address: {
    tab: "Address",
    placeholder: "Street address, e.g. 4122 Wallingford Ave N, Seattle",
    label: "King County street address",
    inputMode: "text" as const,
    autoComplete: "street-address",
    examples: ["1600 E Olive Way, Seattle", "11418 NE 19th St, Bellevue"],
  },
  parcel: {
    tab: "Parcel number",
    placeholder: "10-digit parcel number, e.g. 198520-0495",
    label: "King County parcel number",
    inputMode: "numeric" as const,
    autoComplete: "off",
    examples: ["198520-0495", "408330-1700"],
  },
};
type Mode = keyof typeof MODES;

/**
 * The hero search: a two-way switch (address or parcel number) over one pill-shaped bar. Both send
 * the same `q` to /report, which accepts either; the switch only changes the hint, the keyboard and
 * the examples. Without script it's still a plain GET form that works.
 */
export function HeroSearch() {
  const [mode, setMode] = useState<Mode>("address");
  const input = useRef<HTMLInputElement>(null);
  const id = useId();
  const m = MODES[mode];

  const pick = (next: Mode) => {
    setMode(next);
    input.current?.focus();
  };

  return (
    <div>
      <div role="radiogroup" aria-label="Search by" className="mx-auto mb-4 flex w-fit gap-1 rounded-full bg-[var(--ink)]/45 p-1 backdrop-blur-md">
        {(Object.keys(MODES) as Mode[]).map((k) => (
          <button
            key={k}
            type="button"
            role="radio"
            aria-checked={mode === k}
            onClick={() => pick(k)}
            className={`press rounded-full px-5 py-2 font-medium transition-colors duration-[var(--t-hover)] ${
              mode === k ? "bg-white text-[var(--accent)]" : "text-[var(--paper)] hover:bg-white/15"
            }`}
          >
            {MODES[k].tab}
          </button>
        ))}
      </div>

      <form
        action="/report"
        method="get"
        className="flex w-full flex-col gap-2 rounded-[32px] bg-white p-2 shadow-[0_12px_40px_rgba(28,28,28,0.25)] sm:flex-row sm:rounded-full"
      >
        <label htmlFor={id} className="sr-only">
          {m.label}
        </label>
        <input
          ref={input}
          id={id}
          name="q"
          required
          inputMode={m.inputMode}
          autoComplete={m.autoComplete}
          placeholder={m.placeholder}
          className="min-h-14 min-w-0 flex-1 rounded-full bg-transparent px-5 text-[length:var(--step-body)] text-[var(--ink)] placeholder:text-[var(--muted)] focus:outline-none"
        />
        <button type="submit" className="btn min-h-14 shrink-0 gap-2 px-7">
          <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
            <circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" strokeWidth="2" />
            <path d="M15.5 15.5L21 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          Look up
        </button>
      </form>

      <p className="mt-5 text-center">
        Try{" "}
        {m.examples.map((e, i) => (
          <span key={e}>
            {i ? " or " : ""}
            <Link className="link" href={`/report?q=${encodeURIComponent(e)}`}>
              {e}
            </Link>
          </span>
        ))}
      </p>
    </div>
  );
}
