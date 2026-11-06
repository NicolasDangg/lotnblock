"use client";

import { useEffect, useRef, useState } from "react";

/**
 * A row that scrolls sideways: swipe or trackpad on its own, plus previous/next buttons that move
 * by one screenful and hide at either end. Snap points keep a card's left edge on the column.
 */
export function ScrollRow({ children, label }: { children: React.ReactNode; label: string }) {
  const el = useRef<HTMLUListElement>(null);
  const [edge, setEdge] = useState({ start: true, end: false });

  useEffect(() => {
    const ul = el.current;
    if (!ul) return;
    const update = () =>
      setEdge({ start: ul.scrollLeft < 8, end: ul.scrollLeft + ul.clientWidth >= ul.scrollWidth - 8 });
    update();
    ul.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(ul);
    return () => {
      ul.removeEventListener("scroll", update);
      ro.disconnect();
    };
  }, []);

  const move = (dir: 1 | -1) => {
    const ul = el.current;
    if (!ul) return;
    const card = ul.querySelector("li")?.getBoundingClientRect().width ?? 320;
    const step = Math.max(card, Math.floor(ul.clientWidth / (card + 12)) * (card + 12));
    ul.scrollBy({ left: dir * step, behavior: "smooth" });
  };

  return (
    <div className="relative">
      <ul
        ref={el}
        aria-label={label}
        className="no-scrollbar flex snap-x snap-mandatory scroll-px-[var(--row-inset)] gap-[var(--gap)] overflow-x-auto overscroll-x-contain px-[var(--row-inset)] pb-6"
      >
        {children}
      </ul>
      <Arrow dir={-1} hidden={edge.start} onClick={() => move(-1)} />
      <Arrow dir={1} hidden={edge.end} onClick={() => move(1)} />
    </div>
  );
}

function Arrow({ dir, hidden, onClick }: { dir: 1 | -1; hidden: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={dir === 1 ? "Next lots" : "Previous lots"}
      tabIndex={hidden ? -1 : 0}
      className={`press absolute top-[calc((var(--card-w)*0.75)/2)] z-10 hidden size-14 -translate-y-1/2 items-center justify-center rounded-full bg-[var(--ink)] shadow-[0_6px_20px_rgba(28,28,28,0.3)] text-[var(--paper)] transition-opacity duration-[var(--t-hover)] hover:bg-[var(--accent)] md:flex ${
        dir === 1 ? "right-[calc(var(--row-inset)-28px)]" : "left-[calc(var(--row-inset)-28px)]"
      } ${hidden ? "pointer-events-none opacity-0" : "opacity-100"}`}
    >
      <svg viewBox="0 0 24 24" className={`size-6 ${dir === -1 ? "rotate-180" : ""}`} aria-hidden>
        <path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" />
      </svg>
    </button>
  );
}
