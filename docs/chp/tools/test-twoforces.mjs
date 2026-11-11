// Изиграва 6.1.2 „Две сили на едно тяло“ (js/exp/twoforces.js) докрай с една умишлена грешка.
// Очакван резултат: (0.75 + 1 + 1) / 3 — грешката е в първата задача на стъпка 2 (неравни сили).
// Употреба: NODE_PATH=$(npm root -g) node tools/test-twoforces.mjs http://localhost:8765/chp/ <папка> [ширина]
import { open } from './xp-lib.mjs';
const [, , base, shots = '.', width = '1280'] = process.argv;
const t = await open(base, '6.1.2', shots, width);
const { page, wait } = t;
await t.menuAll();
await t.shot('1');
await t.next();
// 2. Задача 1: умишлена грешка (4 N срещу 6 N), после 6 N
await t.slider('.fs', 4); await t.btn('.go'); await wait(3500); console.log('грешка:', await t.msg());
await t.slider('.fs', 6); await t.btn('.go'); await wait(1000);
await t.shot('2a');
await t.next();
await t.slider('.fs', 8); await t.btn('.go'); await wait(3500); await t.shot('2b'); await t.next();
await t.slider('.fs', 7); await t.btn('.go'); await wait(3500); await t.next();
await t.choose(0); await t.next();
// 3. Силомер
await page.click('.xp-task .chip'); await wait(1200);
await page.fill('.xp-task .ans', '3'); await t.btn('.chk'); await wait(1500);
await t.click('dir-down'); await wait(1600);
await t.click('dir-up'); await wait(600);
await t.shot('3');
await t.next();
// 4. Триене
await t.choose(0); await wait(4500); await t.shot('4');
await t.next();
await t.choose(0);
await t.next();
await t.shot('5');
await t.done((0.75 + 1 + 1) / 3);
