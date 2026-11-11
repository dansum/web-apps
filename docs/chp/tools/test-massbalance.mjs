// Изиграва 6.2.3 „Запазване на масата“ (js/exp/massbalance.js) докрай с една умишлена грешка.
// Очакван резултат: (0.75 + 1 + 1) / 3 — грешката е в предсказанието на стъпка 2.
// Употреба: NODE_PATH=$(npm root -g) node tools/test-massbalance.mjs http://localhost:8765/chp/ <папка> [ширина]
import { open } from './xp-lib.mjs';
const [, , base, shots = '.', width = '1280'] = process.argv;
const t = await open(base, '6.2.3', shots, width);
const { page, wait } = t;
await t.menuAll();
await t.shot('1');
await t.next();
// 2. Отворен съд: една умишлена грешка
await t.choose(1); console.log('грешка:', await t.msg());
await t.choose(0);
await t.btn('.mixb'); await wait(1500); await t.shot('2a'); await wait(2500);
await page.waitForSelector('.xp-controls .choice', { timeout: 15000 }); await wait(400);
await t.choose(0);
await t.next();
await t.click('loose-cap');
await t.btn('.mixb'); await wait(4000);
await t.shot('2b');
await t.next();
// 3. Желязо и сяра
await t.click('fe'); await t.click('su');
await page.fill('.xp-task .ans', '11'); await t.btn('.chk');
await wait(5000); await t.shot('3');
await t.next();
// 4. Свещ на везната
await t.choose(0); await wait(7000);
await t.shot('4a');
await page.waitForSelector('.xp-controls .choice:not([disabled])', { timeout: 15000 });
await t.choose(0);
await t.next();
await t.choose(0); await wait(3500); await t.shot('4b');
await t.next();
await t.shot('5');
await t.done((0.75 + 1 + 1) / 3);
