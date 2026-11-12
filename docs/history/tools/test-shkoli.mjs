// Изиграва 6.2.8 „Школи и университети“ докрай с по една умишлена грешка в стъпки 2 и 3.
// Проверява и знака „Не е по програмата на МОН“ за Фес и ходенето между дворовете.
// Очакван резултат: (stepScore(1, 2) + stepScore(1, 4) + 1) / 3 = (2/3 + 4/5 + 1) / 3.
// Употреба: NODE_PATH=$(npm root -g) node tools/test-shkoli.mjs http://localhost:8765/history/ <папка> [ширина]
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
const [, , base, shots = '.', width = '1280'] = process.argv;
const W = +width, H = W < 600 ? 844 : 900;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: W, height: H } });
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', (e) => errors.push(e.message));
await page.goto(base + 'xp.html?exp=shkoli&q=high');
await page.waitForSelector('.corner-menu .cm-head', { timeout: 40000 });
const wait = (ms) => page.waitForTimeout(ms);
const demo = (fn, arg) => page.evaluate(`(${fn})(document.querySelector('#area').__demo, ${JSON.stringify(arg ?? null)})`);
const shot = async (name) => { const c = await page.locator('.xp-stage').boundingBox(); await page.screenshot({ path: `${shots}/${name}-${W}.png`, clip: c }); };
async function clickPlace(id) { const p = await demo('(d, id) => d.stage.screenOf(id)', id); if (!p) throw new Error('няма ' + id); await page.mouse.click(p.x, p.y); await wait(500); }
const openMenu = async () => { if (await page.locator('.cm-list[hidden]').count()) await page.locator('.cm-head').click(); };
await page.locator('.xp-stage').scrollIntoViewIfNeeded(); await wait(5000);
await shot('k1');

// Стъпка 1: всички места; Фес е отбелязан като извън програмата и в менюто, и в балончето.
const n = await page.locator('.cm-item').count();
for (let i = 0; i < n; i++) { await openMenu(); await page.locator('.cm-item').nth(i).click(); await wait(250); }
const OFF = await demo('(d) => d.OFF_MON');
const fesLabel = await page.locator('.cm-item[data-id="fes"] .cm-lbl').textContent();
const fesBubble = await page.locator('.bubble.wide').last().textContent();
const offOk = fesLabel.includes('⚠') && fesBubble.startsWith(OFF);
console.log('знак за Фес: в менюто', fesLabel.includes('⚠'), '| в балончето', fesBubble.startsWith(OFF));
await shot('k1-fes');
// Разходка: от пътя до скриптория в двора на Търновската школа — с ходене, без скок.
await page.click('.mode-toggle button[data-m="walk"]'); await wait(4500);
await openMenu(); await page.locator('.cm-item[data-id="scriptorium"]').click();
let maxStep = 0, last = await demo('(d) => [d.walk.state.x, d.walk.state.z]'), arrived = false;
for (let k = 0; k < 160 && !arrived; k++) {
  await wait(250);
  const s = await demo('(d) => [d.walk.state.x, d.walk.state.z, !!d.walk.state.auto]');
  maxStep = Math.max(maxStep, Math.hypot(s[0] - last[0], s[1] - last[1])); last = s; arrived = !s[2];
}
const toStand = Math.hypot(last[0] - 61, last[1] + 18.5);
console.log('ходене до скриптория: пристигна', arrived, 'остават m', toStand.toFixed(1), 'най-голям скок m', maxStep.toFixed(1));
await wait(800); await shot('k1-walk');
await page.click('.mode-toggle button[data-m="top"]'); await wait(2500);

// Стъпка 2: една грешка в предсказанието, после четирите факултета.
await page.click('.xp-controls .next'); await wait(2500);
await page.click('.xp-controls button[data-a="walls"]');
console.log('грешка 2:', await page.textContent('.xp-msg'));
await page.click('.xp-controls button[data-a="ok"]');
for (let i = 0; i < 4; i++) {
  await page.click(`.xp-controls .fac[data-i="${i}"]`);
  await page.waitForFunction((k) => document.querySelector(`.xp-controls .fac[data-i="${k}"]`).textContent.includes('✓'), i, { timeout: 120000 });
}
await wait(800); await shot('k2');
await page.click('.xp-controls .next'); await wait(3500);

// Стъпка 3: първото твърдение е за университета — веднъж грешно (школата), после всички вярно.
await clickPlace('evtimiy');
console.log('грешка 3:', await page.textContent('.xp-msg'));
for (let k = 0; k < 6; k++) {
  const yard = await page.getAttribute('.xp-task [data-yard]', 'data-yard');
  await clickPlace(yard === 'uni' ? 'students' : 'evtimiy');
  console.log(yard, '→', await page.textContent('.xp-score'));
  if (k === 1) await shot('k3');
  await wait(2400);
}
await page.click('.xp-controls .next'); await wait(3000);

// Стъпка 4.
await page.click('.xp-controls button[data-i="0"]'); await wait(6000);
await shot('k4');
await page.click('.xp-controls .btn.primary'); await wait(300);
const result = await page.evaluate(() => window.__result);
const want = (2 / 3 + 4 / 5 + 1) / 3;
console.log('резултат:', result, 'очакван:', want);
await page.click('.again'); await wait(2500);
const again = [await page.locator('.corner-menu').count(), await page.textContent('.xp-title')];
console.log('отначало:', again);
console.log('грешки в конзолата:', errors.length ? errors : 'няма');
await browser.close();
process.exit(offOk && arrived && toStand < 1 && maxStep < 25 && Math.abs(result - want) < 1e-6 && again[0] === 1 && again[1].startsWith('1.') && !errors.length ? 0 : 1);
