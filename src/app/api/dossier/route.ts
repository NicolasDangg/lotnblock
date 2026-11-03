import { buildDossier } from "@/lib/dossier";

// The city portal check is a TinyFish Agent run that can take a few minutes.
export const maxDuration = 300;

/**
 * GET /api/dossier?q=<address or parcel>
 * Streams newline-delimited JSON events (see DossierEvent) as each source answers.
 */
export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q")?.trim();
  if (!q) return Response.json({ error: "Pass an address or parcel number as ?q=" }, { status: 400 });

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      await buildDossier(q.slice(0, 200), (e) => controller.enqueue(encoder.encode(JSON.stringify(e) + "\n")));
      controller.close();
    },
  });
  return new Response(stream, {
    headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store" },
  });
}
