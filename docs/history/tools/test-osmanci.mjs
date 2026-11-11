// Изиграва „Османското завоевание“ докрай с една умишлена грешка. Очакван резултат: (0.75 + 1 + 1) / 3.
// Употреба: NODE_PATH=$(npm root -g) node tools/test-osmanci.mjs http://localhost:8765/history/ <папка> [ширина] [умение: 6.2.7 | 10.1.9]
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
const [, , base, shots = '.', width = '1280', skill = '6.2.7'] = process.argv;
const W = +width, H = W < 600 ? 844 : 900, tag = `${skill}-${W}`;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: W, height: H } });
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', (e) => errors.push(e.message));
await page.goto(`${base}xp.html?exp=osmanci&skill=${skill}`);
await page.waitForSelector('.corner-menu .cm-head', { timeout: 15000 });
const wait = (ms) => page.waitForTimeout(ms);
const at = (id) => page.evaluate((i) => document.querySelector('#area').__demo.at(i), id);
async function click(id) { const p = await at(id); if (!p) throw new Error('няма ' + id); await page.mouse.click(p.x, p.y); await wait(350); }
const msg = () => page.textContent('.xp-msg');
const setYear = (y) => page.evaluate((v) => { const r = document.querySelector('.yr-range'); r.value = v; r.dispatchEvent(new Event('input')); }, y);
await page.locator('.xp').scrollIntoViewIfNeeded();

// 1. Опознай
await page.screenshot({ path: `${shots}/o1-explore-${tag}.png` });
for (let i = 0; i < 7; i++) {
  if (await page.locator('.cm-list[hidden]').count()) await page.locator('.cm-head').click();
  await page.locator('.cm-item').nth(i).click();
  await wait(300);
}
await wait(900);
await page.screenshot({ path: `${shots}/o1b-explore-done-${tag}.png` });
await page.click('.xp-controls .btn.primary');
await wait(1300);

// 2. Плъзгач: една умишлена грешка — Варна вместо Търново
await setYear(1393); await wait(600);
await click('varna');
console.log('грешка 1:', await msg());
await click('tarnovo'); console.log('tarnovo →', await msg());
await setYear(1400); await wait(600);
await click('nikopol'); console.log('nikopol →', await msg());
await click('vidin'); console.log('vidin →', await msg());
await wait(500);
await page.screenshot({ path: `${shots}/o2-slider-${tag}.png` });
await page.click('.xp-controls button[data-i="0"]');
await page.click('.xp-controls .btn.primary');
await wait(1400);

// 3. Подреди събитията
await page.screenshot({ path: `${shots}/o3-order-${tag}.png` });
for (const y of [1354, 1371, 1393, 1396, 1444, 1453]) {
  const a = await at(`c${y}`), b = await at(`y${y}`);
  await page.mouse.move(a.x, a.y); await page.mouse.down();
  for (let k = 1; k <= 12; k++) await page.mouse.move(a.x + (b.x - a.x) * k / 12, a.y + (b.y - a.y) * k / 12);
  await page.mouse.up(); await wait(300);
  console.log(y, '→', await page.textContent('.xp-score'));
}
await page.screenshot({ path: `${shots}/o3b-order-done-${tag}.png` });
await page.click('.xp-controls .btn.primary');
await wait(1300);

// 4. Предскажи
await page.click('.xp-controls button[data-i="0"]');
await wait(900);
await page.screenshot({ path: `${shots}/o4-predict-${tag}.png` });
await page.click('.xp-controls .btn.primary');
await wait(300);
const result = await page.evaluate(() => window.__result);
const want = (0.75 + 1 + 1) / 3;
console.log('резултат:', result, 'очакван:', want);
await page.click('.xp-controls .again'); await wait(500);
const again = await page.textContent('.xp-title');
console.log('отначало:', again);
console.log('грешки в конзолата:', errors.length ? errors : 'няма');
await browser.close();
process.exit(Math.abs(result - want) < 1e-6 && again.startsWith('1.') && !errors.length ? 0 : 1);
