// Изиграва 5.3.3 „Дишане“ (js/exp/respiration.js) докрай с една умишлена грешка.
// Очакван резултат: (0.75 + 1 + 1) / 3 — грешката е в предсказанието на стъпка 2.
// Употреба: NODE_PATH=$(npm root -g) node tools/test-respiration.mjs http://localhost:8765/chp/ <папка> [ширина]
import { open } from './xp-lib.mjs';
import { sortAll, orderAll } from './xp5.mjs';
const [, , base, shots = '.', width = '1280'] = process.argv;
const t = await open(base, '5.3.3', shots, width);
const { page, wait } = t;
await t.menuAll();
await t.shot('1');
await t.next();
// 2. Семената: една умишлена грешка в предсказанието
await t.choose(1); console.log('грешка:', await t.msg());
await t.choose(0);
await t.btn('.day'); await wait(2800); await t.btn('.spl'); await wait(2400); await t.shot('2');
await t.choose(0); await t.next();
// 3. Органи
await wait(500); await t.shot('3'); await sortAll(t); await t.next();
// 4. Пътят на кислорода
await wait(800); await orderAll(t, 5); await wait(500); await t.shot('4');
await t.choose(0); await t.choose(0); await t.next();
await t.shot('5');
await t.done((0.75 + 1 + 1) / 3);
