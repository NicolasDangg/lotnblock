/**
 * One real lookup the landing page shows off: the same pipeline as /report, run on the server and
 * kept for an hour so the page doesn't hit the county on every view. Nothing here is sample data;
 * if a step fails, the page says so.
 */
import { plat, type Plat } from "./plat";
import { resolve } from "./resolve";
import { assessor, type AssessorRecord } from "./sources/assessor";
import type { ResolvedProperty, Section } from "./types";

export const EXAMPLE_ADDRESS = "1600 E Olive Way, Seattle";

export interface Example {
  input: string;
  /** What the Census geocoder standardised the input to. */
  property: ResolvedProperty | null;
  plat: Plat | null;
  assessor: Section<AssessorRecord> | null;
}

const TTL_MS = 60 * 60 * 1000;
let cached: { at: number; value: Promise<Example> } | null = null;

async function load(): Promise<Example> {
  try {
    const property = await resolve(EXAMPLE_ADDRESS);
    const [p, a] = await Promise.all([plat(property), assessor(property)]);
    return { input: EXAMPLE_ADDRESS, property, plat: p, assessor: a };
  } catch {
    return { input: EXAMPLE_ADDRESS, property: null, plat: null, assessor: null };
  }
}

export function getExample(): Promise<Example> {
  if (!cached || Date.now() - cached.at > TTL_MS) cached = { at: Date.now(), value: load() };
  return cached.value;
}
