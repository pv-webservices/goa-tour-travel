# Fatima Tour and Travel — design system

An evolved version of the existing brand: the logo's night black and champagne gold, warmed with Goa sand and
an Arabian Sea teal. Business details in `src/data/site.ts` remain the single source of truth.

## Tokens (`src/styles/global.css`)

- **Colour:** `--night` #0b0f12 (header, footer, quote cards), `--gold` / `--gold-grad` (primary actions),
  `--gold-deep` and `--gold-text` (gold text that passes contrast on light backgrounds), `--ivory` / `--sand`
  (page and alternating sections), `--ocean` (the "Why Fatima" and About bands), `--whatsapp` #0f8445 (passes AA
  with white text).
- **Type:** Playfair Display for headings and numerals, Manrope for body/UI. Fluid scale `--fs-*`, 16px base.
- **Layout:** `.container` is `min(1600px, 100% − 2 × gutter)` (≈90% on laptops, ≈83% on 1920px). Carousels and
  hero/banner imagery run full-bleed.
- **Shape & depth:** radii 10 / 18 / 28px and pill buttons; three shadow levels.
- **Motion:** `--ease` cubic-bezier(.22,.7,.18,1). Scroll reveals (IntersectionObserver, staggered), hero entrance,
  image zoom on hover, destination marquee. Card lifts use the `translate` property so they never fight the
  reveal `transform`. Everything is disabled under `prefers-reduced-motion`; content is visible without JS.

## Components

- **Buttons:** gold (default), `outline`, `dark`, `light` (on imagery), `whatsapp`, `small`. Hover is a
  directional fill that sweeps in from the left plus an icon nudge — no shine/shimmer effects.
- **Forms:** native `<select>` with `appearance: none` and a gold chevron panel, themed focus ring, past dates
  blocked.
- **Header:** transparent over heroes, solid on scroll; desktop dropdowns open on hover/focus and via the chevron
  button (touch/keyboard, Escape closes); mobile is a right-hand drawer with accordion submenus.
- **Cards:** vehicle (4:3 photo, category chip, details + WhatsApp), tour (photo, stops, price tag), bento service
  tiles (descriptions reveal on hover, always shown on touch), scenic banners, dark sticky quote cards.
- **Conversion:** hero trip planner (GET → `/contact/?service&vehicle&date`, prefilled), mobile bottom bar (Call /
  WhatsApp / Plan Trip), floating WhatsApp on desktop (62px, filled glyph), final CTA with direct contacts.
- **Loading:** a sub-1.3s logo intro on the first page view of a session only.

## Imagery rules

Client photographs are used for every vehicle that has them. Generated images only depict scenes the client could
not supply (airport, corporate, highway, temple architecture, chauffeur moment, hero coast road) and are labelled
“Illustrative scene” / “Illustration” where they could be mistaken for the business’s own trips. The Fortuner,
which has no client photo, shows a generated SUV marked “Representative image”. See `ASSET-SOURCES.md`.
