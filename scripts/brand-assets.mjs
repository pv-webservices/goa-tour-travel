import fs from 'node:fs/promises';
import sharp from 'sharp';

const logo = 'source-files/original-images/brand/website-logo.jpeg';
const mark = await sharp(logo).trim({ background: '#000000', threshold: 20 }).png().toBuffer();
await fs.mkdir('public/assets/brand', { recursive: true });
await fs.copyFile(logo, 'public/assets/brand/logo.jpg');
const square = await sharp(mark)
  .resize(480, 480, { fit: 'contain', background: '#000000' })
  .extend({ top: 16, right: 16, bottom: 16, left: 16, background: '#000000' })
  .png()
  .toBuffer();
for (const size of [48, 96, 192, 512])
  await sharp(square).resize(size, size).png().toFile(`public/favicon-${size}x${size}.png`);
await sharp(square).resize(180, 180).png().toFile('public/apple-touch-icon.png');
// ICO directory entries embed lossless PNGs, including the requested 48px representation.
const sizes = [16, 32, 48];
const buffers = await Promise.all(sizes.map((size) => sharp(square).resize(size, size).png().toBuffer()));
const header = Buffer.alloc(6 + sizes.length * 16);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(sizes.length, 4);
let offset = header.length;
buffers.forEach((buffer, i) => {
  const at = 6 + i * 16;
  header[at] = sizes[i];
  header[at + 1] = sizes[i];
  header.writeUInt16LE(1, at + 4);
  header.writeUInt16LE(32, at + 6);
  header.writeUInt32LE(buffer.length, at + 8);
  header.writeUInt32LE(offset, at + 12);
  offset += buffer.length;
});
await fs.writeFile('public/favicon.ico', Buffer.concat([header, ...buffers]));
// Browsers fetch the SVG icon at high priority on a first visit; a 128px palette PNG keeps it small
// while staying sharper than any tab or favicon slot it is drawn into.
const svgRaster = await sharp(square).resize(128, 128).png({ palette: true, effort: 10 }).toBuffer();
await fs.writeFile(
  'public/favicon.svg',
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><image width="512" height="512" href="data:image/png;base64,${svgRaster.toString('base64')}"/></svg>\n`,
);
await fs.writeFile(
  'public/site.webmanifest',
  JSON.stringify(
    {
      name: 'Fatima Tour and Travel',
      short_name: 'Fatima Travel',
      start_url: '/',
      display: 'browser',
      theme_color: '#0b0f12',
      background_color: '#0b0f12',
      icons: [192, 512].map((size) => ({
        src: `/favicon-${size}x${size}.png`,
        sizes: `${size}x${size}`,
        type: 'image/png',
        purpose: 'any',
      })),
    },
    null,
    2,
  ) + '\n',
);
const background = Buffer.from(
  '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630"><rect width="1200" height="630" fill="#0b0f12"/><path d="M100 540H1100" stroke="#e8b65a" stroke-width="3"/></svg>',
);
await sharp(background)
  .composite([{ input: await sharp(mark).resize({ width: 1000 }).toBuffer(), gravity: 'centre' }])
  .jpeg({ quality: 90 })
  .toFile('public/assets/brand/social-share.jpg');
console.log('Generated the favicon set, manifest and 1200×630 social image from the supplied logo.');
