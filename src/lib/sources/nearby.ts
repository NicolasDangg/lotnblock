/**
 * What the city has on record at and around a Seattle lot: the newest building permits, land use
 * applications and code complaints within a short walk. Seattle publishes each record with its
 * coordinates (data.seattle.gov, the city's own copy of the Services Portal), so one TinyFish Fetch
 * per list reads everything near a point. The dossier's own permit section still comes from the
 * portal itself (TinyFish Agent); this is what "Watch this address" re-reads every morning, so a new
 * permit next door shows up as a change.
 */
import { fetchPages } from "../tinyfish";

/** How far from the lot counts as near, in metres: the lot's own block. */
export const NEAR_METRES = 150;
/** Newest records kept from each list. Enough for a block; short enough to diff cleanly. */
const PER_LIST = 8;

export interface NearbyRecord {
  kind: "Building permit" | "Land use application" | "Code complaint";
  number: string;
  type: string;
  status: string;
  /** YYYY-MM-DD, as the city dates the record (applied or opened). */
  date: string;
  address: string;
  description: string;
  metres: number;
  /** The record's own page on the Seattle Services Portal. */
  url: string;
}

interface Row {
  permitnum?: string;
  recordnum?: string;
  permittypedesc?: string;
  permittypemapped?: string;
  recordtypedesc?: string;
  recordtype?: string;
  description?: string;
  statuscurrent?: string;
  applieddate?: string;
  opendate?: string;
  originaladdress1?: string;
  latitude?: string;
  longitude?: string;
}

const LISTS: { kind: NearbyRecord["kind"]; id: string; date: "applieddate" | "opendate" }[] = [
  { kind: "Building permit", id: "76t5-zqzr", date: "applieddate" },
  { kind: "Land use application", id: "ht3q-kdvx", date: "applieddate" },
  { kind: "Code complaint", id: "ez4a-iug7", date: "opendate" },
];

/** The city's list of records within NEAR_METRES of a point, newest first. */
export function listUrl(id: string, date: string, lat: number, lon: number, today: string): string {
  // Records dated in the future are data-entry slips; leave them out so they don't sit on top.
  const where = `within_circle(location1,${lat.toFixed(6)},${lon.toFixed(6)},${NEAR_METRES}) AND ${date} IS NOT NULL AND ${date} <= '${today}'`;
  const qs = new URLSearchParams({ $where: where, $order: `${date} DESC`, $limit: String(PER_LIST) });
  return `https://data.seattle.gov/resource/${id}.json?${qs}`;
}

/** Metres between two points (haversine). */
export function metresBetween(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const rad = Math.PI / 180;
  const a =
    Math.sin(((lat2 - lat1) * rad) / 2) ** 2 +
    Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(((lon2 - lon1) * rad) / 2) ** 2;
  return 6_371_000 * 2 * Math.asin(Math.sqrt(a));
}

const squash = (s?: string) => (s ?? "").replace(/\s+/g, " ").trim();

/**
 * Turns one list's body into records. Fetch returns the JSON as text and may escape markdown
 * characters ("max\_applieddate"); those escapes are removed first. Throws if it isn't a list.
 */
export function parseList(kind: NearbyRecord["kind"], text: string, lat: number, lon: number): NearbyRecord[] {
  const rows = JSON.parse(text.replace(/\\([_*[\]()#+\-.!`>~|])/g, "$1")) as Row[];
  if (!Array.isArray(rows)) throw new Error("the city's list didn't come back as a list");
  return rows
    .map((r) => {
      const number = squash(r.permitnum ?? r.recordnum);
      const at = Number(r.latitude) && Number(r.longitude) ? metresBetween(lat, lon, Number(r.latitude), Number(r.longitude)) : NaN;
      return {
        kind,
        number,
        type: squash(r.permittypedesc ?? r.recordtypedesc ?? r.permittypemapped ?? r.recordtype),
        status: squash(r.statuscurrent),
        date: (r.applieddate ?? r.opendate ?? "").slice(0, 10),
        address: squash(r.originaladdress1),
        description: squash(r.description).slice(0, 160),
        metres: Number.isFinite(at) ? Math.round(at / 10) * 10 : NaN,
        url: `https://services.seattle.gov/portal/customize/LinkToRecord.aspx?altId=${encodeURIComponent(number)}`,
      };
    })
    .filter((r) => r.number && r.date);
}

/** One line per record for the watched snapshot: stable wording, so only a real change is a diff. */
export function nearbyLine(r: NearbyRecord, ownAddress: string): string {
  const where =
    r.address.toUpperCase() === ownAddress.toUpperCase()
      ? "at this address"
      : `at ${r.address || "an unlisted address"}${Number.isFinite(r.metres) ? `, about ${r.metres} m away` : ""}`;
  // A complaint's text is a neighbour's own words and often names people: the record link has it,
  // the snapshot doesn't repeat it.
  const about = r.kind === "Code complaint" ? "" : r.description;
  return `${r.date}: ${r.kind} ${r.number} ${where} (${[r.type, r.status].filter(Boolean).join(", ")})${about ? `: ${about}` : ""} ${r.url}`;
}

/** Reads all three lists with TinyFish Fetch. Throws if any can't be read: a partial read would look like a change. */
export async function nearby(lat: number, lon: number): Promise<NearbyRecord[]> {
  const today = new Date().toISOString().slice(0, 10);
  const texts = await fetchPages(LISTS.map((l) => listUrl(l.id, l.date, lat, lon, today)));
  return LISTS.flatMap((l, i) => {
    const text = texts[i];
    if (!text) throw new Error(`Seattle's ${l.kind.toLowerCase()} list didn't answer`);
    return parseList(l.kind, text, lat, lon);
  });
}
