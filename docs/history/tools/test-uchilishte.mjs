// Изиграва 3.3.3 „Новобългарското училище и будителите“ докрай с една умишлена грешка (в стъпка 3).
// Очакван резултат: (1 + 0.75 + 1) / 3.
// Употреба: NODE_PATH=$(npm root -g) node tools/test-uchilishte.mjs http://localhost:8765/history/ <папка> [ширина]
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
await page.goto(base + 'xp.html?exp=uchilishte');
await page.waitForSelector('.corner-menu', { timeout: 15000 });
const wait = (ms) => page.waitForTimeout(ms);
const T0 = Date.now();
const log = (...a) => console.log(`[${((Date.now() - T0) / 1000).toFixed(0)} s]`, ...a);
const pos = (id, key = 'pickId') => page.evaluate(([i, k]) => document.querySelector('#area').__demo.stage.screenOf(i, k), [id, key]);
async function drag(a, b) { await page.mouse.move(a.x, a.y); await page.mouse.down(); for (let k = 1; k <= 5; k++) await page.mouse.move(a.x + (b.x - a.x) * k / 5, a.y + (b.y - a.y) * k / 5); await page.mouse.up(); await wait(350); }
async function menu(id) {
  if (!(await page.isVisible(`.corner-menu .cm-item[data-id="${id}"]`))) await page.click('.corner-menu .cm-head');
  await page.click(`.corner-menu .cm-item[data-id="${id}"]`); await wait(1300);
}
await page.locator('.xp').scrollIntoViewIfNeeded();
await wait(2000);
await snap('u-start');
// 1. Опознай: всичко от менюто (едно — с клик в сцената).
await menu('cell'); await snap('u-cell');
const pt = await pos('teacher'); await page.mouse.click(pt.x, pt.y); await wait(1300); await snap('u-teacher');
for (const id of ['sand', 'psalter', 'school', 'primer', 'tables', 'board']) { await menu(id); await snap(`u-${id}`); }
log('разгледани:', await page.textContent('.xp-score'));
await page.click('.xp-controls .btn.primary'); await wait(1300);
// 2. Опит.
await page.click('.xp-controls button[data-p="new"]'); await wait(300);
const monthDone = () => page.waitForFunction(() => [...document.querySelectorAll('.bubble')].some((b) => /букви за месец/.test(b.textContent)), null, { timeout: 15000 });
await page.click('.xp-controls .r-old'); await wait(2000); await snap('u-run-old-mid'); await monthDone();
await snap('u-run-old');
await page.click('.xp-controls .r-new'); await wait(600); await monthDone();
await snap('u-run-new');
log('опит:', await page.textContent('.xp-score'));
await page.click('.xp-controls button[data-i="0"]'); await wait(600);
await snap('u-why');
await page.click('.xp-controls .btn.primary'); await wait(1500);
// 3. Будителите: една умишлена грешка (букварът → Паисий).
await snap('u-room');
await drag(await pos('d-primer', 'dragId'), await pos('paisiy', 'dropId')); log('грешка:', await page.textContent('.xp-msg'));
for (const [d, p] of [['d-history', 'paisiy'], ['d-nedelnik', 'sofroniy'], ['d-primer', 'beron'], ['d-money', 'aprilov'], ['d-teacher', 'neofit']]) {
  await drag(await pos(d, 'dragId'), await pos(p, 'dropId')); log(d, '→', await page.textContent('.xp-score'));
}
await snap('u-room-done');
await page.click('.xp-controls .btn.primary'); await wait(1500);
// 4. Предскажи.
await page.click('.xp-controls button[data-i="0"]'); await wait(3500);
await snap('u-predict1');
await page.click('.xp-controls button[data-i="0"]'); await wait(3000);
await snap('u-predict2');
await page.click('.xp-controls .btn.primary'); await wait(300);
const result = await page.evaluate(() => window.__result);
const want = (1 + 0.75 + 1) / 3;
await snap('u-finish');
await page.click('.xp-controls .again'); await wait(1500);
const reset = await page.evaluate(() => document.querySelector('.xp-title').textContent + ' | ' + document.querySelector('.xp-score').textContent);
await snap('u-restart');
console.log('след рестарт:', reset);
console.log('резултат:', result, 'очакван:', want);
console.log('грешки в конзолата:', errors.length ? errors : 'няма');
await browser.close();
process.exit(Math.abs(result - want) < 1e-6 && !errors.length && /Опознай/.test(reset) && /0 от 8/.test(reset) ? 0 : 1);
