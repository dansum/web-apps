// Изиграва 6.2.4 „Търновград“ докрай с една умишлена грешка (грешно предсказание в опита). Очакван резултат: (0.75 + 1 + 1) / 3.
// Употреба: NODE_PATH=$(npm root -g) node tools/test-tarnovo.mjs http://localhost:8765/history/ <папка> [ширина]
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
const [, , base, shots = '.', width = '1280'] = process.argv;
const W = +width, H = W < 600 ? 844 : 900;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: W, height: H } });
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', (e) => errors.push(e.message));
await page.goto(base + 'xp.html?exp=tarnovo');
await page.waitForSelector('.walk-nav .wn-next', { timeout: 15000 });
const wait = (ms) => page.waitForTimeout(ms);
const T0 = Date.now(); const lap = (s) => console.log(((Date.now() - T0) / 1000).toFixed(1) + 's', s);
const pos = (id, key = 'pickId') => page.evaluate(([i, k]) => document.querySelector('#area').__demo.stage.screenOf(i, k), [id, key]);
async function drag(a, b) { await page.mouse.move(a.x, a.y); await page.mouse.down(); for (let k = 1; k <= 6; k++) await page.mouse.move(a.x + (b.x - a.x) * k / 6, a.y + (b.y - a.y) * k / 6); await page.mouse.up(); await wait(200); }
await page.locator('.xp').scrollIntoViewIfNeeded();
await wait(1500);
const names = ['yantra', 'houses', 'crafts', 'market', 'merchants', 'gate', 'palace', 'church', 'baldwin'];
await page.screenshot({ path: `${shots}/t-${names[0]}-${W}.png` });
const idle = () => page.waitForFunction(() => !document.querySelector('#area').__demo.walk.busy);
// Снимки на някои спирки (всички спирки снима tools/shots-tarnovo.mjs).
for (let i = 1; i < names.length; i++) { await page.click('.walk-nav .wn-next'); await wait(150); await idle(); if (['gate', 'baldwin'].includes(names[i])) { await wait(500); await page.screenshot({ path: `${shots}/t-${names[i]}-${W}.png` }); } }
await wait(300);
lap('walk'); console.log('спирки:', await page.textContent('.xp-score'));
await page.click('.xp-controls .btn.primary'); await wait(1400);
// 2. Опит: първото предсказание е умишлено грешно (крепост → „ще намалее“).
const order = [['fort', 'down'], ['capital', 'up'], ['food', 'up'], ['war', 'down'], ['crafts', 'up'], ['market', 'up'], ['drought', 'down'], ['roads', 'up']];
for (const [id, p] of order) {
  await page.click(`.xp-controls .cond[data-id="${id}"]`); await wait(200);
  await page.click(`.xp-controls button[data-p="${p}"]`); await wait(250);
  if (id === 'fort') console.log('грешка:', await page.textContent('.xp-msg'));
}
lap('exp'); console.log('след опитите:', await page.textContent('.xp-score'));
await page.click('.xp-controls .cond[data-id="war"]'); await wait(300);
await page.click('.xp-controls .cond[data-id="drought"]'); await wait(1300);
console.log('накрая:', await page.textContent('.xp-score'));
await page.screenshot({ path: `${shots}/t-grow-end-${W}.png` });
await page.click('.xp-controls .btn.primary'); await wait(1400);
await page.screenshot({ path: `${shots}/t-sources-${W}.png` });
for (const [s, r] of [['src-bowl', 'potter'], ['src-iron', 'smith'], ['src-gold', 'goldsmith'], ['src-charter', 'merchant'], ['src-book', 'scribe']]) { const a = await pos(s, 'dragId'), b = await pos(r); await drag(a, b); console.log(s, '→', await page.textContent('.xp-score')); }
await page.screenshot({ path: `${shots}/t-sources-end-${W}.png` });
await page.click('.xp-controls .btn.primary'); await wait(1400);
await page.click('.xp-controls button[data-i="0"]'); await wait(900);
await page.screenshot({ path: `${shots}/t-uni-${W}.png` });
await page.click('.xp-controls .btn.primary'); await wait(1400);
await page.click('.xp-controls button[data-i="1"]'); await wait(900);
await page.screenshot({ path: `${shots}/t-evtimiy-${W}.png` });
await page.click('.xp-controls .btn.primary'); await wait(300);
const result = await page.evaluate(() => window.__result);
const want = (0.75 + 1 + 1) / 3;
lap('end'); console.log('резултат:', result, 'очакван:', want);
// „Започни отначало“: всичко в начално състояние, без презареждане.
await page.click('.xp-controls .again'); await wait(1600);
const back = await page.evaluate(() => ({ title: document.querySelector('.xp-title').textContent, houses: document.querySelector('#area').__demo.houseCount(), nav: !document.querySelector('.walk-nav').hidden }));
console.log('отначало:', back);
await page.screenshot({ path: `${shots}/t-restart-${W}.png` });
const okRestart = back.title.startsWith('1.') && back.houses === 18 && back.nav;
console.log('грешки в конзолата:', errors.length ? errors : 'няма');
await browser.close();
process.exit(Math.abs(result - want) < 1e-6 && okRestart && !errors.length ? 0 : 1);
