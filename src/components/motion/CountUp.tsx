"use client";

import { useEffect, useRef, useState } from "react";

/** Counts up to a real figure once, when it scrolls into view. Without JS it's just the number. */
export function CountUp({ value, prefix = "", duration = 1400 }: { value: number; prefix?: string; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [shown, setShown] = useState<number | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const t0 = performance.now();
      const tick = (now: number) => {
        const t = Math.min(1, (now - t0) / duration);
        setShown(Math.round(value * (1 - (1 - t) ** 4))); // ease-out: fast start, gentle landing
        if (t < 1) raf = requestAnimationFrame(tick);
      };
      setShown(0);
      raf = requestAnimationFrame(tick);
    });
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [value, duration]);

  return (
    <span ref={ref} aria-label={`${prefix}${value.toLocaleString("en-US")}`}>
      <span aria-hidden>
        {prefix}
        {(shown ?? value).toLocaleString("en-US")}
      </span>
    </span>
  );
}
