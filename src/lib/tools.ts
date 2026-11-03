/**
 * What the landing page shows for each TinyFish tool. Fetch shows the real request and the real
 * parsed result from the example lookup. The others show the request this app will send; they
 * are marked "next" and show no results until they're connected.
 */
import type { ToolStep } from "@/components/landing/ToolsStory";
import type { Example } from "./example";
import { assessorUrl } from "./sources/assessor";

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
      job: "Reads pages we can link to directly: the assessor's record for a parcel, in about a second.",
      state: "live",
      code: fetchCode,
    },
    {
      name: "Agent",
      job: "Drives a real browser through search forms with no direct links: permits, violations, tax bills, flood maps.",
      state: "next",
      code: [
        "POST https://agent.tinyfish.ai/v1/automation/run-sse",
        JSON.stringify(
          {
            url: "https://services.seattle.gov/portal/",
            goal:
              `Search all records for the address "${address}". List every building permit and code ` +
              'complaint as JSON {"records":[{"number","type","status","opened","description","url"}]}. ' +
              'If none match, return {"records":[]}. If blocked, return {"records":[],"error":"<reason>"}.',
          },
          null,
          2,
        ),
      ].join("\n"),
    },
    {
      name: "Search",
      job: "Finds the right official portal when an address is outside Seattle, where every city runs its own.",
      state: "next",
      code: [
        "POST https://api.search.tinyfish.ai",
        JSON.stringify({ query: "Bellevue WA building permit search by address", include_domains: "bellevuewa.gov" }, null, 2),
      ].join("\n"),
    },
    {
      name: "Monitor",
      job: "Watches the address after you've read the dossier, and tells you when a new permit or sale appears.",
      state: "next",
      code: [
        "POST https://agent.tinyfish.ai/v1/monitors",
        JSON.stringify(
          {
            type: "fetch",
            name: `Watch ${address}`,
            config: { url, format: "markdown" },
            schedule_cron: "CRON_TZ=America/Los_Angeles 0 7 * * *",
            purpose: "A new permit, sale, appeal or change in assessed value appears for this parcel",
            webhook_url: "https://lotnblock…/api/monitor",
          },
          null,
          2,
        ),
      ].join("\n"),
    },
  ];
}
