// Изиграва 4.2.5 „Стаята през 1900, 1960 и 2020 г.“ докрай с една умишлена грешка (в стъпка 3). Очакван резултат: (1 + 0.8 + 1) / 3.
// Употреба: NODE_PATH=$(npm root -g) node tools/test-staya.mjs http://localhost:8765/history/ <папка> [ширина]
// Папка „-“: без снимки.
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
const [, , base, shots = '.', width = '1280'] = process.argv;
const W = +width, H = W < 600 ? 844 : 900;
const snap = (name) => (shots === '-' ? null : page.screenshot({ path: `${shots}/${name}-${W}.png` }));
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: W, height: H } });
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', (e) => errors.push(e.message));
await page.goto(base + 'xp.html?exp=staya&q=high');
await page.waitForSelector('.pv-epochs .pv-next', { timeout: 20000 });
const wait = (ms) => page.waitForTimeout(ms);
const T0 = Date.now();
const log = (...a) => console.log(`[${((Date.now() - T0) / 1000).toFixed(0)} s]`, ...a);
const pos = (id, key = 'pickId') => page.evaluate(([i, k]) => document.querySelector('#area').__demo.stage.screenOf(i, k), [id, key]);
async function drag(a, b) { await page.mouse.move(a.x, a.y); await page.mouse.down(); for (let k = 1; k <= 5; k++) await page.mouse.move(a.x + (b.x - a.x) * k / 5, a.y + (b.y - a.y) * k / 5); await page.mouse.up(); await wait(300); }
async function menu(id) {
  if (await page.locator('.corner-menu .cm-list').isHidden()) await page.click('.corner-menu .cm-head');
  await page.click(`.corner-menu .cm-item[data-id="${id}"]`); await wait(1300);
}
async function era(e) { await page.evaluate((k) => document.querySelector('#area').__demo.setEpoch(k), e); await wait(700); }
await page.locator('.xp').scrollIntoViewIfNeeded();
await wait(1500);
await snap('s-start');
// 1. Опознай: всички места през 1900 г., после другите години.
for (const id of ['cook', 'cold', 'wash', 'talk', 'fun', 'street', 'light']) { await menu(id); await snap(`s-${id}-0`); }
for (let e = 1; e <= 2; e++) {
  await page.click('.pv-epochs .pv-next'); await wait(900); await snap(`s-light-${e}`);
  for (const id of ['cook', 'wash', 'fun', 'talk', 'street']) { await menu(id); await snap(`s-${id}-${e}`); }
}
log('опознай:', await page.textContent('.xp-score'));
await page.click('.xp-controls .go'); await wait(1400);
// 2. Пренеси: четири опита, все верни.
const trips = [['v-bulb', 0, 1], ['v-lamp', 2, 1], ['v-phone', 1, 1], ['v-fridge', 1, 1]];
await snap('s-chest');
for (const [id, e, right] of trips) {
  await era(e);
  const p = await pos(id); await page.mouse.click(p.x, p.y); await wait(1300);
  await snap(`s-trip-${id}`);
  await page.click(`.xp-controls button[data-i="${right}"]`); await wait(900);
  await snap(`s-trip-${id}-done`);
  log(id, await page.textContent('.xp-score'));
  await page.click('.xp-controls .btn.primary'); await wait(1300);
}
// 3. Подреди: една умишлена грешка (смартфонът в 1900 г.).
await snap('s-cards');
await drag(await pos('k-phone', 'dragId'), await pos('z0', 'dropId')); log('грешка:', await page.textContent('.xp-msg'));
const order = [['k-lamp', 0], ['k-trough', 0], ['k-letter', 0], ['k-radio', 1], ['k-rotary', 1], ['k-tv60', 1], ['k-phone', 2], ['k-micro', 2], ['k-tablet', 2]];
for (const [id, z] of order) { await drag(await pos(id, 'dragId'), await pos('z' + z, 'dropId')); log(id, '→', await page.textContent('.xp-score')); }
await snap('s-cards-done');
await page.click('.xp-controls .btn.primary'); await wait(1400);
// 4. Предскажи.
await snap('s-predict');
await page.click('.xp-controls button[data-i="0"]'); await wait(1600);
await snap('s-predict1');
await wait(2000);
await snap('s-predict2-q');
await page.click('.xp-controls button[data-i="1"]'); await wait(1600);
await snap('s-predict2');
await page.click('.xp-controls .btn.primary'); await wait(300);
const result = await page.evaluate(() => window.__result);
const want = (1 + 0.8 + 1) / 3;
await snap('s-finish');
// „Започни отначало“ връща всичко в начално състояние.
await page.click('.xp-controls .again'); await wait(1500);
const reset = await page.evaluate(() => [document.querySelector('.xp-title').textContent, document.querySelector('#area').__demo.epoch, document.querySelector('.xp-score').textContent]);
console.log('след рестарт:', reset);
console.log('резултат:', result, 'очакван:', want);
console.log('грешки в конзолата:', errors.length ? errors : 'няма');
await browser.close();
process.exit(Math.abs(result - want) < 1e-6 && !errors.length && /Стаята/.test(reset[0]) && reset[1] === 0 && /Места: 1 от 7/.test(reset[2]) ? 0 : 1);
