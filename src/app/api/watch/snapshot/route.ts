import { parcelNumber, resolve } from "@/lib/resolve";
import { assessor } from "@/lib/sources/assessor";
import { districts } from "@/lib/sources/districts";

/**
 * GET /api/watch/snapshot?pin=<parcel>
 * The page a TinyFish Monitor watches for "Watch this address": the parcel's official records,
 * re-read live from the King County Assessor and districts report (TinyFish Fetch) on every
 * request, printed as stable plain text so that any real change shows up as a clean diff.
 * Read times are left out on purpose: they would change on every read.
 */
export async function GET(request: Request) {
  const pin = parcelNumber(new URL(request.url).searchParams.get("pin") ?? "");
  if (!pin) return new Response("Pass ?pin=<10-digit parcel number>", { status: 400 });
  const p = await resolve(pin);
  const [a, d] = await Promise.all([assessor(p), districts(p)]);
  // If the county didn't answer, fail the read: a failed Monitor run is free and raises no alert,
  // whereas a half-empty snapshot would look like a change.
  if (a.status !== "found" || d.status !== "found") {
    return new Response("King County didn't answer; try again later.", { status: 503 });
  }

  const out: string[] = [`# Parcel ${pin}: ${p.address}, ${p.city}`, ""];
  if (a.data) {
    const r = a.data;
    out.push("## Owner and use", `Owner: ${r.owner}`, `Present use: ${r.presentUse}`, `Zoning: ${r.zoning}`, "");
    out.push("## Assessed value", ...r.assessedValues.slice(0, 5).map((v) => `${v.taxYear}: total ${v.totalValue ?? "not stated"} (land ${v.landValue ?? "-"}, buildings ${v.buildingValue ?? "-"})`), "");
    out.push("## Sales and transfers", ...(r.sales.length ? r.sales.map((s) => `${s.date}: ${s.price ?? 0} ${s.instrument}, ${s.seller} to ${s.buyer} (recording ${s.recordingNumber})`) : ["None recorded"]), "");
    out.push("## Permits on file", ...(r.permits.length ? r.permits.map((x) => `${x.issued}: ${x.number} ${x.description}`) : ["None recorded"]), "");
    out.push("## Assessor flags", ...(Object.entries(r.flags).map(([k, v]) => `${k}: ${v}`).concat(Object.keys(r.flags).length ? [] : ["None"])), "");
  }
  if (d.data) {
    const x = d.data;
    out.push(
      "## Hazards and districts",
      `100-year floodplain: ${x.floodplain}`,
      `Landslide: ${x.landslide}`,
      `Erosion: ${x.erosion}`,
      `Seismic: ${x.seismic}`,
      `Development conditions: ${x.developmentConditions}`,
      `School district: ${x.schoolDistrict}`,
    );
  }
  return new Response(out.join("\n"), { headers: { "Content-Type": "text/markdown; charset=utf-8", "Cache-Control": "no-store" } });
}
