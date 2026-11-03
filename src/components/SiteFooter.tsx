import Image from "next/image";
import Link from "next/link";
import { ARCHIVE } from "@/lib/archive";

/** The footer is the page's last photograph, with the name across its foot. */
export function SiteFooter() {
  const credits = Object.values(ARCHIVE);
  return (
    <div className="relative flex h-full flex-col justify-between overflow-hidden text-[var(--paper)]">
      <Image
        src={ARCHIVE["gravel-street-1910"].src}
        alt="Houses above a gravel street in Seattle, about 1910"
        fill
        sizes="100vw"
        className="object-cover"
        style={{ filter: "brightness(0.62)" }}
      />
      <div className="relative flex flex-wrap justify-between gap-8 px-[var(--pad)] pt-8">
        <nav className="flex flex-col gap-1" aria-label="Footer">
          <Link className="link" href="/">
            Look up an address
          </Link>
          <Link className="link" href="/#tools">
            How TinyFish is used
          </Link>
          <a className="link" href="/api/dossier?q=1600%20E%20Olive%20Way%2C%20Seattle">
            JSON API
          </a>
        </nav>
        <p className="max-w-[30ch]">
          lotnblock · King County, Washington. Built for TinyFish Student Bounty Drop 002. Records are read live
          with TinyFish.
        </p>
      </div>
      <div className="relative px-[var(--pad)] pb-8">
        <p className="t-mark" aria-label="Lot and Block">
          Lot &amp; Block
        </p>
        <p className="t-small mt-6 max-w-[120ch]">
          Records belong to the offices that publish them; confirm anything you&apos;ll sign against the linked
          source. Photographs via Wikimedia Commons, none of them a property in a dossier:{" "}
          {credits.map((c, i) => (
            <span key={c.src}>
              <a className="underline" href={c.page}>
                {c.title}
              </a>
              {c.creator ? ` by ${c.creator.replace(/^Unknown author.*/, "unknown")}` : ""} ({c.license})
              {i < credits.length - 1 ? "; " : "."}
            </span>
          ))}
        </p>
      </div>
    </div>
  );
}
