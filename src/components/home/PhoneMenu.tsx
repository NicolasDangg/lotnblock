"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

/**
 * The phone's navigation: one button in the bar that opens a white sheet under it with the page's
 * links at thumb size. Closes on a choice, on Escape and when the window grows past phone width.
 */
export function PhoneMenu({ links, action }: { links: { href: string; label: string }[]; action: { href: string; label: string } }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const wide = window.matchMedia("(min-width: 768px)");
    const onWide = () => wide.matches && setOpen(false);
    window.addEventListener("keydown", onKey);
    wide.addEventListener("change", onWide);
    return () => {
      window.removeEventListener("keydown", onKey);
      wide.removeEventListener("change", onWide);
    };
  }, [open]);

  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="phone-menu"
        onClick={() => setOpen((o) => !o)}
        className="press -mr-2 flex min-h-11 cursor-pointer items-center gap-2.5 rounded-full px-3 font-medium"
      >
        {open ? "Close" : "Menu"}
        <svg viewBox="0 0 24 24" className="size-6" aria-hidden>
          <path
            d={open ? "M6 6l12 12M18 6L6 18" : "M4 8h16M4 16h16"}
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
        </svg>
      </button>
      {open ? (
        <nav id="phone-menu" aria-label="Main" className="arrive absolute inset-x-0 top-full bg-white px-[var(--pad)] pt-2 pb-6">
          <ul className="flex flex-col">
            {links.map((l) => (
              <li key={l.href}>
                <a href={l.href} onClick={() => setOpen(false)} className="t-lead d-strong flex min-h-14 items-center">
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
          <Link href={action.href} onClick={() => setOpen(false)} className="btn btn-ink mt-4 w-full">
            {action.label}
          </Link>
        </nav>
      ) : null}
    </div>
  );
}
