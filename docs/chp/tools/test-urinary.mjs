// Изиграва 5.3.7 „Отделителна система на човека“ (js/exp/urinary.js) докрай с една умишлена грешка.
// Очакван резултат: (0.75 + 1 + 1) / 3 — грешката е в (отворената) прогноза на стъпка 2.
// Употреба: NODE_PATH=$(npm root -g) node tools/test-urinary.mjs http://localhost:8765/chp/ <папка> [ширина]
import { open } from './xp-lib.mjs';
import { sortAll, orderAll } from './xp5.mjs';
const [, , base, shots = '.', width = '1280'] = process.argv;
const t = await open(base, '5.3.7', shots, width);
const { page, wait } = t;
await t.menuAll();
await t.shot('1');
await t.next();
// 2. Водата: отворена прогноза — умишлено грешна (= 1 грешка); сцената пак показва тъмната урина
await wait(500); await t.shot('2a');
await t.choose(1); console.log('прогноза:', await t.msg()); await wait(2600); await t.shot('2c');
console.log('сравнение:', (await page.textContent('.xp-controls .cmp.miss')).replace(/\s+/g, ' ').trim());
await t.next();
await t.slider('.cs', await page.evaluate(() => document.querySelector('.ex-area').__xp.answer)); await t.btn('.chk'); await wait(800); await t.shot('2b'); await t.next();
// 3. Пътят на урината
await wait(500); await orderAll(t, 4); await t.shot('3'); await sortAll(t); await t.choose(0); await t.next();
// 4. Навици
await wait(500); await t.shot('4'); await sortAll(t); await t.choose(0); await t.next();
await t.shot('5');
await t.done((0.75 + 1 + 1) / 3);
