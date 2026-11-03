import { alerts, checkNow, findWatch, startWatch, WatchLimit, type Monitor } from "@/lib/monitor";
import { parcelNumber, resolve, ResolveError } from "@/lib/resolve";

/**
 * GET  /api/watch?pin=<parcel>                 Is this parcel watched? Its checks so far.
 * POST /api/watch?q=<address or parcel>        Start watching it (TinyFish Monitor, daily at 7 am Pacific).
 * POST /api/watch?pin=<parcel>&action=check    Run the watch now and record the result.
 */
/** What the page may see of a Monitor: never its webhook URL, which carries the signature. */
const visible = (m: Monitor | null) =>
  m && { id: m.id, name: m.name, status: m.status, schedule_cron: m.schedule_cron, created_at: m.created_at };

export async function GET(request: Request) {
  const pin = parcelNumber(new URL(request.url).searchParams.get("pin") ?? "");
  if (!pin) return Response.json({ error: "Pass ?pin=" }, { status: 400 });
  try {
    const monitor = await findWatch(pin);
    return Response.json({ watching: Boolean(monitor), monitor: visible(monitor), alerts: monitor ? await alerts(pin) : [] }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 502 });
  }
}

export async function POST(request: Request) {
  const params = new URL(request.url).searchParams;
  try {
    if (params.get("action") === "check") {
      const pin = parcelNumber(params.get("pin") ?? "");
      const monitor = pin ? await findWatch(pin) : null;
      if (!pin || !monitor) return Response.json({ error: "This parcel isn't watched" }, { status: 404 });
      const alert = await checkNow(monitor.id, pin);
      return Response.json({ alert, alerts: await alerts(pin) });
    }
    const p = await resolve(params.get("q")?.slice(0, 200) ?? "");
    const monitor = await startWatch(p.pin, p.address);
    return Response.json({ watching: true, monitor: visible(monitor), alerts: await alerts(p.pin) });
  } catch (err) {
    const status = err instanceof ResolveError ? 404 : err instanceof WatchLimit ? 429 : 502;
    return Response.json({ error: (err as Error).message }, { status });
  }
}
