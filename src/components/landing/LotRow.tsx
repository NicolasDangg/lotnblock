import Image from "next/image";
import Link from "next/link";
import { monthYear } from "@/lib/highlights";
import saved from "@/data/lots.json";
import { PHOTO, type Lot } from "@/lib/lots";
import { money, parcel, titleCase } from "@/components/report/format";
import { ScrollRow } from "./ScrollRow";

const CARD_W = "clamp(272px, 24vw, 340px)";

// Saved by `npm run lots`: the county is read once, ahead of time, so the row renders instantly.
const LOTS = saved as Lot[];
const readOn = LOTS.length
  ? new Date(LOTS.map((l) => l.retrievedAt).sort()[0]).toLocaleDateString(
      "en-US",
      {
        month: "long",
        day: "numeric",
        year: "numeric",
        timeZone: "America/Los_Angeles",
      },
    )
  : null;

/** "Around King County": real lots read from the Assessor, scrolled sideways. */
export function LotsSection() {
  if (!LOTS.length) return null;
  return (
    <section
      id="lots"
      className="scroll-mt-16 pt-[clamp(64px,8vw,112px)] pb-[clamp(40px,5vw,72px)]"
      aria-labelledby="lots-title"
    >
      <div className="mx-auto max-w-[1240px] px-[var(--pad)]">
        <h2 id="lots-title" className="t-section" data-reveal>
          Around King County
        </h2>
        <p
          className="t-lead mt-3 max-w-[46ch] text-[var(--muted)]"
          data-reveal
          style={{ ["--i" as string]: 1 }}
        >
          Real lots, read from the King County Assessor&apos;s website on{" "}
          {readOn}. Values are the county&apos;s assessed value, not a price.
          Open one for today&apos;s full report.
        </p>
      </div>
      {/* The row runs to the window's edge; its first card lines up with the column above. */}
      <div
        className="mt-10"
        style={{
          ["--card-w" as string]: CARD_W,
          ["--row-inset" as string]:
            "max(var(--pad), calc((100vw - 1240px) / 2 + var(--pad)))",
        }}
      >
        <ScrollRow label="Lots around King County">
          {LOTS.map((l, i) => (
            <LotCard key={l.pin} lot={l} eager={i < 4} />
          ))}
        </ScrollRow>
      </div>
    </section>
  );
}

const int = new Intl.NumberFormat("en-US");
const baths = (n: number) =>
  Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/0$/, "");

function LotCard({ lot: l, eager }: { lot: Lot; eager: boolean }) {
  const b = l.building;
  const change = l.value?.change;
  return (
    <li className="shrink-0 snap-start" style={{ width: "var(--card-w)" }}>
      <Link
        href={`/report?q=${encodeURIComponent(l.input)}`}
        className="group block h-full overflow-hidden rounded-[20px] bg-[var(--field-input)] transition-colors duration-[var(--t-hover)] hover:bg-[var(--paper-2)] focus-visible:outline-offset-4"
      >
        <div className="relative aspect-[4/3] overflow-hidden bg-[var(--paper-2)]">
          <Image
            src={l.photo}
            alt={`Aerial photo of ${titleCase(l.address)}, with its lot line drawn`}
            fill
            sizes="340px"
            loading={eager ? "eager" : "lazy"}
            className="object-cover transition-transform duration-700 ease-[var(--ease-out)] group-hover:scale-[1.04]"
          />
          {/* The lot lines, drawn in the photo's own coordinates so they scale with it. */}
          <svg
            viewBox={`0 0 ${PHOTO.w} ${PHOTO.h}`}
            preserveAspectRatio="xMidYMid slice"
            className="absolute inset-0 size-full transition-transform duration-700 ease-[var(--ease-out)] group-hover:scale-[1.04]"
            aria-hidden
          >
            {l.outline.neighbours.map((d, i) => (
              <path
                key={i}
                d={d}
                fill="none"
                stroke="#f2f1eb"
                strokeOpacity="0.4"
                strokeWidth="1"
                vectorEffect="non-scaling-stroke"
              />
            ))}
            <path
              d={l.outline.subject}
              fill="#0f6e4e"
              fillOpacity="0.18"
              stroke="#1c1c1c"
              strokeOpacity="0.55"
              strokeWidth="6"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
            <path
              d={l.outline.subject}
              fill="none"
              stroke="#f2f1eb"
              strokeWidth="2.5"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
          <span className="absolute bottom-2.5 left-2.5 rounded-full bg-[var(--ink)]/70 px-2.5 py-0.5 text-[11px] text-[var(--paper)]">
            Aerial © King County
          </span>
        </div>

        <div className="flex flex-col gap-4 px-5 pt-5 pb-5">
          <div>
            <p className="truncate name">{titleCase(l.address)}</p>
            <p className="text-[var(--muted)]">
              {l.city}, WA {l.zip}
            </p>
          </div>

          <div>
            <p className="flex flex-wrap items-baseline gap-x-3">
              <span className="name text-[2.25rem] leading-none tracking-[-0.03em] tabular-nums">
                {l.value ? money(l.value.total) : "No value"}
              </span>
              {change ? (
                <span className="text-[var(--muted)] tabular-nums">
                  {change > 0 ? "↑" : "↓"} {Math.abs(change * 100).toFixed(1)}%
                </span>
              ) : null}
            </p>
            <p className="name mt-1.5 text-[var(--accent)]">
              {l.value
                ? `County assessed value, ${l.value.year}`
                : "The assessor lists no value"}
            </p>
          </div>

          <div className="text-[var(--muted)]">
            <p>
              {l.use || "Property"}
              {b?.yearBuilt ? `, built ${b.yearBuilt}` : ""}
            </p>
            <p className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
              {b?.bedrooms ? <Fact n={String(b.bedrooms)} unit="bed" /> : null}
              {b?.baths ? <Fact n={baths(b.baths)} unit="bath" /> : null}
              {b?.livingSqFt ? (
                <Fact n={int.format(b.livingSqFt)} unit="sq ft" />
              ) : null}
              {!b && l.landSqFt ? (
                <Fact n={int.format(l.landSqFt)} unit="sq ft lot" />
              ) : null}
              {!b ? <Fact n={l.zoning} unit="zoning" /> : null}
            </p>
          </div>

          <p className="t-small flex flex-wrap justify-between gap-x-3 border-t border-[var(--paper-2)] pt-3 text-[var(--muted)] group-hover:border-[var(--field-input)]">
            <span>
              {l.sale
                ? `Last sold ${money(l.sale.price)}, ${monthYear(l.sale.date)}`
                : "No sale price on record"}
            </span>
            <span>{parcel(l.pin)}</span>
          </p>
        </div>
      </Link>
    </li>
  );
}

function Fact({ n, unit }: { n: string; unit: string }) {
  return (
    <span className="whitespace-nowrap">
      <span className="tabular-nums text-[var(--ink)]">{n}</span> {unit}
    </span>
  );
}
