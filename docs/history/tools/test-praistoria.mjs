// Изиграва 5.1.4 „Праисторията“ докрай с една умишлена грешка. Очакван резултат: (0.5 + 1 + 1) / 3.
// Употреба: NODE_PATH=$(npm root -g) node tools/test-praistoria.mjs http://localhost:8765/history/ <папка> [ширина]
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
const [, , base, shots = '.', width = '1280'] = process.argv;
const W = +width, H = W < 600 ? 844 : 900;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: W, height: H } });
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', (e) => errors.push(e.message));
await page.goto(base + 'xp.html?exp=praistoria');
await page.waitForSelector('.corner-menu .cm-head', { timeout: 15000 });
const wait = (ms) => page.waitForTimeout(ms);
const pos = (id, key = 'pickId') => page.evaluate(([i, k]) => document.querySelector('#area').__demo.stage.screenOf(i, k), [id, key]);
async function click(id) { const p = await pos(id); if (!p) throw new Error('няма ' + id); await page.mouse.click(p.x, p.y); await wait(350); }
await page.locator('.xp').scrollIntoViewIfNeeded();
await wait(500);
await page.screenshot({ path: `${shots}/p1-${W}.png` });
for (let i = 0; i < 4; i++) {
  if (await page.locator('.cm-list[hidden]').count()) await page.locator('.cm-head').click();
  await page.locator('.cm-item').nth(i).click(); await wait(300);
}
await wait(900);
await page.screenshot({ path: `${shots}/p1b-${W}.png` });
await page.click('.xp-controls .btn.primary'); await wait(1300);
await page.click('.xp-controls button[data-a="top"]'); // умишлена грешка
console.log('грешка:', await page.textContent('.xp-msg'));
await page.click('.xp-controls button[data-a="bottom"]');
await page.screenshot({ path: `${shots}/p2-${W}.png` });
for (let i = 0; i < 4; i++) { await click(`layer${i}`); }
await page.screenshot({ path: `${shots}/p2b-${W}.png` });
await page.click('.xp-controls .btn.primary'); await wait(1400);
await page.screenshot({ path: `${shots}/p3-${W}.png` });
for (const [card, slot] of [['kozarnika', 's0'], ['bachokiro', 's1'], ['karanovo', 's2'], ['varna', 's3']]) {
  const a = await pos(card, 'dragId'), b = await pos(slot);
  await page.mouse.move(a.x, a.y); await page.mouse.down();
  for (let k = 1; k <= 12; k++) await page.mouse.move(a.x + (b.x - a.x) * k / 12, a.y + (b.y - a.y) * k / 12);
  await page.mouse.up(); await wait(300);
  console.log(card, '→', await page.textContent('.xp-score'));
}
await page.screenshot({ path: `${shots}/p3b-${W}.png` });
await page.click('.xp-controls .btn.primary'); await wait(1300);
await page.click('.xp-controls button[data-i="0"]'); await wait(900);
await page.screenshot({ path: `${shots}/p4-${W}.png` });
await page.click('.xp-controls .btn.primary'); await wait(300);
const result = await page.evaluate(() => window.__result);
const want = (0.5 + 1 + 1) / 3;
console.log('резултат:', result, 'очакван:', want);
console.log('грешки в конзолата:', errors.length ? errors : 'няма');
await browser.close();
process.exit(Math.abs(result - want) < 1e-6 && !errors.length ? 0 : 1);
