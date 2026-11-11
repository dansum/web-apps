// Изиграва 6.3.7 „Полова система и съзряване“ (js/exp/reproduction.js) докрай с една умишлена грешка.
// Очакван резултат: (0.75 + 1 + 1) / 3 — грешката е в кликването на органа в стъпка 2 (семенник вместо яйчник).
// Употреба: NODE_PATH=$(npm root -g) node tools/test-reproduction.mjs http://localhost:8765/chp/ <папка> [ширина]
import { open } from './xp-lib.mjs';
import { sortAll, orderAll } from './xp5.mjs';
const [, , base, shots = '.', width = '1280'] = process.argv;
const t = await open(base, '6.3.7', shots, width);
const { page, wait } = t;
const ans = () => page.evaluate(() => document.querySelector('.ex-area').__xp.answer);
await t.shot('0');
await t.menuAll();
await t.shot('1');
await t.next();
// 2. Оплождане и развитие: една умишлена грешка — семенник вместо яйчник
await wait(600); await t.shot('2a');
await t.click('testis'); console.log('грешка:', await t.msg());
await t.click('ovary'); await wait(600); await t.shot('2b');
await t.choose(0); await wait(1300);
await t.btn('.go'); await wait(7000); await t.shot('2c');
await t.slider('.ms', 2); await wait(500); await t.shot('2d');
await t.slider('.ms', await ans()); await t.btn('.chk');
await t.slider('.ms', await ans()); await wait(500); await t.btn('.chk'); await wait(500); await t.shot('2e');
await orderAll(t, 5); await t.next();
// 3. Съзряване
await orderAll(t, 5);
for (const a of [12, 14, 16]) { await t.slider('.as', a); await wait(300); }
await t.shot('3a');
await t.btn('.nx2'); await t.choose(0); await sortAll(t); await wait(500); await t.shot('3b'); await t.next();
// 4. Грижа за себе си
await wait(500); await t.shot('4a'); await sortAll(t); await wait(1000); await t.choose(0); await t.choose(0); await wait(600); await t.shot('4b'); await t.next();
await t.shot('5');
await t.done((0.75 + 1 + 1) / 3);
