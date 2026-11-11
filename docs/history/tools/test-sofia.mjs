// Изиграва 4.3.5 „София през епохите“ докрай с една умишлена грешка (в стъпка 3). Очакван резултат: (1 + 0.75 + 1) / 3.
// Употреба: NODE_PATH=$(npm root -g) node tools/test-sofia.mjs http://localhost:8765/history/ <папка> [ширина]
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
await page.goto(base + 'xp.html?exp=sofia');
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
const msg = () => page.textContent('.xp-msg');
await page.locator('.xp').scrollIntoViewIfNeeded();
await wait(1500);
// 1. Опознай: всички места в Сердика, после всички епохи (центърът и Витоша — на снимки).
for (const id of ['vitosha', 'rotunda', 'stsofia', 'banyabashi', 'nevsky', 'parliament', 'center']) { await menu(id); await snap(`s-${id}`); }
for (let e = 1; e <= 4; e++) { await page.click('.pv-epochs .pv-next'); await wait(900); await snap(`s-center-e${e}`); }
for (const id of ['nevsky', 'banyabashi', 'rotunda', 'vitosha']) { await menu(id); await snap(`s-${id}-today`); }
log('опознай:', await page.textContent('.xp-score'));
await page.click('.xp-controls .go'); await wait(2500);
// 2. Карта: една грешка не се прави — направо София и верните отговори.
await page.waitForFunction(() => document.querySelector('#area').__demo.mapReady, null, { timeout: 15000 });
await wait(800);
await snap('s-map');
const sp = await pos('m-sofia'); await page.mouse.click(sp.x, sp.y); await wait(700);
log('карта:', await msg());
await page.click('.xp-controls button[data-i="0"]'); await wait(700);
await page.click('.xp-controls button[data-i="0"]'); await wait(700);
await snap('s-map-done');
await page.click('.xp-controls .btn.primary'); await wait(1600);
// 3. Свържи: една умишлена грешка („Ал. Невски“ в Сердика).
await snap('s-cards');
await drag(await pos('c-nevsky', 'dragId'), await pos('s0', 'dropId')); log('грешка:', await msg());
for (const [id, e] of [['c-rotunda', 0], ['c-stsofia', 0], ['c-boyana', 1], ['c-banyabashi', 2], ['c-nevsky', 3], ['c-parliament', 3], ['c-metro', 4]]) { await drag(await pos(id, 'dragId'), await pos('s' + e, 'dropId')); log(id, '→', await page.textContent('.xp-score')); }
await snap('s-cards-done');
await page.click('.xp-controls .btn.primary'); await wait(2500);
// 4. Предскажи.
await snap('s-predict');
await page.click('.xp-controls button[data-i="0"]'); await wait(2600);
await snap('s-predict1');
await page.click('.xp-controls button[data-i="0"]'); await wait(1600);
await snap('s-predict2');
await page.click('.xp-controls .btn.primary'); await wait(300);
const result = await page.evaluate(() => window.__result);
const want = (1 + 0.75 + 1) / 3;
// „Започни отначало“ връща всичко в начално състояние.
await page.click('.xp-controls .again'); await wait(1500);
const reset = await page.evaluate(() => [document.querySelector('.xp-title').textContent, document.querySelector('#area').__demo.epoch, document.querySelectorAll('.map-approx').length]);
await snap('s-restart');
console.log('след рестарт:', reset);
console.log('резултат:', result, 'очакван:', want);
console.log('грешки в конзолата:', errors.length ? errors : 'няма');
await browser.close();
process.exit(Math.abs(result - want) < 1e-6 && !errors.length && /София/.test(reset[0]) && reset[1] === 0 && reset[2] === 0 ? 0 : 1);
