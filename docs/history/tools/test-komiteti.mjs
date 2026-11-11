// Изиграва „Мрежата от комитети на Левски“ (7.1.4) докрай с една умишлена грешка
// (в стъпка 2 детето кликва Букурещ вместо град в страната). Очакван резултат: (0.75 + 1 + 1) / 3.
// Употреба: NODE_PATH=$(npm root -g) node tools/test-komiteti.mjs http://localhost:8765/history/ <папка> [ширина]
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
const [, , base, shots = '.', width = '1280'] = process.argv;
const W = +width, H = W < 600 ? 844 : 900, tag = `${W}`;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: W, height: H } });
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', (e) => errors.push(e.message));
await page.goto(`${base}xp.html?exp=komiteti&skill=7.1.4&q=high`);
await page.waitForSelector('.corner-menu .cm-head', { timeout: 20000 });
const wait = (ms) => page.waitForTimeout(ms);
const at = (id) => page.evaluate((i) => document.querySelector('#area').__demo.at(i), id);
async function click(id) { const p = await at(id); if (!p) throw new Error('няма ' + id); await page.mouse.click(p.x, p.y); await wait(350); }
const msg = () => page.textContent('.xp-msg');
await page.locator('.xp').scrollIntoViewIfNeeded();

// 1. Опознай
await wait(800);
await page.screenshot({ path: `${shots}/k1-explore-${tag}.png` });
for (let i = 0; i < 7; i++) {
  if (await page.locator('.cm-list[hidden]').count()) await page.locator('.cm-head').click();
  await page.locator('.cm-item').nth(i).click();
  await wait(i === 4 ? 1200 : 300);
  if (i === 4) await page.screenshot({ path: `${shots}/k1b-lovech-${tag}.png` });
}
await wait(1000);
await page.screenshot({ path: `${shots}/k1c-explore-done-${tag}.png` });
await page.click('.xp-controls .btn.primary');
await wait(1500);

// 2. Изгради мрежата: една умишлена грешка — Букурещ
await page.screenshot({ path: `${shots}/k2-build-${tag}.png` });
await click('bucharest');
console.log('грешка 1:', await msg());
for (const id of ['pleven', 'tarnovo', 'troyan', 'karlovo', 'kazanlak', 'stzagora', 'plovdiv', 'sofia']) {
  await click('t-' + id);
  await page.waitForFunction((n) => (document.querySelector('.xp-score').textContent || '').includes(`Комитети: ${n} `), ['pleven', 'tarnovo', 'troyan', 'karlovo', 'kazanlak', 'stzagora', 'plovdiv', 'sofia'].indexOf(id) + 1, { timeout: 15000 });
  console.log(id, '→', await page.textContent('.xp-score'));
}
await wait(1600);
await page.screenshot({ path: `${shots}/k2b-built-${tag}.png` });
await click('t-lovech');
console.log('схема А:', await msg());
await wait(500);
await page.screenshot({ path: `${shots}/k2c-starcut-${tag}.png` });
await page.click('.xp-controls .b-exp');
await wait(800);
await click('t-lovech');
console.log('схема Б:', await msg());
await wait(900);
await page.screenshot({ path: `${shots}/k2d-mesh-${tag}.png` });
await page.click('.xp-controls button[data-i="0"]');
console.log('въпрос:', await msg());
await page.click('.xp-controls .btn.primary');
await wait(1500);

// 3. Свържи делото с деятеля
await page.screenshot({ path: `${shots}/k3-apply-${tag}.png` });
for (let i = 0; i < 8; i++) {
  const id = await page.evaluate(() => document.querySelector('#area').__demo.currentCard());
  const who = await page.evaluate((c) => document.querySelector('#area').__demo.cardWho(c), id);
  const a = await at(id), b = await at('p-' + who);
  await page.mouse.move(a.x, a.y); await page.mouse.down();
  for (let k = 1; k <= 12; k++) await page.mouse.move(a.x + (b.x - a.x) * k / 12, a.y + (b.y - a.y) * k / 12);
  await page.mouse.up(); await wait(350);
  console.log(id, who, '→', await page.textContent('.xp-score'));
  if (i === 3) await page.screenshot({ path: `${shots}/k3b-apply-mid-${tag}.png` });
}
await page.screenshot({ path: `${shots}/k3c-apply-done-${tag}.png` });
await page.click('.xp-controls .btn.primary');
await wait(1500);

// 4. Предскажи
await page.screenshot({ path: `${shots}/k4-predict-${tag}.png` });
await page.click('.xp-controls button[data-i="0"]');
await wait(1000);
await page.screenshot({ path: `${shots}/k4b-predict-done-${tag}.png` });
await page.click('.xp-controls .btn.primary');
await wait(300);
const result = await page.evaluate(() => window.__result);
const want = (0.75 + 1 + 1) / 3;
console.log('резултат:', result, 'очакван:', want);
await page.click('.xp-controls .again'); await wait(900);
const again = await page.textContent('.xp-title');
const visibleMenu = await page.locator('.corner-menu').count();
console.log('отначало:', again, 'менюта:', visibleMenu);
await page.screenshot({ path: `${shots}/k5-restart-${tag}.png` });
console.log('грешки в конзолата:', errors.length ? errors : 'няма');
await browser.close();
process.exit(Math.abs(result - want) < 1e-6 && again.startsWith('1.') && visibleMenu === 1 && !errors.length ? 0 : 1);
