import assert from "node:assert/strict";
import { test } from "node:test";
import { listedTotal, shortfallNote } from "./cityPortal";
import { listUrl, metresBetween, nearbyLine, parseList } from "./nearby";
import { accountNumber } from "./treasurer";

test("listedTotal reads the portal's own record count", () => {
  assert.deepEqual(listedTotal("Showing 51-52 of 52"), { count: 52, orMore: false });
  assert.deepEqual(listedTotal("Showing 1-9 of 9"), { count: 9, orMore: false });
  assert.deepEqual(listedTotal("Showing 1-25 of 250+"), { count: 250, orMore: true });
  assert.deepEqual(listedTotal("5 records found"), { count: 5, orMore: false });
  assert.deepEqual(listedTotal("1,204 results"), { count: 1204, orMore: false });
});

test("listedTotal gives null when there is no count", () => {
  assert.equal(listedTotal(undefined), null);
  assert.equal(listedTotal(""), null);
  assert.equal(listedTotal("No results were found"), null);
  assert.equal(listedTotal("Page 1 of 3"), null);
});

test("accountNumber keeps real account numbers and drops misreads", () => {
  assert.equal(accountNumber("684820062504"), "684820062504");
  assert.equal(accountNumber(" 532680-0020-05 "), "532680-0020-05");
  assert.equal(accountNumber(">parcel_number:"), "");
  assert.equal(accountNumber(undefined), "");
});

test("shortfallNote speaks up only when records went unread", () => {
  assert.equal(shortfallNote("Showing 1-9 of 9", 9), undefined);
  assert.equal(shortfallNote(undefined, 3), undefined);
  assert.match(shortfallNote("Showing 51-52 of 52", 47) ?? "", /lists 52 records .* 47 were read/);
  assert.match(shortfallNote("Showing 1-25 of 250+", 50) ?? "", /lists 250 or more records .* 50 were read/);
});

const PERMITS =
  '[{"permitnum":"7141358-CN","permittypedesc":"Addition/Alteration","description":"Construct shoring to  existing foundations per plan.","statuscurrent":"Issued","applieddate":"2026-06-11T00:00:00.000","originaladdress1":"1661 E OLIVE WAY","latitude":"47.61954958","longitude":"-122.32371956"}\n,{"permitnum":"X-1","originaladdress1":"1600 E OLIVE WAY","applieddate":"2026-01-02","latitude":"47.6194","longitude":"-122.32506"}\n,{"permitnum":"NO-DATE"}]';

test("parseList reads the city's list and measures the distance", () => {
  const rows = parseList("Building permit", PERMITS, 47.6194, -122.32506);
  assert.equal(rows.length, 2); // the undated row is dropped
  assert.equal(rows[0].number, "7141358-CN");
  assert.equal(rows[0].date, "2026-06-11");
  assert.equal(rows[0].metres, 100);
  assert.equal(rows[0].url, "https://services.seattle.gov/portal/customize/LinkToRecord.aspx?altId=7141358-CN");
  assert.equal(rows[0].description, "Construct shoring to existing foundations per plan.");
});

test("parseList undoes Fetch's markdown escapes and refuses a non-list", () => {
  assert.equal(parseList("Code complaint", '[{"recordnum":"1\\-CP","opendate":"2026-11-05"}]', 0, 0)[0].number, "1-CP");
  assert.throws(() => parseList("Code complaint", '{"error":true}', 0, 0));
  assert.throws(() => parseList("Code complaint", "<html>403</html>", 0, 0));
});

test("nearbyLine is stable and says where the record is", () => {
  const [far, own] = parseList("Building permit", PERMITS, 47.6194, -122.32506);
  assert.equal(
    nearbyLine(far, "1600 E OLIVE WAY"),
    "2026-06-11: Building permit 7141358-CN at 1661 E OLIVE WAY, about 100 m away (Addition/Alteration, Issued): Construct shoring to existing foundations per plan. https://services.seattle.gov/portal/customize/LinkToRecord.aspx?altId=7141358-CN",
  );
  assert.match(nearbyLine(own, "1600 E Olive Way"), /^2026-01-02: Building permit X-1 at this address \(\) https/);
  const [complaint] = parseList("Code complaint", '[{"recordnum":"9-CP","recordtypedesc":"Noise","statuscurrent":"Closed","opendate":"2026-11-05","description":"Mr X did a thing","originaladdress1":"1 A ST"}]', 0, 0);
  assert.equal(nearbyLine(complaint, "2 B ST"), "2026-11-05: Code complaint 9-CP at 1 A ST (Noise, Closed) https://services.seattle.gov/portal/customize/LinkToRecord.aspx?altId=9-CP");
});

test("listUrl asks for dated records near the point, newest first", () => {
  const u = new URL(listUrl("76t5-zqzr", "applieddate", 47.6194, -122.32506, "2026-11-12"));
  assert.equal(u.pathname, "/resource/76t5-zqzr.json");
  assert.equal(u.searchParams.get("$where"), "within_circle(location1,47.619400,-122.325060,150) AND applieddate IS NOT NULL AND applieddate <= '2026-11-12'");
  assert.equal(u.searchParams.get("$order"), "applieddate DESC");
  assert.ok(Math.abs(metresBetween(47.6194, -122.32506, 47.61954958, -122.32371956) - 102) < 3);
});
