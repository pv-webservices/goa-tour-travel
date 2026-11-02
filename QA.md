# Local QA — Fatima Tour and Travel

Updated 2 November 2026. Current results are in [docs/STAGE-2-REPORT.md](docs/STAGE-2-REPORT.md) (performance, accessibility, final pre-deployment QA); Stage 1 scope and evidence remain in [docs/STAGE-1-REPORT.md](docs/STAGE-1-REPORT.md).

- Build: 32 HTML documents; 31 canonical indexable pages plus branded noindex 404.
- Astro check: 0 errors, warnings or hints.
- SEO: 3,241 links, 2,018 resource references, 370 WhatsApp links and 161 phone links checked; no audit findings.
- Browser regression: 192 route/viewport checks, 26 existing template axe scans and 7 interaction groups passed.
- Enquiry tests: validation, safe message encoding, handoff guards, offline/copy/browser restrictions, no-JS and failed-script fallbacks passed with mocked outbound actions.
- HTTP: 31 pages return 200, four missing routes return genuine 404, and all 12 required resource checks including eight icon/manifest URLs pass locally.
- Stage 2 accessibility/responsive suite: 64 axe scans (every route at 375/1440 px) with 0 violations; 192 layout checks at 320/375/768/1024/1440 px and 812×375 landscape with no overflow, broken images or sub-24 px targets; keyboard and reduced-motion flows passed.
- Stage 2 visual regression against the Stage 1 build: identical page heights, ≤ 0.37% pixel difference.
- Lighthouse lab medians before/after are in the Stage 2 report. Automated checks do not certify full WCAG conformance; screen-reader, Safari/Firefox and physical-device checks remain manual.

Run commands and evidence locations are in [README.md](README.md). The live site remains an older noindex deployment until an authorized release. No real WhatsApp message, call, commit, push, deployment, DNS change or Search Console submission occurred.
