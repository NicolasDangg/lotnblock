/**
 * Every official source the dossier draws on. `run` is set only once the source is really connected;
 * the site lists the rest as not connected yet rather than pretending.
 */
import type { ResolvedProperty, Section, Via } from "../types";
import { assessor } from "./assessor";

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
  { key: "treasurer", name: "King County Treasurer", level: "county", provides: "Tax billed, paid and due", topic: "tax bills", via: "agent" },
  { key: "permits", name: "Seattle Services Portal", level: "city", provides: "Building permits and their status", topic: "city permits", via: "agent" },
  { key: "violations", name: "Seattle code compliance", level: "city", provides: "Violations and complaints", topic: "code violations", via: "agent" },
  { key: "flood", name: "FEMA Flood Map Service Center", level: "federal", provides: "Flood zone and map panel", topic: "the flood zone", via: "agent" },
  { key: "schools", name: "Seattle Public Schools", level: "district", provides: "Assigned elementary, middle and high school", topic: "school assignment", via: "agent" },
];

export const VIA_LABEL: Record<Via, string> = {
  fetch: "TinyFish Fetch",
  agent: "TinyFish Agent",
  search: "TinyFish Search",
  monitor: "TinyFish Monitor",
  gis: "King County GIS",
};
