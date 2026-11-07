import Image from "next/image";
import Link from "next/link";
import { ARCHIVE } from "@/lib/archive";

/**
 * The curtain footer: the page's last photograph, with the name across its foot.
 */
export function SiteFooter() {
  const credits = Object.values(ARCHIVE);
  return (
    <div className="relative flex h-full flex-col justify-between overflow-hidden bg-[var(--ink)] text-[var(--paper)]">
      <Image
        src={ARCHIVE["gravel-street-1910"].src}
        alt="Houses above a gravel street in Seattle, about 1910"
        fill
        sizes="100vw"
        className="object-cover"
        style={{ filter: "grayscale(1) brightness(0.55)" }}
      />
      <div className="relative flex flex-wrap items-start justify-between gap-x-12 gap-y-8 px-[var(--pad)] pt-8">
        <nav className="flex flex-col gap-1" aria-label="Footer">
          <Link className="link" href="/">
            Look up an address
          </Link>
          <Link className="link" href="/#tinyfish">
            How the records are read
          </Link>
          <a className="link" href="/api/dossier?q=1600%20E%20Olive%20Way%2C%20Seattle">
            JSON API
          </a>
        </nav>
        <p className="max-w-[30ch]">Lot &amp; Block covers King County, Washington.</p>
      </div>

      <div className="relative">
        <div className="px-[var(--pad)] pt-8 pb-6">
          <p className="t-mark" aria-label="Lot and Block">
            Lot &amp; Block
          </p>
          <p className="t-small mt-6 max-w-[120ch] opacity-90">
            Records belong to the agencies that publish them. Check the linked source before relying on any record. Built
            with TinyFish for the Student Bounty Drop 002. Photos from Wikimedia Commons (none shows a property from a
            report):{" "}
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
    </div>
  );
}
