/**
 * Public schools near the property, from the U.S. Department of Education (NCES). NCES's school
 * locations give every public school's position, so the nearest ones are measured from this
 * house; each school's NCES directory page (grades, students, teachers) is then read with
 * TinyFish Fetch. Nearby is not the same as assigned: the district draws attendance boundaries,
 * and the report says so.
 */
import { fetchJson, fetchPages } from "../tinyfish";
import { section, type ResolvedProperty, type Section } from "../types";

const LOCATIONS =
  "https://nces.ed.gov/opengis/rest/services/K12_School_Locations/EDGE_GEOCODE_PUBLICSCH_2324/MapServer/0/query";
export const ncesSchoolUrl = (id: string) => `https://nces.ed.gov/ccd/schoolsearch/school_detail.asp?ID=${id}`;
const NAME = "NCES public school directory";
/** How far to look, in metres (1.5 miles). */
const RADIUS = 2414;
const MAX = 8;

export interface School {
  id: string;
  name: string;
  address: string;
  /** Straight-line distance from the property, in miles. */
  miles: number;
  grades: string | null;
  students: number | null;
  studentTeacherRatio: number | null;
  district: string | null;
  /** NCES directory page for the school. */
  url: string;
}

interface Location {
  attributes: { NCESSCH: string; NAME: string; STREET: string; CITY: string };
  geometry: { x: number; y: number };
}

function miles(lat1: number, lon1: number, lat2: number, lon2: number) {
  const r = (d: number) => (d * Math.PI) / 180;
  const a = Math.sin(r(lat2 - lat1) / 2) ** 2 + Math.cos(r(lat1)) * Math.cos(r(lat2)) * Math.sin(r(lon2 - lon1) / 2) ** 2;
  return 3958.8 * 2 * Math.asin(Math.sqrt(a));
}

/** The facts on an NCES school directory page. */
export function parseSchoolPage(md: string) {
  const field = (label: string) => md.match(new RegExp(`\\*\\*${label}:\\*\\*\\s*\\n?([^\\n*]+)`))?.[1].trim() ?? null;
  const num = (s: string | null) => (s && /\d/.test(s) ? Number(s.replace(/[^\d.]/g, "")) : null);
  return {
    grades: field("Grade Span")?.replace(/\s+/g, " ") ?? null,
    students: num(field("Total Students")),
    studentTeacherRatio: num(field("Student/Teacher Ratio")),
    district: field("District Name"),
  };
}

export async function schools(p: ResolvedProperty): Promise<Section<School[]>> {
  const qs = new URLSearchParams({
    geometry: `${p.lon},${p.lat}`,
    geometryType: "esriGeometryPoint",
    inSR: "4326",
    distance: String(RADIUS),
    units: "esriSRUnit_Meter",
    spatialRel: "esriSpatialRelIntersects",
    outFields: "NCESSCH,NAME,STREET,CITY",
    returnGeometry: "true",
    outSR: "4326",
    f: "json",
  });
  const base = {
    sourceUrl: `https://nces.ed.gov/ccd/schoolsearch/school_list.asp?Search=1&State=53&Zip=${p.zip}&Miles=2`,
    sourceName: NAME,
    via: "fetch" as const,
  };
  try {
    const body = await fetchJson<{ features?: Location[]; error?: { message: string } }>(`${LOCATIONS}?${qs}`);
    if (body.error) throw new Error("NCES school locations didn't answer");
    const near = (body.features ?? [])
      .map((f) => ({ f, miles: miles(p.lat, p.lon, f.geometry.y, f.geometry.x) }))
      .sort((a, b) => a.miles - b.miles)
      // NCES sometimes lists one program twice under two IDs at the same address.
      .filter(({ f }, i, all) => all.findIndex((x) => x.f.attributes.NAME === f.attributes.NAME && x.f.attributes.STREET === f.attributes.STREET) === i)
      .slice(0, MAX);
    if (!near.length) return section<School[]>(base, "none", null, "NCES lists no public school within 1.5 miles");

    const pages = await fetchPages(near.map(({ f }) => ncesSchoolUrl(f.attributes.NCESSCH))).catch(() => near.map(() => null));
    const list: School[] = near.map(({ f, miles }, i) => {
      const facts = pages[i] ? parseSchoolPage(pages[i]!) : { grades: null, students: null, studentTeacherRatio: null, district: null };
      return {
        id: f.attributes.NCESSCH,
        name: f.attributes.NAME,
        address: `${f.attributes.STREET}, ${f.attributes.CITY}`,
        miles: Math.round(miles * 10) / 10,
        ...facts,
        url: ncesSchoolUrl(f.attributes.NCESSCH),
      };
    });
    return section<School[]>(base, "found", list);
  } catch (err) {
    return section<School[]>(base, "source_error", null, (err as Error).message);
  }
}
