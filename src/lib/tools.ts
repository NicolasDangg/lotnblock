/**
 * What the landing page shows for each TinyFish tool: the request this app really sends for the
 * example address. Fetch also shows the real parsed result from the example lookup.
 */
import type { Example } from "./example";
import { assessorUrl } from "./sources/assessor";

export interface ToolStep {
  name: string;
  job: string;
  state: "live" | "next";
  /** A real request (and, when live, the real response) shown as code. */
  code: string;
}

export function toolSteps(ex: Example): ToolStep[] {
  const p = ex.property;
  const a = ex.assessor?.data;
  const url = p ? assessorUrl(p.pin) : "https://blue.kingcounty.com/Assessor/eRealProperty/Detail.aspx?ParcelNbr=…";
  const latest = a?.assessedValues.find((v) => v.totalValue);

  const fetchCode = [
    "POST https://api.fetch.tinyfish.ai",
    JSON.stringify({ urls: [url], format: "html", ttl: 0, include_selectors: ["#cphContent_GridViewTaxRoll", "…"] }, null, 2),
    "",
    a
      ? `// parsed, ${ex.assessor!.retrievedAt.slice(0, 16).replace("T", " ")} UTC\n` +
        JSON.stringify(
          {
            parcel: a.parcel,
            zoning: a.zoning,
            presentUse: a.presentUse,
            assessedTotal: latest?.totalValue,
            taxYear: latest?.taxYear,
            yearsOfValues: a.assessedValues.length,
            sales: a.sales.length,
            permitsOnFile: a.permits.length,
          },
          null,
          2,
        )
      : "// The assessor didn't answer just now. The report would say \"Couldn't check\".",
  ].join("\n");

  const address = p ? `${p.address}, ${p.city}` : "the address";
  return [
    {
      name: "Fetch",
      job: "Loads a page we can link to directly, such as the assessor's page for a parcel, and returns its contents.",
      state: "live",
      code: fetchCode,
    },
    {
      name: "Agent",
      job: "Uses a real browser to fill in search forms on sites with no direct links: the city permit portal and the county's tax lookup. Runs are queued, cached for a day and capped per day.",
      state: "live",
      code: [
        "POST https://agent.tinyfish.ai/v1/automation/run-async",
        JSON.stringify(
          {
            url: "https://services.seattle.gov/Portal/Cap/CapHome.aspx?module=DPDGeneral",
            goal:
              `Type exactly "${p?.address ?? "the address"}" into the search box and run the search. Read every row of the ` +
              "records table, going through every page… Set search_completed to true only if you reached the results table.",
            output_schema: { search_completed: "boolean", records: "[{record_number, record_type, status, date, description}]" },
          },
          null,
          2,
        ),
      ].join("\n"),
    },
    {
      name: "Search",
      job: "Finds the official permit search for addresses outside Seattle, since each city runs its own (many share MyBuildingPermit). Agent then searches it.",
      state: "live",
      code: [
        "POST https://api.search.tinyfish.ai",
        JSON.stringify(
          {
            query: "Bellevue WA building permit search by address",
            purpose: "Find the official online permit search where anyone can look up the permits issued at a street address",
          },
          null,
          2,
        ),
        "",
        "// kept: official hosts only (.gov, .us, mybuildingpermit.com), ranked by \"permit\" + \"search\"",
        '// → https://permitsearch.mybuildingpermit.com/',
      ].join("\n"),
    },
    {
      name: "Monitor",
      job: "Re-reads a watched address's county records every morning, compares them with the day before and posts what changed: a new permit, a sale, a new owner or value.",
      state: "live",
      code: [
        "POST https://agent.tinyfish.ai/v1/monitors",
        JSON.stringify(
          {
            type: "fetch",
            name: `Lot & Block: ${address}`,
            config: { url: `https://lotnblock.vercel.app/api/watch/snapshot?pin=${p?.pin ?? "…"}`, format: "markdown" },
            schedule_cron: "CRON_TZ=America/Los_Angeles 0 7 * * *",
            purpose: "A new building permit, a new sale or transfer, a change of owner, a new assessed value, or a new hazard flag appears for this parcel.",
            webhook_url: "https://lotnblock.vercel.app/api/watch/hook?pin=…&sig=…",
          },
          null,
          2,
        ),
      ].join("\n"),
    },
  ];
}
