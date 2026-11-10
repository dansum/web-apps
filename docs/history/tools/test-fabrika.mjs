// Изиграва 8.2.5 „Първата индустриална революция“ (fabrika) докрай с една умишлена грешка
// (в линията на времето). Очакван резултат: (1 + 0.8 + 1) / 3.
// Употреба: NODE_PATH=$(npm root -g) node tools/test-fabrika.mjs http://localhost:8765/history/ <папка> [ширина] [all]
// С „all“ снима и всяка спирка от разходката (по-бавно).
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
const [, , base, shots = '.', width = '1280', all = ''] = process.argv;
const T0 = Date.now(); const lap = (s) => console.log(`[${((Date.now() - T0) / 1000).toFixed(1)} s] ${s}`);
const W = +width, H = W < 600 ? 844 : 900;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: W, height: H } });
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', (e) => errors.push(e.message));
await page.goto(base + 'xp.html?exp=fabrika');
await page.waitForSelector('.walk-nav .wn-next', { timeout: 15000 });
const wait = (ms) => page.waitForTimeout(ms);
const task = () => page.textContent('.xp-task');
async function until(fn, ms = 20000) { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await fn()) return true; await wait(200); } throw new Error('изтече времето'); }
const pos = (id, key = 'pickId') => page.evaluate(([i, k]) => document.querySelector('#area').__demo.stage.screenOf(i, k), [id, key]);
// Екранна точка на гнездо от линията на времето (самото кръгче, не надписа).
const slotPos = (id) => page.evaluate((i) => {
  const d = document.querySelector('#area').__demo, st = d.stage;
  const v = d.timeline.slots.get(i).getWorldPosition(st.camera.position.clone());
  v.y += 0.1; v.project(st.camera);
  const r = st.renderer.domElement.getBoundingClientRect();
  return { x: r.left + (v.x * 0.5 + 0.5) * r.width, y: r.top + (-v.y * 0.5 + 0.5) * r.height };
}, id);
async function drag(a, b) { await page.mouse.move(a.x, a.y); await page.mouse.down(); for (let k = 1; k <= 5; k++) await page.mouse.move(a.x + (b.x - a.x) * k / 5, a.y + (b.y - a.y) * k / 5); await page.mouse.up(); await wait(300); }
const slider = (cls, v) => page.evaluate(([c, val]) => { const r = document.querySelector('.xp-controls .' + c); r.value = val; r.dispatchEvent(new Event('input')); }, [cls, v]);
await page.locator('.xp').scrollIntoViewIfNeeded();

// 1. Разходка
await wait(2200);
const names = ['mill', 'engine', 'machines', 'workers', 'mine', 'canal', 'railway', 'houses'];
const shot = (n) => page.screenshot({ path: `${shots}/f-${n}-${W}.png` });
if (all) await shot(names[0]);
for (let i = 1; i < names.length; i++) { await page.click('.walk-nav .wn-next'); await wait(1800); if (all || i === 1) await shot(names[i]); }
lap('разходка');
console.log('спирки:', await page.textContent('.xp-score'));
await page.click('.xp-controls .btn.primary'); await wait(1300);

// 2. Парната машина: предсказване, после опит с плъзгачите.
await page.screenshot({ path: `${shots}/f-engine-predict-${W}.png` });
await page.click('.xp-controls button[data-i="0"]'); await wait(400);
await slider('fire', 2); await slider('valve', 60);
await wait(2500);
await page.screenshot({ path: `${shots}/f-engine-run-${W}.png` });
await until(async () => (await task()).includes('затвори клапана'));
await slider('valve', 0); await slider('fire', 3);
await until(async () => (await task()).includes('предпазният клапан'));
await page.screenshot({ path: `${shots}/f-engine-safety-${W}.png` });
await page.click('.xp-controls button[data-i="0"]'); await wait(1300);
await page.screenshot({ path: `${shots}/f-water-${W}.png` });
await page.click('.xp-controls button[data-i="0"]'); await wait(700);
console.log('пара:', await page.textContent('.xp-msg'));
await page.click('.xp-controls .btn.primary'); await wait(1400);

lap('пара');
// 3. Линия на времето: една умишлена грешка („Джени“ → 1829 г.).
await page.screenshot({ path: `${shots}/f-timeline-${W}.png` });
await drag(await pos('c-jenny', 'dragId'), await slotPos('rocket'));
console.log('грешка:', await page.textContent('.xp-msg'));
for (const [c, s] of [['c-jenny', 'jenny'], ['c-watt', 'watt'], ['c-loom', 'loom'], ['c-rocket', 'rocket']]) {
  await drag(await pos(c, 'dragId'), await slotPos(s));
  console.log(c, '→', await page.textContent('.xp-score'));
}
await page.screenshot({ path: `${shots}/f-timeline-done-${W}.png` });
await page.click('.xp-controls .btn.primary'); await wait(1400);

lap('линия');
// 4. Предскажи: три въпроса, всеки с истинския изход.
for (const n of ['city', 'law', 'union']) {
  await page.click('.xp-controls button[data-i="0"]'); await wait(2000);
  await page.screenshot({ path: `${shots}/f-predict-${n}-${W}.png` });
  await page.click('.xp-controls .btn.primary'); await wait(1200);
}
const result = await page.evaluate(() => window.__result);
const want = (1 + 0.8 + 1) / 3;
console.log('резултат:', result, 'очакван:', want);
// „Започни отначало“ връща в началото без презареждане.
await page.click('.xp-controls .again'); await wait(1500);
const back = await page.textContent('.xp-title');
console.log('отначало:', back);
console.log('грешки в конзолата:', errors.length ? errors : 'няма');
await browser.close();
process.exit(Math.abs(result - want) < 1e-6 && !errors.length && back.startsWith('1.') ? 0 : 1);
