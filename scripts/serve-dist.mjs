// Local production server that approximates the Vercel static-hosting behaviour
// configured in vercel.json: compression, cache headers, security headers,
// trailing-slash and legacy redirects, and a real 404 status for unknown routes.
// It is a measurement/QA aid only; it does not prove deployed edge behaviour.
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import zlib from 'node:zlib';
import { promisify } from 'node:util';

const root = path.resolve(process.argv[2] || 'dist');
const port = Number(process.env.PORT || 4322);
const vercel = JSON.parse(await fs.readFile('vercel.json', 'utf8'));
const brotli = promisify(zlib.brotliCompress);
const gzip = promisify(zlib.gzip);

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
  '.webmanifest': 'application/manifest+json',
  '.xml': 'application/xml',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
};
const COMPRESSIBLE = /^(text\/|application\/(json|xml|manifest\+json)|image\/svg)/;

// Converts a vercel.json path-to-regexp source to a RegExp. Dots are literal outside
// parenthesised groups; inside a group the author already wrote a regular expression.
const toRegex = (source) => {
  let out = '';
  let depth = 0;
  for (let i = 0; i < source.length; i++) {
    const char = source[i];
    if (char === '(') depth++;
    if (char === ')') depth--;
    if (char === '\\') {
      out += char + source[++i];
      continue;
    }
    out += char === '.' && depth === 0 ? '\\.' : char;
  }
  return new RegExp(
    '^' +
      out
        .replace(/:(\w+)\(([^)]+(?:\([^)]*\)[^)]*)*)\)/g, '(?<$1>$2)')
        .replace(/:(\w+)\+/g, '(?<$1>.+)')
        .replace(/:(\w+)/g, '(?<$1>[^/]+)') +
      '$',
  );
};
const redirects = vercel.redirects
  .filter((r) => !r.has)
  .map((r) => ({ re: toRegex(r.source), destination: r.destination, status: r.permanent ? 308 : 307 }));
const headerRules = vercel.headers.map((h) => ({ re: toRegex(h.source), headers: h.headers }));

async function resolveFile(urlPath) {
  const candidate = path.join(root, decodeURIComponent(urlPath));
  if (!candidate.startsWith(root)) return null;
  try {
    const stat = await fs.stat(candidate);
    if (stat.isFile()) return candidate;
    if (stat.isDirectory()) {
      const index = path.join(candidate, 'index.html');
      await fs.access(index);
      return index;
    }
  } catch {}
  return null;
}

async function send(req, res, status, file, extraHeaders = {}) {
  let body = await fs.readFile(file);
  const type = TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream';
  const headers = { 'Content-Type': type, ...extraHeaders };
  const accept = req.headers['accept-encoding'] || '';
  if (COMPRESSIBLE.test(type) && body.length > 1024) {
    if (accept.includes('br')) {
      body = await brotli(body);
      headers['Content-Encoding'] = 'br';
    } else if (accept.includes('gzip')) {
      body = await gzip(body);
      headers['Content-Encoding'] = 'gzip';
    }
    headers.Vary = 'Accept-Encoding';
  }
  headers['Content-Length'] = body.length;
  res.writeHead(status, headers);
  res.end(req.method === 'HEAD' ? undefined : body);
}

http
  .createServer(async (req, res) => {
    try {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const pathname = url.pathname;
      const headers = {};
      for (const rule of headerRules)
        if (rule.re.test(pathname)) for (const h of rule.headers) headers[h.key] = h.value;

      for (const r of redirects) {
        const match = pathname.match(r.re);
        if (!match) continue;
        let location = r.destination;
        for (const [key, value] of Object.entries(match.groups || {}))
          location = location.replace(new RegExp(`:${key}\\+?`), value);
        res.writeHead(r.status, { ...headers, Location: location + url.search });
        return res.end();
      }
      // trailingSlash: true — add the slash to extensionless paths.
      if (!pathname.endsWith('/') && !path.extname(pathname)) {
        res.writeHead(308, { ...headers, Location: pathname + '/' + url.search });
        return res.end();
      }
      const file = await resolveFile(pathname);
      if (file) return await send(req, res, 200, file, headers);
      return await send(req, res, 404, path.join(root, '404.html'), headers);
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end(String(error));
    }
  })
  .listen(port, () => console.log(`Serving ${root} with Vercel-like rules at http://localhost:${port}`));
