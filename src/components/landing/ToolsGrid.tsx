import type { ToolStep } from "@/lib/tools";

/**
 * The four TinyFish tools as four standalone parts, all visible at once: name, its job, whether
 * it's live, and the exact request it sends (with the real result for Fetch). Nothing to wait for.
 */
export function ToolsGrid({ tools }: { tools: ToolStep[] }) {
  return (
    <ol className="flex flex-col gap-[clamp(56px,7vw,104px)]">
      {tools.map((t, i) => (
        <li
          key={t.name}
          className={`grid grid-cols-[minmax(0,1fr)] items-start gap-x-[var(--pad)] gap-y-8 ${
            // Alternate sides; the code always gets the wide column.
            i % 2
              ? "md:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] md:[&>*:first-child]:order-2"
              : "md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]"
          }`}
        >
          <div>
            <h3 className="t-mark text-[clamp(3rem,6vw,6rem)]" data-reveal>
              {t.name}
            </h3>
            <p className="t-lead mt-5 max-w-[28ch]" data-reveal style={{ ["--i" as string]: 1 }}>
              {t.job}
            </p>
            <p
              className={`mt-6 inline-flex items-center gap-2 px-3 py-1.5 ${
                t.state === "live" ? "bg-[var(--field-sage)] text-[var(--ink)]" : "bg-[var(--muted)] text-[var(--paper)]"
              }`}
              data-reveal
              style={{ ["--i" as string]: 2 }}
            >
              <span
                aria-hidden
                className={`inline-block size-2 rounded-full ${t.state === "live" ? "live-dot bg-[var(--accent)]" : "bg-[var(--paper)]/60"}`}
              />
              {t.state === "live" ? "Working now" : "Not built yet"}
            </p>
          </div>
          <div className="min-w-0 bg-[#2a2a28] p-6 md:p-8" data-ui data-reveal style={{ ["--i" as string]: 1 }}>
            <pre className="overflow-x-auto text-[length:var(--step-small)] leading-relaxed text-[var(--paper)] [overflow-wrap:anywhere] whitespace-pre-wrap">
              <code>{t.code}</code>
            </pre>
          </div>
        </li>
      ))}
    </ol>
  );
}
