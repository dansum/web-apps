// Изиграва 5.2.2 „Спарта и Атина“ докрай с една умишлена грешка. Очакван резултат: (0.75 + 1 + 1) / 3.
// Употреба: NODE_PATH=$(npm root -g) node tools/test-agora.mjs http://localhost:8765/history/ <папка> [ширина]
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
const [, , base, shots = '.', width = '1280'] = process.argv;
const W = +width, H = W < 600 ? 844 : 900;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: W, height: H } });
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', (e) => errors.push(e.message));
await page.goto(base + 'xp.html?exp=agora');
await page.waitForSelector('.corner-menu .cm-head', { timeout: 15000 });
const wait = (ms) => page.waitForTimeout(ms);
const pos = (id, key = 'pickId') => page.evaluate(([i, k]) => document.querySelector('#area').__demo.stage.screenOf(i, k), [id, key]);
const zonePos = (name) => page.evaluate((n) => {
  const d = document.querySelector('#area').__demo; const z = n === 'assembly' ? d.assembly : d.zones[n];
  const v = z.position.clone().project(d.stage.camera); const r = d.stage.renderer.domElement.getBoundingClientRect();
  return { x: r.left + (v.x * 0.5 + 0.5) * r.width, y: r.top + (-v.y * 0.5 + 0.5) * r.height };
}, name);
async function drag(a, b) {
  await page.mouse.move(a.x, a.y); await page.mouse.down();
  for (let k = 1; k <= 12; k++) await page.mouse.move(a.x + (b.x - a.x) * k / 12, a.y + (b.y - a.y) * k / 12);
  await page.mouse.up(); await wait(300);
}
await page.locator('.xp').scrollIntoViewIfNeeded(); await wait(400);
await page.screenshot({ path: `${shots}/g1-${W}.png` });
for (let i = 0; i < 6; i++) {
  if (await page.locator('.cm-list[hidden]').count()) await page.locator('.cm-head').click();
  await page.locator('.cm-item').nth(i).click(); await wait(300);
}
await wait(900); await page.screenshot({ path: `${shots}/g1b-${W}.png` });
await page.click('.xp-controls .btn.primary'); await wait(1300);
await page.screenshot({ path: `${shots}/g2-${W}.png` });
await drag(await pos('c-woman', 'dragId'), await zonePos('assembly')); // умишлена грешка
console.log('грешка:', await page.textContent('.xp-msg'));
await drag(await pos('c-citizen1', 'dragId'), await zonePos('assembly'));
await drag(await pos('c-citizen2', 'dragId'), await zonePos('assembly'));
await page.screenshot({ path: `${shots}/g2b-${W}.png` });
await page.click('.xp-controls .btn.primary'); await wait(1300);
await page.screenshot({ path: `${shots}/g3-${W}.png` });
for (const [id, city] of [['t-kings', 'sparta'], ['t-demo', 'athens'], ['t-boys', 'sparta'], ['t-parth', 'athens'], ['t-leonid', 'sparta'], ['t-school', 'athens']]) {
  await drag(await pos(id, 'dragId'), await zonePos(city));
  console.log(id, '→', await page.textContent('.xp-score'));
}
await page.screenshot({ path: `${shots}/g3b-${W}.png` });
await page.click('.xp-controls .btn.primary'); await wait(1300);
await page.click('.xp-controls button[data-i="0"]'); await wait(900);
await page.screenshot({ path: `${shots}/g4-${W}.png` });
await page.click('.xp-controls .btn.primary'); await wait(300);
const result = await page.evaluate(() => window.__result);
const want = (0.75 + 1 + 1) / 3;
console.log('резултат:', result, 'очакван:', want);
console.log('грешки в конзолата:', errors.length ? errors : 'няма');
await browser.close();
process.exit(Math.abs(result - want) < 1e-6 && !errors.length ? 0 : 1);
