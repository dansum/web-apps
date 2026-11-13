// Изиграва 5.3.3 „Дишане“ (js/exp/respiration.js) докрай с една умишлена грешка.
// Очакван резултат: (0.75 + 1 + 1) / 3 — грешката е в (отворената) прогноза на стъпка 2: брои се като 1 грешка.
// Употреба: NODE_PATH=$(npm root -g) node tools/test-respiration.mjs http://localhost:8765/chp/ <папка> [ширина]
import { open } from './xp-lib.mjs';
import { sortAll, orderAll } from './xp5.mjs';
const [, , base, shots = '.', width = '1280'] = process.argv;
const t = await open(base, '5.3.3', shots, width);
const { page, wait } = t;
await t.menuAll();
await t.shot('1');
await t.next();
// 2. Семената (решение 26): детето нарежда бурканите. Първо два еднакви — опитът тръгва, но няма с какво да се сравни.
const fill = async (a, b) => {
  await page.click(`.xp-controls .ja[data-j="0"][data-c="${a}"]`); await page.click(`.xp-controls .ja[data-j="1"][data-c="${b}"]`);
  await t.btn('.go');
};
await fill('live', 'live');
await t.choose(2); await t.btn('.day'); await wait(4800); await t.shot('2same');
const same = await page.textContent('.xp-controls'); console.log('еднакви:', same.replace(/\s+/g, ' ').slice(-140));
if (!/няма с какво да сравниш/.test(same)) throw new Error('няма съобщение за еднаквите буркани');
await t.next();
// После честен опит: А покълнали, Б сварени; умишлено грешна (отворена) прогноза „В Б“ — опитът пак тръгва.
await fill('live', 'dead');
await t.choose(1); await t.btn('.day'); await wait(4800); await t.shot('2');
const cmp = await page.textContent('.xp-controls .cmp'); console.log('сравнение:', cmp.replace(/\s+/g, ' ').slice(0, 160));
if (!/Твоята прогноза:\s*В Б/.test(cmp) || !/помътня в А/.test(cmp)) throw new Error('сравнението не е вярно');
await t.next();
await t.choose(0); await t.next();
// 3. Органи
await wait(500); await t.shot('3'); await sortAll(t); await t.next();
// 4. Пътят на кислорода
await wait(800); await orderAll(t, 5); await wait(500); await t.shot('4');
await t.choose(0); await t.choose(0); await t.next();
await t.shot('5');
await t.done((0.75 + 1 + 1) / 3);
