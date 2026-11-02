import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';

const base = process.env.QA_BASE_URL || 'http://localhost:4322';
const report = { checkedAt: new Date().toISOString(), base, checks: [], errors: [] };
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
await context.addInitScript(() => {
  window.__handoffs = [];
  window.open = (...args) => {
    window.__handoffs.push(args);
    return null;
  };
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: {
      writeText: async (text) => {
        window.__copied = text;
      },
    },
  });
});
const page = await context.newPage();
page.on('pageerror', (error) => report.errors.push(error.message));
// Fail closed: no test can send to WhatsApp or place a phone call.
await context.route('**/*', (route) =>
  new URL(route.request().url()).origin === new URL(base).origin ? route.continue() : route.abort(),
);
const button = () => page.getByRole('button', { name: 'Enquire on WhatsApp', exact: true });
try {
  await page.goto(
    `${base}/contact/?service=Airport%20Pickup%20%26%20Drop&vehicle=Toyota%20Innova%20Crysta&token=do-not-share`,
  );
  await page.waitForFunction(() => !document.querySelector('[data-enquiry-fields]').disabled);
  await button().click();
  assert.equal(await page.locator('[aria-invalid=true]').count(), 4);
  assert.equal(await page.locator('[name=name]').evaluate((el) => el === document.activeElement), true);
  for (const field of await page.locator('[aria-invalid=true]').all()) {
    const errorId = await field.getAttribute('aria-describedby');
    assert.ok(await page.locator(`#${errorId}`).isVisible());
    assert.ok(await page.locator(`#${errorId}`).textContent());
  }
  assert.equal(await page.evaluate(() => window.__handoffs.length), 0);
  report.checks.push(
    'Empty fields: associated inline errors, aria-invalid and first-error focus; no handoff',
  );

  await page.locator('[name=name]').fill('   ');
  await page.locator('[name=phone]').fill('123456');
  await page.locator('[name=pickup]').fill('P');
  await page.locator('[name=message]').fill('Trip');
  await button().click();
  assert.equal(await page.locator('[aria-invalid=true]').count(), 4);
  assert.equal(await page.locator('[name=message]').inputValue(), 'Trip');
  report.checks.push('Whitespace name, short phone/pickup/message rejected; input preserved');

  await page.locator('[name=name]').fill('QA Traveller');
  await page.locator('[name=pickup]').fill('Test hotel in Goa');
  await page
    .locator('[name=message]')
    .fill('Hello & नमस्ते 👋 <script>alert("test")</script>\nPlease share a quote.');
  for (const phone of ['12 34 56', '++44123456789', '1234567890123456', '-------', '123+456789']) {
    await page.locator('[name=phone]').fill(phone);
    await button().click();
    assert.equal(await page.locator('[name=phone]').getAttribute('aria-invalid'), 'true');
  }
  await page.locator('[name=phone]').fill('+44 (20) 1234-5678');
  await page.locator('[name=email]').fill('bad-email');
  await button().click();
  assert.equal(await page.locator('[name=email]').getAttribute('aria-invalid'), 'true');
  await page.locator('[name=email]').fill('');
  await page.locator('[name=date]').fill('2020-01-01');
  await page.locator('[name=passengers]').fill('0');
  await button().click();
  assert.equal(await page.locator('[name=date]').getAttribute('aria-invalid'), 'true');
  assert.equal(await page.locator('[name=passengers]').getAttribute('aria-invalid'), 'true');
  await page.locator('[name=date]').fill('');
  await page.locator('[name=passengers]').fill('4');
  report.checks.push(
    'Phone punctuation/digit boundaries, international format, optional email, past date and passenger bounds',
  );

  await button().click();
  const href = await page.locator('#enquiry-preview a').getAttribute('href');
  const url = new URL(href);
  const message = url.searchParams.get('text');
  assert.equal(url.origin + url.pathname, 'https://wa.me/918080643517');
  assert.match(message, /Name: QA Traveller/);
  assert.match(message, /Mobile: \+44 \(20\) 1234-5678/);
  assert.match(message, /Interested service: Airport Pickup & Drop/);
  assert.match(message, /Preferred vehicle: Toyota Innova Crysta/);
  assert.match(message, /नमस्ते 👋 <script>alert\("test"\)<\/script>/);
  assert.match(message, new RegExp(`Source Page: ${base}/contact/`));
  assert.ok(
    !message.includes('token=') &&
      !message.includes('Email:') &&
      !message.includes('Travel date:') &&
      !message.includes('Drop:'),
  );
  assert.equal(message.split('Name:').length - 1, 1);
  assert.equal(await page.locator('#enquiry-preview pre script').count(), 0);
  assert.equal(await page.locator('[name=name]').inputValue(), 'QA Traveller');
  assert.deepEqual(await page.evaluate(() => window.__handoffs[0]), [href, '_blank', 'noopener,noreferrer']);
  await page.locator('#enquiry-form').evaluate((el) => {
    el.requestSubmit();
    el.requestSubmit();
  });
  assert.equal(await page.evaluate(() => window.__handoffs.length), 1);
  assert.ok(
    !/sent successfully|enquiry sent|booking confirmed/i.test(
      await page.locator('#enquiry-form').innerText(),
    ),
  );
  report.checks.push(
    'Correct recipient, UTF-8 encoding, exact field values/context, no empty/duplicate fields, source without query, text-only preview, duplicate-activation guard',
  );

  await page.getByRole('button', { name: 'Copy enquiry message' }).click();
  assert.equal(await page.evaluate(() => window.__copied), message);
  await page.evaluate(() => {
    navigator.clipboard.writeText = async () => {
      throw new Error('blocked');
    };
  });
  await page.getByRole('button', { name: 'Copy enquiry message' }).click();
  assert.match(await page.locator('[data-copy-status]').textContent(), /copy it manually/);
  assert.equal(await page.evaluate(() => window.getSelection().toString()), message);
  report.checks.push('Copy success and clipboard-denied manual selection fallback');

  await button().waitFor({ state: 'visible' });
  await page.waitForFunction(() => !document.querySelector('button[type="submit"]').disabled);
  await page.evaluate(() => {
    window.open = () => {
      throw new Error('blocked');
    };
  });
  await button().click();
  assert.match(await page.locator('[data-enquiry-status]').textContent(), /could not be opened/);
  assert.equal(await page.locator('#enquiry-preview').isVisible(), true);
  await page.waitForFunction(() => !document.querySelector('button[type="submit"]').disabled);
  await page.evaluate(() => {
    window.open = () => null;
  });
  await button().click();
  assert.match(await page.locator('[data-enquiry-status]').textContent(), /If it did not open/);
  report.checks.push(
    'Thrown/blocked/new-tab-null handoffs retain input and expose direct WhatsApp/copy/call alternatives',
  );

  await context.setOffline(true);
  await page.waitForFunction(() => !document.querySelector('button[type="submit"]').disabled);
  await button().click();
  assert.match(await page.locator('[data-enquiry-status]').textContent(), /offline/);
  assert.equal(await page.locator('#enquiry-preview').isVisible(), true);
  await context.setOffline(false);
  await page.locator('[name=message]').fill('A changed enquiry message');
  assert.equal(await page.locator('#enquiry-preview').isVisible(), false);
  report.checks.push('Detectable offline state retains draft; editing invalidates stale handoff');

  await page.goto(`${base}/contact/?service=Unknown&vehicle=Unknown&date=not-a-date`);
  assert.equal(await page.locator('[name=service]').inputValue(), '');
  assert.equal(await page.locator('[name=vehicle]').inputValue(), '');
  assert.equal(await page.locator('[name=date]').inputValue(), '');
  await page.goto(`${base}/`);
  await page.locator('.trip-planner [name=service]').selectOption('Airport Pickup & Drop');
  await page.locator('.trip-planner [name=vehicle]').selectOption('Toyota Innova Crysta');
  await page.locator('.trip-planner button[type=submit]').click();
  // The prefill runs in the deferred module script; wait for it rather than racing page load.
  await page.waitForURL('**/contact/?**');
  await page.waitForFunction(() => !document.querySelector('[data-enquiry-fields]')?.disabled);
  assert.equal(await page.locator('[name=service]').inputValue(), 'Airport Pickup & Drop');
  assert.equal(await page.locator('[name=vehicle]').inputValue(), 'Toyota Innova Crysta');
  await page.goBack();
  assert.equal(new URL(page.url()).pathname, '/');
  await page.goForward();
  assert.equal(new URL(page.url()).pathname, '/contact/');
  report.checks.push('Homepage trip planner, allowlisted query prefills, browser Back/Forward');

  const noJS = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const fallback = await noJS.newPage();
  await fallback.goto(`${base}/contact/`);
  assert.notEqual(await fallback.locator('[data-enquiry-fields]').getAttribute('disabled'), null);
  assert.equal(await fallback.locator('[name=name]').isDisabled(), true);
  const direct = fallback.getByRole('link', { name: 'open WhatsApp directly' });
  assert.equal(await direct.isVisible(), true);
  assert.equal(new URL(await direct.getAttribute('href')).pathname, '/918080643517');
  assert.ok(await fallback.locator('#enquiry-form a[href="tel:+918080643517"]').isVisible());
  await noJS.close();
  const failedJS = await browser.newContext();
  await failedJS.route('**/*.js', (route) => route.abort());
  const broken = await failedJS.newPage();
  await broken.goto(`${base}/contact/`);
  assert.notEqual(await broken.locator('[data-enquiry-fields]').getAttribute('disabled'), null);
  assert.equal(await broken.locator('[name=name]').isDisabled(), true);
  assert.equal(await broken.getByRole('link', { name: 'open WhatsApp directly' }).isVisible(), true);
  await failedJS.close();
  report.checks.push(
    'No JavaScript and failed script load: personal controls disabled, direct WhatsApp/call remain usable',
  );

  await page.goto(`${base}/contact/`);
  await page.locator('[name=name]').focus();
  await page.keyboard.press('Tab');
  assert.equal(await page.locator('[name=phone]').evaluate((el) => el === document.activeElement), true);
  await page.screenshot({ path: 'output/playwright/contact-stage1-mobile.png', fullPage: true });
  report.checks.push('Keyboard form order and mobile screenshot');
  assert.equal(report.errors.length, 0);
} catch (error) {
  report.errors.push(error.stack || String(error));
} finally {
  await browser.close();
  await fs.mkdir('output/stage1', { recursive: true });
  await fs.writeFile('output/stage1/enquiry-qa.json', JSON.stringify(report, null, 2));
}
console.log(JSON.stringify(report, null, 2));
if (report.errors.length) process.exitCode = 1;
