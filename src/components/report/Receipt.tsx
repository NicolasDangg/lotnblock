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

/** What a section shows when it has no records: a stated answer or a stated gap, never a blank. */
export function Gap({ section, what }: { section: Section<unknown>; what: string }) {
  if (section.status === "none") {
    return (
      <div className="bg-[var(--field-sage)] px-6 py-5">
        <p className="name">No {what} on record.</p>
        <p className="mt-1">{section.sourceName} was checked and lists none.</p>
      </div>
    );
  }
  if (section.status === "not_applicable") {
    return (
      <div className="bg-[var(--surface)] px-6 py-5">
        <p className="name">Not covered here.</p>
        <p className="mt-1">{section.note ?? `${section.sourceName} doesn't cover this address.`}</p>
      </div>
    );
  }
  return (
    <div className="bg-[var(--field-blush)] px-6 py-5">
      <p className="name">Couldn&apos;t check {what}.</p>
      <p className="mt-1">
        {section.sourceName} didn&apos;t respond{section.note ? <>: {section.note}</> : null}. You can{" "}
        <a className="link" href={section.sourceUrl} target="_blank" rel="noreferrer">
          check the page yourself
        </a>
        .
      </p>
    </div>
  );
}
