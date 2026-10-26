import type { APIRoute } from 'astro';
import { vehicles, tours, services } from '../data/site';
export const GET: APIRoute = ({ site }) => {
  const routes = [
    '/',
    '/about/',
    '/vehicles/',
    '/tour-packages/',
    '/services/',
    '/gallery/',
    '/contact/',
    '/faq/',
    ...vehicles.map((v) => `/vehicles/${v.slug}/`),
    ...tours.map((t) => `/tour-packages/${t.slug}/`),
    ...services.map((s) => `/services/${s.slug}/`),
  ];
  const urls = site
    ? routes.map((route) => `<url><loc>${new URL(route, site).href}</loc></url>`).join('')
    : '';
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`,
    { headers: { 'Content-Type': 'application/xml' } },
  );
};
