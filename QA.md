# Local verification — Fatima Tour and Travel

Date: 26 October 2026 (Asia/Kolkata). Local production preview: http://localhost:4322/. This is local implementation evidence, not deployment, delivery or production indexing evidence.

## Build and source checks

- `npm run build`: passed, 30 public pages plus branded 404 (31 HTML pages), robots.txt and sitemap.xml.
- `npm run check`: passed with zero errors, warnings or hints.
- Prettier check: passed for Astro, TypeScript, CSS, scripts and documentation.
- Dependency installation audit: zero reported vulnerabilities at installation time.
- Generated titles and descriptions are unique. All 31 HTML pages have one H1 and the supplied contact information.
- Generated internal links, local media/script/style paths, fragment destinations and WhatsApp recipients were checked.
- No fabricated review schema, ratings, mockup phone number, 24/7 claims or incorrect ₹3,300 amount were found.

## Browser checks

`npm test` runs `scripts/qa.mjs` against the production preview in Chromium.

- 31 routes × 6 viewport widths = **186 responsive route checks** at 1440, 1024, 768, 430, 390 and 320 pixels.
- No horizontal overflow or broken loaded images in the passing run. Intentionally unconfigured lightbox images are excluded until a photograph is opened; all generated media destinations are checked separately.
- Active navigation matches the current route, including nested vehicle, package and service pages.
- **26 axe scans:** 13 representative templates at desktop and mobile widths, with WCAG 2 A/AA and 2.1 AA rules. No violations in the passing run.
- No browser JavaScript errors, console errors or unexpected third-party requests in the passing run.

Interaction checks passed for:

1. Mobile navigation, expanded state, Escape, focus restoration and navigation to the fleet.
2. Fleet category filtering, including MPV, SUV and all vehicles.
3. Gallery category filters, modal photo preview, next/previous buttons, arrow keys, Escape and focus restoration.
4. Vehicle detail photograph previews and photo counts.
5. Contact service/vehicle prefill, required and whitespace validation, phone digit validation, email validation, past-date rejection and positive passenger counts.
6. Safe WhatsApp message encoding, recipient configuration and text-only rendering of HTML-like input. The test prepares a draft and never clicks the outbound send handoff.
7. Native FAQ disclosures, Winger video metadata loading, playback controls, no autoplay, content without JavaScript and reduced-motion rendering.

Initial accessibility findings were corrected in shared code: the mobile call button now has an accessible name, gold labels on sand backgrounds have stronger contrast, and optional field labels have stronger contrast. The initial raw report is preserved in `output/playwright/qa-first-pass.json`; the current report is `output/playwright/qa-results.json`.

Visual review included the complete homepage, mobile hero, fleet, tour detail, gallery and enquiry draft. Destination focal points keep the South Goa architecture and Dudhsagar waterfall visible. Temple enquiries use scenic Goa imagery instead of implying an unverified temple identity. Corporate travel uses a supplied Innova photo.

## Local performance smoke check

`node scripts/performance.mjs` used local Chromium with a cold cache, 5 Mbps download, 1 Mbps upload, 40 ms latency and a 4× CPU slowdown, one sample per viewport.

| Viewport        | Observed LCP | Observed cumulative layout shift |
| --------------- | ------------ | -------------------------------- |
| Desktop, 1440px | 1.172 s      | 0.0021                           |
| Mobile, 390px   | 0.860 s      | 0                                |

These synthetic load samples meet the requested LCP and CLS targets in this local setup. They are not field Core Web Vitals, a Lighthouse certification or production speed guarantees. INP was not measured. Results are saved in `output/playwright/performance.json`. Frontend interaction JavaScript is approximately 4 KB uncompressed; fonts and responsive WebP imagery are served locally. Video uses `preload="none"`.

## Domain configuration

A separate build using `https://fatima.example` as a temporary test origin verified canonical links, absolute Open Graph images, crawlable robots and all 30 public sitemap URLs. The test origin was not installed as the production domain. The delivered default build has no configured domain, uses noindex and blocks crawling until `PUBLIC_SITE_URL` is set and the site is rebuilt.

## Evidence

Saved under `output/playwright/`:

- `qa-results.json`: route, viewport, accessibility and interaction results.
- `home-desktop.png` and `home-mobile.png`: complete homepage screenshots.
- `fleet-desktop.png`, `gallery-desktop.png`, `tour-mobile.png` and `contact-draft-mobile.png`.
- `performance.json`: synthetic local load measurements.
- `asset-sheet.jpg`: review of the supplied vehicle imagery.

## Before publishing

- Set the confirmed domain, rebuild, deploy and check the actual production URLs and hosting 404 behaviour.
- Confirm WhatsApp is active on the supplied number and manually verify enquiry receipt. No enquiry was sent during development.
- Confirm the ₹3,500 price basis, temple designations/routes, vehicle availability and all quoted inclusions or payment/cancellation terms with the business.
- Obtain current Urbania and Fortuner photos if they should be displayed. Those enquiry listings currently offer photographs on request.
- A precise office address, map location, social profiles and real customer reviews remain omitted because they were not supplied.

Accessibility scans are automated local evidence, not a formal accessibility certification. Safari/Firefox, physical-device checks, live enquiries, deployment, production traffic performance and search indexing have not been verified.
