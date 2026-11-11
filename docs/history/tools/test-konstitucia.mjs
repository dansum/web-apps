// Изиграва 4.1.1 „Търновската конституция“ докрай с една умишлена грешка (в стъпка 3) и проверява
// „Започни отначало“. Очакван резултат: (1 + (1 − 1/3) + 1) / 3.
// Употреба: NODE_PATH=$(npm root -g) node tools/test-konstitucia.mjs http://localhost:8765/history/ <папка> [ширина]
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
const [, , base, shots = '.', width = '1280'] = process.argv;
const W = +width, H = W < 600 ? 844 : 900;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: W, height: H } });
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', (e) => errors.push(e.message));
await page.goto(base + 'xp.html?exp=konstitucia&q=high');
await page.waitForSelector('.corner-menu .cm-head', { timeout: 15000 });
const wait = (ms) => page.waitForTimeout(ms);
const pos = (id, key = 'pickId') => page.evaluate(([i, k]) => document.querySelector('#area').__demo.stage.screenOf(i, k), [id, key]);
const at = (name) => page.evaluate((n) => document.querySelector('#area').__demo.at(n), name);
async function drag(a, b) {
  await page.mouse.move(a.x, a.y); await page.mouse.down();
  for (let k = 1; k <= 12; k++) await page.mouse.move(a.x + (b.x - a.x) * k / 12, a.y + (b.y - a.y) * k / 12);
  await page.mouse.up(); await wait(300);
}
const msg = () => page.textContent('.xp-msg');
await page.locator('.xp').scrollIntoViewIfNeeded(); await wait(800);
await page.screenshot({ path: `${shots}/k1-${W}.png` });

// 1. Опознай: всичко от менюто.
for (let i = 0; i < 7; i++) {
  if (await page.locator('.cm-list[hidden]').count()) await page.locator('.cm-head').click();
  await page.locator('.cm-item').nth(i).click(); await wait(1200);
  if (i === 1 || i === 3) await page.screenshot({ path: `${shots}/k1-${i}-${W}.png` });
}
await page.screenshot({ path: `${shots}/k1b-${W}.png` });
await page.click('.xp-controls .btn.primary'); await wait(1300);

// 2. Извор: четирите страници, после картите.
for (let i = 0; i < 4; i++) { await page.click('.xp-controls .flip'); await wait(1000); }
await page.screenshot({ path: `${shots}/k2-${W}.png` });
await page.click('.xp-controls .btn.primary'); await wait(1300);
await page.screenshot({ path: `${shots}/k2b-${W}.png` });
for (const id of ['c-equal', 'c-vote', 'c-school', 'c-slave']) {
  await drag(await pos(id, 'dragId'), await at('book'));
  console.log(id, '→', await page.textContent('.xp-score'));
}
await page.screenshot({ path: `${shots}/k2c-${W}.png` });
await page.click('.xp-controls .btn.primary'); await wait(1300);

// 3. Сглоби държавата: една умишлена грешка.
await page.screenshot({ path: `${shots}/k3-${W}.png` });
await drag(await pos('b-prince', 'dragId'), await at('s-laws'));
console.log('грешка:', await msg());
for (const [id, slot] of [['b-assembly', 's-laws'], ['b-prince', 's-rule'], ['b-court', 's-judge']]) {
  await drag(await pos(id, 'dragId'), await at(slot));
  console.log(id, '→', await msg());
}
await wait(3000); await page.screenshot({ path: `${shots}/k3b-${W}.png` });
await page.waitForSelector('.xp-controls .btn.primary', { timeout: 15000 });
await page.screenshot({ path: `${shots}/k3c-${W}.png` });
await page.click('.xp-controls .btn.primary'); await wait(1300);

// 4. Предскажи.
await page.click('.xp-controls button[data-i="0"]'); await wait(1300);
await page.screenshot({ path: `${shots}/k4-${W}.png` });
await page.click('.xp-controls .btn.primary'); await wait(1300);
await page.click('.xp-controls button[data-i="0"]'); await wait(1300);
await page.screenshot({ path: `${shots}/k4b-${W}.png` });
await page.click('.xp-controls .btn.primary'); await wait(400);
const result = await page.evaluate(() => window.__result);
const want = (1 + (1 - 1 / 3) + 1) / 3;
console.log('резултат:', result, 'очакван:', want);

// „Започни отначало“.
await page.click('.xp-controls .again'); await wait(1300);
const restartOk = await page.evaluate(() => document.querySelector('.xp-title').textContent.startsWith('1.') && document.querySelectorAll('.corner-menu').length === 1);
console.log('отначало:', restartOk ? 'да' : 'НЕ');
await page.screenshot({ path: `${shots}/k5-${W}.png` });
console.log('грешки в конзолата:', errors.length ? errors : 'няма');
await browser.close();
process.exit(Math.abs(result - want) < 1e-6 && restartOk && !errors.length ? 0 : 1);
