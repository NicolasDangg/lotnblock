import Image from "next/image";
import Link from "next/link";
import { AddressForm } from "@/components/AddressForm";
import { HeroSearch } from "@/components/landing/HeroSearch";
import { ElasticFooter } from "@/components/landing/ElasticFooter";
import { LotsSection } from "@/components/landing/LotRow";
import { ToolsGrid } from "@/components/landing/ToolsGrid";
import { Gap, Notice, Receipt } from "@/components/report/Receipt";
import { SiteFooter } from "@/components/SiteFooter";
import { StatusTabs, type StatusExample } from "@/components/StatusTabs";
import { ARCHIVE } from "@/lib/archive";
import { EXAMPLE_ADDRESS, getExample, type Example } from "@/lib/example";
import { SOURCES, VIA_LABEL } from "@/lib/sources";
import { toolSteps } from "@/lib/tools";
import type { Section } from "@/lib/types";

const exampleHref = `/report?q=${encodeURIComponent(EXAMPLE_ADDRESS)}`;
const jsonHref = `/api/dossier?q=${encodeURIComponent(EXAMPLE_ADDRESS)}`;

/** One band of the page: a full-bleed ground with the content in a centred column. */
function Band({
  id,
  ground,
  children,
  label,
  labelledBy,
}: {
  id?: string;
  ground: string;
  children: React.ReactNode;
  label?: string;
  labelledBy?: string;
}) {
  return (
    <section id={id} className={`scroll-mt-16 ${ground}`} aria-label={label} aria-labelledby={labelledBy}>
      <div className="mx-auto max-w-[1240px] px-[var(--pad)] py-[clamp(88px,11vw,168px)]">{children}</div>
    </section>
  );
}

/** Words that rise out of a mask one after another. */
function Rise({ text }: { text: string }) {
  return text.split(" ").map((w, i) => (
    <span key={i}>
      <span className="rise">
        <span style={{ ["--w" as string]: i }}>{w}</span>
      </span>{" "}
    </span>
  ));
}

export default async function Home() {
  const ex = await getExample();

  return (
    <>
      <main className="snap-page relative z-10 bg-[var(--paper)]">
        {/* Header: stays with you, translucent so the page scrolls under it */}
        <header className="sticky top-0 z-40 bg-[var(--paper)]/80 backdrop-blur-xl backdrop-saturate-150">
          <div className="mx-auto flex max-w-[1240px] items-center justify-between gap-x-8 px-[var(--pad)] py-4">
            <Link href="/" className="t-lead name press">
              Lot &amp; Block
            </Link>
            <nav className="flex items-center gap-x-7" aria-label="Main">
              <a className="hover:underline" href="#lots">
                Lots
              </a>
              <a className="hidden hover:underline md:inline" href="#questions">
                What it answers
              </a>
              <a className="hidden hover:underline md:inline" href="#tinyfish">
                TinyFish
              </a>
              <a className="hidden hover:underline md:inline" href="#gaps">
                Gaps
              </a>
            </nav>
          </div>
        </header>

        {/* Hero: one photograph, the headline and the search bar centred on it */}
        <section
          className="relative mx-[var(--gap)] flex min-h-[600px] items-center justify-center overflow-hidden rounded-[28px] md:h-[80svh]"
          aria-labelledby="hero-title"
        >
          <Image
            src={ARCHIVE["craftsman-naomi-place-2024"].src}
            alt="A Craftsman bungalow with a red door and a garden of maples and grasses, in Seattle"
            fill
            priority
            sizes="100vw"
            className="drift origin-top object-cover object-[50%_0%] saturate-[0.8]"
          />
          {/* Neutral scrim: an even dim, plus a soft darker pool behind the text so it lifts off the photo. */}
          <div aria-hidden className="absolute inset-0 bg-[#1c1c1c]/45" />
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              background: "radial-gradient(ellipse 58% 52% at 50% 50%, rgba(28,28,28,0.55) 0%, rgba(28,28,28,0.25) 55%, transparent 80%)", // taste-skill-ignore: neutral scrim under text on a photo
            }}
          />
          <div className="relative w-full max-w-[880px] px-[var(--pad)] py-20 text-center text-[var(--paper)]">
            <h1 id="hero-title" className="t-head mx-auto max-w-[17ch] text-[clamp(2.5rem,1.4rem+4vw,5.25rem)]">
              <Rise text="Records for any King County house" />
            </h1>
            <p className="t-lead mx-auto mt-6 max-w-[38ch]" data-reveal style={{ ["--i" as string]: 3 }}>
              Enter an address or parcel number. We pull its records from official government websites and link
              each one to the page it came from.
            </p>
            <div className="mx-auto mt-10 max-w-[760px] text-left" data-reveal style={{ ["--i" as string]: 4 }}>
              <HeroSearch />
            </div>
          </div>
        </section>

        {/* Real lots, read from the county: the first thing under the search */}
        <LotsSection />

        {/* What a report answers: one question per official source */}
        <Band id="questions" ground="bg-[var(--field-blush)]" labelledBy="questions-title">
          <div className="grid gap-x-[var(--pad)] gap-y-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
            <div className="lg:sticky lg:top-28 lg:self-start">
              <h2 id="questions-title" className="t-section max-w-[13ch]" data-reveal>
                What a report answers
              </h2>
              <p className="mt-6 max-w-[42ch]" data-reveal style={{ ["--i" as string]: 1 }}>
                Each answer comes from the government office that keeps the record, read live when you search, and links
                to the page it came from. Open a question to see where it&apos;s read from.
              </p>
              <div className="mt-10 flex flex-wrap gap-[var(--gap)]" data-reveal style={{ ["--i" as string]: 2 }}>
                <Link href={exampleHref} className="btn">
                  See an example report
                </Link>
                <a href={jsonHref} className="btn bg-[var(--paper)] text-[var(--ink)] hover:bg-[var(--field-input)]">
                  View as JSON
                </a>
              </div>
            </div>
            <ol className="flex flex-col gap-2">
              {SOURCES.map((s, i) => (
                <li key={s.key} data-reveal style={{ ["--i" as string]: i + 1 }}>
                  <details className="group rounded-[20px] bg-[var(--paper)] transition-colors duration-[var(--t-hover)] open:bg-[var(--field-input)]">
                    <summary className="flex cursor-pointer list-none items-center gap-4 px-[clamp(18px,2.5vw,28px)] py-5 [&::-webkit-details-marker]:hidden">
                      <span className="min-w-0 flex-1">
                        <span className="t-lead name block">{QUESTION[s.key] ?? s.name}</span>
                        <span className="t-small mt-1 block text-[var(--muted)]">{s.name}</span>
                      </span>
                      <span
                        aria-hidden
                        className="grid size-10 shrink-0 place-items-center rounded-full bg-[var(--paper-2)] transition-transform duration-300 ease-[var(--ease-out)] group-open:rotate-45"
                      >
                        <svg viewBox="0 0 24 24" className="size-4">
                          <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                      </span>
                    </summary>
                    <div className="px-[clamp(18px,2.5vw,28px)] pb-6">
                      <p className="max-w-[56ch]">{s.provides}.</p>
                      <p className="t-small mt-4 flex flex-wrap gap-2">
                        <span className="rounded-full bg-[var(--paper)] px-3 py-1 capitalize">{s.level} record</span>
                        <span className="rounded-full bg-[var(--paper)] px-3 py-1">
                          {s.run ? `Read with ${VIA_LABEL[s.via]}` : "Planned"}
                        </span>
                      </p>
                    </div>
                  </details>
                </li>
              ))}
            </ol>
          </div>
        </Band>

        {/* TinyFish: four standalone parts */}
        <Band id="tinyfish" ground="bg-[var(--ink)] text-[var(--paper)]" labelledBy="tinyfish-title">
          <div className="grid gap-x-[var(--pad)] gap-y-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-end">
            <h2 id="tinyfish-title" className="t-section max-w-[16ch]" data-reveal>
              How TinyFish works
            </h2>
            <p className="max-w-[52ch] text-[var(--field-sage)]" data-reveal style={{ ["--i" as string]: 1 }}>
              Government property sites have no API, so TinyFish opens them the way a person would. Each block below
              is the request this site sends for the example address.
            </p>
          </div>
          <div className="mt-[clamp(64px,8vw,112px)]">
            <ToolsGrid tools={toolSteps(ex)} />
          </div>
        </Band>

        {/* The four answers */}
        <Band id="gaps" ground="bg-[var(--field-sage)]" labelledBy="gaps-title">
          <div className="grid gap-x-[var(--pad)] gap-y-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
            <div>
              <h2 id="gaps-title" className="t-section max-w-[14ch]" data-reveal>
                Gaps are flagged, never guessed
              </h2>
              <p className="mt-6 max-w-[40ch]" data-reveal style={{ ["--i" as string]: 1 }}>
                Every source in a report is marked with one of four results, so you can tell what was checked and what wasn&apos;t.
              </p>
            </div>
            <div data-reveal style={{ ["--i" as string]: 2 }}>
              <StatusTabs examples={statusExamples(ex)} />
            </div>
          </div>
        </Band>

        {/* Close: the search again, on olive */}
        <Band ground="bg-[var(--accent)] text-[var(--accent-ink)]" labelledBy="end-title">
          <div className="text-center">
            <h2 id="end-title" className="t-section mx-auto max-w-[16ch]" data-reveal>
              Search a King County address
            </h2>
            <div className="mx-auto mt-10 max-w-[760px] text-left" data-reveal style={{ ["--i" as string]: 1 }}>
              <AddressForm variant="hero" id="q-end" />
            </div>
          </div>
        </Band>
      </main>

      <ElasticFooter>
        <SiteFooter />
      </ElasticFooter>
    </>
  );
}

/** The buyer's question each source answers, in the order the sources are listed. */
const QUESTION: Record<string, string> = {
  assessor: "What is it worth, and when did it last sell?",
  districts: "Is the land in a hazard area?",
  flood: "Will a lender require flood insurance?",
  schools: "Which public schools are close by?",
  treasurer: "Are the property taxes paid?",
  permits: "What work has the city permitted?",
  violations: "Has anyone filed a code complaint?",
};

/**
 * One report fragment per answer. "Found" and "Nothing on record" come from the real example
 * lookup when it has them; the two gap states can't be shown for real without a failing source,
 * so they're labelled as example wording.
 */
function statusExamples(ex: Example): StatusExample[] {
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
