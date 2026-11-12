# Lot & Block

**Public records for any house in King County, Washington, read live from the official sites.**

Live: **https://lotnblock.vercel.app** · Built for TinyFish Student Bounty Drop 002 (Property Dossier).

Type an address or a parcel number. You get a dossier with zoning, assessed values, sales, tax bills,
permits, code complaints, flood zone, mapped hazards and nearby schools. It comes as a readable report
and as JSON, and every item links to the government page it came from. When a source can't be read,
the report says so instead of guessing. Any address can be watched, and a TinyFish Monitor then reports
new permits, sales, owner or value changes every morning.

## Demo addresses

| Address | What it shows | Report | JSON |
| --- | --- | --- | --- |
| 4122 Wallingford Ave N, Seattle | A house. City permits the assessor never recorded (a 2020 furnace permit), no code complaints, taxes paid, flood zone X, 8 schools within 1.5 miles | [report](https://lotnblock.vercel.app/report?q=4122%20Wallingford%20Ave%20N%2C%20Seattle) | [json](https://lotnblock.vercel.app/api/dossier?q=4122%20Wallingford%20Ave%20N%2C%20Seattle) |
| 1600 E Olive Way, Seattle | A shop. About 50 city records, each linked to its own page on the city portal, including 3 code complaints and a vacant-building case, high traffic noise, valued as a business | [report](https://lotnblock.vercel.app/report?q=1600%20E%20Olive%20Way%2C%20Seattle) | [json](https://lotnblock.vercel.app/api/dossier?q=1600%20E%20Olive%20Way%2C%20Seattle) |
| 11418 NE 19th St, Bellevue | Outside Seattle. TinyFish Search finds Bellevue's permit search (MyBuildingPermit) and Agent reads it, including a pending daycare permit | [report](https://lotnblock.vercel.app/report?q=11418%20NE%2019th%20St%2C%20Bellevue) | [json](https://lotnblock.vercel.app/api/dossier?q=11418%20NE%2019th%20St%2C%20Bellevue) |
| 38575 SE Newton St, Snoqualmie | Flood risk. FEMA zone AE (flood insurance required) and the county's 100-year floodplain | [report](https://lotnblock.vercel.app/report?q=38575%20SE%20Newton%20St%2C%20Snoqualmie) | [json](https://lotnblock.vercel.app/api/dossier?q=38575%20SE%20Newton%20St%2C%20Snoqualmie) |

It works for any address in King County's address list (39 cities and the unincorporated county), not a
fixed set. City permits and code complaints take a few minutes the first
time an address is looked up, because an Agent searches the portal live. The rest of the report shows
at once, and those sections fill in when the search finishes.

## How TinyFish is used

| Tool | What it does here | Why it's needed |
| --- | --- | --- |
| **Fetch** | Reads the King County Assessor's page for the parcel (zoning, lot, 30 years of assessed values, sales, appeals, permits on file), the county's districts and development conditions report (school district, floodplain, landslide, erosion and seismic hazards, wetlands), FEMA's flood map at the point, and each nearby school's NCES directory page. | These are pages with stable links but no API. The assessor's page is a large ASP.NET page; Fetch's `include_selectors` keeps exactly the tables we parse. FEMA and NCES map servers refuse some cloud networks, and Fetch reads them anyway. |
| **Agent** | Searches the Seattle Services Portal for every permit, complaint and violation at the address. Searches the King County Treasurer for tax billed, paid and due. Searches the permit portal that Search found for other cities. | These are search forms with no links to results, so a browser has to fill them in. Runs are queued and the report polls for them; each run must report `search_completed`, so a run that gave up is shown as "Couldn't check", never as "none". |
| **Search** | For an address outside Seattle, finds that city's official permit search (`"Bellevue WA building permit search by address"`), keeping only official hosts (.gov, .us, mybuildingpermit.com). | Each of the 39 cities runs its own permit system. Search is what makes the permit section work county-wide instead of in Seattle only. |
| **Monitor** | "Watch this address" creates a daily Page Monitor. It re-reads a snapshot of the parcel's county records, compares it with the day before, judges the change against the purpose ("a new permit, a sale, a new owner or value…") and posts it to our webhook. Changes show on the report. In Seattle the snapshot also lists the city's newest building permits, land use applications and code complaints within 150 m of the lot, each with its link, so a new permit next door is an alert too. | This is the brief's alert on a new permit or change. Fetch alone can't keep the assessor's permits table, so the Monitor watches `/api/watch/snapshot`, a short text the site rebuilds live from the county pages on every read. |

## Sources (all official)

| Source | Level | Read with | What it gives |
| --- | --- | --- | --- |
| King County Assessor (eReal Property) | County | Fetch | Zoning, present use, lot size, owner, assessed values since the 1990s, sales and transfers, value appeals, permits on file, assessor flags |
| King County districts and development conditions report | County | Fetch | School district, 100-year floodplain, landslide, erosion, seismic and coal mine hazards, wetlands, shoreline, smelter plume, development conditions |
| King County Treasurer | County | Agent | Property tax billed, paid and due by year, account notices |
| Seattle Services Portal | City | Agent | Every permit and its status, code complaints, violations, vacant-building cases |
| City permit searches (MyBuildingPermit and others) | City | Search + Agent | Permits and their status outside Seattle |
| Seattle permit and complaint records by location (data.seattle.gov) | City | Fetch + Monitor | For the watch only: newest building permits, land use applications and code complaints within 150 m |
| FEMA National Flood Hazard Layer | Federal | Fetch | Flood zone, whether flood insurance is required, flood map panel and its date |
| NCES public school directory | Federal | Fetch | Public schools within 1.5 miles, grades, students, student/teacher ratio |

Address matching uses the U.S. Census geocoder and King County's address points. The map uses King
County's 2025 aerial photo and parcel lines. These are glue for the lookup and the picture, not dossier
sources.

## Honesty rules

Every section has one of five states, shown on the page and in the JSON:

- `found`: the source answered with records. Each one is shown as the source lists it. Seattle permits and complaints each link to their own page on the city portal. If the portal says it holds more records than the Agent read, the section says how many are missing.
- `none`: the source answered and lists nothing of that kind. For Agent searches, the note says what was typed into the form.
- `source_error`: the source couldn't be read (down, blocked, the run gave up). The report names the source and the reason and links to the page.
- `not_applicable`: the source doesn't cover this address (for example, Seattle code complaints for a Bellevue house).
- `pending`: an Agent search is still running. Ask `/api/section` again.

Each section also carries `sourceUrl`, `sourceName`, `via` (which TinyFish tool) and `retrievedAt`.

## API

```
GET  /api/dossier?q=<address or parcel>     NDJSON stream: property, outline, one section per source, done
GET  /api/section?q=<parcel>&key=<source>   One source again (used to collect "pending" Agent results)
GET  /api/watch?pin=<parcel>                Is the parcel watched, and its checks so far
POST /api/watch?q=<address or parcel>       Start watching (TinyFish Monitor, daily 7 am Pacific)
POST /api/watch?pin=<parcel>&action=check   Run the watch now
GET  /api/watch/snapshot?pin=<parcel>       The text the Monitor watches
POST /api/watch/hook?pin=&sig=              Monitor webhook (signed per parcel)
```

Source keys: `assessor`, `districts`, `flood`, `schools`, `treasurer`, `permits`, `violations`.

## Cost guards

Fetch and Search are free. Agent is billed per step (about $0.15 to $0.45 for a portal search), and
Monitor costs $0.005 per check.

- Agent results are cached per parcel for 7 days in Vercel Runtime Cache, so repeat lookups are free. Each section shows when it was read. The portal found by Search is remembered per city for 30 days.
- `AGENT_DAILY_LIMIT` (default 25) caps live Agent runs per day across the site. Over the cap, sections say "Couldn't check: today's limit…".
- `MONITOR_LIMIT` (default 40) caps how many addresses the site watches.
- Requests for the same parcel at the same moment share one Agent run.

## Run it locally

```bash
npm install
export TINYFISH_API_KEY=...        # from agent.tinyfish.ai
npm run dev                        # http://localhost:3000
npm run dossier -- "4122 Wallingford Ave N, Seattle"   # the dossier as JSON in the terminal
```

Optional: `AGENT_DAILY_LIMIT`, `MONITOR_LIMIT`, `SITE_URL` (the public URL the Monitor calls back;
defaults to the live site) and `WATCH_SECRET` (signs webhook URLs; defaults to a hash of the API key).

Stack: Next.js 16 (App Router), React 19, Tailwind 4, Leaflet, deployed on Vercel.

## Limits

- King County only. Code complaints are searched in Seattle only; other cities' complaint systems vary.
- Nearby schools are measured in a straight line. Assignment depends on district boundaries, and the report says so.
- Permit portals outside Seattle are found by Search and read by a general Agent instruction. When a portal can't be read, the report says "Couldn't check" and links to it.
- Monitor watches the county's records (permits on file, sales, owner, values, hazards) everywhere. In Seattle it also watches the city's building permits, land use applications and code complaints at and within 150 m of the lot, read with Fetch from the city's published copy of its permit records (data.seattle.gov), which carries coordinates. That copy leaves out trade permits (electrical, mechanical), so the report's own permit list still comes from the portal with Agent, re-read when the address is looked up again. Outside Seattle, nearby permits aren't watched.

Photos on the landing page are from Wikimedia Commons (credits in the footer). None of them shows a
property from a report.
