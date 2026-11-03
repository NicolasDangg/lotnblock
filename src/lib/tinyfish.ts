import { TinyFish } from "@tiny-fish/sdk";

let client: TinyFish | null = null;

/** Server-only TinyFish client. Reads TINYFISH_API_KEY from the environment. */
export function tinyfish(): TinyFish {
  if (!process.env.TINYFISH_API_KEY) {
    throw new Error("Missing TINYFISH_API_KEY");
  }
  client ??= new TinyFish();
  return client;
}

export interface FetchResult {
  url: string;
  final_url?: string;
  text: string | null;
}

/**
 * Direct Fetch API call (same endpoint and auth as the SDK), so we control every option.
 * `ttl: 0` asks for a live read: a dossier is only worth trusting if it's current.
 * `includeSelectors` returns exactly those elements; without it, Fetch's "main content" cleaner
 * may keep only the biggest block of a page and silently drop the rest.
 */
export async function fetchPage(
  url: string,
  format: "html" | "markdown" = "html",
  includeSelectors?: string[],
): Promise<FetchResult> {
  const res = await fetch("https://api.fetch.tinyfish.ai", {
    method: "POST",
    headers: { "X-API-Key": process.env.TINYFISH_API_KEY ?? "", "Content-Type": "application/json" },
    body: JSON.stringify({ urls: [url], format, ttl: 0, include_selectors: includeSelectors }),
    signal: AbortSignal.timeout(60_000),
  });
  if (!res.ok) throw new Error(`TinyFish Fetch ${res.status}`);
  const body = (await res.json()) as { results: FetchResult[]; errors?: { url: string; error: string }[] };
  const hit = body.results[0];
  if (!hit?.text) throw new Error(body.errors?.[0]?.error ?? "Fetch returned no content");
  return hit;
}
