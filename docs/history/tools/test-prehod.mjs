// Изиграва „Преход, НАТО и ЕС“ докрай с една умишлена грешка (членството в ЕС преди първата стъпка
// на картата). Очакван резултат: (1 + 0.75 + 1) / 3.
// Употреба: NODE_PATH=$(npm root -g) node tools/test-prehod.mjs http://localhost:8765/history/ <папка> [ширина]
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
const [, , base, shots = '.', width = '1280'] = process.argv;
const W = +width, H = W < 600 ? 844 : 900, tag = `${W}`;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: W, height: H } });
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', (e) => errors.push(e.message));
await page.goto(`${base}xp.html?exp=prehod&skill=10.3.9`);
await page.waitForSelector('.corner-menu .cm-head', { timeout: 30000 });
const wait = (ms) => page.waitForTimeout(ms);
const demo = (f) => page.evaluate(f);
const at = (id) => page.evaluate((i) => document.querySelector('#area').__demo.at(i), id);
async function click(id) { const p = await at(id); if (!p) throw new Error('няма ' + id); await page.mouse.click(p.x, p.y); await wait(300); }
const msg = () => page.textContent('.xp-msg');
await page.locator('.xp').scrollIntoViewIfNeeded();
await wait(1000);

// 1. Опознай
await page.screenshot({ path: `${shots}/s1-sofia-${tag}.png` });
const n1 = await page.locator('.cm-item').count();
for (let i = 0; i < n1; i++) {
  if (await page.locator('.cm-list[hidden]').count()) await page.locator('.cm-head').click();
  await page.locator('.cm-item').nth(i).click();
  await wait(1100);
  if ([0, 1, 3].includes(i)) await page.screenshot({ path: `${shots}/s1-${i}-${tag}.png` });
}
await click('org-ks');
await wait(500);
await page.screenshot({ path: `${shots}/s1-org-${tag}.png` });
await page.click('.xp-controls .btn.primary');
await wait(1600);

// 2. Опит: трите промени, после класифициране без грешка
await page.screenshot({ path: `${shots}/s2-town-${tag}.png` });
for (const id of ['prices', 'firms', 'priv']) {
  await page.click(`.reform[data-r="${id}"]`);
  await wait(1500);
  if (id !== 'firms') await page.screenshot({ path: `${shots}/s2-${id}-${tag}.png` });
}
await page.click('.xp-controls .go .next');
await wait(800);
const cls = await demo(() => document.querySelector('#area').__demo.CLASSIFY.map((c) => c.good));
for (const g of cls) { await page.click(`.cls[data-g="${g ? 1 : 0}"]`); await wait(250); }
console.log('опит:', await page.textContent('.xp-score'));
await page.click('.xp-controls .next');
await wait(1600);

// 3а. Устройството
await page.screenshot({ path: `${shots}/s3-diagram-${tag}.png` });
const orgs = await demo(() => document.querySelector('#area').__demo.ORG_Q.map((q) => q.id));
for (const id of orgs) { await click(`org-${id}`); const m = await msg(); if (!m.startsWith('Вярно')) console.log('  ', id, '→', m); }
console.log('устройство:', await page.textContent('.xp-score'));
await page.click('.xp-controls .next');
await wait(1600);
// 3б. Картата: една умишлена грешка — ЕС първо
await page.screenshot({ path: `${shots}/s3-map-${tag}.png` });
await page.click('.ev[data-e="e6"]');
console.log('грешка:', await msg());
const ev = await demo(() => document.querySelector('#area').__demo.STEPS_BG.map((e) => e.id));
for (const id of ev) { await page.click(`.ev[data-e="${id}"]`); await wait(350); if (id === 'e4') await page.screenshot({ path: `${shots}/s3-nato-${tag}.png` }); }
console.log('карта:', await page.textContent('.xp-score'));
await page.click('.lay[data-l="nato"]');
await page.evaluate(() => { const r = document.querySelector('.yr-range'); r.value = 6; r.dispatchEvent(new Event('input')); });
await wait(500);
await page.screenshot({ path: `${shots}/s3c-slider-${tag}.png` });
await page.click('.xp-controls .next');
await wait(1800);

// 4. Предскажи
await page.screenshot({ path: `${shots}/s4-predict-${tag}.png` });
await page.click('.xp-controls .opts button[data-i="0"]');
await wait(2000); await page.screenshot({ path: `${shots}/s4-reveal0-${tag}.png` });
await wait(4400); await page.screenshot({ path: `${shots}/s4-reveal1-${tag}.png` });
await wait(6400); await page.screenshot({ path: `${shots}/s4-reveal3-${tag}.png` });
await page.click('.xp-controls .next');
await wait(300);
const result = await page.evaluate(() => window.__result);
const want = (1 + 0.75 + 1) / 3;
console.log('резултат:', result, 'очакван:', want);
await page.click('.xp-controls .again'); await wait(1200);
const again = await page.textContent('.xp-title');
const menuOk = await page.locator('.corner-menu:not([hidden]) .cm-head').count();
await page.screenshot({ path: `${shots}/s6-again-${tag}.png` });
console.log('отначало:', again, '| меню:', menuOk);
console.log('грешки в конзолата:', errors.length ? errors : 'няма');
await browser.close();
process.exit(Math.abs(result - want) < 1e-6 && again.startsWith('1.') && menuOk === 1 && !errors.length ? 0 : 1);
