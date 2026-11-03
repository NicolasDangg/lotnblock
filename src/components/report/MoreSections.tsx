import type { DistrictsRecord } from "@/lib/sources/districts";
import type { FloodRecord } from "@/lib/sources/flood";
import type { School } from "@/lib/sources/schools";
import type { TaxRecord } from "@/lib/sources/treasurer";
import type { Section } from "@/lib/types";
import { money } from "./format";
import { Gap, Receipt } from "./Receipt";

/** A report section with the shared states: still reading, a stated gap, or the records. */
function Shell<T>({
  id,
  title,
  what,
  waiting,
  section,
  children,
}: {
  id: string;
  title: string;
  what: string;
  waiting: string;
  section: Section<T> | undefined;
  children: (data: T) => React.ReactNode;
}) {
  return (
    <section id={id} className="mt-[clamp(64px,7vw,104px)] scroll-mt-24" data-reveal>
      <h2 className="t-lead name mb-6 text-[clamp(1.5rem,1.2rem+1vw,2rem)]">{title}</h2>
      {!section || section.status === "pending" ? (
        <p className="reading">{waiting}</p>
      ) : section.status === "found" && section.data ? (
        children(section.data)
      ) : (
        <Gap section={section} what={what} />
      )}
      {section && section.status !== "pending" ? <Receipt section={section} /> : null}
    </section>
  );
}

export function TaxSection({ section }: { section: Section<TaxRecord> | undefined }) {
  return (
    <Shell
      id="taxes"
      title="Property tax"
      what="tax bills"
      waiting="Looking the parcel up at the King County Treasurer. This takes a minute or two."
      section={section}
    >
      {(t) => {
        const due = t.years.reduce((sum, y) => sum + (y.due ?? 0), 0);
        return (
          <>
            <p className={`px-6 py-5 ${due > 0 ? "bg-[var(--field-blush)]" : "bg-[var(--field-sage)]"}`}>
              <span className="name">{due > 0 ? `${money(due)} due` : "Nothing due"}</span>
              {t.notice ? <span className="block">{t.notice}</span> : null}
            </p>
            <table className="mt-6 w-full text-left [font-variant-numeric:tabular-nums]">
              <thead>
                <tr className="muted">
                  <th className="py-1 font-normal">Tax year</th>
                  <th className="py-1 text-right font-normal">Billed</th>
                  <th className="py-1 text-right font-normal">Paid</th>
                  <th className="py-1 text-right font-normal">Due</th>
                </tr>
              </thead>
              <tbody>
                {t.years.map((y) => (
                  <tr key={y.year}>
                    <td className="py-1">{y.year}</td>
                    <td className="py-1 text-right">{money(y.billed)}</td>
                    <td className="py-1 text-right">{money(y.paid)}</td>
                    <td className="py-1 text-right">{money(y.due)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {t.account ? <p className="t-small muted mt-3">Tax account {t.account}</p> : null}
          </>
        );
      }}
    </Shell>
  );
}

/** FEMA's zone codes in plain words. */
const ZONE_WORDS: Record<string, string> = {
  X: "Outside the high-risk flood area",
  A: "High-risk flood area",
  AE: "High-risk flood area, with base flood elevations",
  AH: "High-risk shallow flooding area",
  AO: "High-risk sheet-flow flooding area",
  VE: "High-risk coastal flood area, with wave action",
  V: "High-risk coastal flood area",
  D: "Flood risk not studied",
};

export function FloodSection({
  flood,
  districts,
}: {
  flood: Section<FloodRecord> | undefined;
  districts: Section<DistrictsRecord> | undefined;
}) {
  return (
    <>
      <Shell id="flood" title="Flood zone" what="a flood zone" waiting="Reading FEMA's flood map…" section={flood}>
        {(f) => (
          <>
            <p className={`px-6 py-5 ${f.specialFloodHazardArea ? "bg-[var(--field-blush)]" : "bg-[var(--field-sage)]"}`}>
              <span className="t-lead name block">Zone {f.zone}</span>
              <span className="block">
                {ZONE_WORDS[f.zone] ?? f.subtype ?? "See FEMA's map for what this zone means"}.{" "}
                {f.specialFloodHazardArea
                  ? "Lenders require flood insurance here."
                  : "Flood insurance isn't required by lenders here."}
              </span>
            </p>
            <p className="mt-4">
              {f.subtype ? `FEMA calls it "${f.subtype.toLowerCase()}". ` : ""}
              {f.panel ? `Flood map panel ${f.panel}${f.panelEffective ? `, in effect since ${f.panelEffective}` : ""}. ` : ""}
              <a className="link" href={f.mapServiceCenterUrl} target="_blank" rel="noreferrer">
                Open the official map at FEMA
              </a>
            </p>
          </>
        )}
      </Shell>

      <Shell
        id="hazards"
        title="Hazards and districts"
        what="the county's hazard map"
        waiting="Reading King County's districts report…"
        section={districts}
      >
        {(d) => (
          <>
            <dl className="grid grid-cols-[minmax(9rem,auto)_1fr] gap-x-6 gap-y-3">
              <Fact term="100-year floodplain" value={d.floodplain} />
              <Fact term="Landslide" value={d.landslide} />
              <Fact term="Erosion" value={d.erosion} />
              <Fact term="Seismic" value={d.seismic} />
              <Fact term="Coal mines" value={d.coalMine} />
              <Fact term="Wetlands" value={d.wetlands} />
              <Fact term="Shoreline" value={d.shoreline} />
              <Fact term="Smelter plume (arsenic)" value={d.smelterPlume} />
              <Fact term="Development conditions" value={d.developmentConditions} />
              <Fact term="School district" value={d.schoolDistrict} />
              <Fact term="Watershed" value={d.watershed} />
            </dl>
            <p className="t-small muted mt-5">
              &ldquo;Check with Jurisdiction&rdquo; means the county doesn&apos;t map that hazard inside this city; the
              city&apos;s own critical-areas map does.
              {d.asOf ? ` The county printed this report on ${d.asOf}.` : ""}
            </p>
          </>
        )}
      </Shell>
    </>
  );
}

export function SchoolsSection({ section }: { section: Section<School[]> | undefined }) {
  return (
    <Shell
      id="schools"
      title="Nearby public schools"
      what="public schools nearby"
      waiting="Finding public schools near the property…"
      section={section}
    >
      {(list) => (
        <>
          <ol className="flex flex-col gap-4">
            {list.map((s) => (
              <li key={s.id} className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-6">
                <a className="link name" href={s.url} target="_blank" rel="noreferrer">
                  {s.name}
                </a>
                <span className="text-right [font-variant-numeric:tabular-nums]">{s.miles} mi</span>
                <span className="text-[var(--muted)]">
                  {s.grades ? `Grades ${s.grades}` : "Grades not read"}
                  {s.students ? ` · ${s.students.toLocaleString("en-US")} students` : ""}
                  {s.studentTeacherRatio ? ` · ${s.studentTeacherRatio} per teacher` : ""}
                </span>
              </li>
            ))}
          </ol>
          <p className="t-small muted mt-5">
            Straight-line distance from the lot. Nearby isn&apos;t the same as assigned: the school district sets
            attendance boundaries, so check with the district which schools serve this address.
          </p>
        </>
      )}
    </Shell>
  );
}

function Fact({ term, value }: { term: string; value: string }) {
  return (
    <>
      <dt className="muted">{term}</dt>
      <dd>{value}</dd>
    </>
  );
}
