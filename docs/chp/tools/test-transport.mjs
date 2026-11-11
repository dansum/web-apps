// Изиграва 6.3.1 „Движение на вещества в организмите“ (js/exp/transport.js) докрай с една умишлена грешка.
// Очакван резултат: (0.75 + 1 + 1) / 3 — грешката е в предсказанието на стъпка 2.
// Употреба: NODE_PATH=$(npm root -g) node tools/test-transport.mjs http://localhost:8765/chp/ <папка> [ширина]
import { open } from './xp-lib.mjs';
import { sortAll, orderAll } from './xp5.mjs';
const [, , base, shots = '.', width = '1280'] = process.argv;
const t = await open(base, '6.3.1', shots, width);
const { page, wait } = t;
await t.menuAll();
await t.shot('1');
await t.next();
// 2. Опитът: една умишлена грешка в предсказанието
await t.choose(1); console.log('грешка:', await t.msg());
await t.choose(0);
await t.slider('.hs', 6); await wait(1200); await t.shot('2a');
await t.next();
await page.check('.lampc'); await page.check('.fanc');
await t.btn('.run'); await wait(3200); await t.shot('2b');
await t.choose(0); await t.next();
// 3. Пътят в растението
await wait(500); await orderAll(t, 5); await t.shot('3'); await sortAll(t); await t.choose(0); await t.next();
// 4. Кръвта свързва всичко
await wait(500); await t.shot('4a'); await sortAll(t); await t.choose(0); await wait(800); await t.shot('4b'); await t.choose(0); await t.next();
await t.shot('5');
await t.done((0.75 + 1 + 1) / 3);
