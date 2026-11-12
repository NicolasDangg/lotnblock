/**
 * City permit portals. In Seattle: the Seattle Services Portal (Accela), which holds every permit,
 * complaint and violation for an address, so one run answers two dossier sections. Elsewhere in
 * King County: TinyFish Search finds the jurisdiction's own permit search (many cities share
 * MyBuildingPermit), and TinyFish Agent searches it. These portals are search forms with no API.
 */
import { getCache } from "@vercel/functions";
import { agentJob, AgentUnavailable } from "../agent";
import { searchWeb } from "../tinyfish";
import { section, type ResolvedProperty, type Section } from "../types";
import type { PortalRecord } from "./portalRecord";

export const PORTAL_URL = "https://services.seattle.gov/portal/";
/** The portal's search page: where a visitor repeats the search themselves. */
export const PORTAL_SEARCH_URL = "https://services.seattle.gov/Portal/Cap/CapHome.aspx?module=DPDGeneral&TabName=DPDGeneral";
const NAME = "Seattle Services Portal";

interface AgentOutput {
  /** True only if the results page (or the site's own no-results message) was actually reached. */
  search_completed: boolean;
  /** Exactly what was typed into the form, so a "nothing found" can be checked by a person. */
  values_entered?: string;
  total_shown?: string;
  site_message?: string;
  records: {
    record_number?: string;
    record_type?: string;
    status?: string;
    date?: string;
    description?: string;
  }[];
}

const SCHEMA = {
  type: "object",
  properties: {
    search_completed: { type: "boolean" },
    values_entered: { type: "string" },
    total_shown: { type: "string" },
    site_message: { type: "string" },
    records: {
      type: "array",
      items: {
        type: "object",
        properties: {
          record_number: { type: "string" },
          record_type: { type: "string" },
          status: { type: "string" },
          date: { type: "string" },
          description: { type: "string" },
        },
      },
    },
  },
  required: ["search_completed", "values_entered", "records"],
};

/** The portal wants the exact address with no punctuation, e.g. "1600 E OLIVE WAY". */
const goal = (address: string) =>
  `This is the Seattle Services Portal record search. Type exactly "${address.replace(/[^\w\s]/g, "")}" into the search box at the top of the page and run the search. ` +
  `If the site shows a list of matching addresses, choose "${address}". ` +
  `On the results page, read every row of the records table, going through every page (up to 60 rows). For each row report the record number, record type, status, date and description exactly as shown. ` +
  `Do not open individual records. Copy the "Showing 1-N of N" text into total_shown, and what you typed into values_entered. ` +
  `Set search_completed to true only if you reached the results table or the site's own no-results message; in that second case copy the message into site_message. ` +
  `If you could not finish the search for any reason, set search_completed to false and leave records empty.`;

/** "11418 NE 19TH ST" → { number: "11418", street: "NE 19TH ST" }. */
const splitAddress = (address: string) => {
  const m = address.trim().match(/^(\d+[A-Z]?)\s+(.+)$/i);
  return m ? { number: m[1], street: m[2] } : { number: "", street: address };
};

/** MyBuildingPermit, shared by most King County cities: a Location search with separate fields. */
const mbpGoal = (address: string, jurisdiction: string) => {
  const { number, street } = splitAddress(address);
  return (
    `This is MyBuildingPermit's permit search. Choose ${jurisdiction} in the Jurisdiction dropdown. Leave the search-type radio buttons as they are. ` +
    `Type "${number}" into the Number field and "${street}" into the Street Name field, leave every other field empty, and press Search. ` +
    `Wait until the results finish loading (up to 20 seconds) before reading them. ` +
    `Results appear below the form as a table with the columns Permit #, Type, Status, Applied Date, Description and Address. ` +
    `The page always contains the text "No results were found matching the above criteria" in a hidden element: ignore it unless the results table is empty. ` +
    `If the table is empty, try once more with the street name alone without its direction or suffix (for example "19TH" for "NE 19TH ST"). ` +
    `Read every row of the table (up to 60), going through every page. For each row report the permit number, type, status, applied date and description exactly as shown, as separate fields. ` +
    `Copy the result count shown (for example "5 records found") into total_shown. ` +
    `Report exactly what you typed into which fields in values_entered. Do not open individual permits. ` +
    `Set search_completed to true only if you reached the results table or the site's own no-results message (copy it into site_message). ` +
    `If you could not finish for any reason, set search_completed to false and leave records empty.`
  );
};

/** The same task for a permit search found by TinyFish Search, whose layout we don't know in advance. */
const otherGoal = (address: string, jurisdiction: string) => {
  const { number, street } = splitAddress(address);
  return (
    `This is the official online permit search used by ${jurisdiction}, Washington. If the page asks you to pick a jurisdiction or city, choose ${jurisdiction}. ` +
    `Search for permits at the street address "${address.replace(/[^\w\s]/g, "")}". If the form has separate fields for house number and street name, ` +
    `type "${number}" and "${street}" into them; leave other fields empty. ` +
    `If a list of matching addresses appears, choose "${address}". On the results, read every row (up to 60), going through every page. ` +
    `For each row report the permit or record number, type, status, date and description exactly as shown, as separate fields. ` +
    `Report exactly what you typed into which fields in values_entered. Do not open individual records, ` +
    `do not create an account and do not submit any application. ` +
    `Set search_completed to true only if you reached the results table or the site's own no-results message; in that second case copy the message into site_message. ` +
    `If the page needs a login, or you could not finish for any reason, set search_completed to false and leave records empty.`
  );
};

interface Portal {
  name: string;
  /** Where the Agent starts. */
  url: string;
  goal: string;
  key: string;
}

const cache = getCache({ namespace: "lotnblock" });
/** Hosts a permit search may live on: government domains and the cities' shared MyBuildingPermit. */
const OFFICIAL = /(\.gov|\.us|\.wa\.us|mybuildingpermit\.com)$/i;

/**
 * Finds a jurisdiction's official permit search with TinyFish Search. Results are ranked to prefer
 * a search page ("permit search", "status") on an official host; listings and blogs are skipped.
 * Remembered for 30 days per jurisdiction.
 */
export async function findPortal(jurisdiction: string): Promise<{ url: string; title: string } | null> {
  const key = `permit-portal:v1:${jurisdiction.toLowerCase()}`;
  const hit = (await cache.get(key)) as { url: string; title: string } | null;
  if (hit) return hit;
  const place = jurisdiction === "Unincorporated King County" ? "King County unincorporated area" : `${jurisdiction} WA`;
  const results = await searchWeb(
    `${place} building permit search by address`,
    "Find the official online permit search where anyone can look up the permits issued at a street address",
  );
  const scored = results
    .filter((r) => OFFICIAL.test(new URL(r.url).hostname))
    .map((r) => {
      const text = `${r.url} ${r.title} ${r.snippet}`.toLowerCase();
      const score =
        (/permit/.test(text) ? 2 : 0) + (/search|status|look ?up|portal/.test(text) ? 2 : 0) + (/permitsearch\./.test(r.url) ? 2 : 0);
      return { ...r, score };
    })
    .filter((r) => r.score >= 4)
    .sort((a, b) => b.score - a.score);
  const best = scored[0] ? { url: scored[0].url, title: scored[0].title } : null;
  if (best) await cache.set(key, best, { ttl: 30 * 86_400 });
  return best;
}

/** Seattle's own link to one record: the address its open data uses for every permit and case. */
const seattleRecordUrl = (number: string) =>
  `https://services.seattle.gov/portal/customize/LinkToRecord.aspx?altId=${encodeURIComponent(number)}`;

/**
 * How many records the portal says it has, from its own count ("Showing 51-52 of 52",
 * "5 records found", "1-25 of 250+"). Null when the text gives no count.
 */
export function listedTotal(totalShown?: string): { count: number; orMore: boolean } | null {
  const t = totalShown ?? "";
  const m = t.match(/\b\d+\s*[-–]\s*\d+\s+of\s+([\d,]+)\s*(\+)?/i) ?? t.match(/\b([\d,]+)\s*(\+)?\s+(?:records?|results?|permits?)\b/i);
  if (!m) return null;
  const count = Number(m[1].replace(/,/g, ""));
  return Number.isFinite(count) ? { count, orMore: Boolean(m[2]) } : null;
}

/** The caveat for a search that read fewer records than the portal says it has; undefined when all were read. */
export function shortfallNote(totalShown: string | undefined, read: number): string | undefined {
  const listed = listedTotal(totalShown);
  if (!listed || (listed.count <= read && !listed.orMore)) return undefined;
  return `The portal lists ${listed.count}${listed.orMore ? " or more" : ""} records for this address and ${read} were read, so some are missing here. Check the portal for the rest.`;
}

/** Complaints, violations and enforcement cases, as opposed to permits and licences. */
const ENFORCEMENT = /complaint|violation|enforcement|notice of|citation|emergency order|vacant building/i;
/** Inventory entries, not permits or cases: equipment certificates and the building's data card. */
const NOT_A_CASE = /equipment certification|building data/i;
/** Remove control characters the portal sometimes leaves in descriptions. */
const clean = (s?: string) => (s ?? "").replace(/[\u0000-\u001f]+/g, " ").trim();

const inSeattle = (p: ResolvedProperty) => p.jurisdiction.trim().toLowerCase() === "seattle";

/**
 * An answer of "no records" whose own result count says there were some (for example "1 of 60"
 * or "5 records found"): the Agent misread the page. Never accept that as "none".
 */
const contradicts = (d: AgentOutput) =>
  !(d.records ?? []).length && /\b[1-9]\d*\b/.test((d.total_shown ?? "").replace(/\b0 of \d+\b/, ""));

const SEATTLE = (p: ResolvedProperty): Portal => ({
  name: NAME,
  url: PORTAL_SEARCH_URL,
  goal: goal(p.address),
  key: `seattle-portal:v2:${p.pin}`,
});

async function records(p: ResolvedProperty, portal: Portal) {
  const res = await agentJob<AgentOutput>({
    key: portal.key,
    url: portal.url,
    goal: portal.goal,
    schema: SCHEMA,
    ttlSeconds: 7 * 86_400, // a week: the report shows when it was read
    complete: (d) => d.search_completed === true && !contradicts(d),
  });
  if (res.state === "running") return { running: true as const, startedAt: res.startedAt };
  // The portal's own count against what the Agent read: a shortfall is reported, never hidden.
  const shortfall = shortfallNote(res.data.total_shown, (res.data.records ?? []).filter((r) => r.record_number).length);
  const rows: PortalRecord[] = (res.data.records ?? [])
    .filter((r) => r.record_number && !NOT_A_CASE.test(r.record_type ?? ""))
    // A row that is the table's own header, or carries nothing but a number, isn't a record.
    .filter((r) => !/^(permit ?#|record ?#|type|record type)$/i.test(r.record_type?.trim() ?? "") && (r.date || r.status || r.description))
    .map((r) => ({
      number: clean(r.record_number),
      type: clean(r.record_type),
      status: clean(r.status),
      date: clean(r.date),
      description: clean(r.description),
      ...(portal.url === PORTAL_SEARCH_URL ? { url: seattleRecordUrl(clean(r.record_number)) } : {}),
    }))
    // Street-use records put the address where the description goes; that says nothing.
    .map((r) => (r.description.toUpperCase().startsWith(p.address.toUpperCase()) && r.description.length < p.address.length + 12 ? { ...r, description: "" } : r));
  // The portal groups results by module, not by date: put the newest first.
  const when = (d: string) => {
    const [m, day, y] = d.split("/").map(Number);
    return y ? new Date(y, m - 1, day).getTime() : 0;
  };
  rows.sort((a, b) => when(b.date) - when(a.date));
  return { running: false as const, rows, retrievedAt: res.retrievedAt, searched: res.data.values_entered?.trim(), shortfall };
}

const base = (url: string, name = NAME) => ({ sourceUrl: url, sourceName: name, via: "agent" as const });

function make(kind: "permits" | "violations") {
  const what = kind === "permits" ? "permits" : "complaints or violations";
  return async (p: ResolvedProperty): Promise<Section<PortalRecord[]>> => {
    let portal: Portal;
    if (inSeattle(p)) {
      portal = SEATTLE(p);
    } else if (kind === "violations") {
      return section<PortalRecord[]>(
        base(PORTAL_URL),
        "not_applicable",
        null,
        `Code complaints are searched in Seattle only; ask ${p.jurisdiction} about complaints at this address.`,
      );
    } else {
      const found = await findPortal(p.jurisdiction).catch(() => null);
      if (!found) {
        return section<PortalRecord[]>(
          base(PORTAL_URL, `${p.jurisdiction} permit search`),
          "source_error",
          null,
          `TinyFish Search didn't find an official permit search for ${p.jurisdiction}`,
        );
      }
      portal = {
        name: `${p.jurisdiction} permit search (${new URL(found.url).hostname}, found with TinyFish Search)`,
        url: found.url,
        goal: (/mybuildingpermit\.com$/i.test(new URL(found.url).hostname) ? mbpGoal : otherGoal)(
          p.address,
          p.jurisdiction === "Unincorporated King County" ? "King County" : p.jurisdiction,
        ),
        key: `city-permits:v4:${p.pin}`,
      };
    }
    const receipt = base(portal.url === PORTAL_SEARCH_URL ? PORTAL_SEARCH_URL : portal.url, portal.name);
    try {
      const r = await records(p, portal);
      if (r.running) {
        return section<PortalRecord[]>(receipt, "pending", null, `Searching since ${r.startedAt}`);
      }
      const { rows, retrievedAt, searched, shortfall } = r;
      const mine = rows.filter((r) => (kind === "violations") === ENFORCEMENT.test(`${r.type} ${r.number}`));
      const s = mine.length
        ? section<PortalRecord[]>(receipt, "found", mine, shortfall)
        : shortfall
          ? // Records went unread, so "none" can't be claimed for this kind.
            section<PortalRecord[]>(receipt, "source_error", null, `the search was incomplete, so ${what} can't be ruled out. ${shortfall}`)
          : section<PortalRecord[]>(
              receipt,
              "none",
              null,
              `The portal lists no ${what} at this address${searched ? ` (searched for: ${searched})` : ""}.`,
            );
      return { ...s, retrievedAt };
    } catch (err) {
      const note = err instanceof AgentUnavailable ? err.message : "the portal search didn't finish";
      return section<PortalRecord[]>(receipt, "source_error", null, note);
    }
  };
}

export const cityPermits = make("permits");
export const cityComplaints = make("violations");
