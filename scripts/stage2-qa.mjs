// Stage 2 QA: axe-core (WCAG 2.1 A/AA) on every built route, responsive overflow,
// tap-target and broken-image checks at 320/375/768/1024/1440 (+ landscape phone),
// keyboard navigation, focus visibility, menu Escape handling and reduced-motion rendering.
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const base = process.env.QA_BASE_URL || 'http://localhost:4322';
const htmlFiles = (await fs.readdir('dist', { recursive: true })).filter((f) => f.endsWith('.html'));
const routes = htmlFiles
  .map((f) =>
    f === '404.html' ? '/stage2-missing-route/' : '/' + f.replaceAll('\\', '/').replace(/index\.html$/, ''),
  )
  .sort();
const viewports = [
  [320, 640],
  [375, 812],
  [768, 1024],
  [1024, 768],
  [1440, 900],
  [812, 375],
];
const results = { base, routes: routes.length, axe: [], layout: [], keyboard: [], motion: [], failures: [] };
const fail = (message) => results.failures.push(message);

const browser = await chromium.launch();
try {
  // 1. axe on every route at mobile and desktop widths.
  for (const width of [375, 1440]) {
    // Reduced motion gives the settled final state; scanning mid scroll-reveal reports transient
    // partial-opacity text as contrast and label-in-name failures.
    const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    for (const route of routes) {
      await page.goto(base + route, { waitUntil: 'networkidle' });
      const audit = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'])
        .analyze();
      const violations = audit.violations.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length }));
      results.axe.push({ route, width, violations, incomplete: audit.incomplete.map((v) => v.id) });
      if (violations.length) fail(`axe ${width}px ${route}: ${violations.map((v) => v.id).join(', ')}`);
    }
    await context.close();
  }

  // 2. Responsive layout: horizontal overflow, broken images, undersized touch targets.
  for (const [width, height] of viewports) {
    const context = await browser.newContext({ viewport: { width, height }, hasTouch: width < 1024 });
    const page = await context.newPage();
    for (const route of routes) {
      await page.goto(base + route, { waitUntil: 'networkidle' });
      const report = await page.evaluate(async () => {
        for (let y = 0; y < document.body.scrollHeight; y += innerHeight) {
          scrollTo(0, y);
          await new Promise((r) => setTimeout(r, 40));
        }
        scrollTo(0, 0);
        await Promise.all(
          [...document.images]
            .filter((img) => img.getBoundingClientRect().width && !img.complete && img.loading !== 'lazy')
            .map((img) => new Promise((r) => img.addEventListener('load', r, { once: true }))),
        );
        const overflow = document.documentElement.scrollWidth - innerWidth;
        const broken = [...document.images]
          .filter((img) => img.complete && img.currentSrc && img.naturalWidth === 0)
          .map((img) => img.currentSrc);
        const small = [...document.querySelectorAll('a[href], button, input, select, textarea, summary')]
          .filter((el) => {
            const r = el.getBoundingClientRect();
            if (!r.width || !r.height || getComputedStyle(el).visibility === 'hidden') return false;
            // Inline links inside running text are exempt under WCAG 2.5.8.
            if (el.tagName === 'A' && getComputedStyle(el).display === 'inline') return false;
            return r.width < 24 || r.height < 24;
          })
          .map((el) => el.outerHTML.slice(0, 80));
        return { overflow, broken, small };
      });
      results.layout.push({ route, width, height, ...report });
      if (report.overflow > 1)
        fail(`Horizontal overflow ${report.overflow}px at ${width}x${height} ${route}`);
      if (report.broken.length) fail(`Broken images at ${width}px ${route}: ${report.broken.join(', ')}`);
      if (report.small.length)
        fail(`Touch targets < 24px at ${width}px ${route}: ${report.small.join(' | ')}`);
    }
    await context.close();
    console.log(`Layout: ${routes.length} routes at ${width}x${height}`);
  }

  // 3. Keyboard: skip link, visible focus, logical order, mobile drawer and submenu Escape.
  {
    // Reduced motion: focus rings fade in via transitions; measure the settled style, not a mid-transition frame.
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      reducedMotion: 'reduce',
    });
    const page = await context.newPage();
    await page.goto(base + '/');
    await page.keyboard.press('Tab');
    assert.equal(await page.evaluate(() => document.activeElement?.className), 'skip-link');
    assert.ok(await page.locator('.skip-link').evaluate((el) => el.getBoundingClientRect().top >= 0));
    await page.keyboard.press('Enter');
    assert.equal(await page.evaluate(() => location.hash), '#main');
    results.keyboard.push('Skip link is first, visible on focus and moves to #main');

    await page.goto(base + '/');
    const seen = [];
    for (let i = 0; i < 40; i++) {
      await page.keyboard.press('Tab');
      const info = await page.evaluate(() => {
        const el = document.activeElement;
        const style = getComputedStyle(el);
        const visible = style.outlineStyle !== 'none' && parseFloat(style.outlineWidth) > 0;
        return {
          tag: el.tagName,
          text: (el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 40),
          visible,
          shadow: style.boxShadow !== 'none',
        };
      });
      seen.push(info);
      if (!info.visible && !info.shadow) fail(`No visible focus indicator on ${info.tag} "${info.text}"`);
    }
    results.keyboard.push(`40 sequential Tab stops on the homepage all show a focus indicator`);

    const toggle = page.locator('.submenu-toggle').first();
    await toggle.focus();
    await page.keyboard.press('Enter');
    assert.equal(await toggle.getAttribute('aria-expanded'), 'true');
    await page.keyboard.press('Escape');
    assert.equal(await toggle.getAttribute('aria-expanded'), 'false');
    assert.ok(await toggle.evaluate((el) => el === document.activeElement));
    await toggle.focus();
    await page.keyboard.press('Space');
    assert.equal(await toggle.getAttribute('aria-expanded'), 'true');
    await page.keyboard.press('Escape');
    results.keyboard.push('Desktop submenu opens with Enter/Space, closes with Escape and returns focus');
    await context.close();

    const mobile = await browser.newContext({ viewport: { width: 375, height: 812 } });
    const m = await mobile.newPage();
    await m.goto(base + '/');
    const menu = m.locator('.menu-toggle');
    await menu.focus();
    await m.keyboard.press('Enter');
    assert.equal(await menu.getAttribute('aria-expanded'), 'true');
    assert.ok(await m.locator('#main-nav a[href="/vehicles/"]').first().isVisible());
    const inNav = () =>
      m.evaluate(() => document.querySelector('#main-nav')?.contains(document.activeElement));
    await m.waitForFunction(() => document.querySelector('#main-nav')?.contains(document.activeElement));
    await m.keyboard.press('Tab');
    assert.ok(await inNav());
    // Shift+Tab from the first drawer item wraps to the toggle, and Tab from the toggle re-enters the drawer.
    await m.locator('#main-nav a[href]').first().focus();
    await m.keyboard.press('Shift+Tab');
    assert.ok(await menu.evaluate((el) => el === document.activeElement));
    await m.keyboard.press('Tab');
    assert.ok(await inNav());
    await m.keyboard.press('Escape');
    assert.equal(await menu.getAttribute('aria-expanded'), 'false');
    assert.ok(await menu.evaluate((el) => el === document.activeElement));
    results.keyboard.push(
      'Mobile drawer opens by keyboard, focus moves into it and cycles with the toggle, Escape closes and restores focus',
    );

    await m.goto(base + '/gallery/');
    const photo = m.locator('[data-photo]').first();
    await photo.focus();
    await m.keyboard.press('Enter');
    assert.ok(await m.locator('#photo-dialog').evaluate((d) => d.open));
    await m.keyboard.press('Escape');
    assert.ok(!(await m.locator('#photo-dialog').evaluate((d) => d.open)));
    assert.ok(await photo.evaluate((el) => el === document.activeElement));
    results.keyboard.push(
      'Photo dialog opens by keyboard, Escape closes it and focus returns to the trigger',
    );

    await m.goto(base + '/contact/');
    await m.locator('#enquiry-name').focus();
    await m.keyboard.press('Enter');
    assert.equal(await m.evaluate(() => document.activeElement?.id), 'enquiry-name');
    assert.equal(await m.locator('#enquiry-name').getAttribute('aria-invalid'), 'true');
    results.keyboard.push(
      'Enter submits the enquiry form by keyboard and focus moves to the first invalid field',
    );
    await mobile.close();
  }

  // 4. Reduced motion: intro hidden, reveal content visible, no running animations block content.
  for (const route of ['/', '/vehicles/', '/tour-packages/north-goa/', '/gallery/']) {
    const context = await browser.newContext({
      viewport: { width: 375, height: 812 },
      reducedMotion: 'reduce',
    });
    const page = await context.newPage();
    await page.goto(base + route, { waitUntil: 'networkidle' });
    const state = await page.evaluate(() => ({
      intro: getComputedStyle(document.querySelector('.intro-screen')).display,
      hidden: [...document.querySelectorAll('[data-reveal]')].filter(
        (el) => getComputedStyle(el).opacity !== '1',
      ).length,
      revealReady: document.documentElement.classList.contains('reveal-ready'),
    }));
    results.motion.push({ route, ...state });
    if (state.intro !== 'none' || state.hidden || state.revealReady)
      fail(`Reduced motion still hides content on ${route}: ${JSON.stringify(state)}`);
    await context.close();
  }
} catch (error) {
  fail(error.stack || String(error));
} finally {
  await browser.close();
  await fs.mkdir('output/stage2', { recursive: true });
  await fs.writeFile('output/stage2/stage2-qa.json', JSON.stringify(results, null, 2));
}
console.log(
  JSON.stringify(
    {
      routes: results.routes,
      axeScans: results.axe.length,
      axeViolations: results.axe.reduce((n, r) => n + r.violations.length, 0),
      layoutChecks: results.layout.length,
      keyboard: results.keyboard.length,
      motion: results.motion.length,
      failures: results.failures,
    },
    null,
    2,
  ),
);
if (results.failures.length) process.exitCode = 1;
