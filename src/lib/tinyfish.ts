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

/**
 * Several pages in one Fetch request. Returns each page's text in the order asked, or null for a
 * page Fetch couldn't read, so a caller can flag exactly which record is missing.
 */
export async function fetchPages(urls: string[], format: "html" | "markdown" = "markdown"): Promise<(string | null)[]> {
  if (!urls.length) return [];
  const res = await fetch("https://api.fetch.tinyfish.ai", {
    method: "POST",
    headers: { "X-API-Key": process.env.TINYFISH_API_KEY ?? "", "Content-Type": "application/json" },
    body: JSON.stringify({ urls, format, ttl: 0 }),
    signal: AbortSignal.timeout(60_000),
  });
  if (!res.ok) throw new Error(`TinyFish Fetch ${res.status}`);
  const body = (await res.json()) as { results: FetchResult[] };
  const byUrl = new Map(body.results.map((r) => [r.url, r.text]));
  return urls.map((u) => byUrl.get(u) ?? null);
}

/** TinyFish Search: ranked web results for a query. */
export async function searchWeb(query: string, purpose?: string) {
  const res = await tinyfish().search.query({ query, purpose, location: "US" });
  return res.results.map((r) => ({ url: r.url, title: r.title, snippet: r.snippet }));
}

/**
 * A JSON endpoint on a government map server. Asked directly first; some (FEMA, NCES) refuse or
 * time out from cloud networks, so on failure the same URL is read through TinyFish Fetch, which
 * returns the body as text with markdown escapes on underscores.
 */
export async function fetchJson<T>(url: string): Promise<T> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(12_000) });
    if (res.ok) return (await res.json()) as T;
  } catch {
    // fall through to TinyFish
  }
  const [text] = await fetchPages([url]);
  if (!text) throw new Error("the map server didn't answer");
  return JSON.parse(text.replace(/\\_/g, "_")) as T;
}
