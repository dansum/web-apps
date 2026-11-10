// Изиграва 7.1.2 „Копривщица“ докрай с една умишлена грешка (в стъпка 3). Очакван резултат: (1 + 0.75 + 1) / 3.
// Употреба: NODE_PATH=$(npm root -g) node tools/test-koprivshtitsa.mjs http://localhost:8765/history/ <папка> [ширина]
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
const [, , base, shots = '.', width = '1280'] = process.argv;
// Папка „-“: без снимки (по-бързо, когато машината е натоварена).
const snap = (name) => (shots === '-' ? null : page.screenshot({ path: `${shots}/${name}-${W}.png` }));
const W = +width, H = W < 600 ? 844 : 900;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: W, height: H } });
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', (e) => errors.push(e.message));
await page.goto(base + 'xp.html?exp=koprivshtitsa');
await page.waitForSelector('.walk-nav .wn-next', { timeout: 15000 });
const wait = (ms) => page.waitForTimeout(ms);
const T0 = Date.now();
const yearDone = () => page.waitForFunction(() => [...document.querySelectorAll('.bubble')].some((b) => /за една година/.test(b.textContent)), null, { timeout: 15000 });
const log = (...a) => console.log(`[${((Date.now() - T0) / 1000).toFixed(0)} s]`, ...a);
const pos = (id, key = 'pickId') => page.evaluate(([i, k]) => document.querySelector('#area').__demo.stage.screenOf(i, k), [id, key]);
async function click(id) { const p = await pos(id); if (!p) throw new Error('няма ' + id); await page.mouse.click(p.x, p.y); await wait(350); }
async function drag(a, b) { await page.mouse.move(a.x, a.y); await page.mouse.down(); for (let k = 1; k <= 4; k++) await page.mouse.move(a.x + (b.x - a.x) * k / 4, a.y + (b.y - a.y) * k / 4); await page.mouse.up(); await wait(300); }
await page.locator('.xp').scrollIntoViewIfNeeded();
await wait(2000);
const names = ['bridge', 'street', 'house', 'people', 'bazaar', 'church', 'cell', 'school', 'chit'];
await snap(`k-${names[0]}`);
for (let i = 1; i < names.length; i++) { await page.click('.walk-nav .wn-next'); await wait(1500); await snap(`k-${names[i]}`); }
log('спирки:', await page.textContent('.xp-score'));
await page.click('.xp-controls .btn.primary'); await wait(1300);
// 2. Двете училища: разглеждане, после опит.
for (const id of ['i-sand', 'i-psalter']) await click(id);
await snap('k-cell-in');
await page.click('.xp-controls .v-school'); await wait(1300);
for (const id of ['i-tables', 'i-board', 'i-map', 'i-books']) await click(id);
await snap('k-school-in');
log('разгледани:', await page.textContent('.xp-score'));
await page.click('.xp-controls .go'); await wait(1300);
await page.click('.xp-controls button[data-p="mutual"]'); await wait(300);
await page.click('.xp-controls .m-cell'); await wait(600);
await page.click('.xp-controls .run'); await yearDone();
await snap('k-run-cell');
await page.click('.xp-controls .m-mutual'); await wait(300);
await page.evaluate(() => { const r = document.querySelector('.xp-controls .h-range'); r.value = '6'; r.dispatchEvent(new Event('input')); }); await wait(1200);
await page.click('.xp-controls .run'); await yearDone();
await snap('k-run-mutual');
await page.click('.xp-controls button[data-i="0"]'); await wait(500);
await page.click('.xp-controls .btn.primary'); await wait(1400);
// 3. Карти: една умишлена грешка (библиотеката → училището).
await snap('k-cards');
await drag(await pos('c-lib', 'dragId'), await pos('school', 'dropId')); log('грешка:', await page.textContent('.xp-msg'));
for (const [c, t] of [['c-math', 'school'], ['c-geo', 'school'], ['c-tables', 'school'], ['c-lib', 'chit'], ['c-theatre', 'chit'], ['c-aba', 'bazaar'], ['c-kozhuh', 'bazaar']]) {
  await drag(await pos(c, 'dragId'), await pos(t, 'dropId')); log(c, '→', await page.textContent('.xp-score'));
}
await snap('k-cards-done');
await page.click('.xp-controls .btn.primary'); await wait(1400);
// 4. Предскажи.
await page.click('.xp-controls button[data-i="0"]'); await wait(900);
await snap('k-predict1');
await page.click('.xp-controls button[data-i="0"]'); await wait(900);
await snap('k-predict2');
await page.click('.xp-controls .btn.primary'); await wait(300);
const result = await page.evaluate(() => window.__result);
const want = (1 + 0.75 + 1) / 3;
// „Започни отначало“ връща всичко в начално състояние.
await page.click('.xp-controls .again'); await wait(1500);
const reset = await page.evaluate(() => document.querySelector('.xp-title').textContent);
console.log('след рестарт:', reset);
console.log('резултат:', result, 'очакван:', want);
console.log('грешки в конзолата:', errors.length ? errors : 'няма');
await browser.close();
process.exit(Math.abs(result - want) < 1e-6 && !errors.length && /Разходка/.test(reset) ? 0 : 1);
