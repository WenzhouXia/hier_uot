import { chromium } from 'playwright';
import { readFile } from 'node:fs/promises';
import { palettes } from './palettes.mjs';
import { greenAccents } from './green-accents.mjs';
import { redSchemes } from './red-schemes.mjs';
import { theoryAccents } from './theory-accents.mjs';

// CN: 将四个完整预览并排排列用于比较，不修改任何单图或论文文件。
// EN: Arrange four full previews for comparison without modifying individual figures or manuscript files.
const browser = await chromium.launch({
  executablePath: process.env.SALUT_CHROME_EXECUTABLE || undefined,
  channel: process.env.SALUT_CHROME_CHANNEL || undefined,
  headless: true,
});
try {
  const reds = process.argv.includes('--reds');
  const theoryGreens = process.argv.includes('--theory-greens');
  const theories = theoryGreens || process.argv.includes('--theories');
  const page = await browser.newPage({ viewport: { width: theories ? 2460 : reds ? 3600 : 2440, height: reds || theories ? 1500 : 2800 }, deviceScaleFactor: 1 });
  const cards = [];
  const semantic = process.argv.includes('--semantic');
  const green = process.argv.includes('--greens');
  const selected = theories ? Object.entries(theoryAccents).filter(([, accent]) => theoryGreens ? accent.family === 'green' : accent.family !== 'green') : reds ? Object.entries(redSchemes) : green ? Object.entries(greenAccents) : Object.entries(palettes).filter(([, palette]) => semantic ? palette.semantic : !palette.semantic);
  for (const [name, palette] of selected) {
    const png = await readFile('../salut_overview_' + (theories ? 'color-filled-compact-support-teal-init-card-theory-' : reds ? 'color-filled-compact-support-red-' : green ? 'color-filled-compact-support-' : '') + name + '_preview.png');
    cards.push('<figure><figcaption>' + palette.title + '</figcaption><img src="data:image/png;base64,' + png.toString('base64') + '"></figure>');
  }
  await page.setContent('<style>body{margin:0;padding:24px;background:#f0f1f4;font:600 30px Arial,sans-serif;color:#343842}main{display:grid;grid-template-columns:repeat('+(reds || theories ? 3 : 2)+',1fr);gap:24px}figure{margin:0;background:white;padding:12px}figcaption{padding:6px 12px 16px}img{display:block;width:100%;height:auto}</style><main>' + cards.join('') + '</main>');
  await page.evaluate(async () => Promise.all([...document.images].map(img => img.decode())));
  await page.locator('main').screenshot({ path: theoryGreens ? '../salut_overview_theory_green_comparison.png' : theories ? '../salut_overview_theory_comparison.png' : reds ? '../salut_overview_red_comparison.png' : green ? '../salut_overview_green_comparison.png' : semantic ? '../salut_overview_semantic_comparison.png' : '../salut_overview_palette_comparison.png' });
} finally {
  await browser.close();
}
