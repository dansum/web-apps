// Изиграва 5.1.4 „Топлопроводност и конвекция“ (js/exp/heat.js) докрай с една умишлена грешка.
// Очакван резултат: (0.75 + 1 + 1) / 3 — грешката е в предсказанието на стъпка 2.
// Употреба: NODE_PATH=$(npm root -g) node tools/test-heat.mjs http://localhost:8765/chp/ <папка> [ширина]
import { open } from './xp-lib.mjs';
import { sortAll, orderAll } from './xp5.mjs';
const [, , base, shots = '.', width = '1280'] = process.argv;
const t = await open(base, '5.1.4', shots, width);
const { page, wait } = t;
await t.menuAll();
await t.shot('1');
await t.next();
// 2. Пръчките: една умишлена грешка в предсказанието
await t.choose(1); console.log('грешка:', await t.msg());
await t.choose(0);
await t.btn('.pour'); await wait(6000); await t.shot('2a');
await page.waitForSelector('.xp-controls .ord', { timeout: 20000 });
await orderAll(t, 4); await t.shot('2b'); await t.next();
// 3. Конвекция
await t.choose(0); await t.btn('.fire'); await wait(4500); await t.shot('3a');
await t.btn('.mid'); await wait(2500); await t.next();
await wait(800); await t.click('spot-high'); await wait(3800); await t.shot('3b');
await t.click('spot-low'); await wait(3200);
await t.choose(0); await t.next();
// 4. Преходите
await wait(500); await t.shot('4');
await sortAll(t);
await t.choose(0); await t.shot('4b'); await t.next();
await t.shot('5');
await t.done((0.75 + 1 + 1) / 3);
