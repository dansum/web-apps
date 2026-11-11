// Изиграва 8.1.2 „Великите географски открития“ докрай с една умишлена грешка
// (в стъпка 2 кликва нос Добра надежда преди 1488 г.). Очакван резултат: (0.75 + 1 + 1) / 3. Проверява и „Започни отначало“.
// Употреба: NODE_PATH=$(npm root -g) node tools/test-otkritia.mjs http://localhost:8765/history/ <папка за снимки> [ширина]
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright'); // глобален пакет: NODE_PATH=$(npm root -g)
const [, , base, shots = '.', width = '1280'] = process.argv;
const W = +width, H = W < 600 ? 844 : 900;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: W, height: H } });
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', (e) => errors.push(e.message));
await page.goto(base + 'xp.html?exp=otkritia');
await page.waitForSelector('.corner-menu .cm-head', { timeout: 20000 });
const wait = (ms) => page.waitForTimeout(ms);
const pos = (id) => page.evaluate((i) => document.querySelector('#area').__demo.at(i), id);
async function click(id) { const p = await pos(id); if (!p) throw new Error('няма ' + id); await page.mouse.click(p.x, p.y); await wait(350); }
const msg = () => page.textContent('.xp-msg');
const setMonth = async (y) => { await page.evaluate((v) => { const r = document.querySelector('.yr-range'); r.value = v; r.dispatchEvent(new Event('input')); }, Math.round((y - 1487.5) * 12)); await wait(1200); };
await page.locator('.xp').scrollIntoViewIfNeeded();
await wait(1200);

// 1. Опознай
await page.screenshot({ path: `${shots}/1-explore-${W}.png` });
const n = await page.locator('.cm-item').count();
for (let i = 0; i < n; i++) {
  if (await page.locator('.cm-list[hidden]').count()) await page.locator('.cm-head').click();
  await page.locator('.cm-item').nth(i).click();
  await wait(1000);
  if (i % 2 === 0 || i === n - 1) await page.screenshot({ path: `${shots}/1-${i}-${W}.png` });
}
console.log('1:', await page.textContent('.xp-score'));
await page.click('.xp-controls .btn.primary');
await wait(1500);

// 2. Плъзгач: една умишлена грешка — нос Добра надежда преди 1488 г.
await setMonth(1487.75);
await click('cape');
console.log('грешка:', await msg());
await setMonth(1488.4);
await page.screenshot({ path: `${shots}/2-dias-${W}.png` });
await click('cape');
await setMonth(1492.84);
await page.screenshot({ path: `${shots}/2b-columbus-${W}.png` });
await click('bahamas');
await setMonth(1498.42);
await page.screenshot({ path: `${shots}/2c-gama-${W}.png` });
await click('calicut');
await click('ship-gama');
console.log('2:', await msg(), await page.textContent('.xp-score'));
await page.screenshot({ path: `${shots}/2d-done-${W}.png` });
await page.click('.xp-controls .btn.primary');
await wait(1600);

// 3. Причина или последица
await page.screenshot({ path: `${shots}/3-sort-${W}.png` });
const bins = { 'c-spice': 'Причини', 'e-lands': 'Последици', 'c-route': 'Причини', 'e-food': 'Последици', 'c-ship': 'Причини', 'e-native': 'Последици', 'c-tools': 'Причини', 'e-trade': 'Последици' };
for (const [card, zone] of Object.entries(bins)) {
  const a = await pos(card);
  const b = await page.evaluate((z) => document.querySelector('#area').__demo.stage.screenOf(z, 'zoneId'), zone);
  await page.mouse.move(a.x, a.y); await page.mouse.down();
  for (let k = 1; k <= 12; k++) await page.mouse.move(a.x + (b.x - a.x) * k / 12, a.y + (b.y - a.y) * k / 12);
  await page.mouse.up(); await wait(300);
  console.log(card, '→', await page.textContent('.xp-score'));
  if (card === 'e-food') await page.screenshot({ path: `${shots}/3a-food-${W}.png` });
}
await wait(500);
await page.screenshot({ path: `${shots}/3b-sort-done-${W}.png` });
await page.click('.xp-controls .btn.primary');
await wait(1600);

// 4. Предскажи
await page.screenshot({ path: `${shots}/4-predict-${W}.png` });
await page.click('.xp-controls button[data-id="round"]');
await wait(6000);
await page.screenshot({ path: `${shots}/4a-pacific-${W}.png` });
await page.waitForSelector('.xp-controls .btn.primary', { timeout: 90000 });
await wait(1500);
await page.screenshot({ path: `${shots}/4b-back-${W}.png` });
await page.click('.xp-controls .btn.primary');
await wait(400);
const result = await page.evaluate(() => window.__result);
await page.screenshot({ path: `${shots}/5-result-${W}.png` });
const expected = (0.75 + 1 + 1) / 3;
console.log('резултат:', result, 'очакван:', expected);

// Започни отначало
await page.click('.xp-controls .again');
await wait(1500);
const title = await page.textContent('.xp-title');
const items = await page.locator('.cm-item').count();
const okRestart = title.startsWith('1.') && items === n && (await page.textContent('.xp-score')).includes('0 от')
  && await page.evaluate(() => [...document.querySelectorAll('.bubble')].length === 0);
console.log('отначало:', title, items, okRestart ? 'ОК' : 'ГРЕШКА');
await page.screenshot({ path: `${shots}/6-restart-${W}.png` });
console.log('грешки в конзолата:', errors.length ? errors : 'няма');
await browser.close();
process.exit(Math.abs(result - expected) < 1e-6 && okRestart && !errors.length ? 0 : 1);
