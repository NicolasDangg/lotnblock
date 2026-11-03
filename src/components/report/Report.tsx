"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AddressForm } from "@/components/AddressForm";
import { Pole } from "@/components/Pole";
import type { DossierEvent } from "@/lib/dossier";
import type { Plat } from "@/lib/plat";
import type { AssessorRecord } from "@/lib/sources/assessor";
import type { ResolvedProperty, Section } from "@/lib/types";
import { AssessorSection } from "./AssessorSection";
import { parcel, titleCase } from "./format";
import { PlatDrawing } from "./PlatDrawing";

interface State {
  property: ResolvedProperty | null;
  sources: { key: string; name: string; connected: boolean }[];
  plat: Plat | null | undefined; // undefined while loading, null when unavailable
  sections: Record<string, Section<unknown>>;
  error: string | null;
  doneMs: number | null;
}

const EMPTY: State = { property: null, sources: [], plat: undefined, sections: {}, error: null, doneMs: null };

/** Reads the NDJSON dossier stream and fills the report in as each source answers. */
function useDossier(q: string) {
  const [state, setState] = useState<State>(EMPTY);
  useEffect(() => {
    const ctrl = new AbortController();
    const apply = (e: DossierEvent) =>
      setState((s) => {
        switch (e.type) {
          case "property":
            return { ...s, property: e.property, sources: e.sources };
          case "plat":
            return { ...s, plat: e.plat };
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

  return (
    <main className="grid grid-cols-[minmax(0,1fr)] gap-[var(--gap)] p-[var(--gap)] md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      {/* The stage: this lot's plat sheet */}
      <aside className="relative flex h-[56svh] flex-col bg-[var(--field-blush)] md:sticky md:top-[var(--gap)] md:h-[calc(100svh-2*var(--gap))]">
        <div className="relative flex-1 overflow-hidden">
          {s.plat ? (
            <div className="absolute inset-0 p-6" data-reveal>
              <PlatDrawing plat={s.plat} label={`Lot outlines around ${p?.address ?? "the property"}, subject lot filled`} />
            </div>
          ) : (
            <p className="t-small muted absolute top-6 left-6">
              {s.error ? "" : s.plat === null ? "No lot outline available for this parcel." : p ? "Drawing the block…" : ""}
            </p>
          )}
        </div>
        <div className="bg-[var(--paper)] px-6 py-5">
          <p className="t-lead name">{p ? `Parcel ${parcel(p.pin)}` : s.error ? "No parcel found" : "Finding the parcel…"}</p>
          <p className="t-small muted mt-1">
            {p ? `${p.lat.toFixed(5)}° N, ${Math.abs(p.lon).toFixed(5)}° W · King County, Washington` : q}
          </p>
        </div>
      </aside>

      {/* The reading column */}
      <div className="min-w-0 bg-[var(--paper)]">
        <Pole />
        <div className="px-[var(--pad)] pt-8 pb-24">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <Link href="/" className="t-lead name press">
              Lot &amp; Block
            </Link>
            <div className="w-full max-w-[460px]">
              <AddressForm defaultValue={q} compact key={q} />
            </div>
          </div>

          {s.error ? (
            <div className="mt-16 bg-[var(--field-blush)] px-6 py-6" data-reveal>
              <h1 className="t-lead name">We couldn&apos;t find that property</h1>
              <p className="mt-2">{s.error}</p>
              <p className="mt-2">Try a full street address in King County, or a 10-digit parcel number.</p>
            </div>
          ) : (
            <>
              <h1 className="t-head mt-16 max-w-[16ch]">{p ? titleCase(p.address) : q}</h1>
              <p className="t-lead mt-3 text-[var(--muted)]">
                {p ? `${p.city}, WA ${p.zip}` : <span className="reading">Matching the address to its parcel…</span>}
              </p>

              {p ? (
                <section className="mt-14" aria-label="Sources">
                  <p>
                    {s.doneMs != null
                      ? `${answered} of ${connected} connected sources answered in ${(s.doneMs / 1000).toFixed(1)} seconds.`
                      : `Reading ${connected} connected ${connected === 1 ? "source" : "sources"}…`}
                  </p>
                  <ul className="mt-4 flex flex-col gap-1">
                    {s.sources.map((src) => (
                      <li key={src.key} className="flex justify-between gap-6">
                        <span className={src.connected ? "" : "muted"}>{src.name}</span>
                        <SourceState connected={src.connected} section={s.sections[src.key]} />
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}

              {s.sections.assessor ? (
                <AssessorSection section={s.sections.assessor as Section<AssessorRecord>} />
              ) : null}
            </>
          )}
        </div>
      </div>
    </main>
  );
}

const STATE_TEXT = {
  found: "Answered",
  none: "Nothing on record",
  source_error: "Couldn't check",
  not_applicable: "Not covered here",
} as const;

function SourceState({ connected, section }: { connected: boolean; section?: Section<unknown> }) {
  if (!connected) return <span className="muted shrink-0">Not connected yet</span>;
  if (!section) return <span className="reading shrink-0">Reading…</span>;
  return (
    <span className={`name shrink-0 ${section.status === "source_error" ? "bg-[var(--field-blush)] px-2" : ""}`}>
      {STATE_TEXT[section.status]}
    </span>
  );
}
