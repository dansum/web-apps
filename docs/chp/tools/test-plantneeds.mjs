// Изиграва 3.2.3 „От какво се нуждаят растенията“ (js/exp/plantneeds.js) докрай с една умишлена грешка.
// Очакван резултат: (0.75 + 1 + 1) / 3 — грешката е в предсказанието на стъпка 2.
// Употреба: NODE_PATH=$(npm root -g) node tools/test-plantneeds.mjs http://localhost:8765/chp/ <папка> [ширина]
import { open } from './xp-lib.mjs';
const [, , base, shots = '.', width = '1280'] = process.argv;
const t = await open(base, '3.2.3', shots, width);
const { page, wait } = t;
// 1. Опознай
await t.menuAll();
await t.shot('1');
await t.next();
// 2. Опит: подреждане и поливане, после предсказание с една умишлена грешка
await t.drag('pot-c', 'zone-dark');
await t.drag('pot-d', 'zone-cold');
await t.click('can');
for (const id of ['pot-a', 'pot-c', 'pot-d']) { await t.click(id); await wait(2800); }
await t.shot('2a');
await t.choose(1); console.log('грешка:', await t.msg());
await t.choose(0);
await t.slider('.days', 14); await wait(1500);
await t.shot('2b');
await t.choose(0);
await t.next();
// 3. Помогни на растенията
for (const [tool, id] of [['water', 'sick-dry'], ['light', 'sick-dark'], ['air', 'sick-oil']]) {
  await page.click(`.xp-task .chip[data-t="${tool}"]`);
  await t.click(id); await wait(600);
}
await wait(1500);
await t.shot('3');
await t.next();
// 4. Предскажи
await t.btn('.turn');
await t.choose(0);
await t.slider('.days', 5); await wait(1200);
await t.shot('4a');
await wait(1000);
await t.choose(0);
await t.next();
await t.shot('5');
await t.done((0.75 + 1 + 1) / 3);
