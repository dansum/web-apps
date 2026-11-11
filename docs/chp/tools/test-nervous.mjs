// Изиграва 6.3.6 „Нервна и опорно-двигателна система на човека“ (js/exp/nervous.js) докрай с една умишлена грешка.
// Очакван резултат: (0.75 + 1 + 1) / 3 — грешката е в предсказанието на стъпка 2.
// Употреба: NODE_PATH=$(npm root -g) node tools/test-nervous.mjs http://localhost:8765/chp/ <папка> [ширина]
import { open } from './xp-lib.mjs';
import { sortAll } from './xp5.mjs';
const [, , base, shots = '.', width = '1280'] = process.argv;
const t = await open(base, '6.3.6', shots, width);
const { page, wait } = t;
await t.menuAll();
await t.shot('1');
await t.next();
// 2. Коленният рефлекс: една умишлена грешка в предсказанието
await t.choose(1); console.log('грешка:', await t.msg());
await t.choose(0); await wait(900);
await t.click('tendon'); await wait(2600); await t.shot('2a');
await t.btn('.cut'); await t.click('tendon'); await wait(2200); await t.shot('2b');
await t.choose(0); await t.next();
// 3. Функции и първа помощ
await wait(500); await t.shot('3a'); await sortAll(t); await wait(800); await t.shot('3b'); await sortAll(t); await t.next();
// 4. Пази нервната система
await wait(500); await t.shot('4'); await sortAll(t); await t.choose(0); await t.choose(0); await t.next();
await t.shot('5');
await t.done((0.75 + 1 + 1) / 3);
