# Route and interaction inventory

Source: executed Stage 1 generated-HTML audit, 2 November 2026. Initial source: 30 public pages plus branded 404. Final: 31 indexable public pages plus branded 404 (32 HTML documents), and two generated endpoints: /robots.txt and /sitemap.xml. Only the privacy page is new; no existing canonical slug was changed.

| Route                               | Classification      | Forms | WhatsApp links | Phone links |
| ----------------------------------- | ------------------- | ----: | -------------: | ----------: |
| /                                   | Main pages          |     1 |             20 |           5 |
| /404.html                           | Noindex utility     |     0 |              5 |           5 |
| /about/                             | Main pages          |     0 |             15 |           5 |
| /contact/                           | Main pages          |     1 |              7 |           6 |
| /faq/                               | Main pages          |     0 |              5 |           5 |
| /gallery/                           | Main pages          |     0 |              5 |           5 |
| /privacy-policy/                    | Privacy information |     0 |              4 |           5 |
| /services/                          | Services            |     0 |             15 |           5 |
| /services/airport-transfers/        | Services            |     0 |             14 |           5 |
| /services/corporate-travel/         | Services            |     0 |              9 |           5 |
| /services/day-packages/             | Services            |     0 |             14 |           5 |
| /services/group-transport/          | Services            |     0 |              9 |           5 |
| /services/outstation-travel/        | Services            |     0 |             14 |           5 |
| /services/taxi-and-rental/          | Services            |     0 |             14 |           5 |
| /tour-packages/                     | Tour packages       |     0 |              9 |           5 |
| /tour-packages/dudhsagar-waterfall/ | Tour packages       |     0 |              9 |           5 |
| /tour-packages/north-goa-extreme/   | Tour packages       |     0 |              9 |           5 |
| /tour-packages/north-goa/           | Tour packages       |     0 |              9 |           5 |
| /tour-packages/south-goa-extreme/   | Tour packages       |     0 |              9 |           5 |
| /tour-packages/south-goa/           | Tour packages       |     0 |              9 |           5 |
| /tour-packages/temple-tours/        | Tour packages       |     0 |              9 |           5 |
| /vehicles/                          | Vehicles            |     0 |             16 |           5 |
| /vehicles/bharatbenz-bus/           | Vehicles            |     0 |             14 |           5 |
| /vehicles/dzire/                    | Vehicles            |     0 |             14 |           5 |
| /vehicles/ertiga/                   | Vehicles            |     0 |             14 |           5 |
| /vehicles/force-urbania/            | Vehicles            |     0 |             14 |           5 |
| /vehicles/fortuner/                 | Vehicles            |     0 |             15 |           5 |
| /vehicles/glanza/                   | Vehicles            |     0 |             14 |           5 |
| /vehicles/innova-crysta/            | Vehicles            |     0 |             14 |           5 |
| /vehicles/innova-hycross/           | Vehicles            |     0 |             14 |           5 |
| /vehicles/tempo-traveller/          | Vehicles            |     0 |             14 |           5 |
| /vehicles/winger/                   | Vehicles            |     0 |             14 |           5 |

## Interaction inventory

- Shared header: home/logo link, primary navigation, vehicle/tour/service submenus, phone contact, mobile drawer and Escape/focus handling.
- Shared footer: navigation, tours/services, visible public email, phone, WhatsApp and back-to-top.
- Desktop floating WhatsApp button; mobile sticky call/WhatsApp/contact bar replaces it at small widths. Existing safe-area rules retained.
- Home: service/vehicle/date trip planner to the contact page; carousels and contextual tour/vehicle enquiries; native FAQ disclosures and click-to-load Winger video.
- Vehicles: category filters, detail links, supplied photograph previews, thumbnail navigation, lightbox arrows/Escape/focus restoration and contextual WhatsApp/call/plan-trip links.
- Tours/services: overview/detail links, related journeys/vehicles, contextual enquiry messages and service-prefilled contact routes.
- Gallery: category filters, photograph lightbox and original vehicle video controls.
- Contact: allowlisted service/vehicle/date prefill, required/length/phone/email/date/passenger validation, associated field errors, first-invalid focus, WhatsApp handoff, visible draft, repeated-activation guard, copy/manual-selection, offline and direct WhatsApp/call fallbacks. No form-email endpoint.
- FAQ: native disclosures and contact alternatives.
- Privacy: linked from footer and form, describes actual enquiry processing.
- 404: Page Not Found, home/tours links, WhatsApp and phone alternatives. Unknown normal/nested routes return 404; direct utility file status is host-specific and noindex.
- Browser Back/Forward and content/fallbacks without JavaScript covered by browser tests. No checkout, booking confirmation, email success page, login, blog or article interaction was discovered.

Counts include repeated shared navigation and contacts on each generated page. They are link occurrences, not distinct people or sent enquiries. Live state is recorded separately in output/stage1/live-before.json and docs/STAGE-1-REPORT.md.
