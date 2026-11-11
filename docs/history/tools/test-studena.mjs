// Изиграва „Студената война“ докрай с една умишлена грешка (Полша в НАТО). Очакван резултат: (0.75 + 1 + 1) / 3.
// Употреба: NODE_PATH=$(npm root -g) node tools/test-studena.mjs http://localhost:8765/history/ <папка> [ширина]
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
const [, , base, shots = '.', width = '1280'] = process.argv;
const W = +width, H = W < 600 ? 844 : 900, tag = `${W}`;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: W, height: H } });
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', (e) => errors.push(e.message));
await page.goto(`${base}xp.html?exp=studena&skill=9.3.2`);
await page.waitForSelector('.corner-menu .cm-head', { timeout: 20000 });
const wait = (ms) => page.waitForTimeout(ms);
const at = (id) => page.evaluate((i) => document.querySelector('#area').__demo.at(i), id);
async function click(id) { const p = await at(id); if (!p) throw new Error('няма ' + id); await page.mouse.click(p.x, p.y); await wait(250); }
const msg = () => page.textContent('.xp-msg');
await page.locator('.xp').scrollIntoViewIfNeeded();
await wait(800);

// 1. Опознай: Берлинската стена
await page.screenshot({ path: `${shots}/s1-berlin-${tag}.png` });
const n1 = await page.locator('.cm-item').count();
for (let i = 0; i < n1; i++) {
  if (await page.locator('.cm-list[hidden]').count()) await page.locator('.cm-head').click();
  await page.locator('.cm-item').nth(i).click();
  await wait(i === 4 ? 1400 : 400);
  if (i === 4) await page.screenshot({ path: `${shots}/s1b-hut-${tag}.png` });
}
await wait(4000);
await page.screenshot({ path: `${shots}/s1c-cross-${tag}.png` });
await page.click('.xp-controls .btn.primary');
await wait(1500);

// 2. Раздели Европа: една умишлена грешка — Полша с цвета на НАТО
const d = await page.evaluate(() => ({ SORT: document.querySelector('#area').__demo.SORT, B55: document.querySelector('#area').__demo.B55 }));
await page.screenshot({ path: `${shots}/s2-map-${tag}.png` });
await page.click('.brush[data-b="nato"]');
await click('pl');
console.log('грешка:', await msg());
for (const id of d.SORT) {
  await page.click(`.brush[data-b="${d.B55[id]}"]`);
  await click(id);
  const m = await msg();
  if (!m.startsWith('Вярно')) console.log('  ', id, '→', m);
}
console.log('блокове:', await page.textContent('.xp-score'));
await wait(2600);
await page.screenshot({ path: `${shots}/s2b-curtain-${tag}.png` });
await page.click('.xp-controls .next');
await wait(1500);

// 3. Приложи: картите към Запада или Изтока
await page.screenshot({ path: `${shots}/s3-cards-${tag}.png` });
const cards = await page.evaluate(() => document.querySelector('#area').__demo.CARDS.map((c) => [c.id, c.side]));
for (const [id, side] of cards) {
  const a = await at(id), b = await at(`zone-${side}`);
  await page.mouse.move(a.x, a.y); await page.mouse.down();
  for (let k = 1; k <= 8; k++) await page.mouse.move(a.x + (b.x - a.x) * k / 8, a.y + (b.y - a.y) * k / 8);
  await page.mouse.up(); await wait(250);
}
console.log('карти:', await page.textContent('.xp-score'));
await page.screenshot({ path: `${shots}/s3b-cards-done-${tag}.png` });
await page.click('.xp-controls .next');
await wait(1500);

// 4. Плъзгач и предсказание
for (const i of [1, 5, 7]) {
  await page.evaluate((v) => { const r = document.querySelector('.yr-range'); r.value = v; r.dispatchEvent(new Event('input')); }, i);
  await wait(700);
  await page.screenshot({ path: `${shots}/s4-slider${i}-${tag}.png` });
}
await page.click('.xp-controls .opts button[data-i="0"]');
await wait(1500);
await page.screenshot({ path: `${shots}/s4b-1989-${tag}.png` });
await page.click('.xp-controls .next');
await wait(300);
const result = await page.evaluate(() => window.__result);
const want = (0.75 + 1 + 1) / 3;
console.log('резултат:', result, 'очакван:', want);
await page.click('.xp-controls .again'); await wait(800);
const again = await page.textContent('.xp-title');
const menuOk = await page.locator('.corner-menu:not([hidden]) .cm-head').count();
console.log('отначало:', again, '| меню:', menuOk);
console.log('грешки в конзолата:', errors.length ? errors : 'няма');
await browser.close();
process.exit(Math.abs(result - want) < 1e-6 && again.startsWith('1.') && menuOk === 1 && !errors.length ? 0 : 1);
