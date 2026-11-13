// Изиграва 5.2.4 „Опазване чистотата на въздуха“ (js/exp/airclean.js) докрай с две умишлени грешки.
// Очакван резултат: (0.5 + 1 + 1) / 3 — грешките са в предсказанието и в протокола на стъпка 2.
// Употреба: NODE_PATH=$(npm root -g) node tools/test-airclean.mjs http://localhost:8765/chp/ <папка> [ширина] [b]
// Детето избира 3 от 5 места (решение 27 — единственият вариант); тук избираме парка, двора и завода.
// С „b“ отваряме стария адрес #/s/5.2.4?v=b — той трябва да води до същото.
import { open } from './xp-lib.mjs';
import { sortAll, fillAll } from './xp5.mjs';
const [, , base, shots = '.', width = '1280', variant = 'a'] = process.argv;
const t = await open(base, variant === 'b' ? '5.2.4?v=b' : '5.2.4', shots, width);
const { page, wait } = t;
await t.menuAll();
await t.shot('1');
await t.next();
// 2. Картончета: една умишлена грешка в предсказанието
for (const id of ['card-park', 'card-yard', 'card-factory']) await t.click(id);
const opts = await page.$$eval('.xp-controls .choice', (els) => els.map((e) => e.textContent));
console.log('избор:', opts.join(' | '));
if (opts.length !== 4 || !opts.includes('До завода')) throw new Error('изборът не е по избраните места');
await page.click('.xp-controls .choice:text("В парка")'); await wait(400);
console.log('грешка:', await t.msg());
await page.click('.xp-controls .choice:text("До завода")'); await wait(400);
await t.btn('.wait'); await wait(5500); await t.shot('2');
// Протокол: детето попълва наблюденията (една умишлена грешка), после избира извода
await fillAll(t, true);
console.log('протокол:', (await page.textContent('.xp-task')).replace(/\s+/g, ' ').slice(-90));
const right = await page.$eval('.xp-controls .choice[data-i="0"]', (e) => e.textContent);
console.log('извод:', right);
await t.choose(0); await t.next();
// 3. Източници и замърсители
await wait(800); await t.shot('3');
await sortAll(t); await wait(300); await sortAll(t); await t.next();
// 4. Мерки
for (const i of [0, 1, 2]) { await page.click(`.xp-controls .ms[data-i="${i}"]`); await wait(500); }
await wait(1500); await t.shot('4a'); await t.next();
await t.choose(0); await t.next();
await t.shot('5');
await t.done((0.5 + 1 + 1) / 3);
