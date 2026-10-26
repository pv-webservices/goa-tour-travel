// Server-side image generation. Run with: npm run images:generate [-- --only=id1,id2] [--force]
// Reads OPENAI_API_KEY from the environment (or .env via node --env-file). Never runs in the browser.
import fs from 'node:fs/promises';
import path from 'node:path';
import { imageConfig, routeImageJob } from '../config/image-generation.mjs';
import { imageJobs } from '../config/image-jobs.mjs';

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  console.error('OPENAI_API_KEY is not set. Add it to .env (never commit it) or the shell environment.');
  process.exit(1);
}

const args = process.argv.slice(2);
const only = args
  .find((a) => a.startsWith('--only='))
  ?.slice(7)
  .split(',');
const force = args.includes('--force');
const jobs = only ? imageJobs.filter((j) => only.includes(j.id)) : imageJobs;

await fs.mkdir(imageConfig.outputDir, { recursive: true });
const logFile = path.join(imageConfig.outputDir, 'generation-log.json');
const log = JSON.parse(await fs.readFile(logFile, 'utf8').catch(() => '{}'));

async function generate(job) {
  const file = path.join(imageConfig.outputDir, `${job.id}.${imageConfig.outputFormat}`);
  if (!force && (await fs.stat(file).catch(() => null))) {
    console.log(`skip  ${job.id} (exists)`);
    return;
  }
  const route = routeImageJob(job);
  console.log(`start ${job.id} → ${route.model} · ${route.quality} · ${route.size}`);
  const response = await fetch(imageConfig.endpoint, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: route.model,
      prompt: job.prompt,
      size: route.size,
      quality: route.quality,
      output_format: imageConfig.outputFormat,
      n: 1,
    }),
    signal: AbortSignal.timeout(imageConfig.timeoutMs),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(`${job.id}: HTTP ${response.status} ${body?.error?.message || ''}`.trim());
  }
  const b64 = body?.data?.[0]?.b64_json;
  if (!b64) throw new Error(`${job.id}: response contained no image data`);
  await fs.writeFile(file, Buffer.from(b64, 'base64'));
  log[job.id] = { ...route, placement: job.placement, generatedAt: new Date().toISOString() };
  console.log(`done  ${job.id}`);
}

const results = await Promise.allSettled(jobs.map(generate));
await fs.writeFile(logFile, JSON.stringify(log, null, 2));
const failures = results.filter((r) => r.status === 'rejected');
failures.forEach((f) => console.error(`fail  ${f.reason.message}`));
process.exit(failures.length ? 1 : 0);
