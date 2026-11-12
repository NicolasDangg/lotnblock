import { CLOSED, type PortalRecord } from "@/lib/sources/portalRecord";
import type { Section } from "@/lib/types";
import { Gap, Receipt } from "./Receipt";

/** City permits or code complaints from the Seattle Services Portal, open records first. */
export function CitySection({
  id,
  title,
  what,
  section,
}: {
  id: string;
  title: string;
  what: string;
  section: Section<PortalRecord[]> | undefined;
}) {
  return (
    <section id={id} className="mt-[clamp(64px,7vw,104px)] scroll-mt-24" data-reveal>
      <h2 className="t-lead name mb-6 text-[clamp(1.5rem,1.2rem+1vw,2rem)]">
        {title}
        {section?.status === "found" && section.data ? ` (${section.data.length})` : ""}
      </h2>
      {!section || section.status === "pending" ? (
        <p className="reading">Searching the city&apos;s permit portal with TinyFish Agent. This takes a few minutes; the rest of the report is ready now.</p>
      ) : section.status === "found" && section.data ? (
        <>
          {section.note ? <p className="reading mb-6 bg-[var(--field-blush)] px-6 py-4">{section.note}</p> : null}
          <Records rows={section.data} />
        </>
      ) : (
        <Gap section={section} what={what} />
      )}
      {section && section.status !== "pending" ? <Receipt section={section} /> : null}
    </section>
  );
}

function Records({ rows }: { rows: PortalRecord[] }) {
  const open = rows.filter((r) => !CLOSED.test(r.status));
  const done = rows.filter((r) => CLOSED.test(r.status));
  return (
    <>
      {open.length ? (
        <div className="mb-8 bg-[var(--field-blush)] px-6 py-5">
          <p className="name">Still open ({open.length})</p>
          <ol className="mt-3 flex flex-col gap-4">
            {open.map((r) => (
              <Item key={r.number} r={r} />
            ))}
          </ol>
        </div>
      ) : null}
      <ol className="flex flex-col gap-5">
        {done.slice(0, 6).map((r) => (
          <Item key={r.number} r={r} />
        ))}
      </ol>
      {done.length > 6 ? (
        <details className="mt-6">
          <summary className="link cursor-pointer">{done.length - 6} older records</summary>
          <ol className="mt-4 flex flex-col gap-5">
            {done.slice(6).map((r) => (
              <Item key={r.number} r={r} />
            ))}
          </ol>
        </details>
      ) : null}
    </>
  );
}

function Item({ r }: { r: PortalRecord }) {
  return (
    <li>
      <p className="name">
        {r.date} · {r.type || "Record"} · {r.status || "status not shown"}
      </p>
      <p className="line-clamp-3">{r.description || "No description given."}</p>
      <p className="t-small text-[var(--muted)]">
        {r.url ? (
          <a className="link" href={r.url} target="_blank" rel="noreferrer">
            {r.number} on the city portal
          </a>
        ) : (
          r.number
        )}
      </p>
    </li>
  );
}
