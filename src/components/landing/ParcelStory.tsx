"use client";

import { useEffect, useRef, useState } from "react";
import { StreamText } from "@/components/motion/StreamText";
import { PlatDrawing } from "@/components/report/PlatDrawing";
import { parcel } from "@/components/report/format";
import type { Plat } from "@/lib/plat";
import type { ResolvedProperty } from "@/lib/types";

/** When each line starts streaming after the section arrives, in ms. */
const STEP_AT = [0, 1500, 3300];

/**
 * What you type → the standardised address → the parcel. When the section arrives, the three lines
 * stream in one after another while the block draws itself beside them. No scrolling required.
 */
export function ParcelStory({ input, property, plat }: { input: string; property: ResolvedProperty | null; plat: Plat | null }) {
  const root = useRef<HTMLElement>(null);
  const [entered, setEntered] = useState(false);
  const [step, setStep] = useState(-1);

  useEffect(() => {
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        setEntered(true);
      },
      { threshold: 0.3 },
    );
    if (root.current) io.observe(root.current);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!entered) return;
    // Reduced motion: everything arrives at once.
    const instant = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timers = STEP_AT.map((at, i) => window.setTimeout(() => setStep(i), instant ? 0 : at));
    return () => timers.forEach(clearTimeout);
  }, [entered]);

  if (!property) return null;

  const lines = [
    { who: "What you type", text: input },
    { who: "Matched to King County's address list", text: `${property.address}, ${property.city.toUpperCase()} WA ${property.zip}` },
    { who: "The parcel number other agencies use", text: parcel(property.pin) },
  ];

  return (
    <section
      ref={root}
      className="grid grid-cols-[minmax(0,1fr)] items-center gap-x-[var(--pad)] gap-y-10 md:grid-cols-[minmax(0,6fr)_minmax(0,5fr)]"
      aria-labelledby="parcel-title"
    >
      <div className="flex flex-col gap-12">
        <h2 id="parcel-title" className="t-head max-w-[15ch]" data-reveal>
          First, we find the parcel
        </h2>
        <ol className="flex flex-col gap-12">
          {lines.map((l, i) => (
            <li
              key={l.who}
              className="transition-opacity duration-500"
              style={{ opacity: i <= step ? 1 : 0.32 }}
              aria-current={i === step ? "step" : undefined}
            >
              <StreamText
                text={l.text}
                active={i <= step}
                caret={i === step}
                cps={i === 2 ? 18 : 40}
                className={i === 2 ? "t-lead name" : "t-lead"}
              />
              <p className="t-small mt-1 text-[var(--muted)]">{l.who}</p>
            </li>
          ))}
        </ol>
      </div>
      <div className="relative aspect-square overflow-hidden bg-[var(--field-blush)]">
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
          Lot outlines from King County&apos;s parcel map
        </p>
      </div>
    </section>
  );
}
