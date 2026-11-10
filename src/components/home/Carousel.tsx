"use client";

import { useEffect, useRef, useState } from "react";

/**
 * A row of cards that scrolls sideways, with its heading and its previous/next buttons on one
 * line above it. Swipe and trackpad work on their own; the buttons move by a screenful and go
 * quiet at either end. The row runs to the window's edge and its first card sits on the column.
 */
export function Carousel({
  heading,
  label,
  children,
}: {
  heading: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
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
    const card = (ul.querySelector("li")?.getBoundingClientRect().width ?? 320) + 20;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    ul.scrollBy({
      left: dir * Math.max(card, Math.floor((ul.clientWidth * 0.8) / card) * card),
      behavior: reduce ? "auto" : "smooth",
    });
  };

  return (
    <div style={{ ["--inset" as string]: "max(var(--pad), calc((100vw - 1280px) / 2 + var(--pad)))" }}>
      <div className="mx-auto flex w-full max-w-[1280px] items-end justify-between gap-8 px-[var(--pad)]">
        <div className="min-w-0">{heading}</div>
        <div className="hidden shrink-0 gap-2 md:flex">
          <Arrow dir={-1} off={edge.start} onClick={() => move(-1)} />
          <Arrow dir={1} off={edge.end} onClick={() => move(1)} />
        </div>
      </div>
      <ul
        ref={el}
        aria-label={label}
        className="no-scrollbar mt-8 flex snap-x snap-mandatory scroll-px-[var(--inset)] gap-5 overflow-x-auto overflow-y-hidden overscroll-x-contain px-[var(--inset)] py-2"
      >
        {children}
      </ul>
    </div>
  );
}

function Arrow({ dir, off, onClick }: { dir: 1 | -1; off: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={off}
      aria-label={dir === 1 ? "Next homes" : "Previous homes"}
      className="press grid size-12 cursor-pointer place-items-center rounded-full bg-white text-[var(--ink)] transition-[background-color,color,opacity] duration-[var(--t-hover)] hover:bg-[var(--ink)] hover:text-white disabled:cursor-default disabled:opacity-35 disabled:hover:bg-white disabled:hover:text-[var(--ink)]"
    >
      <svg viewBox="0 0 24 24" className={`size-5 ${dir === -1 ? "rotate-180" : ""}`} aria-hidden>
        <path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}
