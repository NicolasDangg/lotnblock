/**
 * The report's summary: the few figures a buyer looks for first, and the facts worth knowing,
 * each worked out from the assessor's record in plain words. Nothing here is a guess; a fact that
 * isn't on the record simply doesn't produce a line.
 */
import type { AssessorRecord, Sale } from "./sources/assessor";

export interface Highlight {
  /** "watch": worth checking before deciding. "note": useful context. "gap": a source not yet read. */
  tone: "watch" | "note" | "gap";
  title: string;
  detail: string;
}

/** Seattle's zone families, by code prefix, in plain words. Longest prefixes first. */
const SEATTLE_ZONES: [string, string][] = [
  ["RSL", "residential small lot"],
  ["NR", "neighborhood residential: houses and backyard cottages"],
  ["SF", "single-family residential"],
  ["LR", "lowrise: townhouses and small apartment buildings"],
  ["MR", "midrise apartments"],
  ["HR", "highrise apartments"],
  ["NC", "neighborhood commercial: shops with homes above"],
  ["SM", "Seattle mixed use"],
  ["C1", "commercial"],
  ["C2", "commercial"],
  ["IG", "industrial"],
  ["IB", "industrial buffer"],
  ["IC", "industrial commercial"],
  ["D", "downtown"],
];

export function zoneInPlainWords(code: string, jurisdiction: string): string | null {
  if (!code || jurisdiction.toUpperCase() !== "SEATTLE") return null;
  const c = code.toUpperCase();
  const words = SEATTLE_ZONES.find(([prefix]) => c.startsWith(prefix))?.[1];
  return words ? words.charAt(0).toUpperCase() + words.slice(1) : null;
}

/** "10/17/2013" → Date. The assessor prints US month/day/year. */
const parseDate = (s: string) => {
  const [m, d, y] = s.split("/").map(Number);
  return y ? new Date(y, m - 1, d) : null;
};

export const monthYear = (s: string) =>
  parseDate(s)?.toLocaleDateString("en-US", { month: "short", year: "numeric" }) ?? s;

/** The latest transfer that had a price: quit-claims and trust transfers record $0 and aren't sales. */
export const lastSale = (r: AssessorRecord): Sale | null => r.sales.find((s) => (s.price ?? 0) > 0) ?? null;

/** Change in assessed total between the two latest tax years, as a fraction (0.12 = up 12%). */
export function valueChange(r: AssessorRecord) {
  const v = r.assessedValues.filter((x) => x.totalValue);
  if (v.length < 2) return null;
  const [now, before] = v;
  return { now, before, change: (now.totalValue! - before.totalValue!) / before.totalValue! };
}

const FLAG_WORDS: Record<string, string> = {
  "traffic noise": "road noise",
  "airport noise": "aircraft noise",
  "power lines": "nearby power lines",
  "historic site": "a historic designation",
  "easements": "an easement",
  "water problems": "a water problem",
  "contamination": "possible contamination",
  "wetland": "a wetland",
  "steep slope": "a steep slope",
};

export function highlights(r: AssessorRecord, unchecked: string[], now = new Date()): Highlight[] {
  const out: Highlight[] = [];

  for (const [name, level] of Object.entries(r.flags)) {
    const lvl = level.toLowerCase();
    const what = FLAG_WORDS[name.toLowerCase()] ?? name.toLowerCase();
    const serious = !/^(low|minor|moderate|no|none)$/.test(lvl);
    out.push({
      tone: serious ? "watch" : "note",
      title: `${name.charAt(0)}${name.slice(1).toLowerCase()}: ${lvl}`,
      detail: `The assessor records ${what} at this lot, rated ${lvl}.`,
    });
  }

  if (r.propertyType && r.propertyType !== "R" && r.presentUse) {
    out.push({
      tone: "watch",
      title: `Used as ${r.presentUse.toLowerCase()}`,
      detail: "The assessor lists this lot as non-residential, so it is valued and taxed as a business property.",
    });
  }

  const vc = valueChange(r);
  if (vc && Math.abs(vc.change) >= 0.1) {
    const pct = Math.round(Math.abs(vc.change) * 100);
    out.push({
      tone: "note",
      title: `Value ${vc.change > 0 ? "up" : "down"} ${pct}% in a year`,
      detail: `Assessed at ${usd(vc.now.totalValue)} for ${vc.now.taxYear} taxes, against ${usd(vc.before.totalValue)} for ${vc.before.taxYear}.`,
    });
  }

  const recent = r.permits.find((p) => {
    const d = parseDate(p.issued);
    return d && now.getTime() - d.getTime() < 2 * 365 * 864e5;
  });
  if (recent) {
    out.push({
      tone: "note",
      title: `Work permitted ${monthYear(recent.issued)}`,
      detail: recent.description || `Permit ${recent.number}.`,
    });
  }

  const sale = lastSale(r);
  const since = sale && parseDate(sale.date);
  if (sale && since && r.sales[0] === sale && now.getFullYear() - since.getFullYear() >= 15) {
    out.push({
      tone: "note",
      title: `Same owner since ${since.getFullYear()}`,
      detail: `The last sale was ${monthYear(sale.date)}, so the price paid says little about today's value.`,
    });
  }

  if (r.appeals.length) {
    const a = r.appeals[0];
    out.push({
      tone: "note",
      title: `Value appealed for ${a.taxYear}`,
      detail: `The owner challenged the assessment; the decision was ${a.decision.toLowerCase() || "not stated"}.`,
    });
  }

  if (unchecked.length) {
    out.push({
      tone: "gap",
      title: "Not checked yet",
      detail: `${list(unchecked)}. These sources aren't connected yet, so check them yourself before deciding.`,
    });
  }

  const order = { watch: 0, note: 1, gap: 2 };
  return out.sort((a, b) => order[a.tone] - order[b.tone]);
}

const usd = (n: number | null) =>
  n == null ? "an unstated value" : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

const list = (xs: string[]) => {
  const s = xs.length < 2 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs.at(-1)}`;
  return s.charAt(0).toUpperCase() + s.slice(1);
};
