// Изиграва 5.2.1 „Вещества и смеси“ (js/exp/substances.js) докрай с една умишлена грешка.
// Очакван резултат: (0.75 + 1 + 1) / 3 — грешката е в предсказанието на стъпка 2.
// Употреба: NODE_PATH=$(npm root -g) node tools/test-substances.mjs http://localhost:8765/chp/ <папка> [ширина]
import { open } from './xp-lib.mjs';
import { sortAll } from './xp5.mjs';
const [, , base, shots = '.', width = '1280'] = process.argv;
const t = await open(base, '5.2.1', shots, width);
const { page, wait } = t;
await t.menuAll();
await t.shot('1');
await t.next();
// 2. Модели: една умишлена грешка в предсказанието
await t.choose(1); console.log('грешка:', await t.msg());
await t.choose(0);
await t.btn('.addw'); await t.btn('.adds'); await wait(800); await t.shot('2a'); await t.next();
await wait(500); await t.shot('2b');
await sortAll(t); await t.next();
// 3. Еднородни и нееднородни, състояния
await wait(1000); await t.shot('3a');
await sortAll(t); await wait(300); await sortAll(t); await t.next();
// 4. Медта, бронзът, приложение
await t.btn('.tmag'); await t.btn('.tcur'); await t.btn('.tbend'); await wait(2200); await t.shot('4a');
await t.choose(0); await t.next();
await wait(800); await t.shot('4b');
await t.choose(0); await t.next();
await wait(500); await sortAll(t); await t.next();
await t.shot('5');
await t.done((0.75 + 1 + 1) / 3);
