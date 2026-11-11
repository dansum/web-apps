// Изиграва 6.3.3 „Размножаване“ (js/exp/offspring.js) докрай с една умишлена грешка.
// Очакван резултат: (0.75 + 1 + 1) / 3 — грешката е в предсказанието на стъпка 2.
// Употреба: NODE_PATH=$(npm root -g) node tools/test-offspring.mjs http://localhost:8765/chp/ <папка> [ширина]
import { open } from './xp-lib.mjs';
import { sortAll, orderAll } from './xp5.mjs';
const [, , base, shots = '.', width = '1280'] = process.argv;
const t = await open(base, '6.3.3', shots, width);
const { page, wait } = t;
await t.menuAll();
await t.shot('1');
await t.next();
// 2. Опрашване и оплождане: една умишлена грешка в предсказанието
await t.choose(1); console.log('грешка:', await t.msg());
await t.choose(0); await wait(800);
await t.click('potB'); await t.btn('.run'); await wait(7500); await t.shot('2a');
await t.next(); await wait(300);
await t.click('stigma'); await wait(4500); await t.shot('2b');
await t.btn('.fr'); await wait(2800); await t.shot('2c');
await t.choose(0); await t.next();
// 3. Безполово и полово
await wait(500); await sortAll(t); await orderAll(t, 5); await wait(900); await t.shot('3'); await t.choose(0); await t.next();
// 4. Сравни и предскажи
await wait(500); await t.shot('4'); await sortAll(t); await t.choose(0); await t.choose(0); await t.next();
await t.shot('5');
await t.done((0.75 + 1 + 1) / 3);
