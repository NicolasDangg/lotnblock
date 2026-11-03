/**
 * Step zero: turn whatever the user typed into one King County parcel.
 *
 * Every official source keys the property differently (the assessor by parcel number, the city
 * permit portal by street address, the flood map by coordinates), so we resolve once and hand
 * the same identity to every source. This is glue, not a dossier source:
 * - the US Census geocoder standardises free-form addresses ("400 Broad Street" → "400 BROAD ST");
 * - King County's address-point layer maps that address to its parcel number and exact location.
 */
import type { ResolvedProperty } from "./types";

const ADDRESS_POINTS =
  "https://gismaps.kingcounty.gov/arcgis/rest/services/Address/KingCo_AddressPoints/MapServer/0/query";
const CENSUS =
  "https://geocoding.geo.census.gov/geocoder/locations/onelineaddress?benchmark=Public_AR_Current&format=json";

interface AddressPoint {
  ADDR_FULL: string;
  CTYNAME: string;
  POSTALCTYNAME: string;
  ZIP5: string;
  PIN: string;
  LAT: number;
  LON: number;
  ADDR_HN: string | number;
  PRIM_ADDR: number;
}

export class ResolveError extends Error {}

const FIELDS = "ADDR_FULL,CTYNAME,POSTALCTYNAME,ZIP5,PIN,LAT,LON,ADDR_HN,PRIM_ADDR";

async function queryPoints(params: Record<string, string>): Promise<AddressPoint[]> {
  const qs = new URLSearchParams({ outFields: FIELDS, returnGeometry: "false", f: "json", ...params });
  const res = await fetch(`${ADDRESS_POINTS}?${qs}`, { signal: AbortSignal.timeout(20_000) });
  if (!res.ok) throw new ResolveError(`King County address lookup failed (${res.status})`);
  const body = (await res.json()) as { features?: { attributes: AddressPoint }[]; error?: { message: string } };
  if (body.error) throw new ResolveError(`King County address lookup failed: ${body.error.message}`);
  return (body.features ?? []).map((f) => f.attributes);
}

function toResolved(input: string, p: AddressPoint): ResolvedProperty {
  return {
    input,
    pin: p.PIN,
    address: p.ADDR_FULL,
    city: p.CTYNAME || p.POSTALCTYNAME,
    zip: p.ZIP5,
    lat: p.LAT,
    lon: p.LON,
  };
}

const sqlString = (s: string) => `'${s.replace(/'/g, "''")}'`;

/** "198520-0495" or "1985200495" → "1985200495"; anything else → null. */
export function parcelNumber(input: string): string | null {
  const m = input.trim().match(/^(\d{6})-?(\d{4})$/);
  return m ? m[1] + m[2] : null;
}

export async function resolve(input: string): Promise<ResolvedProperty> {
  const pin = parcelNumber(input);
  if (pin) {
    const points = await queryPoints({ where: `PIN=${sqlString(pin)}` });
    const primary = points.find((p) => p.PRIM_ADDR === 1) ?? points[0];
    if (!primary) throw new ResolveError(`Parcel ${pin} has no site address in King County's records`);
    return toResolved(input, primary);
  }

  // Standardise the address. Bias to Washington when the user left the state off.
  const q = /\b(WA|Washington)\b/i.test(input) ? input : `${input}, WA`;
  const res = await fetch(`${CENSUS}&address=${encodeURIComponent(q)}`, { signal: AbortSignal.timeout(20_000) });
  if (!res.ok) throw new ResolveError(`Address standardisation failed (${res.status})`);
  const census = (await res.json()) as {
    result: { addressMatches: { matchedAddress: string; coordinates: { x: number; y: number } }[] };
  };
  const match = census.result.addressMatches[0];
  if (!match) throw new ResolveError(`Couldn't find "${input}" as a US street address`);

  // "400 BROAD ST, SEATTLE, WA, 98109"
  const [street, , state, zip] = match.matchedAddress.split(",").map((s) => s.trim());
  if (state !== "WA") throw new ResolveError(`"${input}" is outside Washington; this dossier covers King County`);

  const exact = await queryPoints({ where: `ADDR_FULL=${sqlString(street)} AND ZIP5=${sqlString(zip)}` });
  const primary = exact.find((p) => p.PRIM_ADDR === 1) ?? exact[0];
  if (primary) return toResolved(input, primary);

  // Census interpolates along the street, so look for the same house number within ~80 m.
  const houseNumber = street.split(" ")[0];
  const nearby = await queryPoints({
    geometry: `${match.coordinates.x},${match.coordinates.y}`,
    geometryType: "esriGeometryPoint",
    inSR: "4326",
    distance: "80",
    units: "esriSRUnit_Meter",
    spatialRel: "esriSpatialRelIntersects",
  });
  const sameNumber = nearby.find((p) => String(p.ADDR_HN) === houseNumber);
  if (sameNumber) return toResolved(input, sameNumber);

  throw new ResolveError(
    nearby.length
      ? `"${street}" isn't a King County address point (is it in King County?)`
      : `"${input}" is outside King County, which is the area this dossier covers`,
  );
}
