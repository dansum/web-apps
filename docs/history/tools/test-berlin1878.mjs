// Изиграва „Сан Стефано и Берлин“ докрай с една умишлена грешка. Очакван резултат: (0.75 + 1 + 1) / 3.
// Употреба: NODE_PATH=$(npm root -g) node tools/test-berlin1878.mjs http://localhost:8765/history/ <папка> [ширина] [умение: 10.3.1 | 7.2.1]
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
const [, , base, shots = '.', width = '1280', skill = '10.3.1'] = process.argv;
const W = +width, H = W < 600 ? 844 : 900, tag = `${skill}-${W}`;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: W, height: H } });
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', (e) => errors.push(e.message));
await page.goto(`${base}xp.html?exp=berlin1878&skill=${skill}`);
await page.waitForSelector('.corner-menu .cm-head', { timeout: 15000 });
const wait = (ms) => page.waitForTimeout(ms);
async function click(id) {
  const p = await page.evaluate((i) => document.querySelector('#area').__demo.at(i), id);
  if (!p) throw new Error('няма ' + id);
  await page.mouse.click(p.x, p.y); await wait(350);
}
const msg = () => page.textContent('.xp-msg');
await page.locator('.xp').scrollIntoViewIfNeeded();

// 1. Опознай
await page.screenshot({ path: `${shots}/b1-explore-${tag}.png` });
for (let i = 0; i < 5; i++) {
  if (await page.locator('.cm-list[hidden]').count()) await page.locator('.cm-head').click();
  await page.locator('.cm-item').nth(i).click();
  await wait(300);
}
await wait(900);
await page.screenshot({ path: `${shots}/b1b-explore-done-${tag}.png` });
await page.click('.xp-controls .btn.primary');
await wait(1300);

// 2. Сглоби картата: една умишлена грешка — Източна Румелия вместо Княжеството
await click('rumelia');
console.log('грешка 1:', await msg());
await page.screenshot({ path: `${shots}/b2-mistake-${tag}.png` });
for (const id of ['knyaz', 'rumelia', 'makodr', 'ndob', 'nish']) { await click(id); console.log(id, '→', await msg()); }
await page.click('.xp-controls [data-view="ss"]'); await wait(300);
await page.click('.xp-controls [data-view="b"]'); await wait(300);
await page.screenshot({ path: `${shots}/b2b-berlin-${tag}.png` });
await page.click('.xp-controls .next');
await wait(1300);

// 3. Сравни границите
await click('rumelia'); await click('makodr');
await page.screenshot({ path: `${shots}/b3-compare-${tag}.png` });
await page.click('.xp-controls .check'); await wait(400);
if (skill.startsWith('7.')) {
  await page.click('.xp-controls button[data-i="0"]');
} else {
  for (const a of ['ss', 'b', 'ss', 'b']) { await page.click(`.xp-controls button[data-a="${a}"]`); await wait(150); }
}
console.log('стъпка 3:', await msg());
await page.screenshot({ path: `${shots}/b3b-compare-done-${tag}.png` });
await page.click('.xp-controls .btn.primary');
await wait(1300);

// 4. Предскажи
await page.click('.xp-controls button[data-i="0"]');
await wait(900);
await page.screenshot({ path: `${shots}/b4-predict-${tag}.png` });
await page.click('.xp-controls .btn.primary');
await wait(300);
const result = await page.evaluate(() => window.__result);
const want = (0.75 + 1 + 1) / 3;
console.log('резултат:', result, 'очакван:', want);
// „Започни отначало“ връща в началото без презареждане.
await page.click('.xp-controls .again'); await wait(500);
const again = await page.textContent('.xp-title');
console.log('отначало:', again);
console.log('грешки в конзолата:', errors.length ? errors : 'няма');
await browser.close();
process.exit(Math.abs(result - want) < 1e-6 && again.startsWith('1.') && !errors.length ? 0 : 1);
