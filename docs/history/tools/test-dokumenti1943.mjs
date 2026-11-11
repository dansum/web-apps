// Изиграва 9.2.4 „България във войната и спасяването на евреите“ докрай с една умишлена грешка
// (в стъпка 2: избира по-късно звено от веригата) и проверява „Започни отначало“.
// Очакван резултат: ((1 − 1/4) + 1 + 1) / 3.
// Употреба: NODE_PATH=$(npm root -g) node tools/test-dokumenti1943.mjs http://localhost:8765/history/ <папка> [ширина]
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
const [, , base, shots = '.', width = '1280'] = process.argv;
const W = +width, H = W < 600 ? 844 : 900;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: W, height: H } });
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', (e) => errors.push(e.message));
await page.goto(base + 'xp.html?exp=dokumenti1943&q=high');
await page.waitForSelector('.corner-menu .cm-head', { timeout: 15000 });
const wait = (ms) => page.waitForTimeout(ms);
const at = (name) => page.evaluate((n) => document.querySelector('#area').__demo.at(n), name);
const demo = (k) => page.evaluate((key) => document.querySelector('#area').__demo[key], k);
async function drag(a, b) {
  await page.mouse.move(a.x, a.y); await page.mouse.down();
  for (let k = 1; k <= 12; k++) await page.mouse.move(a.x + (b.x - a.x) * k / 12, a.y + (b.y - a.y) * k / 12);
  await page.mouse.up(); await wait(300);
}
const msg = () => page.textContent('.xp-msg');
const primary = () => page.click('.xp-controls .btn.primary');
await page.locator('.xp').scrollIntoViewIfNeeded(); await wait(1200);
await page.screenshot({ path: `${shots}/d1-${W}.png` });

// 1. Опознай: всичко от менюто.
for (let i = 0; i < 8; i++) {
  if (await page.locator('.cm-list[hidden]').count()) await page.locator('.cm-head').click();
  await page.locator('.cm-item').nth(i).click(); await wait(1300);
  await page.screenshot({ path: `${shots}/d1-${i}-${W}.png` });
}
await primary(); await wait(1300);

// 2. Веригата: една умишлена грешка в първия избор (по-късно звено).
await page.screenshot({ path: `${shots}/d2-${W}.png` });
const chain = await demo('chain');
for (let k = 0; k < chain.length; k++) {
  await page.waitForSelector(`.xp-controls button[data-id="${chain[k]}"]`, { timeout: 10000 });
  if (k === 0) {
    const wrong = await page.$$eval('.xp-controls button[data-id]', (bs, r) => bs.map((b) => b.dataset.id).find((id) => id !== r && !['germany', 'nobody'].includes(id)), chain[0]);
    await page.click(`.xp-controls button[data-id="${wrong}"]`); await wait(300);
    console.log('грешка:', wrong, '→', await msg());
  }
  await page.click(`.xp-controls button[data-id="${chain[k]}"]`);
  console.log(chain[k], '→', await msg());
  await page.waitForSelector('.xp-controls .btn.primary', { timeout: 15000 }); await wait(700);
  await page.screenshot({ path: `${shots}/d2-${k}-${W}.png` });
  await primary(); await wait(1300);
}
await page.screenshot({ path: `${shots}/d2-end-${W}.png` });
await primary(); await wait(1400);

// 3. Легална, нелегална съпротива или политика на режима.
await page.screenshot({ path: `${shots}/d3-${W}.png` });
const cards = await page.evaluate(() => document.querySelector('#area').__demo.cards.map((c) => [c.id, c.zone]));
for (const [id, zone] of cards) {
  await drag(await at('card'), await at(zone));
  console.log(id, '→', await page.textContent('.xp-score'));
}
await page.screenshot({ path: `${shots}/d3b-${W}.png` });
await primary(); await wait(1300);

// 4. Предскажи.
await page.screenshot({ path: `${shots}/d4-${W}.png` });
await page.click(`.xp-controls button[data-i="${await demo('q1')}"]`); await wait(5000);
await page.screenshot({ path: `${shots}/d4b-${W}.png` });
await page.waitForSelector('.xp-controls .btn.primary', { timeout: 10000 });
await primary(); await wait(1300);
await page.click(`.xp-controls button[data-i="${await demo('q2')}"]`); await wait(1500);
await page.screenshot({ path: `${shots}/d4c-${W}.png` });
await primary(); await wait(400);
const result = await page.evaluate(() => window.__result);
const want = ((1 - 1 / 4) + 1 + 1) / 3;
console.log('резултат:', result, 'очакван:', want);

await page.click('.xp-controls .again'); await wait(1300);
const restartOk = await page.evaluate(() => document.querySelector('.xp-title').textContent.startsWith('1.') && document.querySelectorAll('.corner-menu').length === 1 && !document.querySelector('.bubble'));
console.log('отначало:', restartOk ? 'да' : 'НЕ');
await page.screenshot({ path: `${shots}/d5-${W}.png` });
console.log('грешки в конзолата:', errors.length ? errors : 'няма');
await browser.close();
process.exit(Math.abs(result - want) < 1e-6 && restartOk && !errors.length ? 0 : 1);
