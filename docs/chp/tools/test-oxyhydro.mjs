// Изиграва 6.2.4 „Кислород и водород“ (js/exp/oxyhydro.js) с една умишлена грешка.
// Очакван резултат: (0.75 + 1 + 1) / 3 — грешката е в предсказанието на стъпка 2.
// Употреба: NODE_PATH=$(npm root -g) node tools/test-oxyhydro.mjs http://localhost:8765/chp/ <папка> [ширина]
import { open } from './xp-lib.mjs';
const [, , base, shots = '.', width = '1280'] = process.argv;
const t = await open(base, '6.2.4', shots, width);
const { page, wait } = t;
const sortAll = async () => { while (await page.locator('.xp-controls .bin').count()) { const a = await page.evaluate(() => document.querySelector('.ex-area').__xp.answer); await t.btn(`.bin[data-b="${a}"]`); } };
await t.menuAll();
await t.shot('1');
await t.next();
await t.choose(1); console.log('грешка:', await t.msg());
await t.choose(0);
await t.btn('.on'); await wait(5000);
await t.btn('.sO'); await wait(1000);
await t.shot('2a');
await t.btn('.sH'); await wait(3800);
await t.shot('2b');
await t.choose(0);
await t.next();
await t.choose(0);
await t.next(); await wait(2600);
await t.shot('3');
await sortAll();
await t.next();
await wait(2000);
await t.shot('4');
await sortAll();
await t.choose(0);
await t.next();
await t.shot('5');
await t.done((0.75 + 1 + 1) / 3);
