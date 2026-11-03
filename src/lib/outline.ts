/**
 * The parcel's outline in latitude/longitude, from King County's parcel layer, for the report's map,
 * plus the lots around it so the map shows where this one ends and the next begins (street maps
 * shade land use, which often spans several lots). Glue for the picture, not a dossier source.
 * Rings are [lat, lon] pairs (Leaflet's order).
 */
const PARCELS = "https://gismaps.kingcounty.gov/arcgis/rest/services/Property/KingCo_Parcels/MapServer/0/query";

export type Rings = [number, number][][];
export interface Outline {
  subject: Rings;
  neighbours: Rings[];
}

/** How far around the lot to fetch neighbours, in degrees (about 90 m north–south). */
const MARGIN = 0.0008;

interface Feature {
  attributes: { PIN: string };
  geometry: { rings: number[][][] };
}

async function query(params: Record<string, string>): Promise<Feature[]> {
  const qs = new URLSearchParams({
    outFields: "PIN",
    returnGeometry: "true",
    outSR: "4326",
    geometryPrecision: "7",
    f: "json",
    ...params,
  });
  const res = await fetch(`${PARCELS}?${qs}`, { signal: AbortSignal.timeout(20_000) });
  if (!res.ok) throw new Error(`parcels ${res.status}`);
  return ((await res.json()) as { features?: Feature[] }).features ?? [];
}

const toLatLon = (rings: number[][][]): Rings => rings.map((r) => r.map(([lon, lat]) => [lat, lon] as [number, number]));

export async function parcelOutline(pin: string): Promise<Outline | null> {
  const id = pin.replace(/\D/g, "");
  try {
    // A parcel can come back as several features (split by a road or a condo layer): keep every ring.
    const own = await query({ where: `PIN='${id}'` });
    const subject = own.flatMap((f) => toLatLon(f.geometry.rings));
    if (!subject.length) return null;

    const pts = subject.flat();
    const lats = pts.map((p) => p[0]);
    const lons = pts.map((p) => p[1]);
    const envelope = [
      Math.min(...lons) - MARGIN * 1.5,
      Math.min(...lats) - MARGIN,
      Math.max(...lons) + MARGIN * 1.5,
      Math.max(...lats) + MARGIN,
    ].join(",");
    const around = await query({
      geometry: envelope,
      geometryType: "esriGeometryEnvelope",
      inSR: "4326",
      spatialRel: "esriSpatialRelIntersects",
      where: `PIN<>'${id}'`,
    }).catch(() => []); // the neighbours are context; the lot still draws without them

    return { subject, neighbours: around.map((f) => toLatLon(f.geometry.rings)) };
  } catch {
    return null;
  }
}
