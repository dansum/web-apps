// Изиграва 5.1.6 „Сезони, фази на Луната, затъмнения“ (js/exp/seasons.js) докрай с една умишлена грешка.
// Очакван резултат: (0.75 + 1 + 1) / 3 — грешката е в предсказанието на стъпка 2.
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
await t.choose(1); console.log('грешка:', await t.msg());
await t.choose(0);
await t.slider('.dd', await answer()); await t.btn('.chk'); await wait(800); await t.shot('2a'); await t.next();
await t.slider('.dd', await answer()); await t.btn('.chk'); await wait(800); await t.shot('2b'); await t.next();
// 3. Фазите
for (let k = 0; k < 3; k++) {
  await t.slider('.mp', await answer()); await t.btn('.chk'); await wait(600);
  if (k === 0) await t.shot('3a');
  await t.next();
}
await orderAll(t, 4); await t.shot('3b'); await t.next();
// 4. Затъмнения
await t.choose(0); await wait(3000); await t.shot('4a'); await t.next();
await t.choose(0); await wait(3500); await t.shot('4b'); await t.next();
await t.choose(0); await t.shot('4c'); await t.next();
await t.shot('5');
await t.done((0.75 + 1 + 1) / 3);
