# Google Search Console — Fatima Tour and Travel

Prepared 2 November 2026 (Asia/Kolkata). Preferred origin: **https://fatimatourandtravels.com/**. The local Stage 1 build contains **31 canonical indexable pages**. This guide does not mean ownership verification, deployment, sitemap submission or Google indexing has happened.

## Completed locally and remaining owner actions

Locally completed: canonical/robots metadata, sitemap endpoint, schema, branded noindex 404, favicon set, WhatsApp-only enquiry handling, phone links, known legacy redirects, security-header configuration and automated audits. See STAGE-1-REPORT.md for evidence.

Still required (Stage 2 local optimization/QA is complete — see STAGE-2-REPORT.md): authorize deployment, verify Vercel Git/project/domain settings, repeat live checks, obtain the owner's Google verification token, publish its DNS record, verify ownership and submit the sitemap. No DNS records, Google properties or live conversations were changed by Stage 1.

## Pre-launch checklist

- Complete Stage 2 performance, accessibility and final QA.
- Verify HTTPS on apex and www, and choose apex as the final URL. Confirm www redirects to apex without an opposite dashboard rule. Check slash/index.html/legacy redirects, query preservation and loops.
- Confirm all 31 canonical pages return 200 with matching absolute HTTPS canonicals and index/follow metadata. Each page must be reachable through internal links.
- Open https://fatimatourandtravels.com/robots.txt and confirm Allow: / with the sitemap reference. The currently deployed older build was blocking crawlers at the Stage 1 check.
- Open https://fatimatourandtravels.com/sitemap.xml and confirm 31 canonical entries. The live sitemap was empty at the Stage 1 check; the local build is corrected.
- Request a normal and nested nonexistent route. Both must return real HTTP 404 with the branded page, noindex and no canonical. Do not rewrite missing URLs to a 200 homepage.
- Review unique titles/descriptions, one H1, image alt attributes, social image, all favicon URLs and JSON-LD. Check schema using Google's Rich Results Test where a supported type applies, and Schema.org Validator for general schema; valid data does not guarantee a rich result.
- Check all enquiry/phone destinations. Use mock handoffs first; real WhatsApp sends or calls need separate authorization. Opening WhatsApp is not message delivery.
- Review the visible privacy notice, existing price basis/itinerary wording and representative photography with the business owner.

## Add a Domain property and verify DNS

1. Sign in to [Google Search Console](https://search.google.com/search-console/) with the owner's intended account. Choose Add property, then Domain. Enter **fatimatourandtravels.com**, without protocol, path or www.
2. Copy Google's exact TXT value, beginning google-site-verification=. Never make up or reuse another project's token.
3. Recheck authoritative nameservers before editing DNS. Stage 1 observed **ns1.dns-parking.com** and **ns2.dns-parking.com**, indicating Hostinger DNS. The registrar alone does not prove who currently hosts DNS.
4. In Hostinger hPanel, select fatimatourandtravels.com, open DNS / Nameservers, then DNS records / Zone Editor. Add a **TXT** record with name **@**, Google's exact verification value, and the dashboard's default TTL. Preserve existing verification, MX, SPF, DKIM, DMARC and Vercel records. If authoritative nameservers have changed, use that provider's DNS dashboard instead.
5. Save, allow DNS propagation, check the TXT result and click Verify in Search Console. A delayed result is possible; do not repeatedly replace the record. Keep the verification TXT after success.

PowerShell read-only checks:

```powershell
Resolve-DnsName fatimatourandtravels.com -Type NS
Resolve-DnsName fatimatourandtravels.com -Type TXT
```

Public DNS also showed apex A 216.198.79.1 and www CNAME 3ac76023b19a0a2c.vercel-dns-017.com on 2 November 2026. These observations are not instructions to overwrite DNS; verify Vercel's current project requirements before a future change.

References: [Google ownership verification](https://support.google.com/webmasters/answer/9008080), [Hostinger TXT instructions](https://www.hostinger.com/support/1583664-how-to-manage-txt-records-at-hostinger/).

## Submit the sitemap after deployment

Exact sitemap: **https://fatimatourandtravels.com/sitemap.xml**. This project does not generate sitemap-index.xml.

In the verified property, open Sitemaps, submit the full sitemap URL (or sitemap.xml if the interface already supplies the origin), then check its reported status and discovered URLs. Reopen the public XML to confirm it returns HTTP 200, XML content and 31 absolute canonical URLs.

An XML browser message saying the document has no style information is normal: an XML sitemap is machine-readable data, not a designed page. Persistent fetch errors require investigation: inspect response status, redirects, HTTPS, protection/login challenges, robots, empty XML, stale deployment/caches, and exact URL. Check whether Google can reach the final canonical host using URL Inspection. Do not dismiss a persistent Could not fetch result.

The sitemap includes only canonical indexable pages. It excludes 404s, legacy redirects and utility routes. Dynamic catalogue entries follow src/data/site.ts; new static pages must also be added to src/pages/sitemap.xml.ts. npm run audit compares the complete generated HTML inventory with the sitemap. Modification dates are omitted because no reliable per-page editorial dates were supplied.

Reference: [Google sitemap guidance](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap).

## Complete canonical inventory — 31 pages

This list is generated from the executed local SEO audit. Before requesting indexing, confirm each URL serves the new build in production.

### Main pages (5)

- https://fatimatourandtravels.com/
- https://fatimatourandtravels.com/about/
- https://fatimatourandtravels.com/contact/
- https://fatimatourandtravels.com/faq/
- https://fatimatourandtravels.com/gallery/

### Privacy information (1)

- https://fatimatourandtravels.com/privacy-policy/

### Services (7)

- https://fatimatourandtravels.com/services/
- https://fatimatourandtravels.com/services/airport-transfers/
- https://fatimatourandtravels.com/services/corporate-travel/
- https://fatimatourandtravels.com/services/day-packages/
- https://fatimatourandtravels.com/services/group-transport/
- https://fatimatourandtravels.com/services/outstation-travel/
- https://fatimatourandtravels.com/services/taxi-services/

### Tour packages (7)

- https://fatimatourandtravels.com/tour-packages/
- https://fatimatourandtravels.com/tour-packages/dudhsagar-waterfall/
- https://fatimatourandtravels.com/tour-packages/north-goa-extreme/
- https://fatimatourandtravels.com/tour-packages/north-goa/
- https://fatimatourandtravels.com/tour-packages/south-goa-extreme/
- https://fatimatourandtravels.com/tour-packages/south-goa/
- https://fatimatourandtravels.com/tour-packages/temple-tours/

### Vehicles (11)

- https://fatimatourandtravels.com/vehicles/
- https://fatimatourandtravels.com/vehicles/bharatbenz-bus/
- https://fatimatourandtravels.com/vehicles/dzire/
- https://fatimatourandtravels.com/vehicles/ertiga/
- https://fatimatourandtravels.com/vehicles/force-urbania/
- https://fatimatourandtravels.com/vehicles/fortuner/
- https://fatimatourandtravels.com/vehicles/glanza/
- https://fatimatourandtravels.com/vehicles/innova-crysta/
- https://fatimatourandtravels.com/vehicles/innova-hycross/
- https://fatimatourandtravels.com/vehicles/tempo-traveller/
- https://fatimatourandtravels.com/vehicles/winger/

### Exclusions

- https://fatimatourandtravels.com/404.html — branded error document; noindex, no canonical, not in sitemap. Astro preview serves the direct utility file/alias with 200; actual unknown URLs were separately tested to return 404. Recheck the deployed host's unknown-route status.
- /thank-you/ — not implemented; a missing URL returns 404. There is no email success page or redirect implying WhatsApp delivery.
- Legacy /index.php/about-us/, /index.php/contact-us/ and /index.php/our-services/ — permanent redirects prepared to the corresponding canonical pages; exclude redirect sources from the sitemap.
- www, HTTP, slashless and index.html variations — redirect/canonical alternatives, not separate indexable pages.

The privacy policy is indexable. No blog/articles, terms page, founder profile or extra business locations were discovered; none were invented.

## Indexing priorities and review batches

Inspect the homepage first: URL Inspection, live test, verify crawler access and selected canonical, then Request indexing when appropriate. Prioritize Services, Taxi & Rental, Airport Pickup & Drop, Tour Packages, North/South Goa, Vehicles, Contact and About. Inspect at least one vehicle detail, one tour detail, one service detail, the privacy page and a missing route to cover every template. Look for stale noindex or a Google-selected www canonical after deployment.

Use manageable review batches rather than submitting all URLs repeatedly:

1. Home, Services, Taxi & Rental, Airport Pickup & Drop, Tour Packages, North Goa, South Goa, Vehicles, Contact, About (10).
2. The ten vehicle detail pages (10).
3. Gallery, FAQ, Privacy, remaining four tour details and remaining four service details (11; split further if useful).

These are organizational batches, not a claim of a guaranteed daily Google quota. Manual requests and sitemap submission do not guarantee crawling or indexing; allow time and investigate persistent exclusions rather than repeatedly resubmitting unchanged URLs.

## Favicon checks

Verify homepage declarations and public access to favicon.ico, favicon.svg, favicon-48x48.png, favicon-96x96.png, favicon-192x192.png, favicon-512x512.png, apple-touch-icon.png and site.webmanifest. The ICO contains 16, 32 and 48px representations; all icons preserve the supplied logo's proportions. Icons and the homepage must be crawlable. Google may take days or weeks to show an updated icon; requesting homepage indexing may encourage recrawling but does not guarantee a faster update or display.

Reference: [Google favicon guidance](https://developers.google.com/search/docs/appearance/favicon-in-search).

## Four-week owner monitoring plan

| Period | Owner actions                                                                                                                                                                                                                               |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Week 1 | Complete Domain verification, deploy approved changes, submit the sitemap and inspect the homepage. Record submission results and repeat public robots/404 checks.                                                                          |
| Week 2 | Review Page indexing exclusions, crawl/fetch errors and selected canonicals. Check structured data reports for supported features and representative detail-page inspection results.                                                        |
| Week 3 | Check PageSpeed and available Core Web Vitals data following Stage 2. Review internal links and mobile enquiry usability. Review an existing verified Google Business Profile if applicable; do not invent an address or create duplicates. |
| Week 4 | Compare indexed/discovered page trends, resolve persistent exclusions and sitemap errors, and consider verifying Bing Webmaster Tools and submitting the same sitemap.                                                                      |

## Google Business Profile

If the business already has a verified Google Business Profile, set its website field to https://fatimatourandtravels.com/ and keep the phone number (+91 80806 43517) identical to the website. Do not create a second profile, invent a street address, opening hours or reviews, or add a location the business does not serve from. The website schema deliberately lists only the verified name, phone, email and Goa service area.

## Bing Webmaster Tools

After Google verification, sign in to Bing Webmaster Tools and choose **Import from Google Search Console** (fastest, reuses the verified property) or add the site manually and verify with Bing's DNS CNAME/TXT option at Hostinger. Submit the same sitemap URL, https://fatimatourandtravels.com/sitemap.xml, then use URL Inspection for the homepage. robots.txt does not block Bingbot. Bing's IndexNow is optional and is not configured in this project.

Record dates and evidence for completed owner actions. A completed local build is neither a submitted sitemap nor confirmed Google indexing.
