/**
 * Seattle Services Portal (Accela): every permit, complaint and violation the city holds for an
 * address. The portal is a search form with no API, so TinyFish Agent fills it in and reads the
 * results table. One run answers two dossier sections: permits, and code complaints/violations.
 */
import { agentJob, AgentUnavailable } from "../agent";
import { section, type ResolvedProperty, type Section } from "../types";
import type { PortalRecord } from "./portalRecord";

export const PORTAL_URL = "https://services.seattle.gov/portal/";
/** The portal's search page: where a visitor repeats the search themselves. */
export const PORTAL_SEARCH_URL = "https://services.seattle.gov/Portal/Cap/CapHome.aspx?module=DPDGeneral&TabName=DPDGeneral";
const NAME = "Seattle Services Portal";

interface AgentOutput {
  /** True only if the results page (or the site's own no-results message) was actually reached. */
  search_completed: boolean;
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
  required: ["search_completed", "records"],
};

/** The portal wants the exact address with no punctuation, e.g. "1600 E OLIVE WAY". */
const goal = (address: string) =>
  `This is the Seattle Services Portal record search. Type exactly "${address.replace(/[^\w\s]/g, "")}" into the search box at the top of the page and run the search. ` +
  `If the site shows a list of matching addresses, choose "${address}". ` +
  `On the results page, read every row of the records table, going through every page (up to 60 rows). For each row report the record number, record type, status, date and description exactly as shown. ` +
  `Do not open individual records. Copy the "Showing 1-N of N" text into total_shown. ` +
  `Set search_completed to true only if you reached the results table or the site's own no-results message; in that second case copy the message into site_message. ` +
  `If you could not finish the search for any reason, set search_completed to false and leave records empty.`;

/** Complaints, violations and enforcement cases, as opposed to permits and licences. */
const ENFORCEMENT = /complaint|violation|enforcement|notice of|citation|emergency order|vacant building/i;
/** Inventory entries, not permits or cases: equipment certificates and the building's data card. */
const NOT_A_CASE = /equipment certification|building data/i;
/** Remove control characters the portal sometimes leaves in descriptions. */
const clean = (s?: string) => (s ?? "").replace(/[\u0000-\u001f]+/g, " ").trim();

const inSeattle = (p: ResolvedProperty) => p.city.trim().toLowerCase() === "seattle";

async function records(p: ResolvedProperty) {
  const res = await agentJob<AgentOutput>({
    key: `seattle-portal:v2:${p.pin}`,
    url: PORTAL_SEARCH_URL,
    goal: goal(p.address),
    schema: SCHEMA,
    ttlSeconds: 24 * 3600,
    complete: (d) => d.search_completed === true,
  });
  if (res.state === "running") return { running: true as const, startedAt: res.startedAt };
  const rows: PortalRecord[] = (res.data.records ?? [])
    .filter((r) => r.record_number && !NOT_A_CASE.test(r.record_type ?? ""))
    .map((r) => ({
      number: clean(r.record_number),
      type: clean(r.record_type),
      status: clean(r.status),
      date: clean(r.date),
      description: clean(r.description),
    }))
    // Street-use records put the address where the description goes; that says nothing.
    .map((r) => (r.description.toUpperCase().startsWith(p.address.toUpperCase()) && r.description.length < p.address.length + 12 ? { ...r, description: "" } : r));
  // The portal groups results by module, not by date: put the newest first.
  const when = (d: string) => {
    const [m, day, y] = d.split("/").map(Number);
    return y ? new Date(y, m - 1, day).getTime() : 0;
  };
  rows.sort((a, b) => when(b.date) - when(a.date));
  return { running: false as const, rows, retrievedAt: res.retrievedAt };
}

const base = (url: string) => ({ sourceUrl: url, sourceName: NAME, via: "agent" as const });

function make(kind: "permits" | "violations") {
  const what = kind === "permits" ? "permits" : "complaints or violations";
  return async (p: ResolvedProperty): Promise<Section<PortalRecord[]>> => {
    if (!inSeattle(p)) {
      return section<PortalRecord[]>(base(PORTAL_URL), "not_applicable", null, `${p.city} isn't covered by Seattle's portal.`);
    }
    try {
      const r = await records(p);
      if (r.running) {
        return section<PortalRecord[]>(base(PORTAL_SEARCH_URL), "pending", null, `Searching since ${r.startedAt}`);
      }
      const { rows, retrievedAt } = r;
      const mine = rows.filter((r) => (kind === "violations") === ENFORCEMENT.test(`${r.type} ${r.number}`));
      const s = mine.length
        ? section<PortalRecord[]>(base(PORTAL_SEARCH_URL), "found", mine)
        : section<PortalRecord[]>(base(PORTAL_SEARCH_URL), "none", null, `The portal lists no ${what} at this address.`);
      return { ...s, retrievedAt };
    } catch (err) {
      const note = err instanceof AgentUnavailable ? err.message : "the portal search didn't finish";
      return section<PortalRecord[]>(base(PORTAL_SEARCH_URL), "source_error", null, note);
    }
  };
}

export const seattlePermits = make("permits");
export const seattleViolations = make("violations");
