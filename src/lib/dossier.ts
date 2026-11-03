/**
 * Builds a dossier as a stream of events, so the report can fill in source by source:
 * property → plat → one section per connected source (as each finishes) → done.
 */
import { plat, type Plat } from "./plat";
import { resolve, ResolveError } from "./resolve";
import { SOURCES } from "./sources";
import type { ResolvedProperty, Section } from "./types";

export type DossierEvent =
  | { type: "property"; property: ResolvedProperty; sources: { key: string; name: string; connected: boolean }[] }
  | { type: "plat"; plat: Plat | null }
  | { type: "section"; key: string; section: Section<unknown> }
  | { type: "error"; message: string }
  | { type: "done"; ms: number };

export async function buildDossier(input: string, emit: (e: DossierEvent) => void): Promise<void> {
  const t0 = Date.now();
  let property: ResolvedProperty;
  try {
    property = await resolve(input);
  } catch (err) {
    emit({ type: "error", message: err instanceof ResolveError ? err.message : "Couldn't look that address up" });
    return;
  }
  emit({
    type: "property",
    property,
    sources: SOURCES.map((s) => ({ key: s.key, name: s.name, connected: Boolean(s.run) })),
  });

  await Promise.all([
    plat(property).then((p) => emit({ type: "plat", plat: p })),
    ...SOURCES.filter((s) => s.run).map(async (s) => emit({ type: "section", key: s.key, section: await s.run!(property) })),
  ]);
  emit({ type: "done", ms: Date.now() - t0 });
}
