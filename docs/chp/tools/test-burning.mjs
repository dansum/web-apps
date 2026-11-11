// Изиграва 6.2.6 „Горене и горива“ (js/exp/burning.js) с една умишлена грешка.
// Очакван резултат: (0.75 + 1 + 1) / 3 — грешката е в предсказанието на стъпка 2.
// Употреба: NODE_PATH=$(npm root -g) node tools/test-burning.mjs http://localhost:8765/chp/ <папка> [ширина]
import { open } from './xp-lib.mjs';
const [, , base, shots = '.', width = '1280'] = process.argv;
const t = await open(base, '6.2.6', shots, width);
const { page, wait } = t;
const sortAll = async () => { while (await page.locator('.xp-controls .bin').count()) { const a = await page.evaluate(() => document.querySelector('.ex-area').__xp.answer); await t.btn(`.bin[data-b="${a}"]`); } };
await t.menuAll();
await t.shot('1');
await t.next();
await t.choose(1); console.log('грешка:', await t.msg());
await t.choose(0);
await t.shot('2a');
await t.slider('.air', 100); await wait(1800);
await t.shot('2b');
await t.choose(0);
await t.next();
for (const r of [1, 2, 0]) { await t.btn('.act'); await wait(2200); if (r === 1) await t.shot('3'); await t.choose(r); await t.next(); }
await t.next();
for (const id of ['f-coal', 'f-oil', 'f-gas', 'f-h2']) await t.click(id);
await wait(1800);
await t.shot('4');
await sortAll();
await t.next();
await t.shot('5');
await t.done((0.75 + 1 + 1) / 3);
