const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const int = new Intl.NumberFormat("en-US");

export const money = (n: number | null | undefined) => (n == null ? "Not stated" : usd.format(n));
export const count = (n: number | null | undefined) => (n == null ? "Not stated" : int.format(n));

/** "6848200625" → "684820-0625", the way the county prints it. */
export const parcel = (pin: string) => `${pin.slice(0, 6)}-${pin.slice(6)}`;

/** "1600 E OLIVE WAY" → "1600 E Olive Way" (keeps directionals upper case). */
export function titleCase(s: string) {
  return s
    .toLowerCase()
    .replace(/\b([a-z])/g, (c) => c.toUpperCase())
    .replace(/\b(Ne|Nw|Se|Sw|N|S|E|W)\b/g, (d) => d.toUpperCase());
}

export const time = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", second: "2-digit" });
