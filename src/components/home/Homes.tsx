import Image from "next/image";
import Link from "next/link";
import saved from "@/data/lots.json";
import { money, parcel, titleCase } from "@/components/report/format";
import { monthYear } from "@/lib/highlights";
import { PHOTO, type Lot } from "@/lib/lots";
import { Carousel } from "./Carousel";

// Saved by `npm run lots`: the county is read once, ahead of time, so the row renders instantly.
export const LOTS = saved as Lot[];

const readOn = LOTS.length
  ? new Date(LOTS.map((l) => l.retrievedAt).sort()[0]).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      timeZone: "America/Los_Angeles",
    })
  : null;

const int = new Intl.NumberFormat("en-US");
const baths = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/0$/, ""));

/** The county's aerial of one lot with its lot line drawn in the photo's own coordinates. */
export function LotPhoto({ lot: l, sizes, eager }: { lot: Lot; sizes: string; eager?: boolean }) {
  return (
    <>
      <Image
        src={l.photo}
        alt={`Aerial photo of ${titleCase(l.address)}, ${l.city}, with its lot line drawn`}
        fill
        sizes={sizes}
        loading={eager ? "eager" : "lazy"}
        className="object-cover"
      />
      <svg viewBox={`0 0 ${PHOTO.w} ${PHOTO.h}`} preserveAspectRatio="xMidYMid slice" className="absolute inset-0 size-full" aria-hidden>
        <path d={l.outline.subject} fill="#0f6e4e" fillOpacity="0.2" stroke="#121413" strokeOpacity="0.55" strokeWidth="6" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        <path d={l.outline.subject} fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      </svg>
    </>
  );
}

/** "Homes around King County": real lots set out like listings, the county's value where a price would be. */
export function Homes() {
  if (!LOTS.length) return null;
  return (
    <section id="homes" className="scroll-mt-20 py-[var(--band)]" aria-labelledby="homes-title">
      <Carousel
        label="Homes around King County"
        heading={
          <>
            <h2 id="homes-title" className="d-title" data-reveal>
              Homes around King County
            </h2>
            <p className="mt-5 max-w-[60ch]" data-reveal style={{ ["--i" as string]: 1 }}>
              Real lots, read from the King County Assessor on {readOn}. The figure is the county&apos;s assessed
              value, not an asking price.<span className="max-sm:hidden"> Aerial photos © King County.</span>
            </p>
          </>
        }
      >
        {LOTS.map((l, i) => (
          <HomeCard key={l.pin} lot={l} i={i} />
        ))}
      </Carousel>
      <p className="t-small mx-auto mt-6 w-full max-w-[1280px] px-[var(--pad)] sm:hidden">Swipe for more. Aerial photos © King County.</p>
    </section>
  );
}

function HomeCard({ lot: l, i }: { lot: Lot; i: number }) {
  const b = l.building;
  const change = l.value?.change;
  const facts = b
    ? [
        b.bedrooms ? `${b.bedrooms} bed` : null,
        b.baths ? `${baths(b.baths)} bath` : null,
        b.livingSqFt ? `${int.format(b.livingSqFt)} sq ft` : null,
      ]
    : [l.landSqFt ? `${int.format(l.landSqFt)} sq ft lot` : null, l.zoning ? `Zoned ${l.zoning}` : null];

  return (
    <li
      className="w-[76vw] max-w-[320px] shrink-0 snap-start sm:w-[clamp(264px,23vw,320px)]"
      data-reveal
      style={{ ["--i" as string]: Math.min(i, 4) + 1 }}
    >
      <Link href={`/report?q=${encodeURIComponent(l.input)}`} className="group block rounded-[var(--r)] focus-visible:outline-offset-4">
        <div className="zoom relative aspect-[4/3] overflow-hidden rounded-[var(--r)] bg-[var(--paper-2)]">
          <LotPhoto lot={l} sizes="320px" eager={i < 4} />
          <span className="tag absolute top-3 left-3">
            {l.use || "Property"}
            {b?.yearBuilt ? `, ${b.yearBuilt}` : ""}
          </span>
        </div>

        <p className="mt-4 flex flex-wrap items-baseline gap-x-3">
          <span className="t-lead d-strong tabular-nums">{l.value ? money(l.value.total) : "No value listed"}</span>
          {change ? (
            <span className="tabular-nums">
              {change > 0 ? "up" : "down"} {Math.abs(change * 100).toFixed(1)}%
            </span>
          ) : null}
        </p>
        <p className="mt-1 text-[var(--accent)]">{l.value ? `Assessed value, ${l.value.year}` : "The assessor lists no value"}</p>
        <p className="mt-3">{facts.filter(Boolean).join(" · ")}</p>
        <p className="mt-1 underline-offset-4 group-hover:underline">
          {titleCase(l.address)}, {l.city}, WA {l.zip}
        </p>
        <p className="t-small mt-3 text-[var(--muted)] max-sm:hidden">
          {l.sale ? `Last sold ${money(l.sale.price)}, ${monthYear(l.sale.date)}` : "No sale price on record"} · Parcel{" "}
          {parcel(l.pin)}
        </p>
      </Link>
    </li>
  );
}
