/**
 * Every official source the dossier draws on. `run` is set only once the source is really connected;
 * the site lists the rest as not connected yet rather than pretending.
 */
import type { ResolvedProperty, Section, Via } from "../types";
import { assessor } from "./assessor";
import { cityComplaints, cityPermits } from "./cityPortal";
import { districts } from "./districts";
import { flood } from "./flood";
import { schools } from "./schools";
import { treasurer } from "./treasurer";

export interface SourceInfo {
  key: string;
  name: string;
  level: "county" | "city" | "federal" | "district";
  provides: string;
  /** What the source answers, in a buyer's words: used when it is listed as not checked. */
  topic: string;
  via: Via;
  run?: (p: ResolvedProperty) => Promise<Section<unknown>>;
}

export const SOURCES: SourceInfo[] = [
  {
    key: "assessor",
    name: "King County Assessor",
    level: "county",
    provides: "Zoning, lot facts, assessed values since 1995, sales, appeals, permits on file",
    topic: "the lot, its value and sales",
    via: "fetch",
    run: assessor,
  },
  {
    key: "districts",
    name: "King County districts report",
    level: "county",
    provides: "School district, mapped floodplain, landslide, erosion and seismic hazards, wetlands, development conditions",
    topic: "hazards and districts",
    via: "fetch",
    run: districts,
  },
  {
    key: "flood",
    name: "FEMA National Flood Hazard Layer",
    level: "federal",
    provides: "Flood zone, whether flood insurance is required, and the flood map panel",
    topic: "the flood zone",
    via: "fetch",
    run: flood,
  },
  {
    key: "schools",
    name: "NCES public school directory",
    level: "federal",
    provides: "Public schools within 1.5 miles, with grades, students and teachers",
    topic: "nearby schools",
    via: "fetch",
    run: schools,
  },
  {
    key: "treasurer",
    name: "King County Treasurer",
    level: "county",
    provides: "Property tax billed, paid and due by year",
    topic: "tax bills",
    via: "agent",
    run: treasurer,
  },
  {
    key: "permits",
    name: "City permit portal",
    level: "city",
    provides: "Every permit at the address and its status (Seattle portal, or the city's own search found with TinyFish Search)",
    topic: "city permits",
    via: "agent",
    run: cityPermits,
  },
  {
    key: "violations",
    name: "Seattle code complaints",
    level: "city",
    provides: "Code complaints, violations and vacant-building cases (Seattle)",
    topic: "code complaints",
    via: "agent",
    run: cityComplaints,
  },
];

export const VIA_LABEL: Record<Via, string> = {
  fetch: "TinyFish Fetch",
  agent: "TinyFish Agent",
  search: "TinyFish Search",
  monitor: "TinyFish Monitor",
  gis: "King County GIS",
};
