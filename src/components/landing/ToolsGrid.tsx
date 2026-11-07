import type { ToolStep } from "@/lib/tools";
import { AgentScene } from "./AgentScene";

/**
 * The four TinyFish tools, one row each: the tool's name and job on one side; on the other, a
 * drawing of an agent doing that job, and the exact request this site sends (with the real
 * result for Fetch), folded away until opened. Rows alternate sides. Meant for a dark ground.
 */
export function ToolsGrid({ tools }: { tools: ToolStep[] }) {
  return (
    <ol className="flex flex-col gap-[clamp(64px,8vw,120px)]">
      {tools.map((t, i) => (
        <li
          key={t.name}
          className={`grid grid-cols-[minmax(0,1fr)] items-start gap-x-[var(--pad)] gap-y-8 ${
            // Alternate sides; the drawing and the code always get the wide column.
            i % 2
              ? "md:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] md:[&>*:first-child]:order-2"
              : "md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]"
          }`}
        >
          <div className="md:sticky md:top-28">
            <h3 className="t-mark text-[clamp(3rem,6vw,6rem)]" data-reveal>
              {t.name}
            </h3>
            <p className="t-lead mt-5 max-w-[28ch]" data-reveal style={{ ["--i" as string]: 1 }}>
              {t.job}
            </p>
            <p
              className={`mt-6 inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 ${
                t.state === "live" ? "bg-[var(--accent-tint)] text-[var(--accent)]" : "bg-white/15 text-[var(--paper)]"
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
          <div className="flex min-w-0 flex-col gap-4" data-reveal style={{ ["--i" as string]: 1 }}>
            <div className="overflow-hidden rounded-[20px] bg-[#262624] p-[clamp(12px,2vw,24px)]">
              <AgentScene tool={t.name} />
            </div>
            <details className="group min-w-0 rounded-[20px] bg-[#2a2a28]" data-ui>
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-5 md:px-8 [&::-webkit-details-marker]:hidden">
                <span className="name">
                  <span className="group-open:hidden">Show the request</span>
                  <span className="hidden group-open:inline">Hide the request</span>
                </span>
                <span
                  aria-hidden
                  className="grid size-9 shrink-0 place-items-center rounded-full bg-white/10 transition-transform duration-300 ease-[var(--ease-out)] group-open:rotate-45"
                >
                  <svg viewBox="0 0 24 24" className="size-4">
                    <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </span>
              </summary>
              <pre className="overflow-x-auto px-6 pb-6 text-[length:var(--step-small)] leading-relaxed text-[var(--paper)] [overflow-wrap:anywhere] whitespace-pre-wrap md:px-8 md:pb-8">
                <code>{t.code}</code>
              </pre>
            </details>
          </div>
        </li>
      ))}
    </ol>
  );
}
