"use client";

import { PinMarkers, usePinned } from "@/components/motion/usePinned";
import { StreamText } from "@/components/motion/StreamText";

export interface ToolStep {
  name: string;
  job: string;
  state: "live" | "next";
  /** A real request (and, when live, the real response) shown as code. */
  code: string;
}

/** Pinned chapter: the four TinyFish tools, one screen each, the code streaming in as you arrive. */
export function ToolsStory({ tools }: { tools: ToolStep[] }) {
  const { ref, step, progress } = usePinned(tools.length);
  const t = tools[step];

  return (
    <section ref={ref} className="relative" style={{ height: `${tools.length * 100}svh` }} aria-labelledby="tools-title">
      <PinMarkers steps={tools.length} />
      <div className="sticky top-0 flex h-svh flex-col gap-[var(--gap)] p-[var(--gap)]">
        <div className="flex flex-1 flex-col bg-[var(--ink)] text-[var(--paper)] md:flex-row">
          <div className="flex min-w-0 flex-col justify-between gap-8 px-[var(--pad)] py-10 md:w-[42%] md:py-14">
            <h2 id="tools-title" className="t-lead name">
              Four TinyFish tools, one job each
            </h2>
            <div>
              {/* The tool name runs out and in as the step changes. */}
              <p key={t.name} className="t-mark tool-in text-[clamp(3.5rem,7.5vw,8.5rem)]">
                {t.name}
              </p>
              <p className="t-lead mt-6 max-w-[26ch]" key={t.job}>
                <StreamText text={t.job} cps={70} caret={false} />
              </p>
              <p className={`mt-6 inline-block px-3 py-1 ${t.state === "live" ? "bg-[var(--field-sage)] text-[var(--ink)]" : "bg-[var(--muted)]"}`}>
                {t.state === "live" ? "Live in this build" : "Connecting next. Nothing it would return is shown yet."}
              </p>
            </div>
            <ol className="flex gap-2" aria-label="Tools">
              {tools.map((x, i) => (
                <li key={x.name} className="h-2 flex-1 bg-[var(--muted)]">
                  <span
                    className="block h-full origin-left bg-[var(--paper)]"
                    style={{
                      transform: `scaleX(${Math.min(1, Math.max(0, progress * tools.length - i))})`,
                    }}
                  />
                  <span className="sr-only">{x.name}</span>
                </li>
              ))}
            </ol>
          </div>
          <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-[#2a2a28] p-6 md:p-10" data-ui>
            <pre className="min-h-0 flex-1 overflow-hidden text-[length:var(--step-small)] leading-relaxed whitespace-pre-wrap text-[var(--paper)] [overflow-wrap:anywhere]">
              <code>
                <StreamText key={t.name} text={t.code} cps={260} />
              </code>
            </pre>
          </div>
        </div>
      </div>
    </section>
  );
}
