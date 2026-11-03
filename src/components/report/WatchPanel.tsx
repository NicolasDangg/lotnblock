"use client";

import { useEffect, useState } from "react";
import type { Alert, Monitor } from "@/lib/monitor";

interface WatchState {
  watching: boolean;
  monitor: Monitor | null;
  alerts: Alert[];
}

const when = (iso: string) =>
  new Date(iso.includes("T") ? iso : `${iso.replace(" ", "T")}Z`).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

/**
 * "Watch this address": a TinyFish Monitor re-reads the parcel's county records every morning and
 * reports what changed. Shows the watch's checks so far, newest first.
 */
export function WatchPanel({ pin, q }: { pin: string; q: string }) {
  const [state, setState] = useState<WatchState | null>(null);
  const [busy, setBusy] = useState<"start" | "check" | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const ctrl = new AbortController();
    fetch(`/api/watch?pin=${pin}`, { signal: ctrl.signal })
      .then((r) => r.json())
      .then((b) => (b.error ? setError(b.error) : setState(b)))
      .catch(() => {});
    return () => ctrl.abort();
  }, [pin]);

  async function act(kind: "start" | "check") {
    setBusy(kind);
    setError(null);
    const url = kind === "start" ? `/api/watch?q=${encodeURIComponent(q)}` : `/api/watch?pin=${pin}&action=check`;
    try {
      const b = await (await fetch(url, { method: "POST" })).json();
      if (b.error) setError(b.error);
      else setState((s) => ({ watching: true, monitor: b.monitor ?? s?.monitor ?? null, alerts: b.alerts ?? s?.alerts ?? [] }));
    } catch {
      setError("The watch service didn't answer.");
    }
    setBusy(null);
  }

  return (
    <section id="watch" className="mt-12 scroll-mt-24 bg-[var(--field-input)] px-6 py-6" aria-labelledby="watch-h">
      <div className="flex flex-wrap items-start justify-between gap-x-8 gap-y-4">
        <div className="max-w-[56ch]">
          <h2 id="watch-h" className="t-lead name">
            {state?.watching ? "Watching this address" : "Watch this address"}
          </h2>
          <p className="mt-1 text-[var(--muted)]">
            {state?.watching
              ? `Every morning at 7, TinyFish Monitor re-reads the county's records for this lot and lists here anything that changed: a new permit, a sale, a new owner or value, a new hazard flag.${state.monitor ? ` Watching since ${when(state.monitor.created_at)}.` : ""}`
              : "Get the county's records for this lot re-read every morning. A new permit, a sale, a new owner or value, or a new hazard flag shows up here."}
          </p>
        </div>
        {state?.watching ? (
          <button type="button" className="btn press" onClick={() => act("check")} disabled={busy !== null}>
            {busy === "check" ? "Checking…" : "Check now"}
          </button>
        ) : (
          <button type="button" className="btn press" onClick={() => act("start")} disabled={busy !== null || !state}>
            {busy === "start" ? "Starting…" : "Watch this address"}
          </button>
        )}
      </div>

      {error ? <p className="mt-4 bg-[var(--field-blush)] px-4 py-3">Couldn&apos;t do that: {error}.</p> : null}

      {state?.watching && state.alerts.length ? (
        <ol className="mt-6 flex flex-col gap-4">
          {state.alerts.slice(0, 8).map((a, i) => (
            <li key={a.at + i} className={a.outcome === "changed" && a.relevant !== false ? "bg-[var(--field-blush)] px-4 py-3" : ""}>
              <p>
                <span className="name">{when(a.at)}: </span>
                {a.outcome === "baseline"
                  ? "Started watching. The records as they stand now are the baseline."
                  : a.outcome === "unchanged"
                    ? "No change."
                    : a.summary ?? (a.relevant === false ? "A minor change on the page, not a new record." : "The records changed.")}
              </p>
              {a.outcome === "changed" && a.added.length ? (
                <ul className="t-small mt-1 text-[var(--muted)]">
                  {a.added.slice(0, 5).map((l) => (
                    <li key={l}>New: {l}</li>
                  ))}
                </ul>
              ) : null}
            </li>
          ))}
        </ol>
      ) : null}
    </section>
  );
}
