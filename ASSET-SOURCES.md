# Asset sources

Original logo and vehicle photographs: client supplied, preserved under source-files/original-images/brand/ and source-files/original-images/vehicles/. The supplied video is public/assets/vehicles/tata-winger-video.mp4. Photographs are used without making fleet ownership or availability claims.

Destination photographs downloaded locally under the [Unsplash License](https://unsplash.com/license):

- aguada: Fort Aguada, North Goa. Photo by Vignesh Jayaprakash. https://unsplash.com/photos/a-group-of-people-walking-around-a-large-white-tower-d6GgOxRgqBQ
- arambol: Arambol Beach, North Goa. Photo by TiAchen Aier. https://unsplash.com/photos/silhouette-of-palm-trees-near-body-of-water-during-sunset-tBzGG6IHaQQ
- dudhsagar: Dudhsagar, Goa. Photo by Arun Prakash. https://unsplash.com/photos/a-waterfall-in-a-forest-J61RCfJ27bk
- goa-coast: Kakolem Beach, Goa. Photo by Chirayu Sharma. https://unsplash.com/photos/a-view-of-a-tropical-beach-with-palm-trees-M5AR9jscKgM
- goa-sunset: Goa sunset. Photo by Chirayu Sharma. https://unsplash.com/photos/the-sun-is-setting-over-the-ocean-with-a-palm-tree-in-the-foreground-I9qh1Q_tgfU
- south-goa: Church architecture, Goa. Photo by Mohammad Aqhib. https://unsplash.com/photos/white-red-church--9FvGYtA9eA
- goa-beach: South Goa coast. Photo by Ishvani Hans. https://unsplash.com/photos/a-sandy-beach-next-to-the-ocean-with-palm-trees-xWFL4KNd_2A
- palolem: Palolem Beach, Goa. Photo by Kotagauni Srinivas. https://unsplash.com/photos/palm-trees-near-seashore-WSe6NAwwESA

## New client photographs (October 2026)

- `source-files/original-images/vehicles/swift-dezire-img-*.jpeg` — Maruti Suzuki Dzire exterior and interior. Replaces the earlier
  `misc` hatchback photos that had been standing in for the Dzire.
- `source-files/original-images/vehicles/urbania-img-*.jpeg` — Force Urbania exterior and cabin. The Urbania now has a full photo set.

## AI-generated images

Generated server-side with the OpenAI Image API (`npm run images:generate`; config in `config/image-generation.mjs`,
prompts and placements in `config/image-jobs.mjs`). Originals are kept in `source-files/original-images/ai/` (outside `public/`);
optimised WebP versions are in `public/assets/`. The routing log is `source-files/original-images/ai/generation-log.json`.

| Image                      | Model · quality · size      | Placement                                                     |
| -------------------------- | --------------------------- | ------------------------------------------------------------- |
| ai-hero-coast-road         | sunburst · high · 1536×1024 | Homepage hero, About hero, 404                                |
| ai-airport-transfer        | sunburst · high · 1536×1024 | Airport service tile, banner, detail, Services hero           |
| ai-corporate-travel        | sunburst · high · 1536×1024 | Corporate service tile and detail                             |
| ai-chauffeur-family        | sunburst · high · 1024×1536 | Homepage “how it works”, About collage                        |
| ai-outstation-highway      | flare · high · 1536×1024    | Outstation service tile and detail                            |
| ai-temple-architecture     | flare · high · 1536×1024    | Temple Tours (labelled “Illustration”; not a specific temple) |
| ai-fortuner-representative | flare · medium · 1024×1024  | Fortuner card/detail (labelled “Representative image”)        |

No vehicle shown in a generated image is the client’s vehicle, and generated scenes are not presented as completed
customer trips. No video was generated.

## Stage 1 organization — 2 November 2026

77 original image masters were moved without changing their bytes. Destination originals are in `source-files/original-images/editorial/`. Public derivatives use `assets/brand`, `assets/vehicles`, `assets/editorial` and `assets/illustrations`. Historical unused and byte-identical derivatives are archived outside public in `source-files/unused-renditions/`. The favicon set and 1200×630 social image derive from the complete supplied logo, fitted proportionally without inventing a new mark. No external image generation or final compression pass ran during this stage.
