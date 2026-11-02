// Runs Lighthouse (lab data) against a served production build and writes a
// median-of-N summary. Usage: node scripts/lighthouse.mjs <label> [baseUrl] [runs]
// Lab metrics only: Total Blocking Time is not Interaction to Next Paint.
import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from '@playwright/test';

// Lighthouse is a QA-only tool kept out of the site's dependencies; install it with
// `npm i --prefix output/stage2/lh-tools lighthouse@13.6.0 chrome-launcher`.
const tools = path.resolve(process.env.LH_TOOLS || 'output/stage2/lh-tools/node_modules');
const { default: lighthouse, desktopConfig } = await import(
  pathToFileURL(path.join(tools, 'lighthouse/core/index.js')).href
);
const chromeLauncher = await import(pathToFileURL(path.join(tools, 'chrome-launcher/dist/index.js')).href);

const label = process.argv[2] || 'run';
const base = process.argv[3] || process.env.QA_BASE_URL || 'http://localhost:4322';
const runs = Number(process.argv[4] || 3);
const pages = (
  process.env.LH_PAGES ||
  '/,/services/airport-transfers/,/contact/,/vehicles/innova-crysta/,/gallery/,/tour-packages/north-goa/'
).split(',');
const outDir = path.join('output', 'stage2', label);
await fs.mkdir(outDir, { recursive: true });
const chromePath = chromium.executablePath();
const median = (values) => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];

const summary = [];
for (const formFactor of (process.env.LH_FORMS || 'mobile,desktop').split(',')) {
  for (const page of pages) {
    const samples = [];
    for (let i = 0; i < runs; i++) {
      const file = path.join(outDir, `${formFactor}${page.replace(/\//g, '_')}${i}.json`);
      const chrome = await chromeLauncher.launch({
        chromePath,
        chromeFlags: ['--headless=new', '--no-sandbox', '--disable-gpu'],
      });
      let lhr;
      try {
        const result = await lighthouse(
          base + page,
          { port: chrome.port, output: 'json', logLevel: 'error' },
          formFactor === 'desktop' ? desktopConfig : undefined,
        );
        lhr = result.lhr;
        await fs.writeFile(file, result.report);
      } finally {
        await chrome.kill();
      }
      const a = lhr.audits;
      const items = a['resource-summary']?.details?.items || [];
      const bytes = (type) => items.find((x) => x.resourceType === type)?.transferSize ?? 0;
      samples.push({
        performance: Math.round(lhr.categories.performance.score * 100),
        accessibility: Math.round(lhr.categories.accessibility.score * 100),
        bestPractices: Math.round(lhr.categories['best-practices'].score * 100),
        seo: Math.round(lhr.categories.seo.score * 100),
        fcp: a['first-contentful-paint'].numericValue,
        lcp: a['largest-contentful-paint'].numericValue,
        si: a['speed-index'].numericValue,
        tbt: a['total-blocking-time'].numericValue,
        cls: a['cumulative-layout-shift'].numericValue,
        totalBytes: bytes('total'),
        scriptBytes: bytes('script'),
        stylesheetBytes: bytes('stylesheet'),
        imageBytes: bytes('image'),
        fontBytes: bytes('font'),
        mediaBytes: bytes('media'),
        thirdPartyBytes: bytes('third-party'),
        requests: items.find((x) => x.resourceType === 'total')?.requestCount ?? 0,
        lcpElement: a['largest-contentful-paint-element']?.details?.items?.[0]?.items?.[0]?.node?.snippet,
        failedAudits: Object.values(a)
          .filter((x) => x.score !== null && x.score < 0.9 && x.scoreDisplayMode !== 'informative')
          .map((x) => x.id),
      });
    }
    const pick = (key) => median(samples.map((s) => s[key]));
    const row = { formFactor, page, runs };
    for (const key of Object.keys(samples[0]))
      row[key] = typeof samples[0][key] === 'number' ? pick(key) : samples[0][key];
    summary.push(row);
    console.log(JSON.stringify(row));
  }
}
const profile =
  'Lighthouse 13.6.0 Node API, Playwright Chromium headless, default simulated throttling (mobile: Moto G Power/slow 4G, 4x CPU; desktop preset). Local Vercel-like server (scripts/serve-dist.mjs) with Brotli. Median per metric.';
await fs.writeFile(
  path.join(outDir, 'summary.json'),
  JSON.stringify({ label, base, profile, summary }, null, 2),
);
