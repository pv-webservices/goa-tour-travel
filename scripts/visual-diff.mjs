// Visual regression: full-page screenshots of two served builds, compared pixel by pixel.
// Usage: node scripts/visual-diff.mjs <baselineUrl> <candidateUrl>
// Animations are frozen (reduced motion + intro skipped) so differences reflect real rendering changes.
import fs from 'node:fs/promises';
import sharp from 'sharp';
import { chromium } from '@playwright/test';

const [baseline = 'http://localhost:4400', candidate = 'http://localhost:4322'] = process.argv.slice(2);
const routes = (
  process.env.DIFF_ROUTES ||
  '/,/about/,/services/,/services/airport-transfers/,/vehicles/,/vehicles/innova-crysta/,/tour-packages/,/tour-packages/north-goa/,/gallery/,/contact/,/faq/,/privacy-policy/,/stage2-missing/'
).split(',');
const widths = [375, 768, 1440];
const out = 'output/stage2/visual';
await fs.mkdir(out, { recursive: true });
const browser = await chromium.launch();
const results = [];

// Viewport-by-viewport captures (stitched): this is what a visitor sees while scrolling. A single
// full-page capture is avoided because Chromium does not render content-visibility:auto sections
// that sit outside the live viewport during stitched full-page screenshots.
async function shoot(context, url, width) {
  const page = await context.newPage();
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  // Placeholder heights resolve as sections render, so re-read the document height every step.
  const docHeight = () => page.evaluate(() => document.documentElement.scrollHeight);
  const tiles = [];
  for (let y = 0; y < (await docHeight()); y += 900) {
    await page.evaluate((y) => scrollTo(0, y), y);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(150);
    const top = await page.evaluate(() => scrollY);
    tiles.push({ input: await page.screenshot({ animations: 'disabled', caret: 'hide' }), top, left: 0 });
  }
  const height = await docHeight();
  await page.close();
  return sharp({ create: { width, height, channels: 3, background: '#000' } })
    .composite(tiles)
    .png()
    .toBuffer();
}

for (const width of widths) {
  const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
  await context.addInitScript(() => sessionStorage.setItem('fatima-intro', '1'));
  for (const route of routes) {
    const [a, b] = [
      await shoot(context, baseline + route, width),
      await shoot(context, candidate + route, width),
    ];
    const [ma, mb] = [await sharp(a).metadata(), await sharp(b).metadata()];
    const row = { route, width, heightA: ma.height, heightB: mb.height };
    if (ma.height === mb.height) {
      // A light blur makes the comparison tolerant of sub-pixel text anti-aliasing, while any real
      // change (moved element, missing image, colour change) still produces large deltas.
      const soften = (png) => sharp(png).removeAlpha().blur(1.2).raw().toBuffer();
      const [ra, rb] = [await soften(a), await soften(b)];
      const channels = 3;
      let differing = 0;
      const mask = Buffer.alloc(ma.width * ma.height);
      for (let i = 0, p = 0; i < ra.length; i += channels, p++) {
        const delta = Math.max(
          Math.abs(ra[i] - rb[i]),
          Math.abs(ra[i + 1] - rb[i + 1]),
          Math.abs(ra[i + 2] - rb[i + 2]),
        );
        if (delta > 40) {
          differing++;
          mask[p] = 255;
        }
      }
      row.differingPixels = differing;
      row.differingPercent = +((differing / (ma.width * ma.height)) * 100).toFixed(3);
      if (differing) {
        const name = `${width}${route.replace(/\//g, '_')}`;
        await sharp(mask, { raw: { width: ma.width, height: ma.height, channels: 1 } })
          .png()
          .toFile(`${out}/${name}-mask.png`);
        await fs.writeFile(`${out}/${name}-candidate.png`, b);
        await fs.writeFile(`${out}/${name}-baseline.png`, a);
      }
    } else row.differingPercent = null;
    results.push(row);
    console.log(JSON.stringify(row));
  }
  await context.close();
}
await browser.close();
await fs.writeFile(`${out}/visual-diff.json`, JSON.stringify(results, null, 2));
