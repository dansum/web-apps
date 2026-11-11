// Изиграва 3.2.1 „Живо и неживо“ (js/exp/living.js) докрай с една умишлена грешка.
// Очакван резултат: (0.75 + 1 + 1) / 3 — грешката е в предсказанието на стъпка 2.
// Употреба: NODE_PATH=$(npm root -g) node tools/test-living.mjs http://localhost:8765/chp/ <папка> [ширина]
import { open } from './xp-lib.mjs';
const [, , base, shots = '.', width = '1280'] = process.argv;
const t = await open(base, '3.2.1', shots, width);
const { page, wait } = t;
// 1. Опознай
await t.menuAll();
await t.shot('1');
await t.next();
// 2. Опит: една умишлена грешка, после вярно
await t.choose(1); console.log('грешка:', await t.msg());
await t.choose(0);
await t.next(); await wait(1800);
await t.shot('2a');
await t.slider('.days', 30); await wait(1000);
await t.shot('2b');
await t.next();
await t.choose(0);
await t.shot('2c');
await t.next();
// 3. Подреждане
for (const id of ['butterfly', 'mush', 'snail', 'tulip']) await t.drag(id, 'zone-live');
for (const id of ['cloud2', 'ball', 'sand']) await t.drag(id, 'zone-dead');
console.log(await page.textContent('.xp-score'));
await t.shot('3');
await t.next();
// 4. Предскажи
await t.choose(0);
await t.slider('.days', 21); await wait(800);
await t.shot('4a');
await wait(1500);
await t.choose(0); await wait(2500);
await t.shot('4b');
await t.next();
await t.shot('5');
await t.done((0.75 + 1 + 1) / 3);
