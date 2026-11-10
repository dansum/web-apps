// Изиграва 3.3.6 „Пловдив през вековете“ докрай с една умишлена грешка (в стъпка 3). Очакван резултат: (1 + 0.8 + 1) / 3.
// Употреба: NODE_PATH=$(npm root -g) node tools/test-plovdiv.mjs http://localhost:8765/history/ <папка> [ширина]
// Папка „-“: без снимки (по-бързо, когато машината е натоварена).
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
await page.goto(base + 'xp.html?exp=plovdiv');
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
await page.locator('.xp').scrollIntoViewIfNeeded();
await wait(1500);
// 1. Опознай: всички места в една епоха, после всички епохи.
for (const id of ['hill', 'house', 'people', 'theatre', 'street']) { await menu(id); await snap(`p-${id}`); }
for (let e = 1; e <= 6; e++) { await page.click('.pv-epochs .pv-next'); await wait(700); if (e === 1 || e === 3 || e === 6) await snap(`p-street-e${e}`); }
log('опознай:', await page.textContent('.xp-score'));
await page.click('.xp-controls .go'); await wait(1400);
// 2. Какво остава: разрезът под улицата.
for (let e = 1; e <= 6; e++) { await page.click('.pv-epochs .pv-next'); await wait(900); if (e === 1 || e === 2) await snap(`p-layers-e${e}`); }
await snap('p-layers-today');
await page.click('.xp-controls button[data-i="0"]'); await wait(400);
await page.click('.xp-controls button[data-i="0"]'); await wait(600);
await snap('p-layers-done');
await page.click('.xp-controls .btn.primary'); await wait(1500);
// 3. Подреди: една умишлена грешка (стадионът на първо място).
await snap('p-cards');
await drag(await pos('c-stadium', 'dragId'), await pos('s0', 'dropId')); log('грешка:', await page.textContent('.xp-msg'));
const order = ['c-hut', 'c-stadium', 'c-fort', 'c-mosque', 'c-erker', 'c-balcony', 'c-today'];
for (let i = 0; i < order.length; i++) { await drag(await pos(order[i], 'dragId'), await pos('s' + i, 'dropId')); log(order[i], '→', await page.textContent('.xp-score')); }
await snap('p-cards-done');
await page.click('.xp-controls .btn.primary'); await wait(1400);
// 4. Предскажи.
await snap('p-predict');
await page.click('.xp-controls button[data-i="0"]'); await wait(2400);
await snap('p-predict1');
await page.click('.xp-controls button[data-i="0"]'); await wait(1400);
await snap('p-predict2');
await page.click('.xp-controls .btn.primary'); await wait(300);
const result = await page.evaluate(() => window.__result);
const want = (1 + 0.8 + 1) / 3;
// „Започни отначало“ връща всичко в начално състояние.
await page.click('.xp-controls .again'); await wait(1500);
const reset = await page.evaluate(() => [document.querySelector('.xp-title').textContent, document.querySelector('#area').__demo.epoch]);
console.log('след рестарт:', reset);
console.log('резултат:', result, 'очакван:', want);
console.log('грешки в конзолата:', errors.length ? errors : 'няма');
await browser.close();
process.exit(Math.abs(result - want) < 1e-6 && !errors.length && /Пловдив/.test(reset[0]) && reset[1] === 0 ? 0 : 1);
