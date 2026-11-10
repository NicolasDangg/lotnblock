"use client";

import Link from "next/link";
import { useId, useRef, useState } from "react";

const MODES = {
  address: {
    tab: "Address",
    placeholder: "4122 Wallingford Ave N, Seattle",
    label: "King County street address",
    inputMode: "text" as const,
    autoComplete: "street-address",
    examples: ["1600 E Olive Way, Seattle", "11418 NE 19th St, Bellevue"],
  },
  parcel: {
    tab: "Parcel number",
    placeholder: "198520-0495",
    label: "King County parcel number",
    inputMode: "numeric" as const,
    autoComplete: "off",
    examples: ["198520-0495", "408330-1700"],
  },
};
type Mode = keyof typeof MODES;

/**
 * The search, the way a listings site does it: a row of tabs over one white pill with the action
 * inside its right end. Both tabs send the same `q` to /report, which accepts an address or a
 * parcel number; the tab only changes the hint, the keyboard and the examples. Without script it
 * is still a plain GET form. Tabs and examples take the colour of whatever they sit on.
 */
export function Search() {
  const [mode, setMode] = useState<Mode>("address");
  const input = useRef<HTMLInputElement>(null);
  const id = useId();
  const m = MODES[mode];

  return (
    <div>
      <div role="radiogroup" aria-label="Search by" className="mb-4 flex gap-7">
        {(Object.keys(MODES) as Mode[]).map((k) => (
          <button
            key={k}
            type="button"
            role="radio"
            aria-checked={mode === k}
            onClick={() => {
              setMode(k);
              input.current?.focus();
            }}
            className={`navlink press min-h-11 cursor-pointer ${mode === k ? "" : "opacity-80 hover:opacity-100"}`}
          >
            {MODES[k].tab}
          </button>
        ))}
      </div>

      <form action="/report" method="get" className="flex w-full items-center gap-2 rounded-full bg-white p-1.5 text-[var(--ink)]">
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
          className="min-h-14 min-w-0 flex-1 rounded-full bg-transparent pr-2 pl-6 text-[length:var(--step-body)] placeholder:text-[var(--muted)] focus:outline-none"
        />
        <button type="submit" className="btn min-h-14 shrink-0 gap-2.5 px-5 sm:px-7">
          <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
            <circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" strokeWidth="2.2" />
            <path d="M15.5 15.5L21 21" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          </svg>
          <span className="max-sm:sr-only">Look up</span>
        </button>
      </form>

      <p className="mt-4">
        Try{" "}
        {m.examples.map((e, i) => (
          <span key={e} className={i ? "max-sm:hidden" : ""}>
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
