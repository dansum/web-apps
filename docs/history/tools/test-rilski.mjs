// Изиграва 6.3.5 „Рилският манастир“ докрай с една умишлена грешка (в стъпка 3). Очакван резултат: (1 + 0.75 + 1) / 3.
// Употреба: NODE_PATH=$(npm root -g) node tools/test-rilski.mjs http://localhost:8765/history/ <папка> [ширина]
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
const [, , base, shots = '.', width = '1280'] = process.argv;
const snap = (name) => (shots === '-' ? null : page.screenshot({ path: `${shots}/${name}-${W}.png` }));
const W = +width, H = W < 600 ? 844 : 900;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: W, height: H } });
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', (e) => errors.push(e.message));
await page.goto(base + 'xp.html?exp=rilski');
await page.waitForSelector('.walk-nav .wn-next', { timeout: 15000 });
const wait = (ms) => page.waitForTimeout(ms);
const T0 = Date.now();
const log = (...a) => console.log(`[${((Date.now() - T0) / 1000).toFixed(0)} s]`, ...a);
const bookDone = () => page.waitForFunction(() => [...document.querySelectorAll('.bubble')].some((b) => /една книга за около/.test(b.textContent)), null, { timeout: 15000 });
const pos = (id, key = 'pickId') => page.evaluate(([i, k]) => document.querySelector('#area').__demo.stage.screenOf(i, k), [id, key]);
async function drag(a, b) { if (!a || !b) throw new Error('няма точка'); await page.mouse.move(a.x, a.y); await page.mouse.down(); for (let k = 1; k <= 4; k++) await page.mouse.move(a.x + (b.x - a.x) * k / 4, a.y + (b.y - a.y) * k / 4); await page.mouse.up(); await wait(300); }
await page.locator('.xp').scrollIntoViewIfNeeded();
await wait(2000);
const names = ['mountain', 'gate', 'yard', 'church', 'tower', 'cells', 'kitchen', 'library', 'pilgrims'];
await snap(`r-${names[0]}`);
for (let i = 1; i < names.length; i++) { await page.click('.walk-nav .wn-next'); await wait(1700); await snap(`r-${names[i]}`); }
log('спирки:', await page.textContent('.xp-score'));
await page.click('.xp-controls .btn.primary'); await wait(1300);
// 2. Книжовниците: предположение, опит с 1 и с 4 книжовници, два въпроса.
await snap('r-lib');
await page.click('.xp-controls button[data-g="months"]'); await wait(300);
await page.click('.xp-controls .run'); await bookDone();
await snap('r-copy1');
await page.evaluate(() => { const r = document.querySelector('.xp-controls .s-range'); r.value = '4'; r.dispatchEvent(new Event('input')); }); await wait(500);
await page.click('.xp-controls .run'); await bookDone();
await snap('r-copy4');
log('опити:', await page.textContent('.xp-score'));
await page.click('.xp-controls button[data-i="0"]'); await wait(500);
await page.click('.xp-controls button[data-i="0"]'); await wait(500);
await snap('r-async');
await page.click('.xp-controls .btn.primary'); await wait(1500);
// 3. Карти: една умишлена грешка (книжовникът → вярата).
await snap('r-cards');
await drag(await pos('c-copy', 'dragId'), await pos('faith', 'dropId')); log('грешка:', await page.textContent('.xp-msg'));
for (const [c, t] of [['c-liturgy', 'faith'], ['c-icon', 'faith'], ['c-copy', 'books'], ['c-kids', 'books'], ['c-sabor', 'people'], ['c-gifts', 'people']]) {
  await drag(await pos(c, 'dragId'), await pos(t, 'dropId')); log(c, '→', await page.textContent('.xp-score'));
}
await snap('r-cards-done');
await page.click('.xp-controls button[data-i="0"]'); await wait(600);
await snap('r-martyr');
await page.click('.xp-controls .btn.primary'); await wait(1500);
// 4. Предскажи.
await page.click('.xp-controls button[data-i="0"]'); await wait(3500);
await snap('r-predict1');
await page.click('.xp-controls button[data-i="0"]'); await wait(1800);
await snap('r-predict2');
await page.click('.xp-controls .btn.primary'); await wait(300);
const result = await page.evaluate(() => window.__result);
const want = (1 + 0.75 + 1) / 3;
await page.click('.xp-controls .again'); await wait(1800);
const reset = await page.evaluate(() => document.querySelector('.xp-title').textContent);
const badge = await page.evaluate(() => document.querySelector('.map-approx').textContent);
await snap('r-restart');
console.log('след рестарт:', reset, '|', badge);
console.log('резултат:', result, 'очакван:', want);
console.log('грешки в конзолата:', errors.length ? errors : 'няма');
await browser.close();
process.exit(Math.abs(result - want) < 1e-6 && !errors.length && /Разходка/.test(reset) && /XV–XVII/.test(badge) ? 0 : 1);
