// Изиграва 5.2.4 „Опазване чистотата на въздуха“ (js/exp/airclean.js) докрай с една умишлена грешка.
// Очакван резултат: (0.75 + 1 + 1) / 3 — грешката е в предсказанието на стъпка 2.
// Употреба: NODE_PATH=$(npm root -g) node tools/test-airclean.mjs http://localhost:8765/chp/ <папка> [ширина]
import { open } from './xp-lib.mjs';
import { sortAll } from './xp5.mjs';
const [, , base, shots = '.', width = '1280'] = process.argv;
const t = await open(base, '5.2.4', shots, width);
const { page, wait } = t;
await t.menuAll();
await t.shot('1');
await t.next();
// 2. Картончета: една умишлена грешка в предсказанието
await t.choose(1); console.log('грешка:', await t.msg());
await t.choose(0);
for (const id of ['card-road', 'card-park', 'card-yard']) await t.click(id);
await t.btn('.wait'); await wait(5500); await t.shot('2');
await t.choose(0); await t.next();
// 3. Източници и замърсители
await wait(800); await t.shot('3');
await sortAll(t); await wait(300); await sortAll(t); await t.next();
// 4. Мерки
for (const i of [0, 1, 2]) { await page.click(`.xp-controls .ms[data-i="${i}"]`); await wait(500); }
await wait(1500); await t.shot('4a'); await t.next();
await t.choose(0); await t.next();
await t.shot('5');
await t.done((0.75 + 1 + 1) / 3);
