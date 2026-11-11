// Изиграва 5.2.5 „Водата и водните разтвори“ (js/exp/solutions.js) докрай с една умишлена грешка.
// Очакван резултат: (0.75 + 1 + 1) / 3 — грешката е в предсказанието на стъпка 2.
// Употреба: NODE_PATH=$(npm root -g) node tools/test-solutions.mjs http://localhost:8765/chp/ <папка> [ширина]
import { open } from './xp-lib.mjs';
import { sortAll } from './xp5.mjs';
const [, , base, shots = '.', width = '1280'] = process.argv;
const t = await open(base, '5.2.5', shots, width);
const { page, wait } = t;
await t.menuAll();
await t.shot('1');
await t.next();
// 2. Наситен разтвор: една умишлена грешка в предсказанието
await t.choose(1); console.log('грешка:', await t.msg());
await t.choose(0);
for (let k = 0; k < 4; k++) { await page.click('.xp-controls .sp'); await wait(400); }
await wait(800); await t.shot('2a');
for (let k = 0; k < 4; k++) { await page.click('.xp-controls .sp'); await wait(400); }
await page.waitForSelector('.xp-controls .choice', { timeout: 10000 }); await wait(1500); await t.shot('2b');
await t.choose(0); await t.next();
// 3. Разтворимост
for (const id of ['b-sugar', 'b-gyps', 'b-chalk', 'b-sand']) await t.click(id);
await wait(2000); await t.shot('3a');
await page.waitForSelector('.xp-controls .bin', { timeout: 10000 });
await sortAll(t); await wait(800); await t.shot('3b');
await t.choose(0); await t.next();
// 4. Свойствата на водата
await t.choose(0); await wait(2600); await t.shot('4a'); await t.next();
await wait(800); await t.shot('4b');
await t.choose(0); await t.next();
await t.choose(0); await t.next();
await t.shot('5');
await t.done((0.75 + 1 + 1) / 3);
