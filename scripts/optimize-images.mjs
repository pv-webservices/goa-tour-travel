import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const originals = 'source-files/original-images';
const manifest = {};
async function optimize(key, input, crop, folder = 'vehicles') {
  let source = sharp(input).rotate();
  if (crop) {
    const m = await sharp(input).metadata();
    source = source.extract({
      left: Math.round(m.width * crop[0]),
      top: Math.round(m.height * crop[1]),
      width: Math.round(m.width * crop[2]),
      height: Math.round(m.height * crop[3]),
    });
  }
  const buffer = await source.toBuffer();
  const m = await sharp(buffer).metadata();
  const id = key
    .replace(/\.[^.]+$/, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-');
  const widths = [
    ...new Set(
      [480, 960, 1440, ...(key === 'goa-coast' || key.startsWith('ai-hero') ? [2200] : [])].map((w) =>
        Math.min(w, m.width),
      ),
    ),
  ];
  const sources = [];
  for (const width of widths) {
    const file = `/assets/${folder}/${id}-${width}.webp`;
    await fs.mkdir(`public/assets/${folder}`, { recursive: true });
    await sharp(buffer)
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: 80, effort: 5 })
      .toFile(`public${file}`);
    sources.push(`${file} ${width}w`);
  }
  manifest[id] = {
    src: `/assets/${folder}/${id}-${widths[Math.min(1, widths.length - 1)]}.webp`,
    srcset: sources.join(', '),
    width: m.width,
    height: m.height,
  };
}
for (const file of await fs.readdir(`${originals}/vehicles`))
  if (file.endsWith('.jpeg') && !file.startsWith('misc-'))
    await optimize(path.parse(file).name, `${originals}/vehicles/${file}`);
// Server-generated AI scenes (see scripts/generate-images.mjs); originals stay outside public/.
for (const file of await fs.readdir(`${originals}/ai`).catch(() => []))
  if (file.endsWith('.png') && !file.includes('fortuner'))
    await optimize(path.parse(file).name, `${originals}/ai/${file}`, undefined, 'illustrations');
for (const file of await fs.readdir(`${originals}/editorial`))
  if (file.endsWith('.jpg'))
    await optimize(path.parse(file).name, `${originals}/editorial/${file}`, undefined, 'editorial');
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
for (const [slug, [file, crop]] of Object.entries(fleet))
  await optimize(`fleet-${slug}`, `${originals}/${file}`, crop);
// The supplied logo sits on a black box; derive a transparent version (black → alpha) for dark headers.
async function transparentLogo() {
  const { data, info } = await sharp(`${originals}/brand/website-logo.jpeg`)
    .rotate()
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  for (let i = 0; i < data.length; i += 4) {
    const peak = Math.max(data[i], data[i + 1], data[i + 2]);
    const alpha = peak <= 18 ? 0 : Math.min(255, Math.round(((peak - 18) * 255) / 237));
    if (alpha)
      for (let c = 0; c < 3; c++) data[i + c] = Math.min(255, Math.round((data[i + c] * 255) / alpha));
    data[i + 3] = alpha;
  }
  const trimmed = await sharp(data, { raw: info }).trim({ threshold: 1 }).png().toBuffer();
  const m = await sharp(trimmed).metadata();
  const sources = [];
  for (const width of [320, 640]) {
    await sharp(trimmed)
      .resize({ width })
      .webp({ quality: 90, alphaQuality: 100 })
      .toFile(`public/assets/brand/logo-light-${width}.webp`);
    sources.push(`/assets/brand/logo-light-${width}.webp ${width}w`);
  }
  manifest.logo = {
    src: '/assets/brand/logo-light-640.webp',
    srcset: sources.join(', '),
    width: m.width,
    height: m.height,
  };
}
await transparentLogo();
await fs.writeFile('src/data/images.json', JSON.stringify(manifest, null, 2));
await import('./clean-assets.mjs');
console.log(`Optimized ${Object.keys(manifest).length} images with responsive WebP sources.`);
