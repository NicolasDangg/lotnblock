import Link from "next/link";
import { ARCHIVE } from "@/lib/archive";
import { EXAMPLE_ADDRESS } from "@/lib/example";

const q = encodeURIComponent(EXAMPLE_ADDRESS);

/** The close: four plain columns on the ink ground, then the name at full width, then the credits. */
export function Footer() {
  const credits = Object.values(ARCHIVE);
  return (
    <footer className="bg-[var(--ink)] text-[var(--paper)]">
      <div className="mx-auto w-full max-w-[1280px] px-[var(--pad)] pt-16 pb-10">
        <div className="grid grid-cols-2 gap-x-8 gap-y-12 md:grid-cols-4">
          <div>
            <p className="d-strong">Coverage</p>
            <p className="mt-3 max-w-[24ch]">Any address or parcel in King County, Washington.</p>
          </div>
          <nav aria-label="Footer">
            <p className="d-strong">Look up</p>
            <ul className="mt-3 flex flex-col gap-2">
              <li>
                <Link className="link" href="/#top">
                  Search an address
                </Link>
              </li>
              <li>
                <Link className="link" href={`/report?q=${q}`}>
                  Example report
                </Link>
              </li>
              <li>
                <a className="link" href={`/api/dossier?q=${q}`}>
                  JSON API
                </a>
              </li>
            </ul>
          </nav>
          <nav aria-label="On this page">
            <p className="d-strong">On this page</p>
            <ul className="mt-3 flex flex-col gap-2">
              <li>
                <a className="link" href="#report">
                  What&apos;s in a report
                </a>
              </li>
              <li>
                <a className="link" href="#gaps">
                  Accuracy
                </a>
              </li>
              <li>
                <a className="link" href="#how">
                  How it works
                </a>
              </li>
            </ul>
          </nav>
          <div>
            <p className="d-strong">Built with TinyFish</p>
            <p className="mt-3 max-w-[26ch]">Made for the TinyFish Student Bounty Drop 002.</p>
          </div>
        </div>

        <p className="t-mark mt-[clamp(72px,10vw,150px)] -ml-[0.04em] text-[length:min(calc((100vw_-_2_*_var(--pad))_/_4.56),256px)]" aria-label="Lot and Block">
          Lot &amp; Block
        </p>

        <p className="t-small mt-8 max-w-[70ch]">
          Records belong to the agencies that publish them. Check the linked source before relying on any record.
        </p>
        <details className="t-small mt-3 max-w-[130ch]">
          <summary className="flex min-h-11 w-fit cursor-pointer items-center underline underline-offset-2">
            Photo credits ({credits.length})
          </summary>
          <p className="mt-2">
            Photographs from Wikimedia Commons, and none shows a property from a report:{" "}
            {credits.map((c, i) => (
              <span key={c.src}>
                <a className="underline underline-offset-2" href={c.page}>
                  {c.title}
                </a>
                {c.creator ? ` by ${c.creator.replace(/^Unknown author.*/, "unknown")}` : ""} ({c.license})
                {i < credits.length - 1 ? "; " : "."}
              </span>
            ))}
          </p>
        </details>
      </div>
    </footer>
  );
}
