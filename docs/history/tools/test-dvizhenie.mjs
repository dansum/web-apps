// Изиграва „Стаята на историка“ (10.2.6) докрай с една умишлена грешка
// (в стъпка 2 първата карта отива в клетката на другия деятел). Очакван резултат: (0.8 + 1 + 1) / 3.
// Употреба: NODE_PATH=$(npm root -g) node tools/test-dvizhenie.mjs http://localhost:8765/history/ <папка> [ширина]
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
const [, , base, shots = '.', width = '1280'] = process.argv;
const W = +width, H = W < 600 ? 844 : 900, tag = `${W}`;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: W, height: H } });
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', (e) => errors.push(e.message));
await page.goto(`${base}xp.html?exp=dvizhenie&skill=10.2.6&q=high`);
await page.waitForSelector('.corner-menu .cm-head', { timeout: 20000 });
const wait = (ms) => page.waitForTimeout(ms);
const demo = (fn, arg) => page.evaluate(([f, a]) => { const d = document.querySelector('#area').__demo; return d[f](a); }, [fn, arg]);
const msg = () => page.textContent('.xp-msg');
const score = () => page.textContent('.xp-score');
await page.locator('.xp').scrollIntoViewIfNeeded();
async function drag(to) {
  const a = await demo('at', 'card'), b = await demo('at', to);
  if (!a || !b) throw new Error('няма точка за ' + to);
  await page.mouse.move(a.x, a.y); await page.mouse.down();
  for (let k = 1; k <= 8; k++) await page.mouse.move(a.x + (b.x - a.x) * k / 8, a.y + (b.y - a.y) * k / 8);
  await page.mouse.up(); await wait(250);
}

// 1. Опознай
await wait(1200);
await page.screenshot({ path: `${shots}/d1-room-${tag}.png` });
for (let i = 0; i < 6; i++) {
  if (await page.locator('.cm-list[hidden]').count()) await page.locator('.cm-head').click();
  await page.locator('.cm-item').nth(i).click();
  await wait(i === 1 || i === 4 ? 1100 : 400);
  if (i === 1 || i === 4) await page.screenshot({ path: `${shots}/d1-item${i}-${tag}.png` });
}
console.log('опознай:', await score());
await page.click('.xp-controls .btn.primary');
await wait(1500);

// 2. Систематизирай: една умишлена грешка в първата карта
await page.screenshot({ path: `${shots}/d2-table-${tag}.png` });
{
  const t = await demo('target');
  const [, c, r] = t.split('-');
  await drag(`cell-${1 - +c}-${r}`);
  console.log('грешка 1:', await msg());
}
for (let i = 0; i < 8; i++) {
  await drag(await demo('target'));
  console.log('карта', i + 1, '→', await score());
  if (i === 4) await page.screenshot({ path: `${shots}/d2b-table-mid-${tag}.png` });
}
await wait(1300);
for (const r of ['goal', 'means', 'org', 'center']) {
  await page.click(`.xp-controls button[data-r="${r}"]`); await wait(500);
  if (r === 'means' || r === 'center') await page.screenshot({ path: `${shots}/d2c-compare-${r}-${tag}.png` });
}
await page.click('.xp-controls .q button[data-i="0"]');
console.log('сравнение:', await msg());
await page.click('.xp-controls .btn.primary');
await wait(1500);

// 3. Оцени Левски
await page.screenshot({ path: `${shots}/d3-levski-${tag}.png` });
for (let i = 0; i < 7; i++) {
  await drag(await demo('target'));
  console.log('аргумент', i + 1, '→', await score());
  if (i === 3) await page.screenshot({ path: `${shots}/d3b-levski-mid-${tag}.png` });
}
await page.screenshot({ path: `${shots}/d3c-levski-done-${tag}.png` });
await page.click('.xp-controls button[data-i="0"]');
console.log('оценка:', await msg());
await page.click('.xp-controls .btn.primary');
await wait(1500);

// 4. Верига и предсказание
await page.screenshot({ path: `${shots}/d4-chain-${tag}.png` });
for (let i = 0; i < 3; i++) {
  await drag(await demo('target'));
  console.log('звено', i + 1, '→', await score());
}
await page.click('.xp-controls .push');
await wait(4500);
await page.screenshot({ path: `${shots}/d4b-falling-${tag}.png` });
await page.waitForSelector('.xp-controls button[data-i="0"]', { timeout: 15000 });
await wait(600);
await page.screenshot({ path: `${shots}/d4c-predict-${tag}.png` });
await page.click('.xp-controls button[data-i="0"]');
await page.waitForSelector('.xp-controls .btn.primary', { timeout: 15000 });
await wait(800);
await page.screenshot({ path: `${shots}/d4d-liberation-${tag}.png` });
await page.click('.xp-controls .btn.primary');
await wait(300);
const result = await page.evaluate(() => window.__result);
const want = (0.8 + 1 + 1) / 3;
console.log('резултат:', result, 'очакван:', want);
await page.screenshot({ path: `${shots}/d5-finish-${tag}.png` });
await page.click('.xp-controls .again'); await wait(1200);
const again = await page.textContent('.xp-title');
const visibleMenu = await page.locator('.corner-menu').count();
const blanks = await page.evaluate(() => document.querySelector('#area').__demo.current());
console.log('отначало:', again, 'менюта:', visibleMenu, 'текуща карта:', blanks);
await page.screenshot({ path: `${shots}/d6-restart-${tag}.png` });
console.log('грешки в конзолата:', errors.length ? errors : 'няма');
await browser.close();
process.exit(Math.abs(result - want) < 1e-6 && again.startsWith('1.') && visibleMenu === 1 && blanks === null && !errors.length ? 0 : 1);
