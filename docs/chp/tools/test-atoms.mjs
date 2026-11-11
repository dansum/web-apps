// Изиграва 6.2.1 „Атоми, молекули, йони; химичен елемент“ (js/exp/atoms.js) с една умишлена грешка.
// Очакван резултат: (0.75 + 1 + 1) / 3 — грешката е в предсказанието на стъпка 2.
// Употреба: NODE_PATH=$(npm root -g) node tools/test-atoms.mjs http://localhost:8765/chp/ <папка> [ширина]
import { open } from './xp-lib.mjs';
const [, , base, shots = '.', width = '1280'] = process.argv;
const t = await open(base, '6.2.1', shots, width);
const { page, wait } = t;
const sortAll = async () => { while (await page.locator('.xp-controls .bin').count()) { const a = await page.evaluate(() => document.querySelector('.ex-area').__xp.answer); await t.btn(`.bin[data-b="${a}"]`); } };
const press = async (sel, n) => { for (let i = 0; i < n; i++) await t.btn(sel); };
await t.menuAll();
await t.shot('1');
await t.next();
await t.choose(1); console.log('грешка:', await t.msg());
await t.choose(0);
await press('.padd', 1); await wait(800);
await t.shot('2a');
await press('.padd', 1); await press('.eadd', 2); await t.btn('.chk');
await press('.padd', 3); await press('.eadd', 2); await t.btn('.chk');
await t.shot('2b');
await t.next();
await sortAll();
await t.shot('3');
await t.next();
await t.choose(0);
await t.click('p-O'); await t.click('p-O2m');
await t.shot('4');
await t.next();
await t.shot('5');
await t.done((0.75 + 1 + 1) / 3);
