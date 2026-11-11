// Изиграва 3.2.2 „Растения, гъби и животни“ (js/exp/kingdoms.js) докрай с една умишлена грешка.
// Очакван резултат: (0.75 + 1 + 1) / 3 — грешката е в предсказанието на стъпка 2.
// Употреба: NODE_PATH=$(npm root -g) node tools/test-kingdoms.mjs http://localhost:8765/chp/ <папка> [ширина]
import { open } from './xp-lib.mjs';
const [, , base, shots = '.', width = '1280'] = process.argv;
const t = await open(base, '3.2.2', shots, width);
const { page, wait } = t;
// 1. Опознай
await t.menuAll();
await t.shot('1');
await t.next();
// 2. Храна на ливадата: една умишлена грешка, после вярно
await t.choose(1); console.log('грешка:', await t.msg());
await t.choose(0);
await t.drag('carrot', 'spot'); await wait(4800);
await t.shot('2a');
await t.next();
await t.slider('.days', 7); await wait(1200);
await t.shot('2b');
await t.choose(0);
await t.next();
// 3. Три групи
for (const [id, z] of [['i-oak', 'plant'], ['i-wheat', 'plant'], ['i-rose', 'plant'], ['i-boletus', 'fungi'], ['i-amanita', 'fungi'], ['i-mold', 'fungi'], ['i-bird', 'animal'], ['i-bfly', 'animal'], ['i-child', 'animal']]) await t.drag(id, 'zone-' + z);
console.log(await page.textContent('.xp-msg'));
await t.shot('3');
await t.next();
// 4. Тъмният шкаф и безопасност
await t.choose(0);
await t.slider('.days', 14); await wait(800);
await t.shot('4a');
await wait(1200);
await t.choose(0);
await t.shot('4b');
await t.next();
await t.shot('5');
await t.done((0.75 + 1 + 1) / 3);
