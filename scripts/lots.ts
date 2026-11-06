/**
 * Snapshot the landing page's "Around King County" row: read every lot in LOT_ADDRESSES from the
 * county, save each aerial photo to public/lots/, and write the cards' data to src/data/lots.json.
 *   npm run lots
 * Re-run it to refresh the values; a lot the county didn't answer for keeps its previous snapshot.
 */
import { readFile, writeFile } from "node:fs/promises";
import { LOT_ADDRESSES, readLot, type Lot } from "../src/lib/lots";

const OUT = "src/data/lots.json";
const previous: Lot[] = JSON.parse(await readFile(OUT, "utf8").catch(() => "[]"));

const lots: Lot[] = [];
for (const input of LOT_ADDRESSES) {
  const lot = await readLot(input).catch((e) => (console.error(`  ${input}: ${(e as Error).message}`), null));
  if (!lot) {
    const old = previous.find((l) => l.input === input);
    console.error(`✗ ${input}${old ? " (kept the previous snapshot)" : " (left out)"}`);
    if (old) lots.push(old);
    continue;
  }
  const res = await fetch(lot.photo, { signal: AbortSignal.timeout(60_000) });
  if (!res.ok) throw new Error(`aerial photo for ${input}: ${res.status}`);
  await writeFile(`public/lots/${lot.pin}.jpg`, Buffer.from(await res.arrayBuffer()));
  lots.push({ ...lot, photo: `/lots/${lot.pin}.jpg` });
  console.error(`✓ ${input}`);
}

await writeFile(OUT, JSON.stringify(lots, null, 2) + "\n");
console.error(`saved ${lots.length} lots to ${OUT}`);
