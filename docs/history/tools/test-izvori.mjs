// Изиграва 3.1.1 „Материални и писмени източници“ докрай с една умишлена грешка (глиненият съд в „писмени“).
// Очакван резултат: (1 + 0.75 + 1) / 3. Проверява и „Започни отначало“.
// Употреба: NODE_PATH=$(npm root -g) node tools/test-izvori.mjs http://localhost:8765/history/ <папка> [ширина]
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
const [, , base, shots = '.', width = '1280'] = process.argv;
const W = +width, H = W < 600 ? 844 : 900;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: W, height: H } });
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', (e) => errors.push(e.message));
await page.goto(base + 'xp.html?exp=izvori');
await page.waitForSelector('.corner-menu .cm-head', { timeout: 15000 });
const wait = (ms) => page.waitForTimeout(ms);
const pos = (id, key = 'pickId') => page.evaluate(([i, k]) => document.querySelector('#area').__demo.stage.screenOf(i, k), [id, key]);
async function click(id) { const p = await pos(id); if (!p) throw new Error('няма ' + id); await page.mouse.click(p.x, p.y); await wait(400); }
async function drag(id, target) {
  const a = await pos(id, 'dragId'), b = await pos(target);
  await page.mouse.move(a.x, a.y); await page.mouse.down();
  for (let k = 1; k <= 12; k++) await page.mouse.move(a.x + (b.x - a.x) * k / 12, a.y + (b.y - a.y) * k / 12);
  await page.mouse.up(); await wait(300);
}
await page.locator('.xp').scrollIntoViewIfNeeded();
await wait(800);
await page.screenshot({ path: `${shots}/i1-${W}.png` });

async function play(round) {
  const n = await page.locator('.cm-item').count();
  for (let i = 0; i < n; i++) {
    if (await page.locator('.cm-list[hidden]').count()) await page.locator('.cm-head').click();
    await page.locator('.cm-item').nth(i).click(); await wait(round ? 100 : 700);
    if (!round && i === 4) await page.screenshot({ path: `${shots}/i1-museum-${W}.png` });
  }
  if (!round) await page.screenshot({ path: `${shots}/i1b-${W}.png` });
  await page.click('.xp-controls .btn.primary'); await wait(1300);
  if (!round) await page.screenshot({ path: `${shots}/i2-${W}.png` });
  for (let i = 0; i < 6; i++) {
    await click(`sq${i}`); await click(`sq${i}`); await wait(500);
    if (!(await page.locator('.xp-controls button[data-ok]').count())) throw new Error('квадрат ' + i + ': ' + await page.textContent('.xp-msg'));
    await page.click('.xp-controls button[data-ok]'); await wait(250);
    if (!round && i === 4) await page.screenshot({ path: `${shots}/i2-stone-${W}.png` });
  }
  console.log('стъпка 2:', await page.textContent('.xp-score'));
  if (!round) await page.screenshot({ path: `${shots}/i2b-${W}.png` });
  await page.click('.xp-controls .btn.primary'); await wait(1400);
  if (!round) await page.screenshot({ path: `${shots}/i3-${W}.png` });
  if (!round) { await drag('pot', 'zone-w'); console.log('грешка:', await page.textContent('.xp-msg')); } // умишлена грешка
  for (const [id, z] of [['pot', 'zone-m'], ['book', 'zone-w'], ['tool', 'zone-m'], ['letter', 'zone-w'], ['jewel', 'zone-m'], ['scroll', 'zone-w']]) {
    await drag(id, z);
  }
  console.log('стъпка 3:', await page.textContent('.xp-score'));
  await wait(1300);
  if (!round) await page.screenshot({ path: `${shots}/i3b-${W}.png` });
  await page.click('.xp-controls .btn.primary'); await wait(1400);
  await page.click('.xp-controls button[data-ok]'); await wait(900);
  if (!round) await page.screenshot({ path: `${shots}/i4-${W}.png` });
  await page.click('.xp-controls .btn.primary'); await wait(300);
  return page.evaluate(() => window.__result);
}

const result = await play(0);
const want = (1 + 0.75 + 1) / 3;
console.log('резултат:', result, 'очакван:', want);
await page.click('.xp-controls .again'); await wait(1200);
await page.screenshot({ path: `${shots}/i5-restart-${W}.png` });
const again = await play(1);
console.log('отначало, без грешки:', again);
console.log('грешки в конзолата:', errors.length ? errors : 'няма');
await browser.close();
process.exit(Math.abs(result - want) < 1e-6 && again === 1 && !errors.length ? 0 : 1);
