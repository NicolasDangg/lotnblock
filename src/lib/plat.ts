/**
 * The block around a parcel, as lot outlines in Washington State Plane North (US feet, EPSG:2926),
 * from King County's parcel layer. Drawn on the report as the property's own plat sheet.
 * Glue for the picture, not a dossier source: nothing in it is stated as a record.
 */
import type { ResolvedProperty } from "./types";

const PARCELS = "https://gismaps.kingcounty.gov/arcgis/rest/services/Property/KingCo_Parcels/MapServer/0/query";

export interface Plat {
  /** [minX, minY, maxX, maxY] in feet. */
  bbox: [number, number, number, number];
  subject: number[][][];
  neighbours: number[][][][];
}

export async function plat(p: ResolvedProperty, radiusMeters = 140): Promise<Plat | null> {
  const qs = new URLSearchParams({
    geometry: `${p.lon},${p.lat}`,
    geometryType: "esriGeometryPoint",
    inSR: "4326",
    distance: String(radiusMeters),
    units: "esriSRUnit_Meter",
    spatialRel: "esriSpatialRelIntersects",
    outFields: "PIN",
    returnGeometry: "true",
    outSR: "2926",
    geometryPrecision: "1",
    f: "json",
  });
  try {
    const res = await fetch(`${PARCELS}?${qs}`, { signal: AbortSignal.timeout(20_000) });
    if (!res.ok) return null;
    const body = (await res.json()) as { features?: { attributes: { PIN: string }; geometry: { rings: number[][][] } }[] };
    const features = body.features ?? [];
    const subject = features.find((f) => f.attributes.PIN === p.pin);
    if (!subject) return null;

    const xs = subject.geometry.rings.flat().map((pt) => pt[0]);
    const ys = subject.geometry.rings.flat().map((pt) => pt[1]);
    const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
    const cy = (Math.min(...ys) + Math.max(...ys)) / 2;
    // Frame the block: about 5× the lot, so its neighbours and streets read as a plan.
    const half = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys), 120) * 2.6;

    return {
      bbox: [cx - half, cy - half, cx + half, cy + half],
      subject: subject.geometry.rings,
      neighbours: features.filter((f) => f !== subject).map((f) => f.geometry.rings),
    };
  } catch {
    return null;
  }
}
