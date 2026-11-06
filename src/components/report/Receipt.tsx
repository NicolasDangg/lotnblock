import { VIA_LABEL } from "@/lib/sources";
import type { Section } from "@/lib/types";
import { time } from "./format";

/** The line under every section that proves where it came from. */
export function Receipt({ section }: { section: Section<unknown> }) {
  return (
    <p className="t-small muted mt-6">
      From {section.sourceName}, read at {time(section.retrievedAt)} with {VIA_LABEL[section.via]}.{" "}
      <a className="link text-[var(--ink)]" href={section.sourceUrl} target="_blank" rel="noreferrer">
        Open the source page
      </a>
    </p>
  );
}

export type Tone = "found" | "none" | "not_applicable" | "source_error";

/** One muted colour per answer, used only on the icon and the label: the card itself stays neutral. */
const TONE: Record<Tone, { color: string; label: string }> = {
  found: { color: "var(--accent)", label: "Found" },
  none: { color: "var(--accent)", label: "Checked: none" },
  not_applicable: { color: "var(--muted)", label: "Not covered" },
  source_error: { color: "#9a4b1f", label: "Couldn't check" },
};

export function StatusIcon({ tone, className = "size-5" }: { tone: Tone; className?: string }) {
  const c = TONE[tone].color;
  return (
    <svg viewBox="0 0 20 20" className={`shrink-0 ${className}`} aria-hidden>
      <circle cx="10" cy="10" r="8.25" fill="none" stroke={c} strokeWidth="1.5" />
      {tone === "found" || tone === "none" ? (
        <path d="M6.3 10.2l2.4 2.4 5-5" fill="none" stroke={c} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      ) : tone === "not_applicable" ? (
        <path d="M6.5 10h7" stroke={c} strokeWidth="1.6" strokeLinecap="round" />
      ) : (
        <>
          <path d="M10 5.8v5.2" stroke={c} strokeWidth="1.6" strokeLinecap="round" />
          <circle cx="10" cy="13.9" r="1" fill={c} />
        </>
      )}
    </svg>
  );
}

/** The small status label used in source lists: icon plus words, no coloured block. */
export function StatusBadge({ tone, children }: { tone: Tone; children?: React.ReactNode }) {
  return (
    <span className="t-small name inline-flex shrink-0 items-center gap-1.5" style={{ color: TONE[tone].color }}>
      <StatusIcon tone={tone} className="size-4" />
      {children ?? TONE[tone].label}
    </span>
  );
}

/** A report notice: one neutral card for every answer, told apart by its icon and label. */
export function Notice({ tone, title, children }: { tone: Tone; title: React.ReactNode; children?: React.ReactNode }) {
  return (
    <div role={tone === "source_error" ? "alert" : undefined} className="flex gap-4 rounded-2xl border border-[var(--ink)]/10 bg-[var(--field-input)] px-5 py-4">
      <StatusIcon tone={tone} className="mt-0.5 size-5" />
      <div className="min-w-0">
        <p className="t-small name uppercase tracking-[0.06em]" style={{ color: TONE[tone].color }}>
          {TONE[tone].label}
        </p>
        <p className="name mt-1">{title}</p>
        {children ? <div className="mt-1 text-[var(--muted)]">{children}</div> : null}
      </div>
    </div>
  );
}

/** What a section shows when it has no records: a stated answer or a stated gap, never a blank. */
export function Gap({ section, what }: { section: Section<unknown>; what: string }) {
  if (section.status === "none") {
    return (
      <Notice tone="none" title={`No ${what} on record.`}>
        {section.sourceName} was checked and lists none.
      </Notice>
    );
  }
  if (section.status === "not_applicable") {
    return (
      <Notice tone="not_applicable" title="This source doesn't cover the address.">
        {section.note ?? `${section.sourceName} doesn't cover this address.`}
      </Notice>
    );
  }
  return (
    <Notice tone="source_error" title={`${what.charAt(0).toUpperCase()}${what.slice(1)} couldn't be read.`}>
      {section.sourceName} didn&apos;t respond{section.note ? <>: {section.note}</> : null}. You can{" "}
      <a className="link text-[var(--ink)]" href={section.sourceUrl} target="_blank" rel="noreferrer">
        check the page yourself
      </a>
      .
    </Notice>
  );
}
