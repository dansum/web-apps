// Изиграва 5.2.6 „Опазване чистотата на водата“ (js/exp/water.js) докрай с две умишлени грешки.
// Очакван резултат: (0.5 + 1 + 1) / 3 — грешките са в предсказанието на стъпка 2 и в реда на слоевете във филтъра.
// Употреба: NODE_PATH=$(npm root -g) node tools/test-water.mjs http://localhost:8765/chp/ <папка> [ширина]
import { open } from './xp-lib.mjs';
import { sortAll, orderAll } from './xp5.mjs';
const [, , base, shots = '.', width = '1280'] = process.argv;
const t = await open(base, '5.2.6', shots, width);
const { page, wait } = t;
await t.menuAll();
await t.shot('1');
await t.next();
// 2. Филтър: една умишлена грешка в предсказанието
await t.choose(1); console.log('грешка:', await t.msg());
await t.choose(0);
// Грешен ред: памукът най-отгоре → мътна вода, подреждаме отново.
for (const i of [4, 0, 1, 2, 3]) { await page.click(`.xp-controls .ord[data-i="${i}"]`); await wait(250); }
await t.btn('.pour'); await wait(5000); await t.shot('2w');
console.log('грешен ред:', await t.msg());
await t.btn('.again-build');
await orderAll(t, 5);
await t.btn('.pour'); await wait(2500); await t.shot('2a'); await wait(2500); await t.shot('2b'); await t.next();
// 3. Станцията и замърсителите
await wait(500); await orderAll(t, 3); await t.shot('3a');
for (let i = 3; i < 5; i++) { await page.click(`.xp-controls .ord[data-i="${i}"]`); await wait(250); }
await wait(800); await t.shot('3b');
await sortAll(t); await t.next();
// 4. Езерото
await t.choose(0); await t.btn('.rain'); await wait(5000); await t.shot('4a');
await t.btn('.fix'); await wait(2800); await t.shot('4b');
await sortAll(t); await t.next();
await t.shot('5');
await t.done((0.5 + 1 + 1) / 3);
