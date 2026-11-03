import Image from "next/image";
import Link from "next/link";
import { AddressForm } from "@/components/AddressForm";
import { ElasticFooter } from "@/components/landing/ElasticFooter";
import { ParcelStory } from "@/components/landing/ParcelStory";
import { ToolsStory } from "@/components/landing/ToolsStory";
import { ValueBars } from "@/components/landing/ValueBars";
import { CountUp } from "@/components/motion/CountUp";
import { Pole } from "@/components/Pole";
import { time } from "@/components/report/format";
import { SiteFooter } from "@/components/SiteFooter";
import { StatusTabs, type StatusExample } from "@/components/StatusTabs";
import { Gap, Receipt } from "@/components/report/Receipt";
import type { Example } from "@/lib/example";
import type { Section } from "@/lib/types";
import { ARCHIVE } from "@/lib/archive";
import { EXAMPLE_ADDRESS, getExample } from "@/lib/example";
import { SOURCES, VIA_LABEL } from "@/lib/sources";
import { toolSteps } from "@/lib/tools";

const exampleHref = `/report?q=${encodeURIComponent(EXAMPLE_ADDRESS)}`;
const jsonHref = `/api/dossier?q=${encodeURIComponent(EXAMPLE_ADDRESS)}`;

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

  return (
    <>
      <main className="snap-page relative z-10 bg-[var(--paper)]">
        {/* 1 · Hero: the printed card beside a Seattle house */}
        <section
          className="snap-start grid grid-cols-[minmax(0,1fr)] gap-[var(--gap)] p-[var(--gap)] md:h-svh md:grid-cols-2"
          aria-labelledby="hero-title"
        >
          <div className="relative h-[34svh] overflow-hidden md:order-2 md:h-auto">
            <Image
              src={ARCHIVE["craftsman-naomi-place-2024"].src}
              alt="A Craftsman bungalow with a red door and a garden of maples and grasses, in Seattle"
              width={1920}
              height={1080}
              priority
              sizes="(max-width: 767px) 100vw, 50vw"
              className="drift h-full w-full object-cover"
            />
          </div>
          <div className="relative z-10 -mt-9 flex min-w-0 flex-col bg-[var(--paper-2)] md:order-1 md:mt-0">
            <Pole />
            <div className="flex flex-1 flex-col justify-center px-[var(--pad)] py-8 md:py-14">
              <p className="t-lead name" data-reveal>
                Lot &amp; Block
              </p>
              <h1 id="hero-title" className="t-head mt-5 max-w-[15ch] md:mt-8">
                <Rise text="Every record on one house" />
              </h1>
              <p className="mt-6 max-w-[40ch]" data-reveal style={{ ["--i" as string]: 3 }}>
                Type a King County address. We read the county, city and federal record sites live and link every
                line back to the page it came from.
              </p>
              <div className="mt-10 max-w-[560px]" data-reveal style={{ ["--i" as string]: 4 }}>
                <AddressForm />
                <p className="t-small muted mt-3">
                  Or try{" "}
                  <Link className="link text-[var(--ink)]" href={exampleHref}>
                    {EXAMPLE_ADDRESS}
                  </Link>
                  , or a parcel number like 198520-0495.
                </p>
              </div>
            </div>
            <nav className="flex flex-wrap gap-x-8 gap-y-2 px-[var(--pad)] pb-7" aria-label="On this page">
              <a className="link" href="#how">
                How it&apos;s read
              </a>
              <a className="link" href="#tools">
                TinyFish
              </a>
              <a className="link" href="#gaps">
                What the labels mean
              </a>
            </nav>
          </div>
        </section>

        {/* 2 · Pinned: address → parcel */}
        <div id="how">
          <ParcelStory input={ex.input} property={ex.property} plat={ex.plat} />
        </div>

        {/* 3 · Pinned: the four TinyFish tools */}
        <div id="tools">
          <ToolsStory tools={toolSteps(ex)} />
        </div>

        {/* 4 · The sources, as an itinerary slip standing on a Seattle street */}
        <section className="snap-start relative mx-[var(--gap)] min-h-svh overflow-hidden" aria-labelledby="sources-title">
          <Image
            src={ARCHIVE["fremont-olympics-2015"].src}
            alt="A residential street in Fremont, Seattle, running downhill toward the ship canal with the Olympic Mountains behind"
            fill
            sizes="100vw"
            className="drift object-cover"
          />
          <div className="relative grid min-h-svh grid-cols-[minmax(0,1fr)] content-center gap-[var(--gap)] p-[var(--gap)] md:grid-cols-2 md:items-start md:py-[10svh]">
            <div className="bg-[var(--paper)] px-[var(--pad)] py-10" data-reveal>
              <h2 id="sources-title" className="t-head max-w-[12ch]">
                Every office, side by side
              </h2>
              <p className="mt-6 max-w-[34ch]">
                Nothing comes from a listing site or an estimate. {connected} of {SOURCES.length} official sources are
                connected in this build; the rest are listed so you know what&apos;s coming, and the report never
                shows them as checked.
              </p>
            </div>
            <Slip />
          </div>
        </section>

        {/* 5 · Real figures from the example lookup */}
        <section
          className="snap-start mx-[var(--gap)] mt-[var(--gap)] grid min-h-svh grid-cols-[minmax(0,1fr)] gap-x-[var(--pad)] gap-y-14 bg-[var(--accent)] px-[var(--pad)] py-12 text-[var(--accent-ink)] md:grid-cols-[minmax(0,6fr)_minmax(0,5fr)] md:py-16"
          aria-labelledby="figures-title"
        >
          <div className="flex flex-col justify-between gap-12">
            <h2 id="figures-title" className="t-lead name max-w-[30ch]" data-reveal>
              A real dossier for {EXAMPLE_ADDRESS}, read live
            </h2>
            {a && latest?.totalValue ? (
              <div className="flex flex-col gap-12">
                <div data-reveal>
                  <p className="t-mark text-[clamp(3rem,8vw,8.5rem)]">
                    <CountUp value={latest.totalValue} prefix="$" />
                  </p>
                  <p className="t-lead mt-4">assessed value for tax year {latest.taxYear}, land and buildings</p>
                </div>
                <div className="grid max-w-[640px] grid-cols-3 gap-6" data-reveal style={{ ["--i" as string]: 1 }}>
                  <Figure n={history.length} label="years with an assessed value" />
                  <Figure n={a.sales.length} label="sales and transfers" />
                  <Figure n={a.permits.length} label="permits on file" />
                </div>
              </div>
            ) : (
              <p className="t-lead">
                The assessor didn&apos;t answer when this page was built, so there are no figures to show. That&apos;s
                the rule: no answer, no number.
              </p>
            )}
            <div className="flex flex-col gap-6" data-reveal>
              <p className="max-w-[52ch]">
                {ex.assessor
                  ? `From ${ex.assessor.sourceName}, read at ${time(ex.assessor.retrievedAt)} with TinyFish Fetch. Zoning ${a?.zoning ?? "not stated"}.`
                  : null}
              </p>
              <div className="flex flex-wrap gap-[var(--gap)]">
                <Link href={exampleHref} className="btn bg-[var(--paper)] text-[var(--ink)] hover:bg-white">
                  Open the full dossier
                </Link>
                <a href={jsonHref} className="btn bg-[#3a4630]">
                  Raw JSON
                </a>
              </div>
            </div>
          </div>

          {a && history.length > 1 ? (
            <div className="flex flex-col gap-12">
              <div className="flex-1" data-reveal style={{ ["--i" as string]: 1 }}>
                <ValueBars values={history} />
              </div>
              {a.permits.length ? (
                <div data-reveal style={{ ["--i" as string]: 2 }}>
                  <h3 className="t-lead">Latest permits on file</h3>
                  <ol className="mt-4 flex flex-col gap-4">
                    {a.permits.slice(0, 3).map((p) => (
                      <li key={p.number} className="bg-[#3a4630] px-5 py-4">
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
          ) : null}
        </section>

        {/* 6 · The four answers */}
        <section
          id="gaps"
          className="snap-start mx-[var(--gap)] mt-[var(--gap)] grid min-h-svh bg-[var(--field-sage)] md:grid-cols-2"
          aria-labelledby="gaps-title"
        >
          <div className="flex items-center p-4 md:p-10">
            <Image
              src={ARCHIVE["summit-ave-bungalows-1979"].src}
              alt="A row of small grey bungalows on Summit Avenue East, Seattle, photographed in 1979"
              width={1920}
              height={1222}
              sizes="(max-width: 767px) 100vw, 50vw"
              className="aspect-square w-full object-cover"
              data-reveal
            />
          </div>
          <div className="flex flex-col justify-between gap-12 px-[var(--pad)] py-10 md:py-16">
            <div data-reveal>
              <StatusTabs examples={statusExamples(ex)} />
            </div>
            <h2 id="gaps-title" className="t-head max-w-[13ch]" data-reveal style={{ ["--i" as string]: 1 }}>
              Gaps stay visible
            </h2>
          </div>
        </section>

        {/* 7 · Who reads it */}
        <section
          className="snap-start mx-[var(--gap)] mt-[var(--gap)] grid min-h-svh grid-cols-[minmax(0,1fr)] gap-[var(--gap)] md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]"
          aria-labelledby="who-title"
        >
          <div className="relative min-h-[40svh] overflow-hidden">
            <Image
              src={ARCHIVE["highland-drive-2007"].src}
              alt="A white colonial-revival house behind clipped hedges on West Highland Drive, Seattle"
              fill
              sizes="(max-width: 767px) 100vw, 42vw"
              className="object-cover"
            />
          </div>
          <div className="flex flex-col justify-center bg-[var(--field-blush)] px-[var(--pad)] py-12">
            <h2 id="who-title" className="t-head max-w-[14ch]" data-reveal>
              Read before you sign
            </h2>
            <dl className="mt-12 flex flex-col gap-10">
              {[
                ["Buyers", "What the county says the lot is worth, every sale and transfer, and anything the assessor has flagged, before you make an offer."],
                ["Agents", "Zoning, lot size and permit history in one place, each with a link a client can check, before you list."],
                ["Contractors", "The zoning code and every permit already on file, so you know what was built and when before you quote."],
              ].map(([who, what], i) => (
                <div key={who} data-reveal style={{ ["--i" as string]: i + 1 }}>
                  <dt className="t-lead name">{who}</dt>
                  <dd className="mt-2 max-w-[46ch]">{what}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-14 max-w-[560px]" data-reveal style={{ ["--i" as string]: 4 }}>
              <AddressForm />
            </div>
          </div>
        </section>
        <div className="h-[var(--gap)]" />
      </main>

      <ElasticFooter>
        <SiteFooter />
      </ElasticFooter>
    </>
  );
}

function Figure({ n, label }: { n: number; label: string }) {
  return (
    <div>
      <p className="t-head">
        <CountUp value={n} />
      </p>
      <p className="mt-1">{label}</p>
    </div>
  );
}

/** The sources printed as an itinerary slip with a zigzag tear. */
function Slip() {
  return (
    <div
      className="w-full max-w-[480px] justify-self-end bg-[var(--paper)] px-7 pt-2 pb-10"
      style={{
        clipPath:
          "polygon(0 0,100% 0,100% calc(100% - 10px),95% 100%,90% calc(100% - 10px),85% 100%,80% calc(100% - 10px),75% 100%,70% calc(100% - 10px),65% 100%,60% calc(100% - 10px),55% 100%,50% calc(100% - 10px),45% 100%,40% calc(100% - 10px),35% 100%,30% calc(100% - 10px),25% 100%,20% calc(100% - 10px),15% 100%,10% calc(100% - 10px),5% 100%,0 calc(100% - 10px))",
        ["--i" as string]: 1,
      }}
      data-reveal
    >
      <SlipGroup title="First">
        <SlipRow left="Find the parcel" right={VIA_LABEL.gis} />
      </SlipGroup>
      <SlipGroup title="Then, side by side">
        {SOURCES.map((s) => (
          <SlipRow key={s.key} left={s.name} right={s.run ? VIA_LABEL[s.via] : "Not connected yet"} dim={!s.run} />
        ))}
      </SlipGroup>
      <SlipGroup title="Afterwards">
        <SlipRow left="Watch for new permits" right="Not connected yet" dim />
      </SlipGroup>
      <div className="-mx-7 mt-8 flex min-h-11 items-center justify-between gap-4 bg-[var(--ink)] px-7 text-[var(--paper)]">
        <span className="name">Your dossier, every line linked</span>
        <span>JSON + report</span>
      </div>
    </div>
  );
}

function SlipGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-7">
      <h3 className="name">{title}</h3>
      <div className="mt-2 flex flex-col gap-2">{children}</div>
    </div>
  );
}

/** One itinerary row: what happens, a dotted leader, and how it's read. */
function SlipRow({ left, right, dim = false }: { left: string; right: string; dim?: boolean }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className={dim ? "muted" : ""}>{left}</span>
      <span
        aria-hidden
        className="min-w-6 flex-1 translate-y-[-0.2em] self-end"
        style={{
          height: 4,
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='9' height='4'%3E%3Ccircle cx='2' cy='2' r='2' fill='%2338424a'/%3E%3C/svg%3E\")",
          backgroundSize: "9px 4px",
        }}
      />
      <span className={`shrink-0 text-right ${dim ? "muted" : "name"}`}>{right}</span>
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
  const real = `real, from ${EXAMPLE_ADDRESS}`;
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
      text: "The office answered with records. Each one is printed as the office wrote it, with the time we read it and a link to the page.",
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
          <p>Records appear here with a link to the page they came from.</p>
        ),
    },
    {
      label: "Nothing on record",
      text: "The office answered, and it has nothing listed. That's a real answer and the report says so, with the link that proves it.",
      provenance: a && a.appeals.length === 0 ? real : "example wording",
      fragment:
        a && s && a.appeals.length === 0 ? (
          <Gap section={{ ...s, status: "none" }} what="value appeals" />
        ) : (
          <Gap section={example({ status: "none", sourceName: "Seattle code compliance" })} what="violations" />
        ),
    },
    {
      label: "Couldn't check",
      text: "The site was down, blocked us or changed its layout. The report says which office and why, and never fills the gap with a guess.",
      provenance: "example wording",
      fragment: (
        <Gap
          section={example({
            sourceName: "King County Treasurer",
            sourceUrl: "https://payment.kingcounty.gov/Home/Index?app=PropertyTaxes",
            note: "the site didn't respond within 150 seconds",
          })}
          what="tax bills"
        />
      ),
    },
    {
      label: "Not covered",
      text: "Some offices only cover part of the county: Seattle's permit portal knows nothing about a house in Bellevue. The report marks those as outside their area.",
      provenance: "example wording",
      fragment: (
        <Gap
          section={example({
            status: "not_applicable",
            sourceName: "Seattle Services Portal",
            note: "Seattle's permit portal only covers addresses inside Seattle; this one is in Bellevue.",
          })}
          what="permits"
        />
      ),
    },
  ];
}
