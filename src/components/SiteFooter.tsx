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
          <Link className="link" href="/#tinyfish">
            How TinyFish is used
          </Link>
          <a className="link" href="/api/dossier?q=1600%20E%20Olive%20Way%2C%20Seattle">
            JSON API
          </a>
        </nav>
        <p className="max-w-[30ch]">
          Lot &amp; Block covers King County, Washington. Built for TinyFish Student Bounty Drop 002.
        </p>
      </div>
      <div className="relative px-[var(--pad)] pb-8">
        <p className="t-mark" aria-label="Lot and Block">
          Lot &amp; Block
        </p>
        <p className="t-small mt-6 max-w-[120ch]">
          Records belong to the agencies that publish them. Check the linked source before relying on any record.
          Photos from Wikimedia Commons (none shows a property from a report):{" "}
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
