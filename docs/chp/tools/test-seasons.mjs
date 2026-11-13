// Изиграва 5.1.6 „Сезони, фази на Луната, затъмнения“ (js/exp/seasons.js) докрай с една умишлена грешка.
// Очакван резултат: (0.75 + 1 + 0.75) / 3 — грешките са в (отворената) прогноза на стъпка 2 и в мястото на Луната за слънчевото затъмнение.
// Употреба: NODE_PATH=$(npm root -g) node tools/test-seasons.mjs http://localhost:8765/chp/ <папка> [ширина]
import { open } from './xp-lib.mjs';
import { orderAll } from './xp5.mjs';
const [, , base, shots = '.', width = '1280'] = process.argv;
const t = await open(base, '5.1.6', shots, width);
const { page, wait } = t;
const answer = () => page.evaluate(() => document.querySelector('.ex-area').__xp.answer);
await t.menuAll();
await t.shot('1');
await t.next();
// 2. Сезоните: една умишлена грешка в предсказанието
// Отворена прогноза (решение 21): умишлено грешна — опитът пак тръгва, накрая сравнение.
await t.choose(1); console.log('прогноза:', await t.msg()); await t.next();
await t.slider('.dd', await answer()); await t.btn('.chk'); await wait(800); await t.shot('2a'); await t.next();
await t.slider('.dd', await answer()); await t.btn('.chk'); await wait(800); await t.shot('2b');
const cmp = await page.textContent('.xp-controls .cmp'); console.log('сравнение:', cmp.replace(/\s+/g, ' ').slice(0, 120));
if (!/Твоята прогноза:\s*Земята ту се приближава/.test(cmp)) throw new Error('няма сравнение на прогнозата');
await t.next();
// 3. Фазите
for (let k = 0; k < 3; k++) {
  await t.slider('.mp', await answer()); await t.btn('.chk'); await wait(600);
  if (k === 0) await t.shot('3a');
  await t.next();
}
await orderAll(t, 4); await t.shot('3b'); await t.next();
// 4. Затъмнения
// Решение 25: детето мести само Луната. Първо грешно място: сянката ѝ не пада върху Земята.
await t.slider('.ep', 90); await t.btn('.chk'); await wait(600); await t.shot('4w');
const bw = await page.textContent('.bubble'); console.log('грешно място:', bw);
if (!/не пада върху Земята/.test(bw)) throw new Error('сцената не показва защо мястото е грешно');
if (await page.locator('.xp-panel .slider').count() !== 1) throw new Error('плъзгачът трябва да е само за Луната');
await t.slider('.ep', await answer()); await t.btn('.chk'); await wait(800); await t.shot('4a'); await t.next();
await t.slider('.ep', await answer()); await t.btn('.chk'); await wait(1500); await t.shot('4b'); await t.next();
await t.choose(0); await t.shot('4c'); await t.next();
await t.shot('5');
await t.done((0.75 + 1 + 0.75) / 3);
