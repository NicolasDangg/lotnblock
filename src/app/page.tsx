import Image from "next/image";
import Link from "next/link";
import { AddressForm } from "@/components/AddressForm";
import { ElasticFooter } from "@/components/landing/ElasticFooter";
import { ParcelStory } from "@/components/landing/ParcelStory";
import { RecordMarquee } from "@/components/landing/RecordMarquee";
import { ToolsGrid } from "@/components/landing/ToolsGrid";
import { ValueBars } from "@/components/landing/ValueBars";
import { CountUp } from "@/components/motion/CountUp";
import { money, time } from "@/components/report/format";
import { Gap, Receipt } from "@/components/report/Receipt";
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
  const a = ex.assessor?.status === "found" ? ex.assessor.data : null;
  const latest = a?.assessedValues.find((v) => v.totalValue);
  const connected = SOURCES.filter((s) => s.run).length;
  // Oldest first, skipping the years the assessor lists without a value.
  const history = (a?.assessedValues ?? [])
    .filter((v) => v.totalValue)
    .map((v) => ({ year: v.taxYear, total: v.totalValue! }))
    .reverse();

  // The ribbon: real lines from the example lookup, nothing else.
  const ribbon = a
    ? [
        `${EXAMPLE_ADDRESS}`,
        `Parcel ${a.parcel}`,
        `Zoning ${a.zoning}`,
        latest?.totalValue ? `Assessed ${money(latest.totalValue)} for ${latest.taxYear}` : null,
        `${a.presentUse}`,
        a.landSqFt ? `${a.landSqFt.toLocaleString("en-US")} sq ft lot` : null,
        ...a.permits.slice(0, 4).map((p) => `Permit ${p.number} issued ${p.issued}`),
        ...a.sales.slice(0, 2).map((s) => `${s.instrument} recorded ${s.date}`),
        `Fetched with TinyFish at ${time(ex.assessor!.retrievedAt)}`,
      ].filter((x): x is string => Boolean(x))
    : [];

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
              <a className="hidden hover:underline md:inline" href="#checks">
                Sources
              </a>
              <a className="hidden hover:underline md:inline" href="#sample">
                Example
              </a>
              <a className="hover:underline" href="#how">
                How it works
              </a>
              <a className="hidden hover:underline md:inline" href="#tinyfish">
                TinyFish
              </a>
              <a className="hidden hover:underline md:inline" href="#who">
                Who it&apos;s for
              </a>
            </nav>
          </div>
        </header>

        {/* Hero: one photograph, the headline and the search bar centred on it */}
        <section
          className="relative mx-[var(--gap)] flex min-h-[560px] items-center justify-center overflow-hidden md:h-[80svh]"
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
              <AddressForm variant="hero" id="q-hero" />
            </div>
            <p className="mt-5" data-reveal style={{ ["--i" as string]: 5 }}>
              Try{" "}
              <Link className="link" href={exampleHref}>
                {EXAMPLE_ADDRESS}
              </Link>{" "}
              or parcel{" "}
              <Link className="link" href="/report?q=198520-0495">
                198520-0495
              </Link>
            </p>
          </div>
        </section>

        {/* The records ribbon */}
        {ribbon.length ? (
          <div className="mt-[var(--gap)]">
            <RecordMarquee items={ribbon} label={`Records fetched for ${EXAMPLE_ADDRESS}`} />
          </div>
        ) : null}

        {/* What a dossier checks */}
        <Band id="checks" ground="bg-[var(--paper)]" labelledBy="checks-title">
          <div className="grid gap-x-[var(--pad)] gap-y-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-end">
            <h2 id="checks-title" className="t-head max-w-[15ch]" data-reveal>
              Where records come from
            </h2>
            <p className="max-w-[52ch]" data-reveal style={{ ["--i" as string]: 1 }}>
              Every record comes from a city, county or federal website, read live when you search. Nothing comes
              from listing sites or estimates. {connected === SOURCES.length ? `All ${connected}` : `${connected} of ${SOURCES.length}`}{" "}
              sources are working; when one can&apos;t be read, the report says so instead of guessing.
            </p>
          </div>
          <div className="mt-12" data-reveal style={{ ["--i" as string]: 2 }}>
            <table className="w-full text-left">
              <thead>
                <tr className="text-[var(--muted)]">
                  <th className="pb-3 pl-4 font-normal">Source</th>
                  <th className="hidden pb-3 font-normal md:table-cell">Level</th>
                  <th className="hidden pb-3 font-normal md:table-cell">What you get</th>
                  <th className="pr-4 pb-3 text-right font-normal">Read with</th>
                </tr>
              </thead>
              <tbody>
                {SOURCES.map((s) => (
                  <tr key={s.key} className="odd:bg-[var(--field-input)]">
                    <td className="name py-4 pr-6 pl-4">{s.name}</td>
                    <td className="hidden py-4 pr-6 capitalize md:table-cell">{s.level}</td>
                    <td className="hidden py-4 pr-6 md:table-cell">{s.provides}</td>
                    <td className={`py-4 pr-4 text-right whitespace-nowrap ${s.run ? "name" : "text-[var(--muted)]"}`}>
                      {s.run ? VIA_LABEL[s.via] : "Planned"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Band>

        {/* A real sample dossier */}
        <Band id="sample" ground="bg-[var(--field-blush)]" labelledBy="sample-title">
          <div className="grid gap-x-[var(--pad)] gap-y-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-end">
            <h2 id="sample-title" className="t-head max-w-[16ch]" data-reveal>
              Example: <span className="whitespace-nowrap">{EXAMPLE_ADDRESS.replace(", Seattle", "")}</span>
            </h2>
            <p className="max-w-[52ch]" data-reveal style={{ ["--i" as string]: 1 }}>
              {ex.assessor
                ? `A real lookup, fetched from the King County Assessor's website at ${time(ex.assessor.retrievedAt)}. Searching an address gives you the same report.`
                : "The King County Assessor's website didn't respond, so there's no example to show right now."}
            </p>
          </div>
          {a && latest?.totalValue ? (
            <div className="mt-12 grid gap-x-[var(--pad)] gap-y-12 bg-[var(--paper)] p-[var(--pad)] md:grid-cols-[minmax(0,6fr)_minmax(0,5fr)]">
              <div className="flex flex-col justify-between gap-12">
                <div data-reveal>
                  <p className="t-mark text-[clamp(3rem,6.5vw,6rem)]">
                    <CountUp value={latest.totalValue} prefix="$" />
                  </p>
                  <p className="t-lead mt-4">
                    Assessed value for tax year {latest.taxYear}, land and buildings. Zoned {a.zoning}.
                  </p>
                </div>
                <div className="grid max-w-[560px] grid-cols-3 gap-6" data-reveal style={{ ["--i" as string]: 1 }}>
                  <Figure n={history.length} label="years with an assessed value" />
                  <Figure n={a.sales.length} label="sales and transfers" />
                  <Figure n={a.permits.length} label="permits on file" />
                </div>
                <div className="flex flex-wrap gap-[var(--gap)]" data-reveal style={{ ["--i" as string]: 2 }}>
                  <Link href={exampleHref} className="btn">
                    See the full report
                  </Link>
                  <a href={jsonHref} className="btn bg-[var(--paper-2)] text-[var(--ink)] hover:bg-[var(--surface)]">
                    View as JSON
                  </a>
                </div>
              </div>
              <div className="flex flex-col gap-12">
                {history.length > 1 ? (
                  <div data-reveal style={{ ["--i" as string]: 1 }}>
                    <ValueBars values={history} />
                  </div>
                ) : null}
                {a.permits.length ? (
                  <div data-reveal style={{ ["--i" as string]: 2 }}>
                    <h3 className="t-lead">Most recent permits</h3>
                    <ol className="mt-4 flex flex-col gap-3">
                      {a.permits.slice(0, 3).map((p) => (
                        <li key={p.number} className="bg-[var(--field-input)] px-5 py-4">
                          <p className="name">
                            {p.issued} · {p.number}
                          </p>
                          <p className="mt-1">{p.description || "No description given."}</p>
                        </li>
                      ))}
                    </ol>
                  </div>
                ) : null}
              </div>
            </div>
          ) : (
            <p className="t-lead mt-12">The assessor didn&apos;t return any values for this example.</p>
          )}
        </Band>

        {/* How it works: address → parcel */}
        <Band id="how" ground="bg-[var(--field-slate)]" label="How it works">
          <ParcelStory input={ex.input} property={ex.property} plat={ex.plat} />
        </Band>

        {/* TinyFish: four standalone parts */}
        <Band id="tinyfish" ground="bg-[var(--ink)] text-[var(--paper)]" labelledBy="tinyfish-title">
          <div className="grid gap-x-[var(--pad)] gap-y-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-end">
            <h2 id="tinyfish-title" className="t-head max-w-[16ch]" data-reveal>
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
              <h2 id="gaps-title" className="t-head max-w-[14ch]" data-reveal>
                When a record is missing
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

        {/* Who it's for */}
        <Band id="who" ground="bg-[var(--paper)]" labelledBy="who-title">
          <h2 id="who-title" className="t-head max-w-[14ch]" data-reveal>
            Who it&apos;s for
          </h2>
          <div className="mt-12 grid gap-x-[var(--gap)] gap-y-12 md:grid-cols-3">
            {AUDIENCES.map((who, i) => (
              <article key={who.name} className="group" data-reveal style={{ ["--i" as string]: i + 1 }}>
                <div className="relative aspect-[4/3] overflow-hidden">
                  <Image
                    src={who.photo.src}
                    alt={who.alt}
                    fill
                    sizes="(max-width: 767px) 100vw, 33vw"
                    className="object-cover transition-transform duration-700 ease-[var(--ease-out)] group-hover:scale-[1.04]"
                  />
                </div>
                <h3 className="t-lead name mt-5">{who.name}</h3>
                <p className="mt-2 max-w-[40ch]">{who.text}</p>
              </article>
            ))}
          </div>
        </Band>

        {/* Close: the search again, on olive */}
        <Band ground="bg-[var(--accent)] text-[var(--accent-ink)]" labelledBy="end-title">
          <div className="text-center">
            <h2 id="end-title" className="t-head mx-auto max-w-[16ch]" data-reveal>
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

const AUDIENCES = [
  {
    name: "Buyers",
    text: "Check the assessed value, past sales and any issues the assessor has noted on the property.",
    photo: ARCHIVE["fremont-olympics-2015"],
    alt: "A residential street in Fremont, Seattle, with the Olympic Mountains behind",
  },
  {
    name: "Agents",
    text: "Get zoning, lot size and permit history in one report, with links your clients can open.",
    photo: ARCHIVE["highland-drive-2007"],
    alt: "A white colonial-revival house behind clipped hedges on West Highland Drive, Seattle",
  },
  {
    name: "Contractors",
    text: "See the zoning and the permits already filed, so you know what work has been done.",
    photo: ARCHIVE["summit-ave-bungalows-1979"],
    alt: "A row of small grey bungalows on Summit Avenue East, Seattle, photographed in 1979",
  },
];

function Figure({ n, label }: { n: number; label: string }) {
  return (
    <div>
      <p className="t-head">
        <CountUp value={n} />
      </p>
      <p className="mt-1 text-[var(--muted)]">{label}</p>
    </div>
  );
}

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
            <p className="name">Zoning {a.zoning}</p>
            <p>
              {a.presentUse}, {a.landSqFt?.toLocaleString("en-US")} sq ft
            </p>
            <Receipt section={s} />
          </>
        ) : (
          <p>Records are listed here, each with a link to its source page.</p>
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
