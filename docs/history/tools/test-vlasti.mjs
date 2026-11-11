// Изиграва 7.3.4 „Конституцията: права и отговорности“ докрай с една умишлена грешка (в стъпка 2)
// и проверява „Започни отначало“. Очакван резултат: ((1 − 1/4) + 1 + 1) / 3.
// Употреба: NODE_PATH=$(npm root -g) node tools/test-vlasti.mjs http://localhost:8765/history/ <папка> [ширина]
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
const [, , base, shots = '.', width = '1280'] = process.argv;
const W = +width, H = W < 600 ? 844 : 900;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: W, height: H } });
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', (e) => errors.push(e.message));
await page.goto(base + 'xp.html?exp=vlasti&q=high');
await page.waitForSelector('.corner-menu .cm-head', { timeout: 15000 });
const wait = (ms) => page.waitForTimeout(ms);
const pos = (id, key = 'pickId') => page.evaluate(([i, k]) => document.querySelector('#area').__demo.stage.screenOf(i, k), [id, key]);
const at = (name) => page.evaluate((n) => document.querySelector('#area').__demo.at(n), name);
const click = async (id) => { const p = await pos(id); await page.mouse.click(p.x, p.y); await wait(300); };
async function drag(a, b) {
  await page.mouse.move(a.x, a.y); await page.mouse.down();
  for (let k = 1; k <= 12; k++) await page.mouse.move(a.x + (b.x - a.x) * k / 12, a.y + (b.y - a.y) * k / 12);
  await page.mouse.up(); await wait(300);
}
const msg = () => page.textContent('.xp-msg');
const primary = () => page.click('.xp-controls .btn.primary');
await page.locator('.xp').scrollIntoViewIfNeeded(); await wait(1000);
await page.screenshot({ path: `${shots}/v1-${W}.png` });

// 1. Опознай: всичко от менюто.
for (let i = 0; i < 8; i++) {
  if (await page.locator('.cm-list[hidden]').count()) await page.locator('.cm-head').click();
  await page.locator('.cm-item').nth(i).click(); await wait(1300);
  if ([0, 2, 3, 4].includes(i)) await page.screenshot({ path: `${shots}/v1-${i}-${W}.png` });
}
await primary(); await wait(1300);

// 2. Пътят на закона: една умишлена грешка (съдът не приема закони).
await page.screenshot({ path: `${shots}/v2-${W}.png` });
await click('court'); console.log('грешка:', await msg());
await click('ns'); console.log('ns →', await msg());
await page.waitForSelector('.xp-controls .vote', { timeout: 10000 }); await wait(1200);
const setVote = (n) => page.evaluate((v) => { const i = document.querySelector('.xp-controls .vote'); i.value = v; i.dispatchEvent(new Event('input')); }, n);
await setVote(100); await page.click('.xp-controls .go'); await wait(500);
console.log('100 за →', await msg());
await page.screenshot({ path: `${shots}/v2b-${W}.png` });
await setVote(150); await page.click('.xp-controls .go'); await wait(400);
console.log('150 за →', await msg());
await page.click('.xp-controls .go'); await wait(500);
console.log('второ →', await msg());
await page.screenshot({ path: `${shots}/v2c-${W}.png` });
await primary(); await wait(1300);
await click('pres'); console.log('pres →', await msg());
await wait(3000); await page.screenshot({ path: `${shots}/v2d-${W}.png` });
await page.waitForSelector('.xp-controls .btn.primary', { timeout: 10000 });
await primary(); await wait(1300);
await click('cc'); console.log('cc →', await msg());
await wait(3200); await page.screenshot({ path: `${shots}/v2e-${W}.png` });
await page.waitForSelector('.xp-controls .btn.primary', { timeout: 10000 });
await primary(); await wait(1300);
await page.screenshot({ path: `${shots}/v2f-${W}.png` });
await primary(); await wait(1300);

// 3. Власти и институции, после права и задължения.
for (const id of ['ns', 'ms', 'court', 'pres']) { await click(id); console.log(id, '→', await msg()); }
await page.screenshot({ path: `${shots}/v3-${W}.png` });
await primary(); await wait(1400);
await page.screenshot({ path: `${shots}/v3b-${W}.png` });
const cards = await page.evaluate(() => document.querySelector('#area').__demo.cards.map((c) => [c.id, c.zone]));
for (const [id, zone] of cards) {
  await drag(await at('card'), await at(zone));
  console.log(id, '→', await page.textContent('.xp-score'));
}
await page.screenshot({ path: `${shots}/v3c-${W}.png` });
await primary(); await wait(1300);

// 4. Извор и предсказание.
for (let i = 0; i < 4; i++) { await page.click('.xp-controls .cmp'); await wait(700); if (i === 1) await page.screenshot({ path: `${shots}/v4-${W}.png` }); }
await primary(); await wait(1300);
await page.click('.xp-controls button[data-i="0"]'); await wait(2500);
await page.screenshot({ path: `${shots}/v4b-${W}.png` });
await primary(); await wait(1300);
await page.click('.xp-controls button[data-i="0"]'); await wait(2800);
await page.screenshot({ path: `${shots}/v4c-${W}.png` });
await page.waitForSelector('.xp-controls .btn.primary', { timeout: 10000 });
await primary(); await wait(400);
const result = await page.evaluate(() => window.__result);
const want = ((1 - 1 / 4) + 1 + 1) / 3;
console.log('резултат:', result, 'очакван:', want);

// „Започни отначало“.
await page.click('.xp-controls .again'); await wait(1300);
const restartOk = await page.evaluate(() => document.querySelector('.xp-title').textContent.startsWith('1.') && document.querySelectorAll('.corner-menu').length === 1 && !document.querySelector('.bubble'));
console.log('отначало:', restartOk ? 'да' : 'НЕ');
await page.screenshot({ path: `${shots}/v5-${W}.png` });
console.log('грешки в конзолата:', errors.length ? errors : 'няма');
await browser.close();
process.exit(Math.abs(result - want) < 1e-6 && restartOk && !errors.length ? 0 : 1);
