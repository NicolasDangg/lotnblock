/**
 * King County GIS Center's "Districts and development conditions report": one server-rendered page
 * per parcel listing its school district, the county's mapped hazards (floodplain, landslide,
 * erosion, seismic, coal mines), wetlands, shoreline designation and development conditions.
 * Read with TinyFish Fetch. Values are kept exactly as the county words them ("None mapped",
 * "Check with Jurisdiction"), never reinterpreted.
 */
import { fetchPage } from "../tinyfish";
import { section, type ResolvedProperty, type Section } from "../types";

export const districtsUrl = (pin: string) => `https://district-conditions-report.kingcounty.gov/?PIN=${pin}`;
const FETCH_URL = (pin: string) => `https://www5.kingcounty.gov/kcgisreports/dd_report.aspx?PIN=${pin}`;
const NAME = "King County districts report";

export interface DistrictsRecord {
  /** The date and time the county printed on the report. */
  asOf: string;
  schoolDistrict: string;
  schoolBoardDistrict: string | null;
  floodplain: string;
  landslide: string;
  erosion: string;
  seismic: string;
  coalMine: string;
  wetlands: string;
  seaLevelRise: string;
  shoreline: string;
  smelterPlume: string;
  developmentConditions: string;
  urbanGrowthArea: string;
  watershed: string;
}

/** Every "| label | **value** |" row of the report's tables. */
export function reportRows(markdown: string): Map<string, string> {
  const rows = new Map<string, string>();
  for (const m of markdown.matchAll(/^\|\s*([^|]+?)\s*\|\s*\*\*(.+?)\*\*\s*\|$/gm)) rows.set(m[1].toLowerCase(), m[2].trim());
  return rows;
}

export function parseDistricts(markdown: string): DistrictsRecord | null {
  const rows = reportRows(markdown);
  if (!rows.has("parcel number")) return null;
  const get = (label: string) => rows.get(label.toLowerCase()) ?? "Not listed";
  return {
    asOf: markdown.match(/report as of ([^\n#]+)/)?.[1].trim() ?? "",
    schoolDistrict: get("School district"),
    schoolBoardDistrict: rows.get("seattle school board district") ?? null,
    floodplain: get("100-year floodplain?"),
    landslide: get("Landslide hazards?"),
    erosion: get("Erosion hazards?"),
    seismic: get("Seismic hazards?"),
    coalMine: get("Coal mine hazards?"),
    wetlands: get("Wetlands at this parcel?"),
    seaLevelRise: get("Sea level rise risk area"),
    shoreline: get("Shoreline management designation"),
    smelterPlume: get("Within the Tacoma Smelter Plume?"),
    developmentConditions: get("Development conditions"),
    urbanGrowthArea: get("Urban Growth Area"),
    watershed: get("Watershed"),
  };
}

export async function districts(p: ResolvedProperty): Promise<Section<DistrictsRecord>> {
  const base = { sourceUrl: districtsUrl(p.pin), sourceName: NAME, via: "fetch" as const };
  try {
    const page = await fetchPage(FETCH_URL(p.pin), "markdown");
    const record = parseDistricts(page.text ?? "");
    return record
      ? section<DistrictsRecord>(base, "found", record)
      : section<DistrictsRecord>(base, "source_error", null, "the report page didn't list this parcel");
  } catch (err) {
    return section<DistrictsRecord>(base, "source_error", null, (err as Error).message);
  }
}
