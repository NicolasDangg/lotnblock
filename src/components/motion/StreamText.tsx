"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Text that streams in character by character while `active`, and runs back out (faster) when it
 * isn't. The full text is laid out invisibly underneath, so nothing reflows while it streams.
 * Screen readers get the whole string at once; reduced motion shows it whole.
 */
export function StreamText({
  text,
  active = true,
  cps = 55,
  caret = true,
  className,
}: {
  text: string;
  active?: boolean;
  /** Characters per second while streaming in. */
  cps?: number;
  caret?: boolean;
  className?: string;
}) {
  const [n, setN] = useState(0);
  const nRef = useRef(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      nRef.current = active ? text.length : 0;
      setN(nRef.current);
      return;
    }
    const target = active ? text.length : 0;
    const rate = active ? cps : cps * 4;
    let raf = 0;
    let last = performance.now();
    let carry = 0;
    const tick = (now: number) => {
      carry += ((now - last) / 1000) * rate;
      last = now;
      const stepBy = Math.floor(carry);
      if (stepBy > 0) {
        carry -= stepBy;
        const cur = nRef.current;
        nRef.current = cur < target ? Math.min(target, cur + stepBy) : Math.max(target, cur - stepBy);
        setN(nRef.current);
      }
      if (nRef.current !== target) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, text, cps]);

  const streaming = n > 0 && n < text.length;
  return (
    <span className={`relative block ${className ?? ""}`} aria-label={text} role="text">
      <span aria-hidden className="invisible">
        {text}
      </span>
      <span aria-hidden className="absolute inset-0">
        {text.slice(0, n)}
        {caret && (streaming || (active && n === text.length)) ? <span className="caret" /> : null}
      </span>
    </span>
  );
}
