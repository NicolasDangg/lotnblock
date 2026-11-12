/**
 * TinyFish Agent runs for the dossier. A portal search takes minutes, longer than a web request
 * should wait, so runs are queued and then checked on: the first call starts the run and reports
 * "running", later calls look at its progress and, once it has finished, return the result.
 *
 * TinyFish's own run history is the record of what has been searched, so nothing is searched twice
 * even when the site's cache is empty (a new deployment, another region): before starting a run we
 * look for the same goal there. A run still going is waited on; a finished one is reused; one that
 * failed recently is reported as failed rather than retried on every page view.
 *
 * Guards for a public site: finished results are also cached per key (Vercel Runtime Cache), and a
 * daily cap stops a busy day or a scraper from draining the wallet.
 */
import { getCache } from "@vercel/functions";
import type { Run } from "@tiny-fish/sdk";
import { tinyfish } from "./tinyfish";

const cache = getCache({ namespace: "lotnblock" });

/** Live Agent runs allowed per day across the site. Set AGENT_DAILY_LIMIT to change it; 0 turns them off. */
const DAILY_LIMIT = Number(process.env.AGENT_DAILY_LIMIT ?? 25);
/**
 * A run still going after this long is treated as stuck, and a fresh one may start. Long enough
 * for runs that wait in TinyFish's queue (the plan runs two at a time) before they start.
 */
const STUCK_AFTER_MS = 30 * 60_000;
/** After a run fails, wait this long before trying the same search again. */
const RETRY_AFTER_MS = 6 * 3600_000;

export class AgentUnavailable extends Error {}

export type AgentState<T> =
  | { state: "done"; data: T; retrievedAt: string; cached: boolean }
  | { state: "running"; runId: string; startedAt: string };

export interface AgentJob<T> {
  key: string;
  url: string;
  goal: string;
  schema: Record<string, unknown>;
  ttlSeconds: number;
  maxSeconds?: number;
  /** Whether the run really finished its task. A run that didn't is an error, never cached. */
  complete: (data: T) => boolean;
}

const inFlight = new Map<string, Promise<AgentState<unknown>>>();

/**
 * Starts the run if needed, or reports on it. Throws if the run failed or can't be started.
 * Calls for the same key at the same moment (the permits and complaints sections ask together)
 * share one check, so they never start two runs.
 */
export function agentJob<T>(job: AgentJob<T>): Promise<AgentState<T>> {
  const shared = inFlight.get(job.key);
  if (shared) return shared as Promise<AgentState<T>>;
  const p = step(job).finally(() => inFlight.delete(job.key));
  inFlight.set(job.key, p);
  return p;
}

/** The latest TinyFish run of exactly this goal on this site, within the cache window. */
async function latestRun<T>(job: AgentJob<T>): Promise<Run | null> {
  const since = new Date(Date.now() - job.ttlSeconds * 1000).toISOString().replace(/\.\d+Z$/, "Z");
  const { data } = await tinyfish().runs.list({
    goal: job.goal.slice(0, 400),
    created_after: since,
    sort_direction: "desc",
    limit: 10,
  });
  // TinyFish stores the goal as "Navigate to <url> to complete the goal: <goal>".
  return data.find((r) => r.goal.endsWith(job.goal) && r.goal.includes(job.url)) ?? null;
}

async function step<T>(job: AgentJob<T>): Promise<AgentState<T>> {
  const hit = (await cache.get(job.key)) as { data: T; retrievedAt: string } | null;
  if (hit) return { state: "done", ...hit, cached: true };

  const last = await latestRun(job);
  if (last) {
    const age = Date.now() - Date.parse(last.created_at);
    const going = last.status === "PENDING" || last.status === "RUNNING";
    if (going && age < STUCK_AFTER_MS) {
      return { state: "running", runId: last.run_id, startedAt: last.created_at };
    }
    if (last.status === "COMPLETED" && last.result && job.complete(last.result as T)) {
      const out = { data: last.result as T, retrievedAt: last.finished_at ?? last.created_at };
      // Count the week from when the portal was read, not from when we noticed the run.
      const age = Math.floor((Date.now() - Date.parse(out.retrievedAt)) / 1000);
      await cache.set(job.key, out, { ttl: Math.max(60, job.ttlSeconds - age) });
      return { state: "done", ...out, cached: false };
    }
    if (!going && age < RETRY_AFTER_MS) {
      const why =
        last.status === "COMPLETED" ? "the search stopped before it finished" : (last.error?.message ?? `the run ${last.status.toLowerCase()}`);
      const retry = new Date(Date.parse(last.created_at) + RETRY_AFTER_MS).toISOString().slice(11, 16);
      throw new AgentUnavailable(`${why}; it will be tried again after ${retry} UTC`);
    }
  }

  const day = `agent-runs:${new Date().toISOString().slice(0, 10)}`;
  const used = Number((await cache.get(day)) ?? 0);
  if (used >= DAILY_LIMIT) {
    throw new AgentUnavailable("today's limit of live portal checks is used up; it resets at midnight UTC");
  }
  await cache.set(day, used + 1, { ttl: 2 * 86_400 });

  const queued = await tinyfish().agent.queue({
    url: job.url,
    goal: job.goal,
    output_schema: job.schema,
    browser_profile: "lite",
    agent_config: { max_duration_seconds: job.maxSeconds ?? 240 },
  });
  if (!queued.run_id) throw new Error(queued.error?.message ?? "the run couldn't be started");
  return { state: "running", runId: queued.run_id, startedAt: new Date().toISOString() };
}
