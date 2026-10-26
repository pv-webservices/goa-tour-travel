import fs from 'node:fs/promises';
const photos = [
  [
    'aguada',
    'https://unsplash.com/photos/a-group-of-people-walking-around-a-large-white-tower-d6GgOxRgqBQ',
    'Vignesh Jayaprakash',
    'Fort Aguada, North Goa',
  ],
  [
    'arambol',
    'https://unsplash.com/photos/silhouette-of-palm-trees-near-body-of-water-during-sunset-tBzGG6IHaQQ',
    'TiAchen Aier',
    'Arambol Beach, North Goa',
  ],
  [
    'dudhsagar',
    'https://unsplash.com/photos/a-waterfall-in-a-forest-J61RCfJ27bk',
    'Arun Prakash',
    'Dudhsagar, Goa',
  ],
  [
    'goa-coast',
    'https://unsplash.com/photos/a-view-of-a-tropical-beach-with-palm-trees-M5AR9jscKgM',
    'Chirayu Sharma',
    'Kakolem Beach, Goa',
  ],
  [
    'goa-sunset',
    'https://unsplash.com/photos/the-sun-is-setting-over-the-ocean-with-a-palm-tree-in-the-foreground-I9qh1Q_tgfU',
    'Chirayu Sharma',
    'Goa sunset',
  ],
  [
    'south-goa',
    'https://unsplash.com/photos/white-red-church--9FvGYtA9eA',
    'Mohammad Aqhib',
    'Church architecture, Goa',
  ],
  [
    'goa-beach',
    'https://unsplash.com/photos/a-sandy-beach-next-to-the-ocean-with-palm-trees-xWFL4KNd_2A',
    'Ishvani Hans',
    'South Goa coast',
  ],
  [
    'palolem',
    'https://unsplash.com/photos/palm-trees-near-seashore-WSe6NAwwESA',
    'Kotagauni Srinivas',
    'Palolem Beach, Goa',
  ],
];
for (const [name, url, author, caption] of photos) {
  try {
    const html = await (await fetch(url)).text();
    const match = html.match(/<meta[^>]+property="og:image"[^>]+content="([^"]+)"/);
    if (!match) throw new Error('No image found');
    const original = new URL(match[1].replaceAll('&amp;', '&'));
    const imageUrl = new URL(original.origin + original.pathname);
    imageUrl.searchParams.set('w', name === 'goa-coast' ? 2200 : 1400);
    imageUrl.searchParams.set('q', 85);
    imageUrl.searchParams.set('fm', 'jpg');
    const result = await fetch(imageUrl);
    if (!result.ok) throw new Error(result.status);
    await fs.writeFile(`public/images/${name}.jpg`, Buffer.from(await result.arrayBuffer()));
    console.log(name, author, caption, imageUrl.toString());
  } catch (e) {
    console.error(name, e.message);
  }
}
await fs.writeFile(
  'ASSET-SOURCES.md',
  '# Asset sources\n\nOriginal logo, vehicle photographs and video: client supplied in public/. Photographs are used without making fleet ownership or availability claims.\n\nDestination photographs downloaded locally under the [Unsplash License](https://unsplash.com/license):\n\n' +
    photos
      .map(([name, url, author, caption]) => `- ${name}: ${caption}. Photo by ${author}. ${url}`)
      .join('\n'),
);
