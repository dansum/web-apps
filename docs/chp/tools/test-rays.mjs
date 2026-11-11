// Изиграва 5.1.5 „Лъчи, сянка, отражение“ (js/exp/rays.js) докрай с една умишлена грешка.
// Очакван резултат: (0.75 + 1 + 1) / 3 — грешката е в предсказанието на стъпка 2.
// Употреба: NODE_PATH=$(npm root -g) node tools/test-rays.mjs http://localhost:8765/chp/ <папка> [ширина]
import { open } from './xp-lib.mjs';
const [, , base, shots = '.', width = '1280'] = process.argv;
const t = await open(base, '5.1.5', shots, width);
const { page, wait } = t;
const answer = () => page.evaluate(() => document.querySelector('.ex-area').__xp.answer);
await t.menuAll();
await t.shot('1');
await t.next();
// 2. Сянката: една умишлена грешка в предсказанието
await t.choose(1); console.log('грешка:', await t.msg());
await t.choose(0);
await t.btn('.on'); await wait(600); await t.btn('.rays'); await wait(1800);
await t.shot('2a');
await t.slider('.ls', await answer()); await t.btn('.chk'); await t.shot('2b'); await t.next();
// 3. Отражение: две мишени
await wait(500); await t.shot('3a');
await t.slider('.ma', await answer()); await t.btn('.chk'); await t.shot('3b'); await t.next();
await t.slider('.ma', await answer()); await t.btn('.chk'); await t.shot('3c'); await t.next();
await t.choose(0); await t.next();
// 4. Енергия
await wait(800); await t.shot('4a');
await t.choose(0); await wait(4000); await t.shot('4b'); await t.next();
await t.choose(0); await t.next();
await t.shot('5');
await t.done((0.75 + 1 + 1) / 3);
