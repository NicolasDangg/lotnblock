/**
 * "Watch this address", built on TinyFish Monitor.
 *
 * A Monitor re-reads one URL on a schedule, compares it with the last read, judges whether the
 * change matters against a stated purpose, and posts the result to a webhook. The assessor's page
 * is too big for a plain read (Fetch keeps only its value table), so the Monitor watches
 * /api/watch/snapshot instead: a short, stable text of the parcel's official records that is
 * rebuilt live from the King County sites (via TinyFish Fetch) every time it is read. A new permit,
 * a sale, an owner change or a new assessed value changes that text, and the Monitor reports it.
 *
 * Scheduled results arrive at /api/watch/hook and are kept in Vercel Runtime Cache for the report.
 */
import { createHmac } from "node:crypto";
import { getCache } from "@vercel/functions";

const API = "https://agent.tinyfish.ai/v1/monitors";
/** The public site: Monitor must reach both the snapshot and the webhook from the internet. */
export const SITE_URL = (process.env.SITE_URL ?? "https://lotnblock.vercel.app").replace(/\/$/, "");
/** How many addresses the site will watch at once. Each check costs $0.005; keep it bounded. */
const LIMIT = Number(process.env.MONITOR_LIMIT ?? 40);
const NAME_PREFIX = "Lot & Block:";
const SCHEDULE = "CRON_TZ=America/Los_Angeles 0 7 * * *";
const PURPOSE =
  "A new building permit, a new sale or transfer, a change of owner, a new assessed value, or a new hazard flag appears for this parcel.";

const cache = getCache({ namespace: "lotnblock" });

export interface Monitor {
  id: string;
  name: string;
  status: string;
  schedule_cron: string;
  created_at: string;
  config: { url?: string };
  last_error?: string | null;
}

export interface Alert {
  at: string;
  outcome: "changed" | "unchanged" | "baseline";
  /** TinyFish's judgment of the change against the purpose; null when no check was made. */
  relevant: boolean | null;
  summary: string | null;
  /** Lines added or removed, from the Monitor's diff. */
  added: string[];
  removed: string[];
}

export const snapshotUrl = (pin: string) => `${SITE_URL}/api/watch/snapshot?pin=${pin}`;

/** A webhook signature, so only TinyFish (which got the URL from us) can post alerts for a parcel. */
export const sign = (pin: string) =>
  createHmac("sha256", process.env.WATCH_SECRET ?? process.env.TINYFISH_API_KEY ?? "")
    .update(pin)
    .digest("hex")
    .slice(0, 24);

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: { "X-API-Key": process.env.TINYFISH_API_KEY ?? "", "Content-Type": "application/json" },
    signal: AbortSignal.timeout(60_000),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((body as { error?: { message?: string } }).error?.message ?? `Monitor API ${res.status}`);
  return body as T;
}

async function ours(): Promise<Monitor[]> {
  const { monitors } = await api<{ monitors: Monitor[] }>("");
  return monitors.filter((m) => m.name?.startsWith(NAME_PREFIX));
}

export async function findWatch(pin: string): Promise<Monitor | null> {
  return (await ours()).find((m) => m.config?.url === snapshotUrl(pin)) ?? null;
}

export class WatchLimit extends Error {}

/** Starts watching a parcel, or returns the Monitor that already does. */
export async function startWatch(pin: string, address: string): Promise<Monitor> {
  const all = await ours();
  const existing = all.find((m) => m.config?.url === snapshotUrl(pin));
  if (existing) return existing;
  if (all.length >= LIMIT) throw new WatchLimit(`the site is already watching ${all.length} addresses, its limit`);
  const { monitor, run } = await api<{ monitor: Monitor; run?: { results?: { text?: string }[] } }>("", {
    method: "POST",
    body: JSON.stringify({
      type: "fetch",
      name: `${NAME_PREFIX} ${address} (${pin})`.slice(0, 100),
      config: { url: snapshotUrl(pin), format: "markdown" },
      schedule_cron: SCHEDULE,
      purpose: PURPOSE,
      webhook_url: `${SITE_URL}/api/watch/hook?pin=${pin}&sig=${sign(pin)}`,
    }),
  });
  await record(pin, {
    at: new Date().toISOString(),
    outcome: "baseline",
    relevant: null,
    summary: run?.results?.[0]?.text ? "First read of the records saved; later checks compare against it." : null,
    added: [],
    removed: [],
  });
  return monitor;
}

/** Runs the Monitor now. TinyFish records the run but sends no webhook for it, so we record it here. */
export async function checkNow(monitorId: string, pin: string): Promise<Alert> {
  const { run } = await api<{ run: WebhookPayload }>(`/${monitorId}/runs`, { method: "POST" });
  const alert = toAlert(run);
  await record(pin, alert);
  return alert;
}

export interface WebhookPayload {
  id?: string;
  is_baseline?: boolean;
  outcome?: "changed" | "unchanged" | "baseline";
  diff?: string | null;
  judgment?: { is_relevant: boolean | null; summary: string | null } | null;
}

export function toAlert(p: WebhookPayload): Alert {
  const lines = (p.diff ?? "").split("\n");
  const keep = (sign: "+" | "-") =>
    lines
      .filter((l) => l.startsWith(sign) && !l.startsWith(`${sign}${sign}${sign}`))
      .map((l) => l.slice(1).trim())
      .filter(Boolean)
      .slice(0, 12);
  return {
    at: new Date().toISOString(),
    outcome: p.outcome ?? (p.is_baseline ? "baseline" : "unchanged"),
    relevant: p.judgment?.is_relevant ?? null,
    summary: p.judgment?.summary ?? null,
    added: keep("+"),
    removed: keep("-"),
  };
}

const alertsKey = (pin: string) => `watch-alerts:v1:${pin}`;

/** Keeps the latest 30 checks per parcel, newest first. */
export async function record(pin: string, alert: Alert) {
  const list = ((await cache.get(alertsKey(pin))) as Alert[] | null) ?? [];
  await cache.set(alertsKey(pin), [alert, ...list].slice(0, 30), { ttl: 365 * 86_400 });
}

export async function alerts(pin: string): Promise<Alert[]> {
  return ((await cache.get(alertsKey(pin))) as Alert[] | null) ?? [];
}
