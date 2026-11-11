// Изиграва 6.2.5 „Желязото и корозията“ (js/exp/iron.js) с една умишлена грешка.
// Очакван резултат: (0.75 + 1 + 1) / 3 — грешката е в предсказанието на стъпка 2.
// Употреба: NODE_PATH=$(npm root -g) node tools/test-iron.mjs http://localhost:8765/chp/ <папка> [ширина]
import { open } from './xp-lib.mjs';
const [, , base, shots = '.', width = '1280'] = process.argv;
const t = await open(base, '6.2.5', shots, width);
const { page, wait } = t;
const sortAll = async () => { while (await page.locator('.xp-controls .bin').count()) { const a = await page.evaluate(() => document.querySelector('.ex-area').__xp.answer); await t.btn(`.bin[data-b="${a}"]`); } };
await t.menuAll();
await t.shot('1');
await t.next();
await t.choose(1); console.log('грешка:', await t.msg());
await t.choose(0);
await t.slider('.days', 14); await wait(800);
await t.shot('2');
await t.choose(0);
await t.next();
for (const k of ['mag', 'bulb', 'heat', 'file', 'acid']) { await page.click(`.xp-task .chip[data-t="${k}"]`); await t.click('bar'); }
await wait(2500);
await t.shot('3');
await t.choose(0);
await t.next();
await sortAll();
await t.shot('4');
await t.next();
await t.shot('5');
await t.done((0.75 + 1 + 1) / 3);
