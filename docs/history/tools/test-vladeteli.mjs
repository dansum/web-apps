// Изиграва 3.2.2 „Владетелите“ докрай с една умишлена грешка. Очакван резултат: (0.75 + 1 + 1) / 3.
// Употреба: node tools/test-vladeteli.mjs http://localhost:8765/history/ <папка за снимки> [ширина]
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright'); // глобален пакет: NODE_PATH=$(npm root -g)
const [, , base, shots = '.', width = '1280'] = process.argv;
const W = +width, H = W < 600 ? 844 : 900;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: W, height: H } });
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', (e) => errors.push(e.message));
await page.goto(base + 'xp.html?exp=vladeteli');
await page.waitForSelector('.corner-menu .cm-head', { timeout: 15000 });
const wait = (ms) => page.waitForTimeout(ms);
const pos = (id) => page.evaluate((i) => document.querySelector('#area').__demo.stage.screenOf(i), id);
async function click(id) { const p = await pos(id); if (!p) throw new Error('няма ' + id); await page.mouse.click(p.x, p.y); await wait(300); }
const task = () => page.textContent('.xp-msg');
await page.locator('.xp').scrollIntoViewIfNeeded();

// 1. Опознай
await page.screenshot({ path: `${shots}/1-explore-${W}.png` });
for (let i = 0; i < 6; i++) {
  const head = page.locator('.cm-head');
  if (await page.locator('.cm-list[hidden]').count()) await head.click();
  await page.locator('.cm-item').nth(i).click();
  await wait(250);
}
await wait(900);
await page.screenshot({ path: `${shots}/1b-explore-done-${W}.png` });
await page.click('.xp-controls .btn.primary');
await wait(1200);

// 2. Изследвай: една умишлена грешка — клик на Плиска преди плъзгача
await click('pliska');
console.log('грешка 1:', await task());
await page.evaluate(() => { const r = document.querySelector('.yr-range'); r.value = 900; r.dispatchEvent(new Event('input')); });
await wait(400);
await page.screenshot({ path: `${shots}/2-slider-${W}.png` });
await click('preslav');
await page.click('.xp-controls button[data-id="simeon"]');
await page.click('.xp-controls .btn.primary');
await wait(1400);

// 3. Подреди делата
await page.screenshot({ path: `${shots}/3-cards-${W}.png` });
const pairs = [['d-state', 'asparuh'], ['d-laws', 'krum'], ['d-faith', 'boris'], ['d-books', 'simeon']];
for (const [card, slot] of pairs) {
  const a = await pos(card), b = await pos(slot);
  await page.mouse.move(a.x, a.y); await page.mouse.down();
  for (let k = 1; k <= 12; k++) await page.mouse.move(a.x + (b.x - a.x) * k / 12, a.y + (b.y - a.y) * k / 12);
  await page.mouse.up(); await wait(300);
  console.log(card, '→', await page.textContent('.xp-score'));
}
await page.screenshot({ path: `${shots}/3b-cards-done-${W}.png` });
await page.click('.xp-controls .btn.primary');
await wait(1300);

// 4. Предскажи
await page.click('.xp-controls button[data-i="0"]');
await wait(800);
await page.screenshot({ path: `${shots}/4-predict-${W}.png` });
await page.click('.xp-controls .btn.primary');
await wait(300);
const result = await page.evaluate(() => window.__result);
console.log('резултат:', result, 'очакван:', (0.75 + 1 + 1) / 3);
console.log('грешки в конзолата:', errors.length ? errors : 'няма');
await browser.close();
process.exit(Math.abs(result - (0.75 + 2) / 3) < 1e-6 && !errors.length ? 0 : 1);
