import { parcelNumber } from "@/lib/resolve";
import { record, sign, toAlert, type WebhookPayload } from "@/lib/monitor";

/**
 * POST /api/watch/hook?pin=<parcel>&sig=<signature>
 * TinyFish Monitor posts every scheduled check of a watched parcel here. The signature was put in
 * the URL when the watch was created, so nobody else can post alerts for a parcel.
 */
export async function POST(request: Request) {
  const params = new URL(request.url).searchParams;
  const pin = parcelNumber(params.get("pin") ?? "");
  if (!pin || params.get("sig") !== sign(pin)) return new Response("Unknown watch", { status: 403 });
  const payload = (await request.json().catch(() => null)) as WebhookPayload | null;
  if (!payload) return new Response("Expected a Monitor result", { status: 400 });
  await record(pin, toAlert(payload));
  return Response.json({ ok: true });
}
