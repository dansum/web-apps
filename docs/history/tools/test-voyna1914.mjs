// Изиграва „Блоковете и Първата световна война“ (9.1.1) докрай с една умишлена грешка
// (Италия оцветена в Антантата). Очакван резултат: (0.75 + 1 + 1) / 3.
// Употреба: NODE_PATH=$(npm root -g) node tools/test-voyna1914.mjs http://localhost:8765/history/ <папка> [ширина]
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
const [, , base, shots = '.', width = '1280'] = process.argv;
const W = +width, H = W < 600 ? 844 : 900, tag = `${W}`;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: W, height: H } });
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', (e) => errors.push(e.message));
await page.goto(`${base}xp.html?exp=voyna1914&skill=9.1.1`);
await page.waitForSelector('.corner-menu .cm-head', { timeout: 15000 });
const wait = (ms) => page.waitForTimeout(ms);
const at = (id, year) => page.evaluate(([i, y]) => document.querySelector('#area').__demo.at(i, y), [id, year]);
async function click(id, year) { const p = await at(id, year); if (!p) throw new Error('няма ' + id); await page.mouse.click(p.x, p.y); await wait(350); }
const msg = () => page.textContent('.xp-msg');
const shot = (name) => page.screenshot({ path: `${shots}/v${name}-${tag}.png` });
await page.locator('.xp').scrollIntoViewIfNeeded();
await wait(800);

// 1. Опознай
await shot('1-explore');
const n1 = await page.locator('.cm-item').count();
for (let i = 0; i < n1; i++) {
  if (await page.locator('.cm-list[hidden]').count()) await page.locator('.cm-head').click();
  await page.locator('.cm-item').nth(i).click();
  await wait(i === 0 ? 1300 : 300);
  if (i === 0) await shot('1a-sarajevo');
}
await wait(900);
await shot('1b-explore-done');
await page.click('.xp-controls .btn.primary');
await wait(1300);

// 2. Блоковете: умишлена грешка — Италия в Антантата
for (const id of ['fr', 'gb', 'ru', 'it']) await click(id);
await page.click('.xp-controls [data-b="ta"]');
for (const id of ['de', 'ah']) await click(id);
await page.click('.xp-controls .check'); await wait(300);
console.log('грешка 1:', await msg());
await click('it');
await page.click('.xp-controls .check'); await wait(300);
console.log('блокове:', await msg());
await shot('2a-blocs');
await page.click('.xp-controls .btn.primary'); await wait(1300);
for (const id of ['rs', 'ru', 'de', 'fr', 'be', 'gb']) {
  await click(id); await wait(700);
  console.log(id, '→', await msg());
}
await wait(800);
await shot('2b-chain');
for (let i = 0; i < 7; i++) { await page.click('.xp-controls .nextev'); await wait(450); }
await shot('2c-events');
await page.click('.xp-controls .btn.primary'); await wait(1500);

// 3. Оръжията, плъзгачът, причини и последици
await shot('3a-diorama');
const n3 = await page.locator('.cm-item').count();
for (let i = 0; i < n3; i++) {
  if (await page.locator('.cm-list[hidden]').count()) await page.locator('.cm-head').click();
  await page.locator('.cm-item').nth(i).click();
  await wait(1200);
  if (i === 2) await shot('3b-tank');
}
await page.click('.xp-controls .btn.primary'); await wait(1300);
const YEARS = [1914, 1915, 1916, 1917, 1918];
for (const [id, y] of [['west', 1914], ['salonika', 1916], ['east', 1917], ['dobro', 1918]]) {
  await page.evaluate((i) => { const r = document.querySelector('.yr-range'); r.value = i; r.dispatchEvent(new Event('input')); }, YEARS.indexOf(y));
  await wait(300);
  await click(id, y);
  console.log(id, y, '→', await msg());
  if (y === 1916) await shot('3c-slider');
}
await page.click('.xp-controls .btn.primary'); await wait(400);
const SORT = ['povod', 'prich', 'posl', 'prich', 'posl', 'prich', 'posl'];
for (const a of SORT) { await page.click(`.xp-controls [data-a="${a}"]`); await wait(200); }
console.log('сортиране:', await msg());
await page.click('.xp-controls .btn.primary'); await wait(1500);

// 4. Предскажи
await shot('4a-compiegne');
await page.click('.xp-controls .btn.primary'); await wait(1300);
for (let e = 0; e < 4; e++) {
  await page.click('.xp-controls button[data-i="0"]'); await wait(1200);
  if (e === 1) await shot('4b-ah');
  await page.click('.xp-controls .btn.primary'); await wait(1300);
}
await shot('4c-after');
await page.click('.xp-controls [data-m="14"]'); await wait(400);
await shot('4d-1914');
await page.click('.xp-controls .fin'); await wait(300);
const result = await page.evaluate(() => window.__result);
const want = (0.75 + 1 + 1) / 3;
console.log('резултат:', result, 'очакван:', want);
await page.click('.xp-controls .again'); await wait(600);
const again = await page.textContent('.xp-title');
console.log('отначало:', again);
console.log('грешки в конзолата:', errors.length ? errors : 'няма');
await browser.close();
process.exit(Math.abs(result - want) < 1e-6 && again.startsWith('1.') && !errors.length ? 0 : 1);
