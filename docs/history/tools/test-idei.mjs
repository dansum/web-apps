// Изиграва 8.3.2 „Консерватизъм, либерализъм, социализъм“ (idei) докрай с една умишлена грешка
// (при подреждането на твърденията). Очакван резултат: (1 + 0.8 + 1) / 3.
// Употреба: NODE_PATH=$(npm root -g) node tools/test-idei.mjs http://localhost:8765/history/ <папка> [ширина]
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
const [, , base, shots = '.', width = '1280'] = process.argv;
const T0 = Date.now(); const lap = (s) => console.log(`[${((Date.now() - T0) / 1000).toFixed(1)} s] ${s}`);
const W = +width, H = W < 600 ? 844 : 900;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: W, height: H } });
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', (e) => errors.push(e.message));
await page.goto(base + 'xp.html?exp=idei');
await page.waitForSelector('.corner-menu', { timeout: 15000 });
const wait = (ms) => page.waitForTimeout(ms);
const shot = (n) => page.screenshot({ path: `${shots}/i-${n}-${W}.png` });
const pos = (id, key = 'pickId') => page.evaluate(([i, k]) => document.querySelector('#area').__demo.stage.screenOf(i, k), [id, key]);
async function drag(a, b) { await page.mouse.move(a.x, a.y); await page.mouse.down(); for (let k = 1; k <= 6; k++) await page.mouse.move(a.x + (b.x - a.x) * k / 6, a.y + (b.y - a.y) * k / 6); await page.mouse.up(); await wait(350); }
await page.locator('.xp').scrollIntoViewIfNeeded();
await wait(1800);
await shot('start');

// 1. Опознай: всичко от менюто.
const spots = ['cafe', 'cons', 'lib', 'soc', 'anar', 'factory', 'parl', 'kiosk', 'church'];
for (const s of spots) {
  if (await page.locator('.corner-menu .cm-list[hidden]').count()) await page.click('.corner-menu .cm-head');
  await page.click(`.corner-menu .cm-item[data-id="${s}"]`); await wait(1300);
  if (['cafe', 'soc', 'parl', 'kiosk'].includes(s)) await shot('spot-' + s);
}
console.log('опознай:', await page.textContent('.xp-score'));
await page.click('.xp-controls .btn.primary'); await wait(1200);
lap('опознай');

// 2. Управлявай: във всеки проблем чуй четирите идеи (една — с щракване върху човека), после провери.
const RIGHT = ['soc', 'anar', 'cons'];
const NAMES = { cons: 'Консерватизъм', lib: 'Либерализъм', soc: 'Социализъм', anar: 'Анархизъм' };
for (let k = 0; k < 3; k++) {
  for (const id of ['cons', 'lib', 'soc', 'anar']) {
    if (k === 0 && id === 'lib') {
      // Връщаме изгледа, за да се вижда кафенето, и щракваме върху либерала.
      await wait(1300);
      const p = await pos('lib');
      await page.mouse.click(p.x, p.y);
      await wait(400);
      if (!(await page.textContent('.xp-score')).includes('2 от 4')) await page.click(`.xp-controls button[data-id="lib"]`);
    } else await page.click(`.xp-controls button[data-id="${id}"]`);
    await wait(1400);
    if (k === 0) await shot(`exp-${id}`);
  }
  await page.click('.xp-controls .btn.primary'); await wait(1100);
  await page.locator('.xp-controls button', { hasText: NAMES[RIGHT[k]] }).click(); await wait(900);
  if (k === 2) await shot('exp-done');
  await page.click('.xp-controls .btn.primary'); await wait(1300);
}
lap('опит');

// 3. Подреди: една умишлена грешка в началото.
const ORDER = ['cons', 'lib', 'soc', 'anar', 'lib', 'cons', 'anar', 'soc'];
await shot('sort');
await drag(await pos('card', 'dragId'), await pos('z-anar'));
console.log('грешка:', await page.textContent('.xp-msg'));
for (const z of ORDER) { await drag(await pos('card', 'dragId'), await pos('z-' + z)); }
console.log('подредени:', await page.textContent('.xp-score'));
await wait(1300);
await shot('book');
const btns = page.locator('.xp-controls button');
for (const i of [0, 2, 3, 5]) { await btns.nth(i).click(); await wait(300); }
await wait(600);
await shot('book-done');
await page.click('.xp-controls .btn.primary'); await wait(1300);
lap('подреди');

// 4. Предскажи.
for (const n of ['union', 'hours', 'vote']) {
  await page.click('.xp-controls button[data-i="0"]'); await wait(2400);
  await shot('predict-' + n);
  await page.click('.xp-controls .btn.primary'); await wait(1200);
}
const result = await page.evaluate(() => window.__result);
const want = (1 + 0.8 + 1) / 3;
console.log('резултат:', result, 'очакван:', want);
await shot('finish');
await page.click('.xp-controls .again'); await wait(1500);
const back = await page.textContent('.xp-title');
const sc = await page.textContent('.xp-score');
console.log('отначало:', back, '|', sc);
console.log('грешки в конзолата:', errors.length ? errors : 'няма');
await browser.close();
process.exit(Math.abs(result - want) < 1e-6 && !errors.length && back.startsWith('1.') && sc.includes('0 от') ? 0 : 1);
