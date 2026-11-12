/**
 * King County Treasurer: property tax billed, paid and due for each year. The tax payment site is
 * a JavaScript app with no API, so TinyFish Agent searches the parcel and reads the account.
 * Queued and cached like the city portal (see ../agent.ts).
 */
import { agentJob, AgentUnavailable } from "../agent";
import { section, type ResolvedProperty, type Section } from "../types";

export const TREASURER_URL = "https://payment.kingcounty.gov/Home/Index?app=PropertyTaxes";
const NAME = "King County Treasurer";

export interface TaxYear {
  year: number;
  billed: number | null;
  paid: number | null;
  due: number | null;
  status: string;
}

export interface TaxRecord {
  account: string;
  /** The account notice, e.g. "NO TAXES ARE DUE AT THIS TIME" or a delinquency warning. */
  notice: string;
  years: TaxYear[];
}

interface AgentOutput {
  search_completed: boolean;
  account?: string;
  notice?: string;
  site_message?: string;
  years: { tax_year?: string; billed?: string; paid?: string; due?: string; status?: string }[];
}

const SCHEMA = {
  type: "object",
  properties: {
    search_completed: { type: "boolean" },
    account: { type: "string" },
    notice: { type: "string" },
    site_message: { type: "string" },
    years: {
      type: "array",
      items: {
        type: "object",
        properties: {
          tax_year: { type: "string" },
          billed: { type: "string" },
          paid: { type: "string" },
          due: { type: "string" },
          status: { type: "string" },
        },
      },
    },
  },
  required: ["search_completed", "years"],
};

const goal = (pin: string) =>
  `This is King County's property tax lookup. Type the parcel number ${pin} into the search box and run the search. ` +
  `Do not pay anything and do not enter any personal details. Open the matching real property account. ` +
  `For each tax year shown (up to 6 years) report the tax year, amount billed, amount paid, amount due and status, exactly as shown. ` +
  `Report the account number shown, and copy any account notice (such as "no taxes are due" or a delinquency or foreclosure warning) into notice. ` +
  `Set search_completed to true only if you reached the account's tax details or the site's own no-results message (copy that message into site_message). ` +
  `If you could not finish for any reason, set search_completed to false.`;

/** The account number as the Treasurer prints it (digits, sometimes dashed). Anything else is a misread and is dropped. */
export const accountNumber = (s?: string) => {
  const t = (s ?? "").trim();
  return /^\d[\d-]{8,14}$/.test(t) ? t : "";
};

const amount = (s?: string) => {
  if (!s || !/\d/.test(s)) return null;
  const n = Number(s.replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? n : null;
};

export async function treasurer(p: ResolvedProperty): Promise<Section<TaxRecord>> {
  const base = { sourceUrl: TREASURER_URL, sourceName: NAME, via: "agent" as const };
  try {
    const res = await agentJob<AgentOutput>({
      key: `treasurer:v1:${p.pin}`,
      url: TREASURER_URL,
      goal: goal(p.pin),
      schema: SCHEMA,
      ttlSeconds: 7 * 86_400, // a week: the report shows when it was read
      complete: (d) => d.search_completed === true,
    });
    if (res.state === "running") return section<TaxRecord>(base, "pending", null, `Searching since ${res.startedAt}`);
    const years = (res.data.years ?? [])
      .map((y) => ({
        year: Number(y.tax_year?.match(/\d{4}/)?.[0]),
        billed: amount(y.billed),
        paid: amount(y.paid),
        due: amount(y.due),
        status: y.status?.trim() ?? "",
      }))
      .filter((y) => y.year)
      .sort((a, b) => b.year - a.year);
    const s = years.length
      ? section<TaxRecord>(base, "found", { account: accountNumber(res.data.account), notice: res.data.notice ?? "", years })
      : section<TaxRecord>(base, "none", null, res.data.site_message || "The Treasurer lists no tax bills for this parcel");
    return { ...s, retrievedAt: res.retrievedAt };
  } catch (err) {
    const note = err instanceof AgentUnavailable ? err.message : "the tax lookup didn't finish";
    return section<TaxRecord>(base, "source_error", null, note);
  }
}
