// Изиграва 10.1.4 „Плиска“ докрай с една умишлена грешка (стъпка 2, първият въпрос).
// Очакван резултат: (0.75 + 1 + 1) / 3. Накрая проверява „Започни отначало“.
// Употреба: NODE_PATH=$(npm root -g) node tools/test-pliska.mjs http://localhost:8765/history/ <папка> [ширина]
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
const [, , base, shots = '.', width = '1280'] = process.argv;
const W = +width, H = W < 600 ? 844 : 900;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: W, height: H } });
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', (e) => errors.push(e.message));
await page.goto(base + 'xp.html?exp=pliska');
await page.waitForSelector('.walk-nav .wn-next', { timeout: 15000 });
const wait = (ms) => page.waitForTimeout(ms);
const pos = (id, key) => page.evaluate(([i, k]) => document.querySelector('#area').__demo.stage.screenOf(i, k), [id, key]);
async function drag(a, b) { await page.mouse.move(a.x, a.y); await page.mouse.down(); for (let k = 1; k <= 6; k++) await page.mouse.move(a.x + (b.x - a.x) * k / 6, a.y + (b.y - a.y) * k / 6); await page.mouse.up(); await wait(250); }
const shot = (n) => page.screenshot({ path: `${shots}/p-${n}-${W}.png` });
await page.locator('.xp').scrollIntoViewIfNeeded();
await wait(2200);
// 1. Разходка
const names = ['val', 'homes', 'herds', 'wall', 'temple', 'small', 'palace', 'people'];
await shot('1-' + names[0]);
for (let i = 1; i < names.length; i++) { await page.click('.walk-nav .wn-next'); await wait(300); await page.waitForFunction(() => !document.querySelector('#area').__demo.walk.busy); await wait(250); await shot('1-' + names[i]); }
console.log('спирки:', await page.textContent('.xp-score'));
await page.click('.xp-controls .btn.primary'); await wait(1400);
// 2. Опит: плитък ров → конниците минават; дълбок → спират.
await page.click('.xp-controls .go'); await wait(5200);
await shot('2-pass');
console.log('плитък ров:', (await page.textContent('.bubble')).slice(0, 40));
await page.evaluate(() => { const r = document.querySelector('.xp-controls .dig'); r.value = 3; r.dispatchEvent(new Event('input')); });
await wait(300);
await page.click('.xp-controls .go'); await wait(1500);
await shot('2-stop');
await wait(2600);
console.log('дълбок ров:', (await page.textContent('.bubble')).slice(0, 40));
await page.click('.xp-controls button[data-i="1"]'); // умишлена грешка
console.log('грешка:', await page.textContent('.xp-msg'));
await page.click('.xp-controls button[data-i="0"]'); await wait(1600);
await shot('2-wall');
await page.click('.xp-controls button[data-i="0"]'); await wait(300);
await page.click('.xp-controls .btn.primary'); await wait(1500);
// 3. Стълбата на властта
await shot('3-ranks');
for (const id of ['khan', 'kavhan', 'ichirgu', 'boils', 'people']) {
  await drag(await pos(id, 'dragId'), await pos(id, 'slotId'));
  console.log(id, '→', await page.textContent('.xp-score'));
}
await shot('3-ranks-done');
await page.click('.xp-controls .btn.primary'); await wait(1500);
await shot('3-peoples');
for (const [id, side] of [['t-perun', 's'], ['t-tangra', 'b'], ['t-elders', 's'], ['t-khan', 'b'], ['t-farm', 's'], ['t-horse', 'b']]) {
  await drag(await pos(id, 'dragId'), await pos(side, 'zoneId'));
  console.log(id, '→', await page.textContent('.xp-score'));
}
await shot('3-peoples-done');
await page.click('.xp-controls .btn.primary'); await wait(1500);
// 4. Предскажи
await shot('4-krum');
await page.click('.xp-controls button[data-i="0"]'); await wait(2500);
await shot('4-krum-done');
await page.click('.xp-controls .btn.primary'); await wait(1500);
await page.click('.xp-controls button[data-i="0"]'); await wait(1800);
await shot('4-omurtag-done');
await page.click('.xp-controls .btn.primary'); await wait(400);
const result = await page.evaluate(() => window.__result);
const want = (0.75 + 1 + 1) / 3;
console.log('резултат:', result, 'очакван:', want);
await shot('5-finish');
// „Започни отначало“
await page.click('.xp-controls .again'); await wait(1500);
const restart = await page.evaluate(() => ({ title: document.querySelector('.xp-title').textContent, score: document.querySelector('.xp-score').textContent, marks: document.querySelectorAll('.cm-ok').length, level: document.querySelector('#area').__demo.level }));
console.log('отначало:', restart);
const okRestart = restart.title.startsWith('1.') && restart.marks <= 1 && restart.level === 3;
console.log('грешки в конзолата:', errors.length ? errors : 'няма');
await browser.close();
process.exit(Math.abs(result - want) < 1e-6 && okRestart && !errors.length ? 0 : 1);
