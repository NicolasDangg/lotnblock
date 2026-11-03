"use client";

import { useEffect, useRef, useState } from "react";
import { Pole } from "@/components/Pole";
import { animateSpring, rubberband } from "@/lib/spring";

/**
 * A curtain footer. The page scrolls up off a footer fixed underneath it:
 * - a snap point at half height catches the reveal with the name and half the photograph showing;
 * - the next snap shows all of it;
 * - scrolling past the end stretches the footer up (Apple's rubber band, more resistance the
 *   further you pull) to show what's underneath, and on release a slightly bouncy spring settles it.
 */
export function ElasticFooter({ children }: { children: React.ReactNode }) {
  const footer = useRef<HTMLElement>(null);
  const spacer = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);

  // The fixed layers only exist on screen while the curtain is lifting, not behind the whole page.
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => setNear(e.isIntersecting), { rootMargin: "0px 0px 20% 0px" });
    if (spacer.current) io.observe(spacer.current);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let over = 0; // raw overscroll distance the user has "pulled"
    let shown = 0; // what's on screen after the rubber band
    let stop: (() => void) | null = null;
    let timer = 0;
    let touchY: number | null = null;
    let lastMove = { y: 0, t: 0, v: 0 };

    const set = (y: number) => {
      shown = y;
      if (footer.current) footer.current.style.transform = `translate3d(0, ${-y}px, 0)`;
    };
    const atBottom = () => window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
    const pull = (delta: number) => {
      stop?.();
      stop = null;
      over = Math.max(0, over + delta);
      set(rubberband(over, window.innerHeight));
    };
    const release = (velocity = 0) => {
      over = 0;
      stop = animateSpring(shown, 0, set, { damping: 0.72, response: 0.42 }, -velocity);
    };

    const onWheel = (e: WheelEvent) => {
      if ((atBottom() && e.deltaY > 0) || over > 0) {
        e.preventDefault();
        pull(e.deltaY);
        clearTimeout(timer);
        timer = window.setTimeout(() => release(), 110);
      }
    };
    const onTouchStart = (e: TouchEvent) => {
      touchY = e.touches[0].clientY;
      lastMove = { y: touchY, t: performance.now(), v: 0 };
    };
    const onTouchMove = (e: TouchEvent) => {
      if (touchY == null) return;
      const y = e.touches[0].clientY;
      const delta = touchY - y; // finger moving up = scrolling down
      touchY = y;
      const now = performance.now();
      lastMove = { y, t: now, v: ((lastMove.y - y) / Math.max(1, now - lastMove.t)) * 1000 };
      if ((atBottom() && delta > 0) || over > 0) {
        e.preventDefault();
        pull(delta);
      }
    };
    const onTouchEnd = () => {
      touchY = null;
      if (over > 0) release(Math.max(0, lastMove.v) * 0.3);
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onTouchEnd);
    return () => {
      stop?.();
      clearTimeout(timer);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, []);

  return (
    <div ref={spacer} className="relative h-svh">
      {/* Snap points: half revealed, then fully revealed. */}
      <div aria-hidden className="snap-end pointer-events-none absolute inset-x-0 top-0 h-[55svh]" />
      <div aria-hidden className="snap-end pointer-events-none absolute inset-0" />

      {/* What the stretch uncovers. */}
      <div
        aria-hidden
        className={`fixed inset-x-0 bottom-0 -z-10 flex h-svh flex-col justify-end bg-[var(--ink)] text-[var(--paper)] ${near ? "" : "invisible"}`}
      >
        {/* Centred in the band the stretch can uncover (it never exceeds ~55% of the screen). */}
        <div className="flex h-[52svh] flex-col items-center justify-center px-[var(--pad)] text-center">
          <p className="t-head">Oops, you&apos;ve scrolled past the end</p>
          <p className="t-lead mt-3 text-[var(--field-sage)]">Let go and it springs back.</p>
        </div>
        <p className="t-lead px-[var(--pad)] pb-6">End of the record.</p>
        <div className="bg-[var(--paper)]">
          <Pole bars={80} />
        </div>
      </div>

      <footer
        ref={footer}
        className={`fixed inset-x-0 bottom-0 z-0 h-svh will-change-transform ${near ? "" : "invisible"}`}
      >
        {children}
      </footer>
    </div>
  );
}
