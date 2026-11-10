// Изиграва 6.2.4 „Търновград“ докрай с по една умишлена грешка в стъпки 2 и 3 и проверява разходката.
// Очакван резултат: (stepScore(1, 2) + stepScore(1, 4) + 1) / 3 = (2/3 + 4/5 + 1) / 3.
// Употреба: NODE_PATH=$(npm root -g) node tools/test-tarnovgrad.mjs http://localhost:8765/history/ <папка> [ширина]
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
const [, , base, shots = '.', width = '1280'] = process.argv;
const W = +width, H = W < 600 ? 844 : 900;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: W, height: H } });
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', (e) => errors.push(e.message));
await page.goto(base + 'xp.html?exp=tarnovgrad&q=high');
await page.waitForSelector('.corner-menu .cm-head', { timeout: 40000 });
const wait = (ms) => page.waitForTimeout(ms);
const demo = (fn, arg) => page.evaluate(`(${fn})(document.querySelector('#area').__demo, ${JSON.stringify(arg ?? null)})`);
const shot = async (name) => { const c = await page.locator('.xp-stage').boundingBox(); await page.screenshot({ path: `${shots}/${name}-${W}.png`, clip: c }); };
async function clickPlace(id) { const p = await demo('(d, id) => d.stage.screenOf(id)', id); if (!p) throw new Error('няма ' + id); await page.mouse.click(p.x, p.y); await wait(500); }
await page.locator('.xp-stage').scrollIntoViewIfNeeded(); await wait(5000);
await shot('t1');

// Стъпка 1: всички места от менюто; после кратка разходка.
const n = await page.locator('.cm-item').count();
for (let i = 0; i < n; i++) {
  if (await page.locator('.cm-list[hidden]').count()) await page.locator('.cm-head').click();
  await page.locator('.cm-item').nth(i).click(); await wait(250);
}
await page.click('.mode-toggle button[data-m="walk"]'); await wait(4500);
const a = await demo('(d) => [d.walk.active, d.walk.state.x, d.walk.state.z]');
await page.keyboard.down('ArrowUp'); await wait(3000); await page.keyboard.up('ArrowUp');
const b = await demo('(d) => [d.walk.active, d.walk.state.x, d.walk.state.z]');
const moved = Math.hypot(b[1] - a[1], b[2] - a[2]);
console.log('разходка: активна', b[0], 'изминати m', moved.toFixed(1));
// През стена не се минава: опит да се влезе в зида на портата.
await demo('(d) => { const s = d.walk.state; s.x = -96; s.z = 2; s.yaw = 0; }');
await page.keyboard.down('ArrowUp'); await wait(2500); await page.keyboard.up('ArrowUp');
const wallZ = await demo('(d) => d.walk.state.z');
console.log('спира пред зида на z =', wallZ.toFixed(2));
await shot('t1-walk');
await page.click('.mode-toggle button[data-m="top"]'); await wait(2500);

// Стъпка 2: една грешка в предсказанието, после трите причини.
await page.click('.xp-controls .btn.primary'); await wait(2500);
await page.click('.xp-controls button[data-a="walls"]');
console.log('грешка 2:', await page.textContent('.xp-msg'));
await page.click('.xp-controls button[data-a="ok"]');
await shot('t2-empty');
for (let i = 0; i < 3; i++) { await page.click(`.xp-controls .cause[data-i="${i}"]`); await wait(900); }
await wait(2500);
await shot('t2');
await page.click('.xp-controls .next'); await wait(3500);

// Стъпка 3: първата находка — веднъж грешно, после всички вярно.
await clickPlace('market');
console.log('грешка 3:', await page.textContent('.xp-msg'));
for (let k = 0; k < 5; k++) {
  const target = await page.getAttribute('.xp-task [data-find]', 'data-find');
  await clickPlace(target);
  console.log(target, '→', await page.textContent('.xp-score'));
  if (k === 2) await shot('t3');
  await wait(2600);
}
await page.click('.xp-controls .btn.primary'); await wait(3000);

// Стъпка 4.
await shot('t4a');
await page.click('.xp-controls button[data-i="0"]'); await wait(7000);
await shot('t4');
await page.click('.xp-controls .btn.primary'); await wait(300);
const result = await page.evaluate(() => window.__result);
const want = (2 / 3 + 4 / 5 + 1) / 3;
console.log('резултат:', result, 'очакван:', want);
// „Започни отначало“ връща първата стъпка, менюто и целия долен град.
await page.click('.again'); await wait(2500);
const again = await demo('(d) => [document.querySelectorAll(".corner-menu").length, document.querySelector(".xp-title").textContent, d.world.growth.every((g) => g.visible), d.walk.active]');
console.log('отначало:', again);
console.log('грешки в конзолата:', errors.length ? errors : 'няма');
await browser.close();
const ok = Math.abs(result - want) < 1e-6 && !errors.length && b[0] && moved > 2 && Math.abs(wallZ - 2) < 1.6 && again[0] === 1 && again[1].startsWith('1.') && again[2] && !again[3];
process.exit(ok ? 0 : 1);
