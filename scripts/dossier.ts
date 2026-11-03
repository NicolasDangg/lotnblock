/**
 * CLI: build a dossier for one address or parcel and print it as JSON.
 *   npm run dossier -- "400 Broad St, Seattle"
 */
import { resolve } from "../src/lib/resolve";
import { assessor } from "../src/lib/sources/assessor";

const input = process.argv.slice(2).join(" ").trim();
if (!input) {
  console.error('Usage: npm run dossier -- "<address or parcel number>"');
  process.exit(1);
}

const t0 = Date.now();
const property = await resolve(input);
console.error(`resolved → parcel ${property.pin}, ${property.address}, ${property.city} ${property.zip}`);
const assessed = await assessor(property);
console.log(JSON.stringify({ property, sections: { assessor: assessed } }, null, 2));
console.error(`done in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
