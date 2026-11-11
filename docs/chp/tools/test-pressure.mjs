// Изиграва 6.1.4 „Налягане“ (js/exp/pressure.js) докрай с една умишлена грешка.
// Очакван резултат: (0.75 + 1 + 1) / 3 — грешката е в предсказанието на стъпка 2.
// Употреба: NODE_PATH=$(npm root -g) node tools/test-pressure.mjs http://localhost:8765/chp/ <папка> [ширина]
import { open } from './xp-lib.mjs';
const [, , base, shots = '.', width = '1280'] = process.argv;
const t = await open(base, '6.1.4', shots, width);
const { page, wait } = t;
await t.menuAll();
await t.shot('1');
await t.next();
// 2. Предсказание с една умишлена грешка, после трите пози
await t.choose(1); console.log('грешка:', await t.msg());
await t.choose(0);
for (const p of ['flat', 'side', 'up']) { await t.btn(`.pose[data-p="${p}"]`); await wait(900); }
await t.shot('2a');
await t.next();
await page.fill('.xp-task .ans', '2000'); await t.btn('.chk'); await wait(1200);
await t.shot('2b');
await t.next();
// 3. Подреждане
for (const id of ['knife', 'pin', 'needle']) await t.drag(id, 'zone-big');
for (const id of ['skis', 'track', 'bag']) await t.drag(id, 'zone-small');
console.log(await page.textContent('.xp-score'));
await t.shot('3');
await t.next();
// 4. Предскажи
await t.choose(0); await wait(1200); await t.shot('4a');
await t.next();
await t.choose(0); await wait(800); await t.shot('4b');
await t.next();
await t.shot('5');
await t.done((0.75 + 1 + 1) / 3);
