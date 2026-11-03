"use client";

import { useEffect, useRef, useState } from "react";

/**
 * A pinned chapter: the section is `steps` screens tall and its frame sticks while you scroll
 * through it. Returns which step is showing and the progress through the whole chapter (0–1).
 */
export function usePinned(steps: number) {
  const ref = useRef<HTMLElement>(null);
  const [state, setState] = useState({ step: 0, progress: 0 });

  useEffect(() => {
    let raf = 0;
    const measure = () => {
      raf = 0;
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const travel = r.height - window.innerHeight;
      const progress = Math.min(1, Math.max(0, -r.top / Math.max(1, travel)));
      const step = Math.min(steps - 1, Math.floor(progress * steps * 0.999));
      setState((s) => (s.step === step && Math.abs(s.progress - progress) < 0.002 ? s : { step, progress }));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [steps]);

  return { ref, ...state };
}

/** Snap points, one per step, so a flick lands on a step instead of flying past the chapter. */
export function PinMarkers({ steps }: { steps: number }) {
  return (
    <>
      {Array.from({ length: steps }, (_, i) => (
        <div
          key={i}
          aria-hidden
          className="snap-start pointer-events-none absolute inset-x-0 h-0"
          style={{ top: `calc(${i} * (100% - 100svh) / ${Math.max(1, steps - 1)})` }}
        />
      ))}
    </>
  );
}
