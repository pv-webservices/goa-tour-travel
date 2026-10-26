# Fatima Tour and Travel

A complete static business website for Goa tours, taxi and driver-included rentals, airport transfers, corporate journeys and outstation travel. Built with Astro, TypeScript and structured CSS. No database or booking dashboard is required.

## Run locally

Use a current Node.js version supported by Astro (the implementation was verified with Node 24.19.0).

```powershell
npm ci
npm run dev
```

Development runs at http://localhost:4321. Fonts, photos, logo, icons and video are served locally; the visitor does not need a third-party font or image service.

```powershell
npm run check
npm run build
npm run preview -- --port 4322
```

The production output is `dist/`. Serve that directory using a static host with directory index support. Configure the host to use `404.html` for unknown paths, rather than rewriting all requests to the homepage. The site needs no server-side runtime after building.

## Pages

30 public pages plus the branded 404:

- Home, About, Vehicles, Tour Packages, Services, Gallery, Contact and FAQ.
- Ten vehicle detail pages.
- Six tour detail pages: four Goa routes, Dudhsagar Waterfall and temple tour enquiries.
- Six service detail pages: taxi/rental, airport, outstation, corporate, day bookings and group transport.

## Business details and content

Edit `src/data/site.ts` for the business name, telephone, WhatsApp number, email, vehicle catalogue, tour stops, services and FAQs. The confirmed contact details are +91 80806 43517, vaseem9823@gmail.com and Goa, India.

- The source brief called the Winger a Force; the supplied photos identify it as a Tata Winger, and the website uses the photographed make.
- The supplied `force` photos are used for the Tempo Traveller listing.
- The Dzire and Force Urbania now use the client's own photos (`public/new car images/`). The Fortuner still has no client photo; it shows a generated SUV clearly labelled "Representative image" and offers current photographs on request.
- Only the explicitly supplied BharatBenz 40-seater capacity is stated. Other seating, luggage, variants, amenities and availability are not assumed.
- North Goa Extreme displays the supplied ₹3,500 amount. Its price basis and inclusions must be agreed with the business. Other trips require a quote.
- Temple designations and routes need confirmation; no unrelated temple image or fixed itinerary is presented as verified.
- No reviews, experience figures, ratings, social accounts, full address, office hours, guarantees or cancellation policy were invented.

## Enquiries

Call links use `tel:` and email links use `mailto:`. WhatsApp links target the configured business number with encoded, contextual text. The contact form validates the details and prepares a message for the visitor to review. The visitor then chooses to open WhatsApp and send it.

The website does not send email, save enquiries, confirm delivery, take payment, reserve vehicles or confirm bookings. No mail provider or enquiry endpoint was supplied. Real delivery and recipient WhatsApp availability must be checked separately before launch. Test automation never sends a message.

## Domain and indexing

Set `PUBLIC_SITE_URL` to the real HTTPS site origin before the production build. Copy `.env.example` to `.env`, or set the hosting provider’s build environment variable.

```powershell
$env:PUBLIC_SITE_URL = 'https://your-confirmed-domain.example'
npm run build
```

Replace the example with the actual domain. The build derives canonical links, absolute Open Graph images, sitemap URLs and robots from this origin. Without a configured domain, pages deliberately use `noindex, follow`, robots disallows crawling and the sitemap contains no guessed URLs. A configured build permits indexing on public pages; the 404 remains noindex. Configuration is not evidence that a deployed site is indexed.

## Images and video

Client originals are preserved in `public/` (the new Dzire and Urbania photos are in `public/new car images/`). Optimized, responsive WebP versions are in `public/media/`, indexed by `src/data/images.json`. Sources and licensing are documented in `ASSET-SOURCES.md`. Destination and generated scenes are not represented as customer trips.

```powershell
# After adding/replacing original images (also rebuilds the transparent header logo):
npm run images:optimize
```

The optional `scripts/source-images.mjs` re-downloads the documented destination sources; ordinary development and deployment do not need it. The original Winger video is reused on the homepage, gallery and Winger page; it loads only on request (`preload="none"`) and has browser playback controls. No video was generated.

### AI image generation (server-side only)

Seven additional scenes were generated with the OpenAI Image API. Generation runs as a Node script on your machine or build server — never in the browser — and reads `OPENAI_API_KEY` from `.env` (gitignored) or the environment.

```powershell
npm run images:generate                                      # generates missing images only
npm run images:generate -- --only=ai-hero-coast-road --force # regenerate one image
npm run images:optimize                                      # convert results to responsive WebP
```

- `config/image-generation.mjs` — model names (`gpt-image-2.5-flare` default, `gpt-image-2.5-sunburst` premium), quality levels, sizes and the automatic routing rule. Each can be overridden with `OPENAI_IMAGE_*` variables (see `.env.example`).
- `config/image-jobs.mjs` — one entry per image: prompt, orientation, priority and placement. Hero, multi-subject and photorealistic-people jobs route to Sunburst; everything else uses Flare. High-priority jobs use high quality; routine ones use medium.

## Verification

With the production preview running at port 4322, use a second terminal:

```powershell
npx playwright install chromium
npm test
```

To use a different local preview, set `QA_BASE_URL`. `scripts/qa.mjs` checks generated links and metadata; tests all 31 HTML routes at 1440, 1024, 768, 430, 390 and 320 pixels; exercises navigation, filters, dialogs, form validation and video; and runs axe on representative templates at desktop and mobile sizes. Results and screenshots are written to `output/playwright/`.

See `QA.md` for the recorded results and launch boundaries. Automated accessibility checks do not constitute formal certification; local timing is not field Core Web Vitals.
