// Изиграва 5.3.2 „Хранене при растения и животни“ (js/exp/nutrition.js) докрай с една умишлена грешка.
// Очакван резултат: (0.75 + 1 + 1) / 3 — грешката е в предсказанието на стъпка 2.
// Употреба: NODE_PATH=$(npm root -g) node tools/test-nutrition.mjs http://localhost:8765/chp/ <папка> [ширина]
import { open } from './xp-lib.mjs';
import { sortAll, orderAll } from './xp5.mjs';
const [, , base, shots = '.', width = '1280'] = process.argv;
const t = await open(base, '5.3.2', shots, width);
const { page, wait } = t;
await t.menuAll();
await t.shot('1');
await t.next();
// 2. Растението: една умишлена грешка в предсказанието
await t.choose(1); console.log('грешка:', await t.msg());
await t.choose(0);
for (const k of ['water', 'co2', 'light']) { await page.click(`.xp-controls .in[data-k="${k}"]`); await wait(400); }
await page.waitForSelector('.xp-controls .choice[data-i]', { timeout: 10000 }); await wait(1500); await t.shot('2');
await t.choose(0); await t.next();
// 3. Животното
// Три действия (решение 24): първо „само вода“ и „без храна“ — последствията се виждат в сцената, после морков.
await t.btn('.feed-w'); await wait(5000); await t.shot('3w');
const bw = await page.textContent('.bubble'); console.log('само вода:', bw);
if (!/не е храна/.test(bw)) throw new Error('няма последствие за водата');
await t.btn('.feed-n'); await wait(1500);
const bn = await page.textContent('.bubble'); console.log('без храна:', bn);
if (!/празни/.test(bn)) throw new Error('няма последствие без храна');
await t.btn('.feed'); await wait(3000); await t.shot('3a');
await page.waitForSelector('.xp-controls .ord', { timeout: 10000 });
await orderAll(t, 7); await sortAll(t); await t.shot('3b'); await t.next();
// 4. Сравни и предскажи
await wait(500); await t.shot('4a');
await sortAll(t); await t.choose(0); await t.shot('4b'); await t.next();
await t.shot('5');
await t.done((0.75 + 1 + 1) / 3);
