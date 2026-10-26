import fs from 'node:fs/promises';
import { chromium } from '@playwright/test';

const base = process.env.QA_BASE_URL || 'http://localhost:4322';
const browser = await chromium.launch({ headless: true });
const runs = [];
try {
  for (const width of [1440, 390]) {
    const context = await browser.newContext({ viewport: { width, height: 900 } });
    const page = await context.newPage();
    const cdp = await context.newCDPSession(page);
    await cdp.send('Network.enable');
    await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
    await cdp.send('Network.emulateNetworkConditions', {
      offline: false,
      latency: 40,
      downloadThroughput: 625000,
      uploadThroughput: 125000,
    });
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    await page.addInitScript(() => {
      window.__metrics = { lcp: 0, cls: 0, longTasks: 0 };
      new PerformanceObserver((list) => {
        for (const e of list.getEntries()) window.__metrics.lcp = e.startTime;
      }).observe({ type: 'largest-contentful-paint', buffered: true });
      new PerformanceObserver((list) => {
        for (const e of list.getEntries()) if (!e.hadRecentInput) window.__metrics.cls += e.value;
      }).observe({ type: 'layout-shift', buffered: true });
      new PerformanceObserver((list) => {
        window.__metrics.longTasks += list.getEntries().length;
      }).observe({ type: 'longtask', buffered: true });
    });
    await page.goto(base, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(1500);
    runs.push(
      await page.evaluate(
        (width) => ({
          width,
          ...window.__metrics,
          resources: performance.getEntriesByType('resource').length,
          transferBytes: performance.getEntriesByType('resource').reduce((sum, r) => sum + r.transferSize, 0),
        }),
        width,
      ),
    );
    await context.close();
  }
} finally {
  await browser.close();
}
const result = {
  profile:
    'Local Chromium, cold cache, 5 Mbps down / 1 Mbps up, 40ms latency, 4x CPU slowdown; one sample per viewport. Synthetic load smoke check, not field Core Web Vitals or INP evidence.',
  runs,
};
await fs.mkdir('output/playwright', { recursive: true });
await fs.writeFile('output/playwright/performance.json', JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
