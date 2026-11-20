import { chromium } from 'playwright';
import { readFile } from 'node:fs/promises';
import { supportBlues } from './support-blues.mjs';
import { dualYellows } from './dual-yellows.mjs';

// CN: 并排展示三档蓝色，不改写论文图。
// EN: Compare three blue depths side by side without changing the paper figure.
const browser = await chromium.launch({ executablePath: process.env.SALUT_CHROME_EXECUTABLE, headless: true });
try {
  const cards = [];
  const yellows = process.argv.includes('--dual-yellows');
  for (const [name, option] of Object.entries(yellows ? dualYellows : supportBlues)) {
    if (name === 'mixed') continue;
    const file = '../salut_overview_color-filled-compact-support-teal-init-card-theory-teal-solver-components-blue-'+(yellows ? 'mixed-yellow-' : '')+name+'_preview.png';
    const png = await readFile(file);
    cards.push('<figure><figcaption>'+option.title+'</figcaption><img src="data:image/png;base64,'+png.toString('base64')+'"></figure>');
  }
  const page = await browser.newPage({ viewport: { width: 2460, height: 1600 } });
  await page.setContent('<style>body{margin:0;background:#eef0f3;padding:24px;font:600 27px Arial;color:#343842}main{display:grid;grid-template-columns:repeat(3,1fr);gap:24px}figure{margin:0;background:white;padding:12px}figcaption{padding:8px 10px 18px}img{display:block;width:100%}</style><main>'+cards.join('')+'</main>');
  await page.evaluate(async () => Promise.all([...document.images].map(img => img.decode())));
  await page.locator('main').screenshot({ path: yellows ? '../salut_overview_dual_yellow_comparison.png' : '../salut_overview_support_blue_comparison.png' });
} finally {
  await browser.close();
}
