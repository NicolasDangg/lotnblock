/** Minimal table helpers for the government pages we read. They're simple server-rendered tables. */

const ENTITIES: Record<string, string> = { "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&#39;": "'", "&nbsp;": " " };

export function cellText(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;(?=[a-z#0-9]+;)/gi, "&") // the county double-encodes some text ("&amp;amp;")
    .replace(/&[a-z#0-9]+;/gi, (e) => ENTITIES[e] ?? " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** The inner HTML of `<table id="...">`, or null if the page doesn't have it. Assumes no nested tables. */
export function tableById(html: string, id: string): string | null {
  const start = html.search(new RegExp(`<table[^>]*\\bid="${id}"`));
  if (start < 0) return null;
  const end = html.indexOf("</table>", start);
  return end < 0 ? null : html.slice(start, end);
}

/** Rows of `<td>` text. Header rows (`<th>`) are skipped. */
export function tableRows(tableHtml: string): string[][] {
  return [...tableHtml.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)]
    .map((m) => [...m[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((c) => cellText(c[1])))
    .filter((cells) => cells.length > 0);
}

/** Two-column label/value tables ("Zoning | SM-UP 95 (M)") as a record. */
export function labelValues(tableHtml: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [label, value] of tableRows(tableHtml)) if (label) out[label] = value ?? "";
  return out;
}

/** "$1,350,071" or "8,211,000" → 1350071; blank → null. */
export function money(s: string | undefined): number | null {
  const n = (s ?? "").replace(/[$,\s]/g, "");
  return n && !Number.isNaN(Number(n)) ? Number(n) : null;
}
