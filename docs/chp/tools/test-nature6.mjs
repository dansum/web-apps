// Изиграва 6.3.8 „Единство на природата; човекът – част от природата“ (js/exp/nature6.js) докрай с една умишлена грешка.
// Очакван резултат: (1 + 0.75 + 1) / 3 — грешката е в предсказанието на стъпка 3.
// Употреба: NODE_PATH=$(npm root -g) node tools/test-nature6.mjs http://localhost:8765/chp/ <папка> [ширина]
import { open } from './xp-lib.mjs';
import { sortAll } from './xp5.mjs';
const [, , base, shots = '.', width = '1280'] = process.argv;
const t = await open(base, '6.3.8', shots, width);
const { page, wait } = t;
await t.menuAll();
await t.shot('1');
await t.next();
// 2. Всичко се движи
await wait(500); await sortAll(t); await t.choose(0); await t.choose(0); await t.shot('2'); await t.next();
// 3. Нивата и езерото: една умишлена грешка в предсказанието
await t.choose(1); console.log('грешка:', await t.msg());
await t.choose(0);
await t.slider('.fs', 3); await t.btn('.run'); await wait(4800); await t.shot('3a');
await t.slider('.fs', 2); await page.check('.stc'); await t.btn('.run'); await wait(4800); await t.shot('3b');
await t.choose(0); await t.next();
// 4. Ние и природата
await wait(600); for (const id of ['trash0', 'trash1', 'trash2']) await t.click(id);
await wait(1800); await t.shot('4a'); await sortAll(t); await t.choose(0); await t.shot('4b'); await t.next();
await t.shot('5');
await t.done((1 + 0.75 + 1) / 3);
