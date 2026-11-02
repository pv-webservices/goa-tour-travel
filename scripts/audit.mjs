import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from '@playwright/test';
import sharp from 'sharp';

const origin = 'https://fatimatourandtravels.com';
const files = (await fs.readdir('dist', { recursive: true })).filter((file) => file.endsWith('.html'));
const browser = await chromium.launch();
const page = await browser.newPage();
const report = {
  checkedAt: new Date().toISOString(),
  pages: [],
  indexable: [],
  excluded: [],
  linksChecked: 0,
  resourcesChecked: 0,
  whatsappLinks: 0,
  phoneLinks: 0,
  errors: [],
  warnings: [],
};
const expect = (ok, message) => {
  if (!ok) report.errors.push(message);
};
const titles = new Set();
const descriptions = new Set();
const references = new Set();
const inbound = new Map();
const routeOf = (file) =>
  file === '404.html' ? '/404.html' : '/' + file.replaceAll('\\', '/').replace(/index\.html$/, '');
const resolveFile = async (url) => {
  const local = decodeURIComponent(url.pathname).replace(/^\//, '');
  if (local.split('/').includes('..')) return null;
  const target = path.join('dist', local || 'index.html');
  const stat = await fs.stat(target).catch(() => null);
  return stat?.isFile()
    ? target
    : stat?.isDirectory() && (await fs.stat(path.join(target, 'index.html')).catch(() => null))
      ? path.join(target, 'index.html')
      : null;
};
try {
  for (const file of files) {
    const route = routeOf(file);
    const html = await fs.readFile(path.join('dist', file), 'utf8');
    const info = await page.evaluate((html) => {
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const meta = (key) =>
        doc.querySelector(`meta[name="${key}"], meta[property="${key}"]`)?.getAttribute('content');
      const headings = [...doc.querySelectorAll('h1,h2,h3,h4,h5,h6')].map((el) => ({
        level: Number(el.tagName[1]),
        text: el.textContent.trim(),
      }));
      const resources = [
        ...doc.querySelectorAll('[src],[poster],[data-poster],[data-photo],link[href]'),
      ].flatMap((el) => {
        if (
          el.matches('link') &&
          !['stylesheet', 'icon', 'apple-touch-icon', 'manifest', 'preload'].includes(el.getAttribute('rel'))
        )
          return [];
        return ['src', 'poster', 'data-poster', 'data-photo', ...(el.matches('link') ? ['href'] : [])]
          .map((key) => el.getAttribute(key))
          .filter(Boolean);
      });
      for (const el of doc.querySelectorAll('[srcset]'))
        resources.push(
          ...el
            .getAttribute('srcset')
            .split(',')
            .map((entry) => entry.trim().split(/\s+/)[0]),
        );
      return {
        title: doc.title,
        description: meta('description'),
        robots: meta('robots'),
        canonical: [...doc.querySelectorAll('link[rel="canonical"]')].map((el) => el.getAttribute('href')),
        headings,
        missingAlts: [...doc.images]
          .filter((el) => !el.hasAttribute('alt'))
          .map((el) => el.getAttribute('src')),
        links: [...doc.querySelectorAll('a[href]')].map((el) => ({
          href: el.getAttribute('href'),
          target: el.target,
          rel: el.rel,
          hidden: el.getAttribute('aria-hidden') === 'true',
          text: el.getAttribute('aria-label') || el.textContent.trim(),
        })),
        resources,
        ids: [...doc.querySelectorAll('[id]')].map((el) => el.id),
        metadata: Object.fromEntries(
          [
            'og:title',
            'og:description',
            'og:url',
            'og:type',
            'og:image',
            'og:image:width',
            'og:image:height',
            'og:image:alt',
            'twitter:card',
            'twitter:title',
            'twitter:description',
            'twitter:image',
            'twitter:image:alt',
          ].map((key) => [key, meta(key)]),
        ),
        schemas: [...doc.querySelectorAll('script[type="application/ld+json"]')].map((el) => el.textContent),
        forms: [...doc.forms].map((el) => ({ action: el.getAttribute('action'), method: el.method })),
      };
    }, html);
    const noindex = info.robots?.includes('noindex');
    expect(Boolean(info.title) && !titles.has(info.title), `${route}: missing/duplicate title`);
    titles.add(info.title);
    expect(
      Boolean(info.description) && !descriptions.has(info.description),
      `${route}: missing/duplicate description`,
    );
    descriptions.add(info.description);
    if (info.title?.length > 80 || info.title?.length < 30)
      report.warnings.push(`${route}: title length ${info.title.length}`);
    if (info.description?.length > 170 || info.description?.length < 70)
      report.warnings.push(`${route}: description length ${info.description.length}`);
    expect(info.headings.filter((h) => h.level === 1).length === 1, `${route}: expected one H1`);
    let previous = 0;
    for (const heading of info.headings) {
      expect(heading.level <= previous + 1, `${route}: heading skips to H${heading.level}: ${heading.text}`);
      previous = heading.level;
    }
    expect(!info.missingAlts.length, `${route}: missing alt attributes`);
    expect(info.ids.length === new Set(info.ids).size, `${route}: duplicate element IDs`);
    expect(
      noindex
        ? info.canonical.length === 0
        : info.canonical.length === 1 && info.canonical[0] === origin + route,
      `${route}: canonical mismatch`,
    );
    expect(
      noindex
        ? route === '/404.html'
        : info.robots?.includes('index, follow') && info.robots.includes('max-image-preview:large'),
      `${route}: robots mismatch`,
    );
    (noindex ? report.excluded : report.indexable).push(origin + route);
    for (const [key, value] of Object.entries(info.metadata)) {
      if (key !== 'og:url' || !noindex) expect(Boolean(value), `${route}: missing ${key}`);
    }
    if (!noindex) expect(info.metadata['og:url'] === origin + route, `${route}: OG URL mismatch`);
    expect(
      info.metadata['og:image'] === `${origin}/assets/brand/social-share.jpg`,
      `${route}: unexpected social image`,
    );
    expect(
      info.metadata['og:image:width'] === '1200' && info.metadata['og:image:height'] === '630',
      `${route}: social dimensions`,
    );
    for (const raw of info.schemas) {
      try {
        const schema = JSON.parse(raw);
        expect(schema['@context'] === 'https://schema.org', `${route}: schema context`);
        const graph = schema['@graph'];
        expect(
          Array.isArray(graph) &&
            graph.some((item) => item['@type'] === 'TravelAgency') &&
            graph.some((item) => item['@type'] === 'WebSite'),
          `${route}: missing business/website schema`,
        );
        const business = graph.find((item) => item['@type'] === 'TravelAgency');
        expect(
          business.telephone === '+918080643517' &&
            business.email === 'vaseem9823@gmail.com' &&
            business.url === origin + '/',
          `${route}: schema contacts`,
        );
        expect(
          !/aggregateRating|reviewRating|openingHours|streetAddress/.test(raw),
          `${route}: unsupported schema claim`,
        );
        if (route !== '/') {
          const crumbs = graph.find((item) => item['@type'] === 'BreadcrumbList');
          expect(crumbs?.itemListElement.at(-1).item === origin + route, `${route}: breadcrumb destination`);
        }
      } catch (error) {
        report.errors.push(`${route}: invalid JSON-LD: ${error.message}`);
      }
    }
    expect(noindex || info.schemas.length > 0, `${route}: missing JSON-LD`);
    for (const link of info.links) {
      report.linksChecked++;
      expect(link.hidden || Boolean(link.text), `${route}: link without accessible name: ${link.href}`);
      if (link.target === '_blank')
        expect(
          link.rel.includes('noopener') && link.rel.includes('noreferrer'),
          `${route}: unsafe external tab`,
        );
      if (link.href.startsWith('https://wa.me/')) {
        report.whatsappLinks++;
        const url = new URL(link.href);
        expect(
          url.pathname === '/918080643517' && Boolean(url.searchParams.get('text')),
          `${route}: invalid WhatsApp recipient/message`,
        );
      } else if (link.href.startsWith('tel:')) {
        report.phoneLinks++;
        expect(link.href === 'tel:+918080643517', `${route}: invalid phone link`);
      } else if (/^(\/|#)/.test(link.href) || link.href.startsWith(origin)) {
        const url = new URL(link.href, origin + route);
        if (url.origin !== origin) continue;
        const target = await resolveFile(url);
        expect(Boolean(target), `${route}: broken internal link ${link.href}`);
        if (target && url.hash) {
          const targetHTML = await fs.readFile(target, 'utf8');
          expect(
            targetHTML.includes(`id="${decodeURIComponent(url.hash.slice(1))}"`),
            `${route}: broken fragment ${link.href}`,
          );
        }
        if (url.pathname !== route) inbound.set(url.pathname, (inbound.get(url.pathname) || 0) + 1);
      }
    }
    for (const resource of info.resources) {
      const url = new URL(resource, origin + route);
      if (url.origin !== origin) continue;
      report.resourcesChecked++;
      references.add(url.pathname);
      expect(Boolean(await resolveFile(url)), `${route}: missing resource ${resource}`);
    }
    expect(
      !/formsubmit|emailjs|nodemailer|smtp|gmail\.googleapis|api\.resend|action="mailto:/i.test(html),
      `${route}: email-form implementation`,
    );
    expect(
      info.forms.every((form) => !form.action || form.action === '/contact/'),
      `${route}: unexpected form endpoint`,
    );
    report.pages.push({
      route,
      title: info.title,
      description: info.description,
      noindex,
      h1: info.headings.find((h) => h.level === 1)?.text,
      interactions: {
        whatsapp: info.links.filter((link) => link.href.startsWith('https://wa.me/')).length,
        phone: info.links.filter((link) => link.href.startsWith('tel:')).length,
        forms: info.forms.length,
      },
    });
  }
  const sitemap = await fs.readFile('dist/sitemap.xml', 'utf8');
  const entries = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  expect(entries.length === new Set(entries).size, 'Sitemap duplicate URLs');
  expect(
    JSON.stringify([...entries].sort()) === JSON.stringify([...report.indexable].sort()),
    'Sitemap differs from canonical indexable HTML inventory',
  );
  const robots = await fs.readFile('dist/robots.txt', 'utf8');
  expect(
    robots.includes('Allow: /') &&
      !robots.includes('Disallow: /') &&
      robots.includes(`Sitemap: ${origin}/sitemap.xml`),
    'robots.txt mismatch',
  );
  for (const url of report.indexable) expect(inbound.has(new URL(url).pathname), `Orphan page: ${url}`);
  for (const file of (await fs.readdir('dist', { recursive: true })).filter((file) =>
    file.endsWith('.css'),
  )) {
    const css = await fs.readFile(path.join('dist', file), 'utf8');
    for (const [, source] of css.matchAll(/url\(["']?([^\s"')]+)["']?\)/g)) {
      if (source.startsWith('data:')) continue;
      const url = new URL(source, origin + '/' + file.replaceAll('\\', '/'));
      expect(Boolean(await resolveFile(url)), `Missing CSS asset ${source}`);
      references.add(url.pathname);
      report.resourcesChecked++;
    }
  }
  for (const size of [48, 96, 192, 512]) {
    const info = await sharp(`dist/favicon-${size}x${size}.png`).metadata();
    expect(info.width === size && info.height === size, `Invalid favicon size ${size}`);
  }
  const apple = await sharp('dist/apple-touch-icon.png').metadata();
  expect(apple.width === 180 && apple.height === 180, 'Invalid Apple icon');
  const social = await sharp('dist/assets/brand/social-share.jpg').metadata();
  expect(social.width === 1200 && social.height === 630, 'Invalid social image');
  const ico = await fs.readFile('dist/favicon.ico');
  expect(
    ico.readUInt16LE(2) === 1 &&
      Array.from({ length: ico.readUInt16LE(4) }, (_, i) => ico[6 + i * 16]).includes(48),
    'ICO missing 48px representation',
  );
  const manifest = JSON.parse(await fs.readFile('dist/site.webmanifest', 'utf8'));
  expect(
    manifest.name && manifest.short_name && manifest.theme_color && manifest.background_color,
    'Manifest fields',
  );
  for (const icon of manifest.icons)
    expect(Boolean(await resolveFile(new URL(icon.src, origin))), `Missing manifest icon ${icon.src}`);
  report.referencedResources = [...references].sort();
} finally {
  await browser.close();
  await fs.mkdir('output/stage1', { recursive: true });
  await fs.writeFile('output/stage1/seo-audit.json', JSON.stringify(report, null, 2));
}
console.log(
  JSON.stringify(
    {
      pages: report.pages.length,
      indexable: report.indexable.length,
      excluded: report.excluded.length,
      linksChecked: report.linksChecked,
      resourcesChecked: report.resourcesChecked,
      whatsappLinks: report.whatsappLinks,
      phoneLinks: report.phoneLinks,
      errors: report.errors,
      warnings: report.warnings,
    },
    null,
    2,
  ),
);
if (report.errors.length) process.exitCode = 1;
