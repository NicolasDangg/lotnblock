/**
 * The dossier's honesty contract: every section says where it came from, when, how it was
 * retrieved, and whether it actually found anything. Nothing is filled in by guessing.
 */

/** Which TinyFish endpoint (or glue lookup) produced a section. */
export type Via = "fetch" | "agent" | "search" | "monitor" | "gis";

export type SectionStatus =
  /** The source answered and had records for this property. */
  | "found"
  /** The source answered, and says it has no records (e.g. zero violations). */
  | "none"
  /** We couldn't get an answer: site down, blocked, timed out, or unparseable. */
  | "source_error"
  /** This source doesn't cover the property (e.g. a Seattle-only portal for a Bellevue address). */
  | "not_applicable"
  /** A slow source (a TinyFish Agent run) is still working; ask /api/section again for the answer. */
  | "pending";

export interface Section<T> {
  status: SectionStatus;
  /** Official page the data was read from: the "receipt". */
  sourceUrl: string;
  sourceName: string;
  via: Via;
  retrievedAt: string; // ISO timestamp
  data: T | null;
  /** Human-readable reason when status isn't "found", or a caveat on a "found" section (e.g. the source lists more records than were read). */
  note?: string;
}

/** The property, resolved once and shared by every source. */
export interface ResolvedProperty {
  input: string;
  /** King County 10-digit parcel number (MAJOR + MINOR). */
  pin: string;
  address: string; // e.g. "400 BROAD ST"
  city: string;
  /** Who governs land use here: a city name, or "Unincorporated King County". */
  jurisdiction: string;
  zip: string;
  lat: number;
  lon: number;
}

export function section<T>(
  base: Pick<Section<T>, "sourceUrl" | "sourceName" | "via">,
  status: SectionStatus,
  data: T | null,
  note?: string,
): Section<T> {
  return { ...base, status, data, note, retrievedAt: new Date().toISOString() };
}
