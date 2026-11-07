import Image from "next/image";
import saved from "@/data/lots.json";
import { AddressForm } from "@/components/AddressForm";
import { titleCase } from "@/components/report/format";
import { PHOTO, type Lot } from "@/lib/lots";

const LOT = (saved as Lot[])[0];

/**
 * The last call to action: the search on the brand green, beside one real aerial of a King County
 * lot with its lot line drawn. One picture, one heading, one input; nothing else.
 */
export function ClosingPanel() {
  return (
    <section className="px-[var(--gap)] pt-[var(--gap)] pb-[var(--gap)]" aria-labelledby="end-title">
      <div
        className="relative grid overflow-hidden rounded-[28px] text-[var(--accent-ink)] md:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]"
        style={{ background: "linear-gradient(135deg, #12805c 0%, var(--accent) 45%, #0a5039 100%)" }} // taste-skill-ignore: tonal ramp of the brand green
      >
        <div className="flex flex-col justify-center px-[var(--pad)] py-[clamp(56px,7vw,112px)]">
          <h2 id="end-title" className="t-head max-w-[12ch]" data-reveal>
            Look up a King County address
          </h2>
          <div className="mt-10 max-w-[560px]" data-reveal style={{ ["--i" as string]: 1 }}>
            <AddressForm variant="hero" id="q-end" />
          </div>
        </div>

        {LOT ? (
          <div className="relative min-h-[300px] md:min-h-[480px]" aria-hidden={false}>
            <Image
              src={LOT.photo}
              alt={`Aerial photo of ${titleCase(LOT.address)}, ${LOT.city}, with its lot line drawn`}
              fill
              sizes="(min-width: 768px) 45vw, 100vw"
              className="object-cover"
            />
            <svg
              viewBox={`0 0 ${PHOTO.w} ${PHOTO.h}`}
              preserveAspectRatio="xMidYMid slice"
              className="absolute inset-0 size-full"
              aria-hidden
            >
              {LOT.outline.neighbours.map((d, i) => (
                <path key={i} d={d} fill="none" stroke="#f2f1eb" strokeOpacity="0.4" strokeWidth="1" vectorEffect="non-scaling-stroke" />
              ))}
              <path d={LOT.outline.subject} fill="#0f6e4e" fillOpacity="0.2" stroke="#1c1c1c" strokeOpacity="0.55" strokeWidth="6" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
              <path d={LOT.outline.subject} fill="none" stroke="#f2f1eb" strokeWidth="2.5" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
            </svg>
            <span className="absolute bottom-4 left-4 rounded-full bg-[var(--ink)]/70 px-3 py-1 text-[12px] text-[var(--paper)]">
              {titleCase(LOT.address)}, {LOT.city} · Aerial © King County
            </span>
          </div>
        ) : null}
      </div>
    </section>
  );
}
