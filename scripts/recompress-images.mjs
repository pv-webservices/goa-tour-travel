// Re-encodes every deployed responsive WebP rendition directly from its original
// master (never from an already-lossy WebP) with tuned settings. File names,
// pixel dimensions and src/data/images.json stay unchanged; a rendition is only
// replaced when the new encode is smaller. Usage: node scripts/recompress-images.mjs [--dry-run]
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const dryRun = process.argv.includes('--dry-run');
const originals = 'source-files/original-images';
const QUALITY = 72;
const manifest = JSON.parse(await fs.readFile('src/data/images.json', 'utf8'));
const slug = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

// Same crops as scripts/optimize-images.mjs so recompressed renditions match the approved framing.
const fleet = {
  'innova-crysta': ['vehicles/toyota-crysta-img-3.jpeg', [0.1, 0.29, 0.69, 0.42]],
  'innova-hycross': ['vehicles/toyota-innova-hycross-img-4.jpeg', [0.16, 0.31, 0.65, 0.39]],
  ertiga: ['vehicles/maruti-ertiga-img-3.jpeg'],
  dzire: ['vehicles/swift-dezire-img-3.jpeg', [0, 0.32, 1, 0.56]],
  'force-urbania': ['vehicles/urbania-img-3.jpeg'],
  fortuner: ['ai/ai-fortuner-representative.png', [0, 0.12, 1, 0.82]],
  glanza: ['vehicles/toyota-glanza-img-4.jpeg'],
  winger: ['vehicles/tata-winger-img-3.jpeg'],
  'tempo-traveller': ['vehicles/force-img-3.jpeg'],
  'bharatbenz-bus': ['vehicles/bharat-benz-img-3.jpeg'],
};
const masters = new Map();
for (const folder of ['vehicles', 'ai', 'editorial'])
  for (const file of await fs.readdir(path.join(originals, folder)))
    if (/\.(jpe?g|png)$/i.test(file)) masters.set(slug(path.parse(file).name), [`${folder}/${file}`]);
for (const [key, value] of Object.entries(fleet)) masters.set(`fleet-${key}`, value);

async function decoded([file, crop]) {
  const input = path.join(originals, file);
  let image = sharp(input).rotate();
  if (crop) {
    // Mirrors optimize-images.mjs exactly (crop fractions of the stored, unrotated dimensions).
    const { width: w, height: h } = await sharp(input).metadata();
    image = image.extract({
      left: Math.round(w * crop[0]),
      top: Math.round(h * crop[1]),
      width: Math.round(w * crop[2]),
      height: Math.round(h * crop[3]),
    });
  }
  // Keep pixels lossless between decode and the single WebP encode.
  const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });
  return () => sharp(data, { raw: info });
}

const report = { quality: QUALITY, replaced: [], kept: [], skipped: [], before: 0, after: 0 };
const urls = new Set(
  Object.entries(manifest)
    .filter(([key]) => key !== 'logo')
    .flatMap(([, image]) => image.srcset.split(', ').map((part) => part.split(' ')[0])),
);
const cache = new Map();
// Some deployed renditions were cut from older crops of the same master. Compare a tiny
// grayscale thumbnail of both images and refuse any re-encode whose framing differs.
const MAX_DIFFERENCE = 6;
async function difference(a, b) {
  const tiny = (input) => sharp(input).resize(48, 48, { fit: 'fill' }).grayscale().raw().toBuffer();
  const [x, y] = [await tiny(a), await tiny(b)];
  return x.reduce((sum, value, i) => sum + Math.abs(value - y[i]), 0) / x.length;
}
report.framingMismatch = [];
for (const url of urls) {
  const match = path.basename(url).match(/^(.*)-(\d+)\.webp$/);
  const master = match && masters.get(match[1]);
  if (!master) {
    report.skipped.push(url);
    continue;
  }
  const file = `public${url}`;
  const current = await fs.readFile(file);
  const { width, height } = await sharp(current).metadata();
  if (!cache.has(match[1])) cache.set(match[1], await decoded(master));
  const source = await cache.get(match[1])().metadata();
  // Never distort: the master framing must match the deployed rendition's aspect ratio.
  if (Math.abs(source.width / source.height - width / height) > 0.01) {
    report.skipped.push(`${url} (aspect mismatch)`);
    continue;
  }
  const next = await cache
    .get(match[1])()
    .resize({ width, height, fit: 'fill' })
    .webp({ quality: QUALITY, effort: 6, smartSubsample: true })
    .toBuffer();
  report.before += current.length;
  const delta = await difference(current, next);
  if (delta > MAX_DIFFERENCE) {
    report.after += current.length;
    report.framingMismatch.push({ url, delta: +delta.toFixed(1) });
    continue;
  }
  if (next.length < current.length) {
    report.after += next.length;
    report.replaced.push({ url, before: current.length, after: next.length });
    if (!dryRun) await fs.writeFile(file, next);
  } else {
    report.after += current.length;
    report.kept.push(url);
  }
}
// Vehicle detail thumbnails render at ~75–110 CSS px; a 240w rung stops them fetching 480w files.
report.added = [];
for (const [key, image] of Object.entries(manifest)) {
  if (key === 'logo' || !image.src.startsWith('/assets/vehicles/') || image.srcset.includes(' 240w'))
    continue;
  const id = path.basename(image.srcset.split(' ')[0]).replace(/-\d+\.webp$/, '');
  const master = masters.get(id);
  if (!master) continue;
  if (!cache.has(id)) cache.set(id, await decoded(master));
  const url = `/assets/vehicles/${id}-240.webp`;
  const next = await cache
    .get(id)()
    .resize({ width: 240 })
    .webp({ quality: QUALITY, effort: 6, smartSubsample: true })
    .toBuffer();
  const reference = await fs.readFile(`public${image.srcset.split(' ')[0]}`);
  const delta = await difference(reference, next);
  if (delta > MAX_DIFFERENCE) {
    report.framingMismatch.push({ url, delta: +delta.toFixed(1) });
    continue;
  }
  report.added.push({ url, bytes: next.length });
  if (dryRun) continue;
  await fs.writeFile(`public${url}`, next);
  image.srcset = `${url} 240w, ${image.srcset}`;
}
if (!dryRun && report.added.length)
  await fs.writeFile('src/data/images.json', JSON.stringify(manifest, null, 2) + '\n');

await fs.mkdir('output/stage2', { recursive: true });
await fs.writeFile(
  `output/stage2/recompress-${dryRun ? 'dry-run' : 'applied'}.json`,
  JSON.stringify(report, null, 2),
);
console.log(
  `${dryRun ? '[dry run] ' : ''}${report.replaced.length} replaced, ${report.added.length} thumbnails added, ${report.kept.length} kept, ${report.framingMismatch.length} framing mismatches kept, ${report.skipped.length} skipped; ` +
    `${(report.before / 1048576).toFixed(2)} MB → ${(report.after / 1048576).toFixed(2)} MB`,
);
if (report.skipped.length) console.log('Skipped (no master mapping):', report.skipped.join(', '));
