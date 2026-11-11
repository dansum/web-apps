// Изиграва 5.3.8 „Единство на природата“ (js/exp/unity.js) докрай с една умишлена грешка.
// Очакван резултат: (0.75 + 1 + 1) / 3 — грешката е в предсказанието на стъпка 2.
// Употреба: NODE_PATH=$(npm root -g) node tools/test-unity.mjs http://localhost:8765/chp/ <папка> [ширина]
import { open } from './xp-lib.mjs';
import { sortAll } from './xp5.mjs';
const [, , base, shots = '.', width = '1280'] = process.argv;
const t = await open(base, '5.3.8', shots, width);
const { page, wait } = t;
await t.menuAll();
await t.shot('1');
await t.next();
// 2. Капката: една умишлена грешка в предсказанието
await t.choose(1); console.log('грешка:', await t.msg());
await t.choose(0);
for (const id of ['river', 'cloud', 'tree', 'human']) { await t.click(id); await wait(900); console.log(id, '→', await t.msg()); }
await t.shot('2a'); await wait(1200);
await sortAll(t); await t.shot('2b'); await t.next();
// 3. Гората и реката
await t.choose(0); await t.btn('.cut'); await t.btn('.rain'); await wait(4800); await t.shot('3a');
await t.btn('.plant'); await wait(2200); await t.shot('3b'); await t.choose(0); await t.next();
// 4. Пази природата
await wait(800); await t.shot('4'); await sortAll(t); await t.choose(0); await t.next();
await t.shot('5');
await t.done((0.75 + 1 + 1) / 3);
