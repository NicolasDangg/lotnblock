/**
 * The parcel's outline in latitude/longitude, from King County's parcel layer, for the report's map.
 * Glue for the picture, not a dossier source. Returns rings as [lat, lon] pairs (Leaflet's order).
 */
const PARCELS = "https://gismaps.kingcounty.gov/arcgis/rest/services/Property/KingCo_Parcels/MapServer/0/query";

export type Outline = [number, number][][];

export async function parcelOutline(pin: string): Promise<Outline | null> {
  const qs = new URLSearchParams({
    where: `PIN='${pin.replace(/\D/g, "")}'`,
    outFields: "PIN",
    returnGeometry: "true",
    outSR: "4326",
    geometryPrecision: "7",
    f: "json",
  });
  try {
    const res = await fetch(`${PARCELS}?${qs}`, { signal: AbortSignal.timeout(20_000) });
    if (!res.ok) return null;
    const body = (await res.json()) as { features?: { geometry: { rings: number[][][] } }[] };
    const rings = body.features?.[0]?.geometry.rings;
    return rings?.length ? rings.map((r) => r.map(([lon, lat]) => [lat, lon] as [number, number])) : null;
  } catch {
    return null;
  }
}
