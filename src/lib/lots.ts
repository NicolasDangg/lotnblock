/**
 * The landing page's row of real lots: a handful of King County addresses, each run through the same
 * resolve → Assessor (TinyFish Fetch) → parcel outline steps as a report, and boiled down to what a
 * card can show at a glance. `npm run lots` reads them once and saves the result (and each aerial
 * photo) into the repo, so the row renders instantly with no county call on page load.
 */
import { lastSale, valueChange } from "./highlights";
import { parcelOutline, type Rings } from "./outline";
import { resolve } from "./resolve";
import { assessor, type Building } from "./sources/assessor";

/** Spread across the county on purpose: city, suburb, lake, river valley, and one commercial lot. */
export const LOT_ADDRESSES = [
  "4122 Wallingford Ave N, Seattle",
  "8358 Falls Ave SE, Snoqualmie",
  "11418 NE 19th St, Bellevue",
  "10220 NE 64th St, Kirkland",
  "8210 SE 36th St, Mercer Island",
  "1711 NE 175th St, Shoreline",
  "1416 SW 166th St, Burien",
  "1917 14th Ct NE, Issaquah",
  "1413 N 36th St, Renton",
  "1600 E Olive Way, Seattle",
];

/** Card image size in CSS pixels; the photo is requested at twice this. */
export const PHOTO = { w: 480, h: 360 };

export interface Lot {
  input: string;
  address: string;
  city: string;
  zip: string;
  pin: string;
  use: string;
  zoning: string;
  landSqFt: number | null;
  value: { year: number; total: number; change: number | null } | null;
  building: Building | null;
  sale: { price: number; date: string } | null;
  permits: number;
  /** King County's aerial photo of the box around the lot: the county's URL when read, a local copy once saved. */
  photo: string;
  /** SVG path data in PHOTO's coordinate space. */
  outline: { subject: string; neighbours: string[] };
  retrievedAt: string;
}

// Web Mercator, the projection the county's aerial is served in, so lines and photo agree exactly.
const R = 6378137;
const mx = (lon: number) => (R * lon * Math.PI) / 180;
const my = (lat: number) => R * Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360));

const AERIAL_EXPORT = "https://gismaps.kingcounty.gov/arcgis/rest/services/BaseMaps/KingCo_Aerial_2025/MapServer/export";

/** Frame the lot with room around it, fetch the photo of exactly that box, and project the rings into it. */
function frame(subject: Rings, neighbours: Rings[]) {
  const pts = subject.flat().map(([lat, lon]) => [mx(lon), my(lat)]);
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
  const cy = (Math.min(...ys) + Math.max(...ys)) / 2;
  const aspect = PHOTO.w / PHOTO.h;
  // The lot fills about half the frame; never closer than 70 m across, so small lots keep their street.
  let w = Math.max((Math.max(...xs) - Math.min(...xs)) * 2.1, (Math.max(...ys) - Math.min(...ys)) * 2.1 * aspect, 70);
  w = Math.min(w, 900);
  const h = w / aspect;
  const [x0, y1] = [cx - w / 2, cy + h / 2];
  const bbox = [cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2].map((n) => n.toFixed(2)).join(",");

  const path = (rings: Rings) =>
    rings
      .map(
        (ring) =>
          "M" +
          ring
            .map(([lat, lon]) => `${(((mx(lon) - x0) / w) * PHOTO.w).toFixed(1)} ${(((y1 - my(lat)) / h) * PHOTO.h).toFixed(1)}`)
            .join("L") +
          "Z",
      )
      .join("");

  const qs = new URLSearchParams({
    bbox,
    bboxSR: "3857",
    imageSR: "3857",
    size: `${PHOTO.w * 2},${PHOTO.h * 2}`,
    format: "jpg",
    f: "image",
  });
  return { photo: `${AERIAL_EXPORT}?${qs}`, subject: path(subject), neighbours: neighbours.map(path) };
}

/** "Single Family(Res Use/Zone)" → "Single family". */
const plainUse = (s: string) => {
  const u = s.replace(/\(.*?\)/g, "").trim();
  return u ? u.charAt(0) + u.slice(1).toLowerCase() : "";
};

export async function readLot(input: string): Promise<Lot | null> {
  const property = await resolve(input);
  const [a, outline] = await Promise.all([assessor(property), parcelOutline(property.pin)]);
  if (a.status !== "found" || !a.data || !outline) return null;
  const r = a.data;
  const v = valueChange(r);
  const latest = r.assessedValues.find((x) => x.totalValue);
  const sale = lastSale(r);
  const f = frame(outline.subject, outline.neighbours);
  return {
    input,
    address: property.address,
    city: property.city,
    zip: property.zip,
    pin: property.pin,
    use: plainUse(r.presentUse),
    zoning: r.zoning,
    landSqFt: r.landSqFt,
    value: latest?.totalValue ? { year: latest.taxYear, total: latest.totalValue, change: v?.change ?? null } : null,
    building: r.building,
    sale: sale?.price ? { price: sale.price, date: sale.date } : null,
    permits: r.permits.length,
    photo: f.photo,
    outline: { subject: f.subject, neighbours: f.neighbours },
    retrievedAt: a.retrievedAt,
  };
}
