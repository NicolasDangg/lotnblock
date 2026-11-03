import { highlights, lastSale, monthYear, valueChange, zoneInPlainWords, type Highlight } from "@/lib/highlights";
import type { AssessorRecord } from "@/lib/sources/assessor";
import { CLOSED, type PortalRecord } from "@/lib/sources/portalRecord";
import type { Section } from "@/lib/types";
import { count, money } from "./format";

/**
 * The top of the report: four figures a buyer reads first, then the facts worth knowing.
 * Everything below it is the full record for anyone who wants to check the working.
 */
export function Glance({
  record,
  unchecked,
  city = [],
}: {
  record: AssessorRecord;
  unchecked: string[];
  /** The city portal's permits and complaints sections, when they have answered. */
  city?: (Section<PortalRecord[]> | undefined)[];
}) {
  const vc = valueChange(record);
  const sale = lastSale(record);
  const zone = zoneInPlainWords(record.zoning, record.jurisdiction);
  const latestPermit = record.permits[0];
  const permitsSection = city[0];
  // The city portal is the permit authority; once it has answered, its count replaces the assessor's.
  const cityPermits =
    permitsSection?.status === "found" ? permitsSection.data : permitsSection?.status === "none" ? [] : null;
  const openCity = city.flatMap((c) => c?.data ?? []).filter((r) => !CLOSED.test(r.status));
  const items: Highlight[] = [
    ...openCity.map((r) => ({
      tone: "watch" as const,
      title: `Open with the city: ${r.type || r.number}`,
      detail: `${r.status || "Status not shown"}, since ${r.date}.`,
    })),
    ...highlights(record, unchecked),
  ];
  const watch = items.filter((h) => h.tone === "watch");
  const notes = items.filter((h) => h.tone === "note");
  const gap = items.find((h) => h.tone === "gap");

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
        {cityPermits ? (
          <Figure
            value={String(cityPermits.length)}
            label={cityPermits.length === 1 ? "City permit" : "City permits"}
            sub={cityPermits[0] ? `Latest ${cityPermits[0].date}` : "None at the city portal"}
          />
        ) : (
          <Figure
            value={String(record.permits.length)}
            label={record.permits.length === 1 ? "Permit on file" : "Permits on file"}
            sub={latestPermit ? `Latest ${monthYear(latestPermit.issued)}` : "None recorded by the assessor"}
          />
        )}
      </dl>

      {watch.length || notes.length ? (
        <div className="mt-12">
          <h2 className="t-lead name">Worth knowing</h2>
          <div className={`mt-5 grid grid-cols-[minmax(0,1fr)] gap-3 ${watch.length && notes.length ? "md:grid-cols-2" : ""}`}>
            {watch.length ? <Group title="Check before you decide" items={watch} ground="bg-[var(--field-blush)]" /> : null}
            {notes.length ? <Group title="Good to know" items={notes} ground="bg-[var(--field-input)]" /> : null}
          </div>
        </div>
      ) : null}

      {gap ? (
        <p className="mt-3 bg-[var(--field-slate)] px-6 py-4">
          <span className="name">{gap.title}:</span> {gap.detail.replace(/\.$/, "")}. Check these yourself before deciding.
        </p>
      ) : null}
    </section>
  );
}

function Figure({ value, label, sub, accent }: { value: string; label: string; sub?: string; accent?: boolean }) {
  return (
    <div className={`@container flex min-w-0 flex-col px-6 py-6 ${accent ? "bg-[var(--accent)] text-[var(--accent-ink)]" : "bg-[var(--field-input)]"}`}>
      {/* dt first in the source (valid markup), the figure first on screen */}
      <dt className="name order-2 mt-3">{label}</dt>
      <dd className="order-1 text-[clamp(1.75rem,14cqi,3.25rem)] leading-none tracking-[-0.02em] whitespace-nowrap [font-variant-numeric:tabular-nums]">
        {value}
      </dd>
      {sub ? <dd className={`order-3 mt-1 ${accent ? "text-[var(--field-sage)]" : "text-[var(--muted)]"}`}>{sub}</dd> : null}
    </div>
  );
}

function Group({ title, items, ground }: { title: string; items: Highlight[]; ground: string }) {
  return (
    <section className={`${ground} px-6 py-5`}>
      <h3 className="name">{title}</h3>
      <ul className="mt-3 flex flex-col gap-4">
        {items.map((h) => (
          <li key={h.title}>
            <p>{h.title}</p>
            <p className="t-small text-[var(--muted)]">{h.detail}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

function changeWords(change: number, year: number) {
  const pct = Math.round(Math.abs(change) * 100);
  if (pct === 0) return `About the same as ${year}`;
  return `${change > 0 ? "Up" : "Down"} ${pct}% from ${year}`;
}
