"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AddressForm } from "@/components/AddressForm";
import type { DossierEvent } from "@/lib/dossier";
import type { Outline } from "@/lib/outline";
import type { AssessorRecord } from "@/lib/sources/assessor";
import { assessorUrl } from "@/lib/sources/assessor";
import type { ResolvedProperty, Section } from "@/lib/types";
import { AssessorSection, ASSESSOR_PARTS } from "./AssessorSection";
import { Glance } from "./Glance";
import { parcel, titleCase } from "./format";

// Leaflet touches `window`, so the map only renders in the browser.
const ParcelMap = dynamic(() => import("./ParcelMap").then((m) => m.ParcelMap), {
  ssr: false,
  loading: () => <MapPlaceholder text="Loading the map…" />,
});

interface State {
  property: ResolvedProperty | null;
  sources: { key: string; name: string; topic: string; connected: boolean }[];
  outline: Outline | null | undefined; // undefined while loading, null when unavailable
  sections: Record<string, Section<unknown>>;
  error: string | null;
  doneMs: number | null;
}

const EMPTY: State = { property: null, sources: [], outline: undefined, sections: {}, error: null, doneMs: null };

/** Reads the NDJSON dossier stream and fills the report in as each source answers. */
function useDossier(q: string) {
  const [state, setState] = useState<State>(EMPTY);
  useEffect(() => {
    const ctrl = new AbortController();
    const apply = (e: DossierEvent) =>
      setState((s): State => {
        switch (e.type) {
          case "property":
            return { ...s, property: e.property, sources: e.sources };
          case "outline":
            return { ...s, outline: e.outline };
          case "section":
            return { ...s, sections: { ...s.sections, [e.key]: e.section } };
          case "error":
            return { ...s, error: e.message };
          case "done":
            return { ...s, doneMs: e.ms };
        }
      });
    (async () => {
      setState(EMPTY);
      try {
        const res = await fetch(`/api/dossier?q=${encodeURIComponent(q)}`, { signal: ctrl.signal });
        if (!res.body) throw new Error("No response");
        const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
        let buf = "";
        for (;;) {
          const { value, done } = await reader.read();
          if (done) break;
          buf += value;
          const lines = buf.split("\n");
          buf = lines.pop() ?? "";
          for (const line of lines) if (line.trim()) apply(JSON.parse(line));
        }
      } catch (err) {
        if ((err as Error).name !== "AbortError") apply({ type: "error", message: "The lookup stopped before it finished." });
      }
    })();
    return () => ctrl.abort();
  }, [q]);
  return state;
}

export function Report({ q }: { q: string }) {
  const s = useDossier(q);
  const p = s.property;
  const answered = s.sources.filter((src) => s.sections[src.key]).length;
  const connected = s.sources.filter((src) => src.connected).length;
  const assessor = s.sections.assessor as Section<AssessorRecord> | undefined;
  const unchecked = s.sources.filter((src) => !src.connected).map((src) => src.topic);

  return (
    <div className="min-h-svh bg-[var(--paper)]">
      {/* Header: the same translucent bar as the landing page, with the search in it */}
      <header className="sticky top-0 z-[1000] bg-[var(--paper)]/80 backdrop-blur-xl backdrop-saturate-150">
        <div className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-x-8 gap-y-3 px-[var(--pad)] py-3">
          <Link href="/" className="t-lead name press">
            Lot &amp; Block
          </Link>
          <div className="w-full max-w-[460px]">
            <AddressForm defaultValue={q} variant="compact" id="q-compact" key={q} />
          </div>
        </div>
      </header>

      <main>
        {/* The map */}
        <div className="mx-[var(--gap)] h-[48svh] min-h-[340px] overflow-hidden">
          {p ? (
            s.outline === undefined ? (
              <MapPlaceholder text="Finding the lot outline…" />
            ) : (
              <ParcelMap
                lat={p.lat}
                lon={p.lon}
                outline={s.outline}
                label={`Map of ${titleCase(p.address)}, ${p.city}, with the parcel outlined`}
              />
            )
          ) : (
            <MapPlaceholder text={s.error ? "No property to show." : "Finding the parcel…"} />
          )}
        </div>

        <div className="mx-auto max-w-[1240px] px-[var(--pad)]">
          {s.error ? (
            <div className="my-16 max-w-[60ch] bg-[var(--field-blush)] px-6 py-6" data-reveal>
              <h1 className="t-lead name">We couldn&apos;t find that property</h1>
              <p className="mt-2">{s.error}</p>
              <p className="mt-2">Try a full street address in King County, or a 10-digit parcel number.</p>
            </div>
          ) : (
            <>
              {/* Title block */}
              <div className="pt-10 pb-12 md:pt-14">
                <h1 className="t-head max-w-[18ch]">{p ? titleCase(p.address) : q}</h1>
                <p className="t-lead mt-3 text-[var(--muted)]">
                  {p ? `${p.city}, WA ${p.zip}` : <span className="reading">Matching the address to its parcel…</span>}
                </p>
                {p ? (
                  <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2">
                    <span className="name">Parcel {parcel(p.pin)}</span>
                    <span className="text-[var(--muted)]">
                      {p.lat.toFixed(5)}° N, {Math.abs(p.lon).toFixed(5)}° W
                    </span>
                    <a className="link" href={`https://www.google.com/maps/search/?api=1&query=${p.lat},${p.lon}`} target="_blank" rel="noreferrer">
                      Open in Google Maps
                    </a>
                    <a className="link" href={assessorUrl(p.pin)} target="_blank" rel="noreferrer">
                      Assessor page
                    </a>
                    <a className="link" href={`/api/dossier?q=${encodeURIComponent(q)}`}>
                      View as JSON
                    </a>
                  </div>
                ) : null}
              </div>

              {/* The summary: what a buyer reads first */}
              {p ? (
                <div className="pb-[clamp(64px,8vw,112px)]">
                  {assessor?.status === "found" && assessor.data ? (
                    <Glance record={assessor.data} unchecked={unchecked} />
                  ) : assessor ? null : (
                    <p className="reading t-lead">Reading the county&apos;s record for this lot…</p>
                  )}
                </div>
              ) : null}

              {/* The full record: sources and contents beside it */}
              {p ? (
                <div className="grid grid-cols-[minmax(0,1fr)] gap-x-[var(--pad)] gap-y-12 pb-[clamp(96px,12vw,160px)] lg:grid-cols-[260px_minmax(0,1fr)]">
                  <aside className="lg:sticky lg:top-24 lg:self-start">
                    <h2 className="name">Sources</h2>
                    <p className="t-small mt-1 text-[var(--muted)]">
                      {s.doneMs != null
                        ? `${answered} of ${connected} working ${connected === 1 ? "source" : "sources"} answered in ${(s.doneMs / 1000).toFixed(1)} s`
                        : `Checking ${connected} working ${connected === 1 ? "source" : "sources"}…`}
                    </p>
                    <ul className="mt-4 flex flex-col gap-2">
                      {s.sources.map((src) => (
                        <li key={src.key} className="flex items-baseline justify-between gap-4">
                          <span className={src.connected ? "" : "text-[var(--muted)]"}>{src.name}</span>
                          <SourceState connected={src.connected} section={s.sections[src.key]} />
                        </li>
                      ))}
                    </ul>
                    {assessor?.status === "found" ? (
                      <nav className="mt-10 hidden lg:block" aria-label="Report contents">
                        <h2 className="name">In this report</h2>
                        <ul className="mt-3 flex flex-col gap-1.5">
                          {ASSESSOR_PARTS.map((part) => (
                            <li key={part.id}>
                              <a className="text-[var(--muted)] hover:text-[var(--ink)] hover:underline" href={`#${part.id}`}>
                                {part.title}
                              </a>
                            </li>
                          ))}
                        </ul>
                      </nav>
                    ) : null}
                  </aside>

                  <div className="min-w-0">
                    <h2 className="t-head mb-2">The full record</h2>
                    {assessor ? (
                      <AssessorSection section={assessor} />
                    ) : (
                      <p className="reading">Fetching the King County Assessor&apos;s page…</p>
                    )}
                  </div>
                </div>
              ) : null}
            </>
          )}
        </div>
      </main>

      <footer className="bg-[var(--ink)] px-[var(--pad)] py-10 text-[var(--paper)]">
        <div className="mx-auto flex max-w-[1240px] flex-wrap items-baseline justify-between gap-6">
          <Link href="/" className="t-lead name">
            Lot &amp; Block
          </Link>
          <p className="t-small max-w-[60ch] text-[var(--field-sage)]">
            Records belong to the agencies that publish them. Check the linked source before relying on any record.
            Street map &copy; OpenStreetMap contributors. Aerial photo and parcel lines from King County GIS.
          </p>
        </div>
      </footer>
    </div>
  );
}

function MapPlaceholder({ text }: { text: string }) {
  return (
    <div className="flex h-full w-full items-center justify-center bg-[var(--paper-2)]">
      <p className="reading text-[var(--muted)]">{text}</p>
    </div>
  );
}

const STATE_TEXT = {
  found: "Answered",
  none: "None on record",
  source_error: "Couldn't check",
  not_applicable: "Not covered",
} as const;

function SourceState({ connected, section }: { connected: boolean; section?: Section<unknown> }) {
  if (!connected) return <span className="t-small shrink-0 text-[var(--muted)]">Planned</span>;
  if (!section) return <span className="t-small reading shrink-0">Checking…</span>;
  return (
    <span className={`t-small name shrink-0 ${section.status === "source_error" ? "bg-[var(--field-blush)] px-2" : ""}`}>
      {STATE_TEXT[section.status]}
    </span>
  );
}
