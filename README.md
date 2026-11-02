# Fatima Tour and Travel

Static Astro 7.4.2 website for Goa tours, driver-included vehicles, airport transfers and group travel. Confirmed production origin: **https://fatimatourandtravels.com/**. The built site needs no database, mail backend or server runtime.

## Development and checks

Use Node 24 (verified with 24.19.0), npm and the committed lockfile.

```powershell
npm ci
npm run dev
npm run check
npm run build
npm run audit
npm run serve:dist            # Vercel-like local server on :4322 (Brotli, cache/security headers, redirects, real 404s)
```

In another terminal while preview runs:

```powershell
npx playwright install chromium
npm run test:http
npm run test:enquiry
npm test
npm run test:stage2           # axe on every route, 6 viewports, keyboard, reduced motion, touch targets
npm run test:visual -- http://localhost:4400 http://localhost:4322   # pixel diff between two served builds
```

Lighthouse is a QA-only tool and is not a site dependency. Install it once into the gitignored tooling folder, then run medians against a served build:

```powershell
npm i --prefix output/stage2/lh-tools lighthouse@13.6.0 chrome-launcher
npm run perf:lighthouse -- after http://localhost:4322 3
```

`audit` inspects every built HTML page, linked resources, CSS, metadata, JSON-LD, sitemap and icons. `test:http` checks local HTTP responses and MIME types plus hosting configuration assertions. `test:enquiry` mocks handoffs and covers validation/fallbacks. `npm test` runs the existing browser regression suite at six widths, interactions and representative axe scans. Tests never send WhatsApp messages or place calls. Set `QA_BASE_URL` for another local preview. `npm run preview -- --port 4322` also works for most checks, but Astro preview does not apply vercel.json, so prefer `serve:dist` for status codes, headers and performance measurement.

Evidence is gitignored under `output/stage1/`, `output/stage2/` and `output/playwright/`. There is no ESLint configuration: Astro check and Prettier are the available source checks. See [Stage 1 report](docs/STAGE-1-REPORT.md) and [route inventory](docs/ROUTE-INVENTORY.md). Stage 2 performance/accessibility results are in the [Stage 2 report](docs/STAGE-2-REPORT.md).

## Project structure

```text
src/pages/                File routes, dynamic catalogue pages, robots and sitemap endpoints
src/layouts/Layout.astro  Shared navigation, footer, metadata and JSON-LD
src/components/           Existing UI and enquiry form
src/scripts/site.ts       Navigation, gallery, filters and WhatsApp form handling
src/data/site.ts          Contacts, vehicles, tours, services and FAQs
src/data/images.json      Image keys and responsive paths
src/styles/               Existing visual design
public/assets/brand/      Supplied logo, header renditions and 1200×630 social image
public/assets/vehicles/   Vehicle renditions and original Winger video
public/assets/editorial/  Destination renditions
public/assets/illustrations/ Existing generated scenes
public/favicon*           ICO, SVG and 48/96/192/512 PNG icons
public/apple-touch-icon.png
public/site.webmanifest
source-files/original-images/{brand,vehicles,editorial,ai}/ Original masters and generation log
source-files/unused-renditions/ Archived obsolete/duplicate derivatives
scripts/                  Audit, browser QA, maintenance and original generation tools
docs/                     Search Console guide, inventory and Stage 1 handover
vercel.json               Static output, redirects and security headers
```

Only `dist/` is deployed. Keep originals and unused renditions outside `public/`. Public filenames use lowercase and hyphens; fonts are bundled locally by Astro. Provenance: [ASSET-SOURCES.md](ASSET-SOURCES.md).

## Enquiries and contacts

`src/data/site.ts` owns WhatsApp `918080643517`, phone `+918080643517` and existing public email `vaseem9823@gmail.com`.

The homepage planner sends service/vehicle/date choices to the contact page using GET; it contains no personal fields. The contact form validates details, prepares an encoded WhatsApp message with the current page URL (without query/fragment), displays a draft and synchronously opens WhatsApp from the submit action. The visitor reviews and sends manually. Opening a link confirms neither delivery nor a booking.

Personal controls remain disabled until the form handler loads. Direct WhatsApp/call links work without JavaScript. Copy/manual-selection, offline and blocked-window fallbacks preserve the draft. No form posts to email or an enquiry endpoint. An optional entered email is only part of the WhatsApp draft; public `mailto:` links remain separate contact links. No enquiry values are deliberately written to analytics, logs or persistent browser storage. `/privacy-policy/` describes this process and hosting/WhatsApp processing.

## Domain and deployment

The Astro config defaults to the confirmed HTTPS origin. Optional `PUBLIC_SITE_URL` must use that origin; `.env.example` has no credentials. Ordinary builds contain 31 indexable pages, a crawlable `/robots.txt` and `/sitemap.xml`. The 404 is noindex without a canonical. Dynamic catalogue data also drives the sitemap; adding a static page requires adding it to the endpoint, and `npm run audit` detects omissions. No invented modification dates are emitted.

Public responses and DNS confirm Vercel hosting. Git remote: `https://github.com/pv-webservices/goa-tour-travel.git`, current branch `main`. The Vercel dashboard's Git connection/production branch could not be verified without credentials. Do not assume a push will or will not deploy.

After Stage 2 and explicit deployment authorization:

1. Verify the Vercel project/repository/root/production branch. Use framework Astro, `npm run build` and output `dist`. No server adapter is needed.
2. Make `fatimatourandtravels.com` preferred in Vercel Domains, with `www` directed to it. Remove any opposite apex-to-www redirect to prevent a loop. Existing Hostinger DNS already points to Vercel; do not replace working records blindly.
3. Confirm Vercel previews are protected or have appropriate response noindex handling. Canonicals alone do not prevent preview indexing.
4. Run the checks above, review the diff, then commit/push/deploy only with authorization. Stage 1 remains uncommitted and undeployed.
5. Verify live HTTPS/domain/slash/index/legacy redirects and query preservation, headers, true nested 404s, pages, icons, robots and sitemap. Astro preview does **not** execute `vercel.json`; local checks are not production proof.
6. Follow [GOOGLE-SEARCH-CONSOLE.md](docs/GOOGLE-SEARCH-CONSOLE.md). Real WhatsApp enquiries and calls require separate authorization.

Vercel rules use permanent 308 redirects for domain/index and known former WordPress routes. There is no SPA catch-all rewrite or Apache/Netlify configuration. Another static host must explicitly serve `404.html` with status 404 for missing and nested paths.

## Asset management

All 77 original image masters are preserved byte for byte. Stage 2 re-encoded every deployed WebP rendition directly from its master (quality 72, same file names, dimensions and framing) and added 240w renditions for vehicle thumbnails.

```powershell
npm run assets:brand      # Recreate icons, manifest and social image from the supplied logo
npm run assets:clean      # Archive known obsolete renditions and deduplicate identical bytes
npm run images:optimize   # Regenerate the existing WebP policy from masters, then deduplicate
npm run images:recompress # Re-encode renditions from masters (framing-checked) and add 240w thumbnails
```

`images:optimize` writes quality-80 files and a manifest without the 240w thumbnails; always follow it with `images:recompress`. Add `-- --dry-run` to preview savings.

Image regeneration rewrites the manifest and output. Rebuild, audit and browser-check every affected placement afterward. The cleanup command refuses conflicting archive bytes. Keep originals for Stage 2. The favicon fits the complete wide logo proportionally into a square; no replacement logo was invented.

The original optional generation scripts remain for separately authorized work. They run server-side, read `OPENAI_API_KEY` from the environment and store masters under `source-files/original-images/ai/`. No external image generation ran in Stage 1. Historical model configuration does not establish current API availability. `scripts/source-images.mjs` optionally downloads documented destination sources. Normal builds need no generation credentials or external image downloads.

## Content requiring owner review

The existing North Goa Extreme amount is ₹3,500; its unit/inclusions require confirmation. Temple designations, availability and booking/payment/cancellation terms must be confirmed directly. Fortuner photography remains labelled representative. No street address, founder, hours, ratings, reviews or new business promises were invented. Review the privacy notice against the owner's actual handling of conversations before launch.
