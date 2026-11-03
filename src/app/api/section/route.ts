import { resolve, ResolveError } from "@/lib/resolve";
import { SOURCES } from "@/lib/sources";

/**
 * GET /api/section?q=<address or parcel>&key=<source key>
 * Runs one source again. Slow sources answer "pending" while their TinyFish Agent run works;
 * the report asks again every few seconds until the answer is in.
 */
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const q = params.get("q")?.trim().slice(0, 200);
  const source = SOURCES.find((s) => s.key === params.get("key") && s.run);
  if (!q || !source) return Response.json({ error: "Pass ?q= and the key of a working source" }, { status: 400 });
  try {
    const property = await resolve(q);
    return Response.json({ key: source.key, section: await source.run!(property) }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    const message = err instanceof ResolveError ? err.message : "Couldn't look that address up";
    return Response.json({ error: message }, { status: 404 });
  }
}
