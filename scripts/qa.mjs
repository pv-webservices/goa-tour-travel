import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const base = process.env.QA_BASE_URL || 'http://localhost:4322';
const output = 'output/playwright';
await fs.mkdir(output, { recursive: true });
const htmlFiles = (await fs.readdir('dist', { recursive: true })).filter((f) => f.endsWith('.html'));
const routes = htmlFiles
  .map((f) => (f === '404.html' ? '/404.html' : '/' + f.replaceAll('\\', '/').replace(/index\.html$/, '')))
  .sort();
const results = {
  base,
  routes,
  staticChecks: 0,
  viewportChecks: [],
  accessibility: [],
  interactions: [],
  failures: [],
  consoleErrors: [],
  pageErrors: [],
  externalRequests: [],
};
const check = (condition, message) => {
  if (!condition) results.failures.push(message);
};
const titleSet = new Set();
const descriptionSet = new Set();
for (const file of htmlFiles) {
  const html = await fs.readFile(path.join('dist', file), 'utf8');
  const title = html.match(/<title>(.*?)<\/title>/s)?.[1];
  const description = html.match(/name="description" content="([^"]+)"/)?.[1];
  check(Boolean(title) && !titleSet.has(title), `Missing or duplicate title: ${file}`);
  titleSet.add(title);
  check(
    Boolean(description) && !descriptionSet.has(description),
    `Missing or duplicate description: ${file}`,
  );
  descriptionSet.add(description);
  check((html.match(/<h1[ >]/g) || []).length === 1, `Expected one h1: ${file}`);
  check(
    html.includes('vaseem9823@gmail.com') && html.includes('918080643517'),
    `Missing confirmed contact details: ${file}`,
  );
  check(
    !/98765|987654|24\/7|5-star|five-star|aggregateRating|reviewRating|₹3,300/.test(html),
    `Unverified mockup claim: ${file}`,
  );
  for (const [, href] of html.matchAll(/(?:href|src|poster)="([^"\s]+)"/g)) {
    if (href.startsWith('/') && !href.startsWith('//')) {
      let local = decodeURIComponent(href.split(/[?#]/)[0]).slice(1);
      if (!path.extname(local)) local = path.join(local, 'index.html');
      try {
        await fs.access(path.join('dist', local));
      } catch {
        results.failures.push(`Missing local destination ${href} in ${file}`);
      }
    }
    if (href.startsWith('#'))
      check(html.includes(`id="${href.slice(1)}"`), `Missing anchor ${href} in ${file}`);
    if (href.startsWith('https://wa.me/'))
      check(
        new URL(href.replaceAll('&amp;', '&')).pathname === '/918080643517',
        `Incorrect WhatsApp recipient: ${file}`,
      );
  }
  results.staticChecks++;
}
console.log(`Static checks: ${results.staticChecks} pages, ${results.failures.length} findings`);

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ reducedMotion: 'reduce' });
const page = await context.newPage();
page.on('pageerror', (error) => results.pageErrors.push({ url: page.url(), error: error.message }));
page.on('console', (message) => {
  if (message.type() === 'error') results.consoleErrors.push({ url: page.url(), error: message.text() });
});
page.on('request', (request) => {
  if (!request.url().startsWith(base) && !request.url().startsWith('data:'))
    results.externalRequests.push(request.url());
});

try {
  for (const width of [1440, 1024, 768, 430, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of routes) {
      const response = await page.goto(base + route, { waitUntil: 'networkidle' });
      await page.evaluate(() => document.fonts.ready);
      const observation = await page.evaluate(() => ({
        width: innerWidth,
        scrollWidth: document.documentElement.scrollWidth,
        broken: [...document.images]
          .filter((img) => img.getAttribute('src') && img.complete && !img.naturalWidth)
          .map((img) => img.currentSrc || img.src),
        h1: document.querySelector('h1')?.textContent,
        active: [...document.querySelectorAll('#main-nav [aria-current]')].map((el) =>
          el.getAttribute('href'),
        ),
      }));
      check(response.status() < 400 || route === '/404.html', `HTTP ${response.status()}: ${route}`);
      check(
        observation.scrollWidth <= width + 1,
        `Horizontal overflow at ${width}px: ${route} (${observation.scrollWidth})`,
      );
      check(
        observation.broken.length === 0,
        `Broken images at ${width}px: ${route}: ${observation.broken.join(', ')}`,
      );
      const expectedActive = route.startsWith('/vehicles/')
        ? '/vehicles/'
        : route.startsWith('/tour-packages/')
          ? '/tour-packages/'
          : route.startsWith('/services/')
            ? '/services/'
            : route;
      if (!['/faq/', '/404.html'].includes(route))
        check(observation.active.includes(expectedActive), `Wrong active navigation: ${route} at ${width}`);
      results.viewportChecks.push({
        route,
        width,
        overflow: observation.scrollWidth > width + 1,
        broken: observation.broken.length,
      });
    }
    console.log(`Verified ${routes.length} pages at ${width}px`);
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(base + '/');
  const menu = page.locator('.menu-toggle');
  await menu.click();
  assert.equal(await menu.getAttribute('aria-expanded'), 'true');
  await page.keyboard.press('Escape');
  assert.equal(await menu.getAttribute('aria-expanded'), 'false');
  assert.equal(await menu.evaluate((el) => el === document.activeElement), true);
  await menu.click();
  await page
    .getByRole('navigation', { name: 'Main navigation' })
    .getByRole('link', { name: 'Our Vehicles', exact: true })
    .click();
  assert.equal(new URL(page.url()).pathname, '/vehicles/');
  await page.getByRole('button', { name: 'MPV', exact: true }).click();
  assert.equal(await page.locator('.vehicle-card:visible').count(), 3);
  await page.getByRole('button', { name: 'SUV', exact: true }).click();
  assert.equal(await page.locator('.vehicle-card:visible').count(), 1);
  await page.getByRole('button', { name: 'All Vehicles', exact: true }).click();
  assert.equal(await page.locator('.vehicle-card:visible').count(), 10);
  results.interactions.push('Mobile navigation, Escape/focus, navigation to fleet, MPV/SUV/all filters');

  await page.goto(base + '/gallery/');
  await page.getByRole('button', { name: 'Waterfall', exact: true }).click();
  assert.equal(await page.locator('.gallery-item:visible').count(), 1);
  await page.locator('.gallery-item:visible').click();
  assert.equal(await page.locator('#photo-dialog').evaluate((el) => el.open), true);
  await page.keyboard.press('Escape');
  assert.equal(
    await page.locator('.gallery-item:visible').evaluate((el) => el === document.activeElement),
    true,
  );
  await page.getByRole('button', { name: 'Goa', exact: true }).click();
  assert.equal(await page.locator('.gallery-item:visible').count(), 7);
  await page.locator('.gallery-item:visible').first().click();
  const firstCaption = await page.locator('#photo-dialog figcaption').textContent();
  await page.getByRole('button', { name: 'Next photograph', exact: true }).click();
  assert.notEqual(await page.locator('#photo-dialog figcaption').textContent(), firstCaption);
  await page.keyboard.press('ArrowLeft');
  assert.equal(await page.locator('#photo-dialog figcaption').textContent(), firstCaption);
  await page.getByRole('button', { name: 'Close photograph preview', exact: true }).click();
  assert.equal(await page.locator('#photo-dialog').evaluate((el) => el.open), false);
  results.interactions.push(
    'Gallery filters, lightbox, next/previous, arrow keys, Escape and focus restoration',
  );

  await page.goto(base + '/vehicles/innova-crysta/');
  await page.getByRole('button', { name: 'View Toyota Innova Crysta photograph 1', exact: true }).click();
  assert.equal(await page.locator('#photo-dialog').evaluate((el) => el.open), true);
  await page.keyboard.press('ArrowRight');
  assert.equal(await page.locator('.photo-counter').textContent(), '2 / 4');
  await page.keyboard.press('Escape');
  results.interactions.push('Vehicle detail photograph navigation');

  await page.goto(base + '/contact/?vehicle=Toyota%20Innova%20Crysta&service=Airport%20Pickup%20%26%20Drop');
  assert.equal(await page.locator('[name=vehicle]').inputValue(), 'Toyota Innova Crysta');
  assert.equal(await page.locator('[name=service]').inputValue(), 'Airport Pickup & Drop');
  await page.getByRole('button', { name: 'Prepare WhatsApp Enquiry', exact: true }).click();
  assert.equal(await page.locator('#enquiry-preview').isVisible(), false);
  await page.locator('[name=name]').fill('   ');
  assert.equal(await page.locator('[name=name]').evaluate((el) => el.validity.valid), false);
  await page.locator('[name=name]').fill('QA Traveller');
  await page.locator('[name=phone]').fill('-------');
  assert.equal(await page.locator('[name=phone]').evaluate((el) => el.validity.valid), false);
  await page.locator('[name=phone]').fill('+91 80806 43517');
  assert.equal(await page.locator('[name=phone]').evaluate((el) => el.validity.valid), true);
  await page.locator('[name=email]').fill('invalid');
  assert.equal(await page.locator('[name=email]').evaluate((el) => el.validity.valid), false);
  await page.locator('[name=email]').fill('');
  await page.locator('[name=pickup]').fill('Goa test pickup');
  await page.locator('[name=passengers]').fill('0');
  assert.equal(await page.locator('[name=passengers]').evaluate((el) => el.validity.valid), false);
  await page.locator('[name=passengers]').fill('4');
  await page.locator('[name=date]').fill('2020-01-01');
  assert.equal(await page.locator('[name=date]').evaluate((el) => el.validity.valid), false);
  await page.locator('[name=date]').fill('');
  await page.locator('[name=message]').fill('North Goa & airport enquiry <script>test</script>');
  await page.getByRole('button', { name: 'Prepare WhatsApp Enquiry', exact: true }).click();
  assert.equal(await page.locator('#enquiry-preview').isVisible(), true);
  const waUrl = new URL(await page.locator('#enquiry-preview a').getAttribute('href'));
  assert.equal(waUrl.hostname, 'wa.me');
  assert.equal(waUrl.pathname, '/918080643517');
  assert.match(waUrl.searchParams.get('text'), /Toyota Innova Crysta/);
  assert.match(waUrl.searchParams.get('text'), /North Goa & airport enquiry <script>test<\/script>/);
  assert.equal(await page.locator('#enquiry-preview script').count(), 0);
  assert.equal(new URL(page.url()).hostname, 'localhost');
  await page.screenshot({ path: `${output}/contact-draft-mobile.png`, fullPage: true });
  results.interactions.push(
    'Contact prefill, required/whitespace/phone/email/date/passenger validation, safely encoded WhatsApp draft; no external send',
  );

  await page.goto(base + '/faq/');
  await page.locator('summary').first().click();
  assert.equal(
    await page
      .locator('details')
      .first()
      .evaluate((el) => el.open),
    true,
  );
  results.interactions.push('Native FAQ disclosure');

  await page.goto(base + '/vehicles/winger/');
  const video = page.locator('video');
  await video.evaluate((el) => el.load());
  await page.waitForFunction(() => document.querySelector('video')?.readyState >= 1);
  assert.equal(await video.evaluate((el) => el.controls && !el.autoplay), true);
  results.interactions.push('Supplied video metadata loads with user controls and no autoplay');

  const templates = [
    '/',
    '/about/',
    '/vehicles/',
    '/vehicles/innova-crysta/',
    '/vehicles/force-urbania/',
    '/tour-packages/',
    '/tour-packages/north-goa-extreme/',
    '/services/',
    '/services/airport-transfers/',
    '/gallery/',
    '/contact/',
    '/faq/',
    '/404.html',
  ];
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of templates) {
      await page.goto(base + route, { waitUntil: 'networkidle' });
      const audit = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
      const violations = audit.violations.map((v) => ({
        id: v.id,
        impact: v.impact,
        help: v.help,
        nodes: v.nodes.map((n) => ({ target: n.target, summary: n.failureSummary })),
      }));
      results.accessibility.push({ route, width, violations });
      check(
        !violations.length,
        `Accessibility findings at ${width}px ${route}: ${violations.map((v) => v.id).join(', ')}`,
      );
    }
    console.log(`Accessibility: ${templates.length} templates at ${width}px`);
  }

  for (const [label, route, width] of [
    ['home-desktop', '/', 1440],
    ['home-mobile', '/', 390],
    ['fleet-desktop', '/vehicles/', 1440],
    ['tour-mobile', '/tour-packages/north-goa-extreme/', 390],
    ['gallery-desktop', '/gallery/', 1440],
  ]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(base + route, { waitUntil: 'networkidle' });
    for (let y = 0; y < (await page.locator('body').evaluate((el) => el.scrollHeight)); y += 700) {
      await page.evaluate((y) => scrollTo(0, y), y);
      await page.waitForTimeout(60);
    }
    await page.evaluate(() => scrollTo(0, 0));
    await page.waitForFunction(() =>
      [...document.images].every((img) => {
        // Lazy images parked off-screen inside horizontal carousels load when the carousel is scrolled.
        const r = img.getBoundingClientRect();
        return !r.width || img.complete || r.left >= innerWidth || r.right <= 0;
      }),
    );
    await page.screenshot({ path: `${output}/${label}.png`, fullPage: true });
  }
  const noJS = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const noJSPage = await noJS.newPage();
  await noJSPage.goto(base + '/');
  assert.equal(await noJSPage.locator('h1').isVisible(), true);
  check((await noJSPage.locator('.tour-card').count()) === 4, 'Homepage content missing without JS');
  await noJS.close();
  results.interactions.push('Content visible without JavaScript and reduced-motion rendering');
} catch (error) {
  results.failures.push(error.stack || String(error));
} finally {
  check(!results.pageErrors.length, 'Browser JavaScript errors present');
  check(!results.consoleErrors.length, 'Browser console errors present');
  check(!results.externalRequests.length, 'Unexpected third-party network requests');
  await fs.writeFile(`${output}/qa-results.json`, JSON.stringify(results, null, 2));
  await browser.close();
}
console.log(
  JSON.stringify(
    {
      staticPages: results.staticChecks,
      viewportChecks: results.viewportChecks.length,
      a11yScans: results.accessibility.length,
      interactions: results.interactions.length,
      failures: results.failures,
    },
    null,
    2,
  ),
);
if (results.failures.length) process.exitCode = 1;
