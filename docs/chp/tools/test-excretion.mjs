// Изиграва 5.3.4 „Отделяне“ (js/exp/excretion.js) докрай с една умишлена грешка.
// Очакван резултат: (0.75 + 1 + 1) / 3 — грешката е в предсказанието на стъпка 2.
// Употреба: NODE_PATH=$(npm root -g) node tools/test-excretion.mjs http://localhost:8765/chp/ <папка> [ширина]
import { open } from './xp-lib.mjs';
import { sortAll, orderAll } from './xp5.mjs';
const [, , base, shots = '.', width = '1280'] = process.argv;
const t = await open(base, '5.3.4', shots, width);
const { page, wait } = t;
await t.menuAll();
await t.shot('1');
await t.next();
// 2. Растенията: една умишлена грешка в предсказанието
await t.choose(1); console.log('грешка:', await t.msg());
await t.choose(0);
await t.btn('.sun'); await wait(3400); await t.shot('2a');
await t.btn('.fall'); await wait(3000); await t.shot('2b');
await t.choose(0); await t.next();
// 3. Бозайникът
await wait(500); await t.shot('3'); await sortAll(t); await orderAll(t, 4); await t.next();
// 4. Ако отделянето спре
await t.choose(0); await t.btn('.stop'); await wait(3800); await t.shot('4');
await t.btn('.back'); await t.choose(0); await t.next();
await t.shot('5');
await t.done((0.75 + 1 + 1) / 3);
