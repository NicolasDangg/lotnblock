import type { AssessorRecord } from "@/lib/sources/assessor";
import type { Section } from "@/lib/types";
import { count, money } from "./format";
import { Gap, Receipt } from "./Receipt";

export function AssessorSection({ section }: { section: Section<AssessorRecord> }) {
  const r = section.data;
  if (section.status !== "found" || !r) {
    return (
      <Block title="The lot, its value and its history">
        <Gap section={section} what="the assessor's record" />
        <Receipt section={section} />
      </Block>
    );
  }

  const values = r.assessedValues.filter((v) => v.totalValue);
  const latest = values[0];
  const flags = Object.entries(r.flags);

  const priced = r.sales.filter((x) => (x.price ?? 0) > 0);
  const unpriced = r.sales.filter((x) => !((x.price ?? 0) > 0));

  return (
    <>
      <Receipt section={section} />
      <Block id="lot" title="The lot" near>
        <dl className="grid grid-cols-[minmax(9rem,auto)_1fr] gap-x-6 gap-y-3">
          <Fact term="Zoning" value={r.zoning || "Not stated"} />
          <Fact term="Present use" value={r.presentUse || "Not stated"} />
          <Fact term="Lot size" value={r.landSqFt ? `${count(r.landSqFt)} sq ft (${r.acres} acres)` : "Not stated"} />
          <Fact term="Owner of record" value={r.owner || "Not stated"} />
          <Fact term="Jurisdiction" value={r.jurisdiction || "Not stated"} />
          {r.propertyName ? <Fact term="Property name" value={r.propertyName} /> : null}
        </dl>
        {flags.length ? (
          <div className="mt-8 bg-[var(--field-blush)] px-6 py-5">
            <p className="name">The assessor has flagged this lot</p>
            <ul className="mt-2">
              {flags.map(([k, v]) => (
                <li key={k}>
                  {k}: {v.toLowerCase()}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="mt-8">No easements, designations, nuisances or water problems are flagged by the assessor.</p>
        )}
      </Block>

      <Block id="value" title="Assessed value">
        {latest ? (
          <>
            <p className="t-head">{money(latest.totalValue)}</p>
            <p className="mt-2">
              For tax year {latest.taxYear}: land {money(latest.landValue)}, buildings {money(latest.buildingValue)}.
            </p>
            <ValueChart values={values} />
            <details className="mt-6">
              <summary className="link cursor-pointer">All {values.length} years</summary>
              <table className="mt-4 w-full text-left">
                <thead>
                  <tr className="muted">
                    <th className="py-1 font-normal">Tax year</th>
                    <th className="py-1 text-right font-normal">Land</th>
                    <th className="py-1 text-right font-normal">Buildings</th>
                    <th className="py-1 text-right font-normal">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {values.map((v) => (
                    <tr key={v.taxYear}>
                      <td className="py-1">{v.taxYear}</td>
                      <td className="py-1 text-right">{money(v.landValue)}</td>
                      <td className="py-1 text-right">{money(v.buildingValue)}</td>
                      <td className="py-1 text-right">{money(v.totalValue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </details>
          </>
        ) : (
          <p>The assessor lists no assessed values for this parcel.</p>
        )}
      </Block>

      <Block id="sales" title="Sales and transfers">
        {priced.length ? (
          <ol className="flex flex-col gap-5">
            {priced.map((x) => (
              <SaleItem key={x.recordingNumber} s={x} />
            ))}
          </ol>
        ) : (
          <p>No sale with a price is recorded for this parcel.</p>
        )}
        {unpriced.length ? (
          <details className="mt-6">
            <summary className="link cursor-pointer">
              {unpriced.length} {unpriced.length === 1 ? "transfer" : "transfers"} without a price (gifts, trusts, refinancing)
            </summary>
            <ol className="mt-4 flex flex-col gap-5">
              {unpriced.map((x) => (
                <SaleItem key={x.recordingNumber} s={x} />
              ))}
            </ol>
          </details>
        ) : null}
      </Block>

      <Block id="permits" title={`Permits on file (${r.permits.length})`}>
        {r.permits.length ? (
          <ol className="flex flex-col gap-5">
            {r.permits.slice(0, 5).map((p) => (
              <PermitItem key={p.number} p={p} />
            ))}
          </ol>
        ) : (
          <p>The assessor has no permits on file for this parcel.</p>
        )}
        {r.permits.length > 5 ? (
          <details className="mt-6">
            <summary className="link cursor-pointer">{r.permits.length - 5} older permits</summary>
            <ol className="mt-4 flex flex-col gap-5">
              {r.permits.slice(5).map((p) => (
                <PermitItem key={p.number} p={p} />
              ))}
            </ol>
          </details>
        ) : null}
        <p className="t-small muted mt-5">
          These are the permits the assessor recorded. The city&apos;s own permit portal, with status and inspections,
          is a separate source.
        </p>
      </Block>

      {r.appeals.length ? (
        <Block id="appeals" title="Value appeals">
          <ol className="flex flex-col gap-3">
            {r.appeals.map((a) => (
              <li key={a.taxYear + a.type}>
                {a.taxYear}: {a.type.toLowerCase()} against {money(a.appealedValue)}, settled at{" "}
                {money(a.settlementValue)} ({a.decision.toLowerCase()}).
              </li>
            ))}
          </ol>
        </Block>
      ) : null}
    </>
  );
}

function SaleItem({ s }: { s: AssessorRecord["sales"][number] }) {
  return (
    <li>
      <p className="name">
        {s.date}: {s.price ? money(s.price) : "no price recorded"}
      </p>
      <p>
        {titleish(s.seller)} to {titleish(s.buyer)}. {s.instrument}
        {s.reason && s.reason !== "None" ? `, ${s.reason.toLowerCase()}` : ""}.
      </p>
    </li>
  );
}

function PermitItem({ p }: { p: AssessorRecord["permits"][number] }) {
  return (
    <li>
      <p className="name">
        {p.issued} · {p.number}
        {p.value ? ` · ${money(p.value)}` : ""}
      </p>
      <p>{p.description || "No description given."}</p>
    </li>
  );
}

const titleish = (s: string) => s.toLowerCase().replace(/\b([a-z])/g, (c) => c.toUpperCase());

/** The parts of the assessor's record, in report order: used for the contents list. */
export const ASSESSOR_PARTS = [
  { id: "lot", title: "The lot" },
  { id: "value", title: "Assessed value" },
  { id: "sales", title: "Sales and transfers" },
  { id: "permits", title: "Permits on file" },
];

function Block({ id, title, near, children }: { id?: string; title: string; near?: boolean; children: React.ReactNode }) {
  return (
    <section id={id} className={`${near ? "mt-12" : "mt-[clamp(64px,7vw,104px)]"} scroll-mt-24 first:mt-0`} data-reveal>
      <h2 className="t-lead name mb-6 text-[clamp(1.5rem,1.2rem+1vw,2rem)]">{title}</h2>
      {children}
    </section>
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

/** Assessed total per tax year as filled bars; the latest year in olive. */
function ValueChart({ values }: { values: AssessorRecord["assessedValues"] }) {
  const series = [...values].reverse();
  const max = Math.max(...series.map((v) => v.totalValue ?? 0));
  const bw = 10;
  const gap = 4;
  const H = 120;
  return (
    <figure className="mt-8">
      <svg
        viewBox={`0 0 ${series.length * (bw + gap)} ${H}`}
        className="h-32 w-full"
        preserveAspectRatio="none"
        role="img"
        aria-label={`Assessed total value from tax year ${series[0].taxYear} to ${series.at(-1)!.taxYear}`}
      >
        {series.map((v, i) => {
          const h = Math.max(2, ((v.totalValue ?? 0) / max) * H);
          return (
            <rect
              key={v.taxYear}
              x={i * (bw + gap)}
              y={H - h}
              width={bw}
              height={h}
              fill={i === series.length - 1 ? "var(--accent)" : "var(--ink)"}
            />
          );
        })}
      </svg>
      <figcaption className="t-small muted mt-2 flex justify-between">
        <span>{series[0].taxYear}</span>
        <span>{series.at(-1)!.taxYear}</span>
      </figcaption>
    </figure>
  );
}
