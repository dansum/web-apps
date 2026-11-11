// Изиграва 6.3.4 „Растеж и развитие“ (js/exp/growth.js) докрай с една умишлена грешка.
// Очакван резултат: (0.75 + 1 + 1) / 3 — грешката е в предсказанието на стъпка 2.
// Употреба: NODE_PATH=$(npm root -g) node tools/test-growth.mjs http://localhost:8765/chp/ <папка> [ширина]
import { open } from './xp-lib.mjs';
import { sortAll, orderAll } from './xp5.mjs';
const [, , base, shots = '.', width = '1280'] = process.argv;
const t = await open(base, '6.3.4', shots, width);
const { page, wait } = t;
const ans = () => page.evaluate(() => document.querySelector('.ex-area').__xp.answer);
await t.menuAll();
await t.shot('1');
await t.next();
// 2. Развитието на жабата: една умишлена грешка в предсказанието
await t.choose(1); console.log('грешка:', await t.msg());
await t.choose(0);
await t.slider('.ws', 3); await wait(600); await t.shot('2a');
await t.slider('.ws', await ans()); await wait(500); await t.shot('2b'); await t.btn('.chk');
await t.slider('.ws', await ans()); await wait(500); await t.btn('.chk'); await wait(600); await t.shot('2c');
await t.next();
// 3. Растеж или развитие
await wait(500); await sortAll(t); await sortAll(t); await t.shot('3a'); await orderAll(t, 5); await t.shot('3b'); await t.next();
// 4. Общо и различно
await wait(500); await t.shot('4a'); await sortAll(t); await t.choose(0); await wait(900); await t.shot('4b'); await t.next();
await t.shot('5');
await t.done((0.75 + 1 + 1) / 3);
