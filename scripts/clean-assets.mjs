import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

const file = 'src/data/images.json';
const manifest = JSON.parse(await fs.readFile(file, 'utf8'));
const archived = [];
const aliases = {};
async function archive(url) {
  const source = `public${url}`;
  const destination = `source-files/unused-renditions/${path.basename(url)}`;
  if (await fs.stat(source).catch(() => null)) {
    await fs.mkdir(path.dirname(destination), { recursive: true });
    if (await fs.stat(destination).catch(() => null)) {
      const previous = await fs.readFile(destination);
      const current = await fs.readFile(source);
      if (!previous.equals(current)) throw new Error(`Archive collision: ${destination}`);
      await fs.unlink(source);
    } else await fs.rename(source, destination);
    archived.push(url);
  }
}
// Superseded by current client photos, the cropped Fortuner card and transparent header logo.
for (const key of Object.keys(manifest).filter(
  (key) => key.startsWith('misc-img-') || ['website-logo', 'ai-fortuner-representative'].includes(key),
)) {
  for (const source of manifest[key].srcset.split(', ').map((part) => part.split(' ')[0]))
    await archive(source);
  delete manifest[key];
}
const hashes = new Map();
const sources = [
  ...new Set(
    Object.values(manifest).flatMap((image) => image.srcset.split(', ').map((part) => part.split(' ')[0])),
  ),
];
// Keep the fleet URL when two placements use exactly the same bytes.
sources.sort((a, b) => Number(b.includes('/fleet-')) - Number(a.includes('/fleet-')) || a.localeCompare(b));
for (const source of sources) {
  const hash = crypto
    .createHash('sha256')
    .update(await fs.readFile(`public${source}`))
    .digest('hex');
  if (hashes.has(hash)) {
    aliases[source] = hashes.get(hash);
    await archive(source);
  } else hashes.set(hash, source);
}
for (const image of Object.values(manifest)) {
  image.src = aliases[image.src] || image.src;
  image.srcset = image.srcset
    .split(', ')
    .map((part) => {
      const [source, width] = part.split(' ');
      return `${aliases[source] || source} ${width}`;
    })
    .join(', ');
}
await fs.writeFile(file, JSON.stringify(manifest, null, 2) + '\n');
await fs.mkdir('output/stage1', { recursive: true });
await fs.writeFile('output/stage1/asset-cleanup.json', JSON.stringify({ archived, aliases }, null, 2));
console.log(
  `${archived.length} unused/duplicate renditions archived outside public; ${Object.keys(aliases).length} URLs deduplicated.`,
);
