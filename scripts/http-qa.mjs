import fs from 'node:fs/promises';
import assert from 'node:assert/strict';

const base = process.env.QA_BASE_URL || 'http://localhost:4322';
const audit = JSON.parse(await fs.readFile('output/stage1/seo-audit.json', 'utf8'));
const results = {
  base,
  checkedAt: new Date().toISOString(),
  pages: [],
  resources: [],
  errors: [],
  hostingConfig: [],
};
try {
  for (const url of audit.indexable) {
    const path = new URL(url).pathname;
    const response = await fetch(base + path, { redirect: 'manual' });
    assert.equal(response.status, 200, path);
    results.pages.push({ path, status: response.status });
  }
  for (const path of [
    '/stage1-missing-page/',
    '/nested/stage1-missing-page/',
    '/thank-you/',
    '/services/not-a-service/',
  ]) {
    const response = await fetch(base + path, { redirect: 'manual' });
    const html = await response.text();
    assert.equal(response.status, 404, path);
    assert.match(html, /Page Not Found/);
    assert.match(html, /name="robots" content="noindex, follow"/);
    assert.ok(!html.includes('rel="canonical"'), path);
    assert.ok(html.includes('tel:+918080643517') && html.includes('https://wa.me/918080643517'), path);
    results.pages.push({ path, status: response.status });
  }
  for (const [path, type] of [
    ['/favicon.ico', /image\/(x-icon|vnd\.microsoft\.icon)/],
    ['/favicon.svg', /image\/svg\+xml/],
    ...[48, 96, 192, 512].map((size) => [`/favicon-${size}x${size}.png`, /image\/png/]),
    ['/apple-touch-icon.png', /image\/png/],
    ['/site.webmanifest', /application\/(manifest\+json|json)/],
    ['/assets/brand/social-share.jpg', /image\/jpeg/],
    ['/assets/brand/logo.jpg', /image\/jpeg/],
    ['/robots.txt', /text\/plain/],
    ['/sitemap.xml', /(?:application|text)\/xml/],
  ]) {
    const response = await fetch(base + path, { redirect: 'manual' });
    assert.equal(response.status, 200, path);
    assert.match(response.headers.get('content-type') || '', type, path);
    results.resources.push({ path, status: response.status, type: response.headers.get('content-type') });
  }
  const config = JSON.parse(await fs.readFile('vercel.json', 'utf8'));
  assert.equal(config.framework, 'astro');
  assert.equal(config.outputDirectory, 'dist');
  assert.equal(config.trailingSlash, true);
  assert.ok(!config.rewrites?.length && !config.routes?.length, 'Do not add a catch-all SPA fallback');
  assert.ok(config.redirects.every((rule) => rule.permanent === true));
  for (const source of [
    '/index.html',
    '/index.php/about-us/',
    '/index.php/contact-us/',
    '/index.php/our-services/',
  ])
    assert.ok(
      config.redirects.some((rule) => rule.source === source),
      source,
    );
  const host = config.redirects.find((rule) => rule.has?.some((item) => item.type === 'host'));
  assert.equal(host.has[0].value, 'www.fatimatourandtravels.com');
  assert.equal(host.source, '/:path(.*)');
  assert.equal(host.destination, 'https://fatimatourandtravels.com/:path');
  const headers = config.headers.find((entry) => entry.source === '/(.*)').headers;
  for (const [key, value] of Object.entries({
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'X-Frame-Options': 'DENY',
  }))
    assert.ok(
      headers.some((header) => header.key === key && header.value === value),
      key,
    );
  results.hostingConfig.push(
    'Static config assertions passed: domain redirect, permanent legacy/index rules, trailing slashes, security headers and no SPA fallback. Astro preview does not execute vercel.json; production behavior must be tested after authorized deployment.',
  );
} catch (error) {
  results.errors.push(error.stack || String(error));
}
await fs.writeFile('output/stage1/http-qa.json', JSON.stringify(results, null, 2));
console.log(
  JSON.stringify(
    {
      base,
      pages: results.pages.length,
      resources: results.resources.length,
      hostingConfig: results.hostingConfig,
      errors: results.errors,
    },
    null,
    2,
  ),
);
if (results.errors.length) process.exitCode = 1;
