/**
 * King County Assessor, eReal Property: one server-rendered page per parcel, read with TinyFish Fetch.
 * It carries zoning, the land/building facts, 30 years of assessed values, sales, appeals and the
 * permits the assessor has recorded. Tables are identified by their stable ASP.NET ids.
 */
import { fetchPage } from "../tinyfish";
import { labelValues, money, tableById, tableRows } from "../html";
import { section, type ResolvedProperty, type Section } from "../types";

export interface AssessedValue {
  taxYear: number;
  landValue: number | null;
  buildingValue: number | null;
  totalValue: number | null;
  taxableTotal: number | null;
  reason: string;
}

export interface Sale {
  recordingNumber: string;
  date: string;
  price: number | null;
  seller: string;
  buyer: string;
  instrument: string;
  reason: string;
}

export interface AssessorPermit {
  number: string;
  description: string;
  type: string;
  issued: string;
  value: number | null;
  jurisdiction: string;
}

export interface Appeal {
  taxYear: string;
  type: string;
  appealedValue: number | null;
  settlementValue: number | null;
  decision: string;
  status: string;
}

export interface AssessorRecord {
  parcel: string;
  owner: string;
  siteAddress: string;
  propertyName: string;
  jurisdiction: string;
  propertyType: string;
  presentUse: string;
  zoning: string;
  landSqFt: number | null;
  acres: number | null;
  /** Assessor flags that matter before buying: easements, historic designation, water problems… */
  flags: Record<string, string>;
  assessedValues: AssessedValue[];
  sales: Sale[];
  appeals: Appeal[];
  permits: AssessorPermit[];
}

export const assessorUrl = (pin: string) =>
  `https://blue.kingcounty.com/Assessor/eRealProperty/Detail.aspx?ParcelNbr=${pin}`;

const FLAG_TABLES = [
  "cphContent_DetailsViewLandDesignations",
  "cphContent_DetailsViewLandNuisances",
  "cphContent_DetailsViewLandProblems",
];

const TABLES = [
  "cphContent_DetailsViewParcel",
  "cphContent_DetailsViewParcel2",
  "cphContent_DetailsViewLand",
  "cphContent_DetailsViewLandSystem",
  ...FLAG_TABLES,
  "cphContent_GridViewTaxRoll",
  "cphContent_GridViewSales",
  "cphContent_GridViewReview",
  "cphContent_GridViewPermits",
];

export function parseAssessor(html: string): AssessorRecord | null {
  const parcelTable = tableById(html, "cphContent_DetailsViewParcel");
  if (!parcelTable) return null; // Not a parcel page (bad PIN, error page, or layout change).
  const parcel = labelValues(parcelTable);
  const parcel2 = labelValues(tableById(html, "cphContent_DetailsViewParcel2") ?? "");
  const land = labelValues(tableById(html, "cphContent_DetailsViewLand") ?? "");
  const system = labelValues(tableById(html, "cphContent_DetailsViewLandSystem") ?? "");

  const flags: Record<string, string> = {};
  for (const id of FLAG_TABLES) {
    for (const [k, v] of Object.entries(labelValues(tableById(html, id) ?? ""))) {
      // Keep only flags that are actually set; "NO"/blank is the default for every parcel.
      if (v && v !== "NO" && v !== "(none)" && v !== "0") flags[k] = v;
    }
  }

  const rows = (id: string) => tableRows(tableById(html, id) ?? "");

  return {
    parcel: parcel["Parcel"] ?? "",
    owner: parcel["Name"] ?? "",
    siteAddress: parcel["Site Address"] ?? "",
    propertyName: parcel["Property Name"] ?? "",
    jurisdiction: parcel2["Jurisdiction"] ?? "",
    propertyType: parcel2["Property Type"] ?? "",
    presentUse: land["Present Use"] ?? "",
    zoning: system["Zoning"] ?? land["Zoning"] ?? "",
    landSqFt: money(land["Land SqFt"]),
    acres: money(land["Acres"]),
    flags,
    // Account, Valued Year, Tax Year, Omit Year, Levy Code, Appraised Land, Appraised Imps,
    // Appraised Total, New Dollars, Taxable Land, Taxable Imps, Taxable Total, Tax Value Reason
    assessedValues: rows("cphContent_GridViewTaxRoll").map((c) => ({
      taxYear: Number(c[2]),
      landValue: money(c[5]),
      buildingValue: money(c[6]),
      totalValue: money(c[7]),
      taxableTotal: money(c[11]),
      reason: c[12] ?? "",
    })),
    // Excise Number, Recording Number, Document Date, Sale Price, Seller, Buyer, Instrument, Sale Reason
    sales: rows("cphContent_GridViewSales").map((c) => ({
      recordingNumber: c[1],
      date: c[2],
      price: money(c[3]),
      seller: c[4],
      buyer: c[5],
      instrument: c[6],
      reason: c[7] ?? "",
    })),
    // Tax Year, Review Number, Review Type, Appealed Value, Hearing Date, Settlement Value, Decision, Status
    appeals: rows("cphContent_GridViewReview").map((c) => ({
      taxYear: c[0],
      type: c[2],
      appealedValue: money(c[3]),
      settlementValue: money(c[5]),
      decision: c[6] ?? "",
      status: c[7] ?? "",
    })),
    // Permit Number, Description, Type, Issue Date, Permit Value, Issuing Jurisdiction, Reviewed Date
    permits: rows("cphContent_GridViewPermits").map((c) => ({
      number: c[0],
      description: c[1].replace(/,\s*$/, ""),
      type: c[2],
      issued: c[3],
      value: money(c[4]),
      jurisdiction: c[5] ?? "",
    })),
  };
}

export async function assessor(p: ResolvedProperty): Promise<Section<AssessorRecord>> {
  const base = {
    sourceUrl: assessorUrl(p.pin),
    sourceName: "King County Assessor: eReal Property",
    via: "fetch" as const,
  };
  try {
    const page = await fetchPage(base.sourceUrl, "html", TABLES.map((id) => `#${id}`));
    const record = parseAssessor(page.text ?? "");
    if (!record) return section<AssessorRecord>(base, "source_error", null, "The assessor page didn't contain a parcel record");
    return section(base, "found", record);
  } catch (err) {
    return section<AssessorRecord>(base, "source_error", null, (err as Error).message);
  }
}
