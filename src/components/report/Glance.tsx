import { highlights, lastSale, monthYear, valueChange, zoneInPlainWords, type Highlight } from "@/lib/highlights";
import type { AssessorRecord } from "@/lib/sources/assessor";
import { count, money } from "./format";

/**
 * The top of the report: four figures a buyer reads first, then the facts worth knowing.
 * Everything below it is the full record for anyone who wants to check the working.
 */
export function Glance({ record, unchecked }: { record: AssessorRecord; unchecked: string[] }) {
  const vc = valueChange(record);
  const sale = lastSale(record);
  const zone = zoneInPlainWords(record.zoning, record.jurisdiction);
  const latestPermit = record.permits[0];
  const items = highlights(record, unchecked);

  return (
    <section aria-labelledby="glance-h" data-reveal>
      <h2 id="glance-h" className="sr-only">
        At a glance
      </h2>
      <dl className="grid grid-cols-[minmax(0,1fr)] gap-px bg-[var(--paper-2)] sm:grid-cols-2 xl:grid-cols-4">
        <Figure
          value={vc ? money(vc.now.totalValue) : "Not stated"}
          label={vc ? `Assessed value for ${vc.now.taxYear} taxes` : "Assessed value"}
          sub={vc ? changeWords(vc.change, vc.before.taxYear) : undefined}
          accent
        />
        <Figure
          value={sale ? money(sale.price) : "None"}
          label={sale ? `Last sold, ${monthYear(sale.date)}` : "Sale with a price on record"}
          sub={sale ? sale.instrument : record.sales.length ? `${record.sales.length} transfers without a price` : undefined}
        />
        <Figure
          value={record.landSqFt ? `${count(record.landSqFt)} sq ft` : "Not stated"}
          label={`Lot, zoned ${record.zoning || "not stated"}`}
          sub={zone ?? undefined}
        />
        <Figure
          value={String(record.permits.length)}
          label={record.permits.length === 1 ? "Permit on file" : "Permits on file"}
          sub={latestPermit ? `Latest ${monthYear(latestPermit.issued)}` : "None recorded by the assessor"}
        />
      </dl>

      {items.length ? (
        <div className="mt-10">
          <h2 className="t-lead name">Worth knowing</h2>
          <ul className="mt-4 grid grid-cols-[minmax(0,1fr)] gap-3 md:grid-cols-2">
            {items.map((h) => (
              <Item key={h.title} h={h} />
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

function Figure({ value, label, sub, accent }: { value: string; label: string; sub?: string; accent?: boolean }) {
  return (
    <div className={`flex flex-col px-6 py-6 ${accent ? "bg-[var(--accent)] text-[var(--accent-ink)]" : "bg-[var(--field-input)]"}`}>
      {/* dt first in the source (valid markup), the figure first on screen */}
      <dt className="name order-2 mt-2">{label}</dt>
      <dd className="t-head order-1 [font-variant-numeric:tabular-nums]">{value}</dd>
      {sub ? <dd className={`order-3 mt-1 ${accent ? "text-[var(--field-sage)]" : "text-[var(--muted)]"}`}>{sub}</dd> : null}
    </div>
  );
}

const TONE: Record<Highlight["tone"], { bg: string; tag: string }> = {
  watch: { bg: "bg-[var(--field-blush)]", tag: "Check this" },
  note: { bg: "bg-[var(--field-input)]", tag: "Good to know" },
  gap: { bg: "bg-[var(--field-slate)]", tag: "Missing" },
};

function Item({ h }: { h: Highlight }) {
  const t = TONE[h.tone];
  return (
    <li className={`${t.bg} px-5 py-4`}>
      <p className="name">{h.title}</p>
      <p className="mt-1">{h.detail}</p>
      <p className="t-small mt-2 text-[var(--muted)]">{t.tag}</p>
    </li>
  );
}

function changeWords(change: number, year: number) {
  const pct = Math.round(Math.abs(change) * 100);
  if (pct === 0) return `About the same as ${year}`;
  return `${change > 0 ? "Up" : "Down"} ${pct}% from ${year}`;
}
