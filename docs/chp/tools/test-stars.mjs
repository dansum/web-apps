// Изиграва 5.1.7 „Слънчевата система и звездите“ (js/exp/stars.js) докрай с две умишлени грешки.
// Очакван резултат: (0.75 + 1 + 0.75) / 3 — грешките са в (отворената) прогноза на стъпка 2
// и в разпознаването на Малката мечка в стъпка 4.
// Употреба: NODE_PATH=$(npm root -g) node tools/test-stars.mjs http://localhost:8765/chp/ <папка> [ширина]
import { open } from './xp-lib.mjs';
import { sortAll, orderAll } from './xp5.mjs';
const [, , base, shots = '.', width = '1280'] = process.argv;
const t = await open(base, '5.1.7', shots, width);
const { page, wait } = t;
await t.menuAll();
await t.shot('1');
await t.next();
// 2. Притеглянето: отворена прогноза — умишлено грешна (= 1 грешка); опитът пак тръгва
await wait(500); await t.shot('2a');
await t.choose(1); console.log('прогноза:', await t.msg());
await t.btn('.off'); await wait(4000); await t.shot('2b');
console.log('сравнение:', (await page.textContent('.xp-controls .cmp.miss')).replace(/\s+/g, ' ').trim());
await t.btn('.back'); await wait(1200);
await t.choose(0); await t.next();
// 3. Планетите и полетите
await wait(1200); await t.shot('3a');
await sortAll(t);
await wait(500); await t.shot('3t');
await t.choose(0); await t.next();
await orderAll(t, 5); await wait(500); await t.shot('3b'); await t.next();
// 4. Звездите
await wait(800); await t.shot('4a');
await t.click('star-dubhe'); await wait(1800);
await t.click('polaris'); await wait(1800); await t.shot('4b');
await t.choose(1); console.log('грешка 4:', await t.msg());
await t.choose(0); await t.next();
await t.choose(0); await t.next();
await t.choose(0); await t.next();
await t.shot('5');
await t.done((0.75 + 1 + 0.75) / 3);
