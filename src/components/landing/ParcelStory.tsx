"use client";

import { useEffect, useRef, useState } from "react";
import { PinMarkers, usePinned } from "@/components/motion/usePinned";
import { StreamText } from "@/components/motion/StreamText";
import { PlatDrawing } from "@/components/report/PlatDrawing";
import { parcel } from "@/components/report/format";
import type { Plat } from "@/lib/plat";
import type { ResolvedProperty } from "@/lib/types";

const STEPS = 3;

/** Pinned chapter: what you type → the standardised address → the parcel, with its lot drawing in. */
export function ParcelStory({ input, property, plat }: { input: string; property: ResolvedProperty | null; plat: Plat | null }) {
  const { ref, step } = usePinned(STEPS);
  // The block draws itself as soon as the chapter arrives, without waiting for the scroll steps.
  const frame = useRef<HTMLDivElement>(null);
  const [entered, setEntered] = useState(false);
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setEntered(true), { threshold: 0.35 });
    if (frame.current) io.observe(frame.current);
    return () => io.disconnect();
  }, []);
  if (!property) return null;

  const lines = [
    { who: "You type", text: input },
    { who: "Standardised, then matched to King County's address points", text: `${property.address}, ${property.city.toUpperCase()} WA ${property.zip}` },
    { who: "The parcel every other office files it under", text: parcel(property.pin) },
  ];

  return (
    <section ref={ref} className="relative" style={{ height: `${STEPS * 100}svh` }} aria-labelledby="parcel-title">
      <PinMarkers steps={STEPS} />
      <div className="sticky top-0 grid h-svh grid-cols-[minmax(0,1fr)] gap-[var(--gap)] p-[var(--gap)] md:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        <div className="flex flex-col justify-between bg-[var(--field-slate)] px-[var(--pad)] py-10 md:py-14">
          <h2 id="parcel-title" className="t-head max-w-[13ch]">
            One address in, one parcel out
          </h2>
          <ol className="flex flex-col gap-7">
            {lines.map((l, i) => (
              <li
                key={l.who}
                className="transition-opacity duration-500"
                style={{ opacity: i <= step ? 1 : 0.32 }}
                aria-current={i === step ? "step" : undefined}
              >
                <p className="t-small text-[var(--muted)]">{l.who}</p>
                <StreamText
                  text={l.text}
                  active={i <= step}
                  caret={i === step}
                  cps={i === 2 ? 18 : 40}
                  className={i === 2 ? "t-head name mt-1" : "t-lead mt-1"}
                />
              </li>
            ))}
          </ol>
        </div>
        <div ref={frame} className="relative hidden overflow-hidden bg-[var(--field-blush)] md:block">
          {plat ? (
            <div
              className="absolute inset-0 p-8 transition-transform duration-[1200ms] ease-[var(--ease-out)]"
              style={{ transform: `scale(${step === 2 ? 1.18 : 1})` }}
            >
              <PlatDrawing
                plat={plat}
                drawn={entered ? 1 : 0}
                staggerMs={28}
                label={`Lot outlines around ${property.address}, the parcel filled in olive`}
              />
            </div>
          ) : (
            <p className="t-small muted p-8">King County&apos;s parcel map didn&apos;t answer, so there&apos;s no drawing.</p>
          )}
          <p className="t-small absolute bottom-0 left-0 bg-[var(--paper)] px-4 py-3">
            Drawn from King County&apos;s parcel map: {plat ? plat.neighbours.length + 1 : 0} lots around {property.address}
          </p>
        </div>
      </div>
    </section>
  );
}
