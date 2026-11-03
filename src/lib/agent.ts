/**
 * TinyFish Agent runs for the dossier. A portal search takes minutes, longer than a web request
 * should wait, so runs are queued and then checked on: the first call starts the run and reports
 * "running", later calls with the same key look at its progress and, once it has finished, return
 * the result.
 *
 * Two guards for a public site: results are cached per key (a run costs wallet money, and permit
 * records change slowly), and a daily cap stops a busy day or a scraper from draining the wallet.
 * Both live in Vercel's Runtime Cache, shared across function instances in a region (in-memory
 * when run locally).
 */
import { getCache } from "@vercel/functions";
import { tinyfish } from "./tinyfish";

const cache = getCache({ namespace: "lotnblock" });

/** Live Agent runs allowed per day across the site. Set AGENT_DAILY_LIMIT to change it; 0 turns them off. */
const DAILY_LIMIT = Number(process.env.AGENT_DAILY_LIMIT ?? 25);
/** A run still going after this long is treated as stuck, and a fresh one may start. */
const STUCK_AFTER_MS = 12 * 60_000;

export class AgentUnavailable extends Error {}

export type AgentState<T> =
  | { state: "done"; data: T; retrievedAt: string; cached: boolean }
  | { state: "running"; runId: string; startedAt: string };

interface Pending {
  runId: string;
  startedAt: string;
}

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

async function step<T>(job: AgentJob<T>): Promise<AgentState<T>> {
  const hit = (await cache.get(job.key)) as { data: T; retrievedAt: string } | null;
  if (hit) return { state: "done", ...hit, cached: true };

  const pendingKey = `${job.key}:run`;
  const pending = (await cache.get(pendingKey)) as Pending | null;
  if (pending && Date.now() - Date.parse(pending.startedAt) < STUCK_AFTER_MS) {
    const run = await tinyfish().runs.get(pending.runId);
    if (run.status === "PENDING" || run.status === "RUNNING") return { state: "running", ...pending };
    await cache.delete(pendingKey);
    if (run.status !== "COMPLETED" || !run.result) {
      throw new Error(run.error?.message ?? `the run ended as ${run.status.toLowerCase()}`);
    }
    if (!job.complete(run.result as T)) throw new Error("the run stopped before it finished");
    const out = { data: run.result as T, retrievedAt: run.finished_at ?? new Date().toISOString() };
    await cache.set(job.key, out, { ttl: job.ttlSeconds });
    return { state: "done", ...out, cached: false };
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
  const started: Pending = { runId: queued.run_id, startedAt: new Date().toISOString() };
  await cache.set(pendingKey, started, { ttl: STUCK_AFTER_MS / 1000 });
  return { state: "running", ...started };
}
