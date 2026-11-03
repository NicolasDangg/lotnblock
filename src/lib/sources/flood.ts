/**
 * FEMA's National Flood Hazard Layer: the flood zone at the property and the flood map panel
 * (FIRM) it is drawn on. FEMA's map server refuses some networks, so the two queries go through
 * TinyFish Fetch, which reads them like any other page. The report links FEMA's own Map Service
 * Center search for the address, where anyone can open the official panel.
 */
import { fetchPages } from "../tinyfish";
import { section, type ResolvedProperty, type Section } from "../types";

const NFHL = "https://hazards.fema.gov/arcgis/rest/services/public/NFHL/MapServer";
const NAME = "FEMA National Flood Hazard Layer";

export interface FloodRecord {
  /** FEMA zone code: X, A, AE, VE, D… */
  zone: string;
  subtype: string | null;
  /** In a Special Flood Hazard Area: lenders require flood insurance there. */
  specialFloodHazardArea: boolean;
  panel: string | null;
  panelEffective: string | null;
  /** FEMA's Map Service Center search for this address. */
  mapServiceCenterUrl: string;
}

const query = (layer: number, lat: number, lon: number, fields: string) =>
  `${NFHL}/${layer}/query?${new URLSearchParams({
    geometry: `${lon},${lat}`,
    geometryType: "esriGeometryPoint",
    inSR: "4326",
    spatialRel: "esriSpatialRelIntersects",
    outFields: fields,
    returnGeometry: "false",
    f: "json",
  })}`;

interface Features {
  features?: { attributes: Record<string, string | number | null> }[];
  error?: { message: string };
}

/** Fetch returns JSON as text, with markdown escapes on underscores. */
const parseJson = (text: string | null): Features | null => {
  if (!text) return null;
  try {
    return JSON.parse(text.replace(/\\_/g, "_"));
  } catch {
    return null;
  }
};

export const floodQueryUrl = (p: ResolvedProperty) => query(28, p.lat, p.lon, "FLD_ZONE,ZONE_SUBTY,SFHA_TF");

export async function flood(p: ResolvedProperty): Promise<Section<FloodRecord>> {
  const base = { sourceUrl: floodQueryUrl(p), sourceName: NAME, via: "fetch" as const };
  const mapServiceCenterUrl = `https://msc.fema.gov/portal/search?AddressQuery=${encodeURIComponent(`${p.address}, ${p.city}, WA ${p.zip}`)}`;
  try {
    const [zones, panels] = (await fetchPages([floodQueryUrl(p), query(3, p.lat, p.lon, "FIRM_PAN,EFF_DATE")])).map(parseJson);
    if (!zones || zones.error) return section<FloodRecord>(base, "source_error", null, "FEMA's map server didn't answer");
    const z = zones.features?.[0]?.attributes;
    if (!z) {
      return section<FloodRecord>(base, "none", null, "FEMA has no flood zone mapped at this point");
    }
    const panel = panels?.features?.[0]?.attributes;
    const eff = panel?.EFF_DATE;
    return section<FloodRecord>(base, "found", {
      zone: String(z.FLD_ZONE),
      subtype: z.ZONE_SUBTY ? String(z.ZONE_SUBTY) : null,
      specialFloodHazardArea: z.SFHA_TF === "T",
      panel: panel?.FIRM_PAN ? String(panel.FIRM_PAN) : null,
      panelEffective: typeof eff === "number" ? new Date(eff).toISOString().slice(0, 10) : eff ? String(eff) : null,
      mapServiceCenterUrl,
    });
  } catch (err) {
    return section<FloodRecord>(base, "source_error", null, (err as Error).message);
  }
}
