// Изиграва 5.2.5 „Водата и водните разтвори“ (js/exp/solutions.js) докрай с две умишлени грешки.
// Очакван резултат: (0.75 + 0.75 + 1) / 3 — грешките са в (отворената) прогноза на стъпка 2 и в протокола на стъпка 3.
// Употреба: NODE_PATH=$(npm root -g) node tools/test-solutions.mjs http://localhost:8765/chp/ <папка> [ширина]
import { open } from './xp-lib.mjs';
import { sortAll, fillAll } from './xp5.mjs';
const [, , base, shots = '.', width = '1280'] = process.argv;
const t = await open(base, '5.2.5', shots, width);
const { page, wait } = t;
await t.menuAll();
await t.shot('1');
await t.next();
// 2. Наситен разтвор: отворена прогноза — умишлено грешна (= 1 грешка); опитът пак тръгва
await t.choose(1); console.log('прогноза:', await t.msg());
for (let k = 0; k < 4; k++) { await page.click('.xp-controls .sp'); await wait(400); }
await wait(800); await t.shot('2a');
console.log('сравнение:', (await page.textContent('.xp-controls .cmp.miss')).replace(/\s+/g, ' ').trim());
for (let k = 0; k < 4; k++) { await page.click('.xp-controls .sp'); await wait(400); }
await page.waitForSelector('.xp-controls .choice', { timeout: 10000 }); await wait(1500); await t.shot('2b');
await t.choose(0); await t.next();
// 3. Разтворимост
for (const id of ['b-sugar', 'b-gyps', 'b-chalk', 'b-sand']) await t.click(id);
await wait(2000); await t.shot('3a');
await page.waitForSelector('.xp-controls .fill-row', { timeout: 10000 }); await wait(300);
await fillAll(t, true);
await page.waitForSelector('.xp-controls .bin', { timeout: 10000 });
await sortAll(t); await wait(800); await t.shot('3b');
await t.choose(0); await t.next();
// 4. Свойствата на водата
await t.choose(0); await wait(2600); await t.shot('4a');
if (!(await page.locator('.xp-controls .cmp.ok').count())) throw new Error('няма сравнение след вярна прогноза');
await t.next();
await wait(800); await t.shot('4b');
await t.choose(0); await t.next();
await t.choose(0); await t.next();
await t.shot('5');
await t.done((0.75 + 0.75 + 1) / 3);
