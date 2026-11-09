// Изиграва 5.2.6 „Севтополис“ докрай с една умишлена грешка. Очакван резултат: (0.8 + 1 + 1) / 3.
// Употреба: NODE_PATH=$(npm root -g) node tools/test-sevtopolis.mjs http://localhost:8765/history/ <папка> [ширина]
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
const [, , base, shots = '.', width = '1280'] = process.argv;
const W = +width, H = W < 600 ? 844 : 900;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: W, height: H } });
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', (e) => errors.push(e.message));
await page.goto(base + 'xp.html?exp=sevtopolis');
await page.waitForSelector('.walk-nav .wn-next', { timeout: 15000 });
const wait = (ms) => page.waitForTimeout(ms);
const pos = (id, key = 'pickId') => page.evaluate(([i, k]) => document.querySelector('#area').__demo.stage.screenOf(i, k), [id, key]);
async function click(id) { const p = await pos(id); if (!p) throw new Error('няма ' + id); await page.mouse.click(p.x, p.y); await wait(350); }
async function drag(a, b) { await page.mouse.move(a.x, a.y); await page.mouse.down(); for (let k = 1; k <= 12; k++) await page.mouse.move(a.x + (b.x - a.x) * k / 12, a.y + (b.y - a.y) * k / 12); await page.mouse.up(); await wait(300); }
await page.locator('.xp').scrollIntoViewIfNeeded();
await wait(2000);
const names = ['gate', 'street', 'house', 'crafts', 'animals', 'people', 'market', 'palace'];
await page.screenshot({ path: `${shots}/s-${names[0]}-${W}.png` });
for (let i = 1; i < 8; i++) { await page.click('.walk-nav .wn-next'); await wait(2000); await page.screenshot({ path: `${shots}/s-${names[i]}-${W}.png` }); }
console.log('спирки:', await page.textContent('.xp-score'));
await page.click('.xp-controls .btn.primary'); await wait(1400);
// 2. Стоки: една умишлена грешка (вино → Македония)
await click('g-wine'); await click('macedonia'); console.log('грешка:', await page.textContent('.xp-msg'));
for (const [g, p] of [['g-wine', 'thasos'], ['g-cup', 'apollonia'], ['g-mac', 'macedonia'], ['g-seuth', 'sevtopolis']]) { await click(g); await click(p); }
await page.screenshot({ path: `${shots}/s-trade-${W}.png` });
console.log('стоки:', await page.textContent('.xp-score'));
await page.click('.xp-controls .btn.primary'); await wait(1400);
await page.screenshot({ path: `${shots}/s-orders-${W}.png` });
for (const [o, t] of [['o-fibula', 'forge'], ['o-spear', 'forge'], ['o-jug', 'wheel'], ['o-ring', 'gold']]) { await drag(await pos(o, 'dragId'), await pos(t)); console.log(o, '→', await page.textContent('.xp-score')); }
await page.click('.xp-controls .btn.primary'); await wait(1400);
await page.click('.xp-controls button[data-i="0"]'); await wait(900);
await page.screenshot({ path: `${shots}/s-predict-${W}.png` });
await page.click('.xp-controls .btn.primary'); await wait(300);
const result = await page.evaluate(() => window.__result);
const want = (0.8 + 1 + 1) / 3;
console.log('резултат:', result, 'очакван:', want);
console.log('грешки в конзолата:', errors.length ? errors : 'няма');
await browser.close();
process.exit(Math.abs(result - want) < 1e-6 && !errors.length ? 0 : 1);
