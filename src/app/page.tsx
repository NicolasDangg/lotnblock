import Image from "next/image";
import Link from "next/link";
import { Answers, type Answer } from "@/components/home/Answers";
import { Footer } from "@/components/home/Footer";
import { Homes, LOTS, LotPhoto } from "@/components/home/Homes";
import { PhoneMenu } from "@/components/home/PhoneMenu";
import { Search } from "@/components/home/Search";
import { Tools } from "@/components/home/Tools";
import { Gap, Notice, Receipt } from "@/components/report/Receipt";
import { titleCase } from "@/components/report/format";
import { ARCHIVE } from "@/lib/archive";
import { EXAMPLE_ADDRESS, getExample, type Example } from "@/lib/example";
import { SOURCES } from "@/lib/sources";
import { toolSteps } from "@/lib/tools";
import type { Section } from "@/lib/types";

const exampleHref = `/report?q=${encodeURIComponent(EXAMPLE_ADDRESS)}`;
const jsonHref = `/api/dossier?q=${encodeURIComponent(EXAMPLE_ADDRESS)}`;

/** The page's one column: every section's text starts on the same left edge. */
const COL = "mx-auto w-full max-w-[1280px] px-[var(--pad)]";

type Photo = keyof typeof ARCHIVE;

/**
 * One tile per official source, the way a listings site sets out its categories: what the source
 * answers, a photograph from that source's world, and where in the example report it lands.
 */
const TILE: Record<string, { label: string; photo: Photo; alt: string; anchor: string }> = {
  assessor: {
    label: "Value and sales",
    photo: "highland-drive-2007",
    alt: "A white house with tall columns behind clipped hedges on Highland Drive, Seattle",
    anchor: "value",
  },
  districts: {
    label: "Hazards",
    photo: "fremont-olympics-2015",
    alt: "A steep residential street in Fremont, Seattle, looking down to the water and the Olympic Mountains",
    anchor: "hazards",
  },
  flood: {
    label: "Flood zone",
    photo: "snoqualmie-river",
    alt: "The Snoqualmie River running fast between dark firs, with sun through the mist",
    anchor: "flood",
  },
  schools: {
    label: "Schools",
    photo: "queen-anne-school",
    alt: "The red brick West Queen Anne Public School building, Seattle, across a lawn",
    anchor: "schools",
  },
  treasurer: {
    label: "Tax bills",
    photo: "county-courthouse",
    alt: "The King County Courthouse and Administration Building in Seattle, with autumn trees",
    anchor: "taxes",
  },
  permits: {
    label: "City permits",
    photo: "craftsman-revival-2009",
    alt: "Three newly built Craftsman-style houses on a Seattle street, one with a builder's sign",
    anchor: "city-permits",
  },
  violations: {
    label: "Code complaints",
    photo: "municipal-tower",
    alt: "Seattle Municipal Tower, the city's office tower, seen from the street against a blue sky",
    anchor: "city-complaints",
  },
};

const LEVEL = { county: "County record", city: "City record", federal: "Federal record", district: "District record" };

const NAV = [
  { href: "#homes", label: "Example homes" },
  { href: "#report", label: "What's in a report" },
  { href: "#gaps", label: "Accuracy" },
  { href: "#how", label: "How it works" },
];

const COUNT = ["No", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten"];

const QUESTIONS = [
  {
    q: "Which addresses can I look up?",
    a: "Any street address or parcel number in King County, Washington. Seattle addresses get permits and code complaints from the city's own portal. For other cities we look for that city's official permit search, and the report says so when one can't be searched.",
  },
  {
    q: "Is the value an asking price?",
    a: "No. It is the King County Assessor's assessed value, the figure property tax is worked out from. It can sit well above or below what a house would sell for, so the report shows it beside the recorded sales.",
  },
  {
    q: "How current are the records?",
    a: "Each source is read when you search, and every section prints the time it was fetched. Searches that need a real browser, such as city permits and tax bills, are kept for a day before they are run again.",
  },
  {
    q: "Why is a section of my report empty?",
    a: "Because the source had nothing, couldn't be reached or doesn't cover the address. The report says which of the three it was and links to the page, so you can check it yourself. It never fills a gap with a guess.",
  },
  {
    q: "Can I get the records as data?",
    a: "Yes. Every report is also served as JSON from /api/dossier, with the same sections, statuses and source links as the page.",
  },
];

export default async function Home() {
  const ex = await getExample();
  const live = SOURCES.filter((s) => s.run);
  const names = live.map((s) => s.name);
  const closing = LOTS[0];

  return (
    <div className="home bg-[var(--paper)]">
      <a href="#main" className="btn btn-ink sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50">
        Skip to content
      </a>

      {/* A plain white bar: the name, four links, one action. */}
      <header className="sticky top-0 z-40 bg-white">
        <div className={`${COL} flex min-h-16 items-center justify-between gap-x-8`}>
          <Link href="/" className="t-lead d-strong press">
            Lot &amp; Block
          </Link>
          <nav className="hidden items-center gap-x-8 md:flex" aria-label="Main">
            {NAV.map((l, i) => (
              <a key={l.href} className={`navlink ${i === 0 ? "hidden lg:inline" : ""}`} href={l.href}>
                {l.label}
              </a>
            ))}
            <Link href={exampleHref} className="btn btn-ink min-h-11 px-5">
              Example report
            </Link>
          </nav>
          <PhoneMenu links={NAV} action={{ href: exampleHref, label: "Example report" }} />
        </div>
      </header>

      <main id="main">
        {/* Hero: one photograph edge to edge, the headline and the search on its lower left. */}
        <section id="top" className="relative flex min-h-[min(78svh,860px)] items-end overflow-hidden md:min-h-[min(88svh,860px)]" aria-labelledby="hero-title">
          <Image
            src={ARCHIVE["craftsman-naomi-place-2024"].src}
            alt="A Craftsman bungalow with a red front door and a garden of maples and grasses, in Seattle"
            fill
            preload
            sizes="100vw"
            className="drift object-cover object-[50%_20%]"
          />
          <div aria-hidden className="absolute inset-0 bg-[var(--scrim)]" />
          <div className={`${COL} relative pt-28 pb-12 text-white md:pt-40 md:pb-[clamp(64px,9vw,104px)]`}>
            <h1 id="hero-title" className="d-display">
              <span className="line">
                <span>Records for any</span>
              </span>
              <span className="line">
                <span style={{ ["--l" as string]: 1 }}>King County home</span>
              </span>
            </h1>
            <p className="t-lead mt-6 max-w-[46ch]" data-reveal style={{ ["--i" as string]: 4 }}>
              Value, sales, taxes, permits, flood zone and schools, read live from official government websites
              <span className="max-md:hidden"> and linked to the page each came from</span>.
            </p>
            <div className="mt-7 max-w-[720px] md:mt-9" data-reveal style={{ ["--i" as string]: 5 }}>
              <Search />
            </div>
          </div>
        </section>

        {/* The sources, by name, running off both edges. */}
        <section aria-label="Official sources">
          <div className="overflow-hidden bg-[var(--accent)] py-[clamp(24px,3vw,40px)] text-white">
            <div className="marquee d-title" aria-hidden>
              {[0, 1].map((k) => (
                <div key={k} className="flex shrink-0 items-center">
                  {names.map((n) => (
                    <span key={n} className="flex items-center whitespace-nowrap">
                      {n}
                      <span className="mx-[0.45em] inline-block size-[0.22em] rounded-full bg-current" />
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </div>
          <p className={`${COL} t-lead pt-8`} data-reveal>
            {COUNT[live.length] ?? live.length} official sources are read each time you search
            <span className="max-md:hidden">: {names.join(", ")}</span>.
          </p>
        </section>

        {/* Real lots, set out like listings. */}
        <Homes />

        {/* What a report holds: one tile per source. */}
        <section id="report" className="scroll-mt-20 bg-white py-[var(--band)]" aria-labelledby="report-title">
          <div className={COL}>
            <div className="grid gap-x-12 gap-y-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:items-end">
              <h2 id="report-title" className="d-title" data-reveal>
                What&apos;s in a report
              </h2>
              <p className="max-w-[56ch]" data-reveal style={{ ["--i" as string]: 1 }}>
                Each part comes from the office that keeps the record and carries a link to the page it was read from.
                Pick one to see it in a real report for {EXAMPLE_ADDRESS}.
              </p>
            </div>

            <ul className="mt-8 grid gap-2 sm:mt-12 sm:grid-cols-2 sm:gap-x-5 sm:gap-y-10 lg:grid-cols-4">
              {live.map((s, i) => {
                const t = TILE[s.key];
                if (!t) return null;
                return (
                  <li key={s.key} data-reveal style={{ ["--i" as string]: (i % 4) + 1 }}>
                    <Link href={`${exampleHref}#${t.anchor}`} className={TILE_LINK}>
                      <div className={`zoom bg-[var(--paper-2)] ${TILE_PIC}`}>
                        <Image src={ARCHIVE[t.photo].src} alt={t.alt} fill sizes="(min-width: 1024px) 300px, (min-width: 640px) 50vw, 96px" className="object-cover" />
                        <span className="tag absolute top-3 right-3 max-sm:hidden">{LEVEL[s.level]}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="t-lead d-strong underline-offset-4 group-hover:underline sm:mt-4">{t.label}</h3>
                        <p className="mt-0.5 text-[var(--accent)] sm:mt-1">{s.name}</p>
                        <p className="mt-2 max-sm:hidden">{s.provides}.</p>
                      </div>
                      <Chevron />
                    </Link>
                  </li>
                );
              })}
              <li data-reveal style={{ ["--i" as string]: 4 }}>
                <Link href={exampleHref} className={TILE_LINK}>
                  <div className={`flex flex-col items-center justify-center bg-[var(--accent)] text-white transition-colors duration-[var(--t-hover)] group-hover:bg-[var(--accent-hover)] sm:items-stretch sm:justify-between sm:p-5 ${TILE_PIC}`}>
                    <svg viewBox="0 0 24 24" className="size-9 transition-transform sm:self-end duration-300 ease-[var(--ease-out)] group-hover:translate-x-1 group-hover:-translate-y-1" aria-hidden>
                      <path d="M6 18L18 6M8 6h10v10" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <p className="t-lead d-strong max-w-[12ch] max-sm:hidden">All of it, on one page</p>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="t-lead d-strong underline-offset-4 group-hover:underline sm:mt-4">Example report</h3>
                    <p className="mt-0.5 text-[var(--accent)] sm:mt-1">{EXAMPLE_ADDRESS}</p>
                    <p className="mt-2 max-sm:hidden">A real lookup, run on the live sources when you open it.</p>
                  </div>
                  <Chevron />
                </Link>
              </li>
            </ul>
          </div>
        </section>

        {/* Who reads one, and when. */}
        <section className="py-[var(--band)]" aria-labelledby="who-title">
          <div className={`${COL} grid gap-x-[clamp(32px,6vw,96px)] gap-y-12 md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] md:items-center`}>
            <div className="relative aspect-[4/5] overflow-hidden rounded-[var(--r)] bg-[var(--paper-2)] max-md:order-2 max-md:aspect-[16/9]" data-reveal>
              <Image
                src={ARCHIVE["summit-ave-bungalows-1979"].src}
                alt="A row of small pale bungalows on Summit Avenue, Seattle, in 1979, with a white Volkswagen Beetle parked in front"
                fill
                sizes="(min-width: 768px) 45vw, 100vw"
                className="object-cover"
              />
            </div>
            <div>
              <h2 id="who-title" className="d-title max-w-[12ch]" data-reveal>
                Read it before you sign
              </h2>
              <div className="mt-10 flex flex-col gap-10">
                <Reader title="Buying a house" link="See an example report" href={exampleHref} i={1}>
                  See what the county says the house is worth, what it last sold for, whether the taxes are paid and
                  whether a lender will ask for flood insurance.
                </Reader>
                <Reader title="Renovating or building" link="See the permits in the example" href={`${exampleHref}#city-permits`} i={2}>
                  Check the zoning, the permits already on file with the city and any open code complaints before you
                  price the job.
                </Reader>
                <Reader title="Listing a property" link="Open the same report as JSON" href={jsonHref} i={3}>
                  Hand a buyer one page of official records, each with a link that proves it, instead of a folder of
                  screenshots.
                </Reader>
              </div>
            </div>
          </div>
        </section>

        {/* Trust: what a report does when a record can't be found. */}
        <section id="gaps" className="scroll-mt-20 bg-white py-[var(--band)]" aria-labelledby="gaps-title">
          <div className={`${COL} grid gap-x-[clamp(32px,6vw,96px)] gap-y-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]`}>
            <div>
              <h2 id="gaps-title" className="d-title max-w-[13ch]" data-reveal>
                Gaps are flagged, never guessed
              </h2>
              <p className="mt-6 max-w-[40ch]" data-reveal style={{ ["--i" as string]: 1 }}>
                Every source in a report ends in one of four answers, so you can tell what was checked and what
                wasn&apos;t.
              </p>
            </div>
            <div data-reveal style={{ ["--i" as string]: 2 }}>
              <Answers answers={answers(ex)} />
            </div>
          </div>
        </section>

        {/* Watch: the Monitor, as a band of the brand green. */}
        <section className="bg-[var(--green-deep)] text-white" aria-labelledby="watch-title">
          <div className={`${COL} grid gap-x-[clamp(32px,6vw,96px)] gap-y-12 py-[var(--band)] md:grid-cols-2 md:items-center`}>
            <div>
              <h2 id="watch-title" className="d-title max-w-[14ch]" data-reveal>
                Get told when a record changes
              </h2>
              <p className="mt-6 max-w-[44ch]" data-reveal style={{ ["--i" as string]: 1 }}>
                Watch an address and its county records are read again every morning at seven. You hear about a new
                permit, a sale, a new owner or a new assessed value, not a reprint of the whole report.
              </p>
              <div className="mt-9" data-reveal style={{ ["--i" as string]: 2 }}>
                <Link href={`${exampleHref}#watch`} className="btn btn-paper">
                  Watch the example address
                </Link>
              </div>
            </div>
            <div className="relative aspect-[3/2] overflow-hidden rounded-[var(--r)]" data-reveal style={{ ["--i" as string]: 2 }}>
              <Image
                src={ARCHIVE["gravel-street-1910"].src}
                alt="Wooden houses above an unpaved gravel street in Seattle, about 1910"
                fill
                sizes="(min-width: 768px) 50vw, 100vw"
                className="object-cover"
              />
            </div>
          </div>
        </section>

        {/* For the curious: how the records are read. */}
        <section id="how" className="scroll-mt-20 py-[var(--band)]" aria-labelledby="how-title">
          <div className={COL}>
            <div className="grid gap-x-12 gap-y-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:items-end">
              <h2 id="how-title" className="d-title max-w-[14ch]" data-reveal>
                How the records are read
              </h2>
              <p className="max-w-[56ch]" data-reveal style={{ ["--i" as string]: 1 }}>
                Government property sites have no API, so TinyFish opens them the way a person would. Each stage shows
                the request this site sends for {EXAMPLE_ADDRESS}.
              </p>
            </div>
            <div className="mt-12" data-reveal style={{ ["--i" as string]: 2 }}>
              <Tools tools={toolSteps(ex)} />
            </div>
          </div>
        </section>

        {/* Questions. */}
        <section className="bg-white py-[var(--band)]" aria-labelledby="faq-title">
          <div className={`${COL} grid gap-x-[clamp(32px,6vw,96px)] gap-y-10 lg:grid-cols-[minmax(0,4fr)_minmax(0,7fr)]`}>
            <h2 id="faq-title" className="d-title max-w-[10ch]" data-reveal>
              Common questions
            </h2>
            <div className="flex flex-col gap-2">
              {QUESTIONS.map((f, i) => (
                <details
                  key={f.q}
                  className="faq rounded-[var(--r)] bg-[var(--field-input)] transition-colors duration-[var(--t-hover)]"
                  open={i === 0}
                  data-reveal
                  style={{ ["--i" as string]: i + 1 }}
                >
                  <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-6 px-6 py-4">
                    <span className="t-lead d-strong">{f.q}</span>
                    <svg viewBox="0 0 24 24" className="mark size-6 shrink-0" aria-hidden>
                      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
                    </svg>
                  </summary>
                  <p className="max-w-[62ch] px-6 pb-6">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Close: the search once more, beside one real lot. */}
        <section className="py-[var(--band)]" aria-labelledby="end-title">
          <div className={`${COL} grid gap-x-[clamp(32px,6vw,96px)] gap-y-12 md:grid-cols-[minmax(0,6fr)_minmax(0,5fr)] md:items-center`}>
            <div>
              <h2 id="end-title" className="d-title max-w-[13ch]" data-reveal>
                Look up a King County address
              </h2>
              <div className="mt-9 max-w-[640px]" data-reveal style={{ ["--i" as string]: 1 }}>
                <Search />
              </div>
            </div>
            {closing ? (
              <Link
                href={`/report?q=${encodeURIComponent(closing.input)}`}
                className="group block rounded-[var(--r)] focus-visible:outline-offset-4 max-md:hidden"
                data-reveal
                style={{ ["--i" as string]: 2 }}
              >
                <div className="zoom relative aspect-[4/3] overflow-hidden rounded-[var(--r)] bg-[var(--paper-2)]">
                  <LotPhoto lot={closing} sizes="(min-width: 768px) 45vw, 100vw" />
                </div>
                <p className="mt-4 underline-offset-4 group-hover:underline">
                  {titleCase(closing.address)}, {closing.city}, with its lot line drawn. Aerial photo © King County.
                </p>
              </Link>
            ) : null}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

/**
 * A report tile. From tablet up it is a photograph with its words underneath, in a grid; on a
 * phone it is one filled row, a small square picture beside the name, so seven fit on a screen.
 */
const TILE_LINK =
  "group flex items-center gap-4 rounded-[var(--r)] focus-visible:outline-offset-4 max-sm:bg-[var(--field-input)] max-sm:p-2 max-sm:pr-3 sm:block";
const TILE_PIC = "relative size-[84px] shrink-0 overflow-hidden rounded-[8px] sm:aspect-[3/2] sm:size-auto sm:rounded-[var(--r)]";

function Chevron() {
  return (
    <svg viewBox="0 0 24 24" className="size-5 shrink-0 sm:hidden" aria-hidden>
      <path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** One kind of reader: who they are, what they check, and where to see it. */
function Reader({
  title,
  link,
  href,
  i,
  children,
}: {
  title: string;
  link: string;
  href: string;
  i: number;
  children: React.ReactNode;
}) {
  return (
    <div data-reveal style={{ ["--i" as string]: i }}>
      <h3 className="t-lead d-strong">{title}</h3>
      <p className="mt-2 max-w-[52ch]">{children}</p>
      <p className="mt-3">
        <Link href={href} className="link text-[var(--accent)]">
          {link}
        </Link>
      </p>
    </div>
  );
}

/**
 * One report fragment per answer. "Found" and "Nothing on record" come from the real example
 * lookup when it has them; the two gap states can't be shown for real without a failing source,
 * so they're labelled as example wording.
 */
function answers(ex: Example): Answer[] {
  const s = ex.assessor;
  const a = s?.status === "found" ? s.data : null;
  const real = `real lookup of ${EXAMPLE_ADDRESS}`;
  const example = (base: Partial<Section<unknown>>): Section<unknown> => ({
    status: "source_error",
    sourceUrl: "",
    sourceName: "",
    via: "agent",
    retrievedAt: new Date().toISOString(),
    data: null,
    ...base,
  });

  return [
    {
      label: "Found",
      text: "The source returned records. Each is shown as the source lists it, with the time it was fetched and a link to the page.",
      provenance: a ? real : "example wording",
      fragment:
        a && s ? (
          <>
            <Notice tone="found" title={`Zoning ${a.zoning}`}>
              {a.presentUse}, {a.landSqFt?.toLocaleString("en-US")} sq ft lot
            </Notice>
            <Receipt section={s} />
          </>
        ) : (
          <Notice tone="found" title="Records are listed here">
            Each one links to the page it came from.
          </Notice>
        ),
    },
    {
      label: "Nothing on record",
      text: "The source was checked and has no records of that kind, for example no appeals. The report says so and links to the page.",
      provenance: a && a.appeals.length === 0 ? real : "example wording",
      fragment:
        a && s && a.appeals.length === 0 ? (
          <Gap section={{ ...s, status: "none" }} what="value appeals" />
        ) : (
          <Gap section={example({ status: "none", sourceName: "Seattle code complaints" })} what="violations" />
        ),
    },
    {
      label: "Couldn't check",
      text: "The website was down, blocked the request or changed its layout. The report names the source and the reason, and leaves the section empty.",
      provenance: "example wording",
      fragment: (
        <Gap
          section={example({
            sourceName: "King County Treasurer",
            sourceUrl: "https://payment.kingcounty.gov/Home/Index?app=PropertyTaxes",
            note: "no answer within 150 seconds",
          })}
          what="tax bills"
        />
      ),
    },
    {
      label: "Not covered",
      text: "The source doesn't cover this address. Seattle's code complaints, for example, can't be searched for a house in Bellevue.",
      provenance: "example wording",
      fragment: (
        <Gap
          section={example({
            status: "not_applicable",
            sourceName: "Seattle code complaints",
            note: "Code complaints are searched in Seattle only; ask Bellevue about complaints at this address.",
          })}
          what="code complaints"
        />
      ),
    },
  ];
}
