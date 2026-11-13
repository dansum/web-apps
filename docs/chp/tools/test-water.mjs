// Изиграва 5.2.6 „Опазване чистотата на водата“ (js/exp/water.js) докрай с две умишлени грешки.
// Очакван резултат: (0.5 + 1 + 0.75) / 3 — грешките са в (отворената) прогноза на стъпка 2 и в реда на слоевете във филтъра,
// а на стъпка 4 — една мярка, която не маха причината (изгребваме водораслите, а новият дъжд ги връща).
// Употреба: NODE_PATH=$(npm root -g) node tools/test-water.mjs http://localhost:8765/chp/ <папка> [ширина]
import { open } from './xp-lib.mjs';
import { sortAll, orderAll } from './xp5.mjs';
const [, , base, shots = '.', width = '1280'] = process.argv;
const t = await open(base, '5.2.6', shots, width);
const { page, wait } = t;
await t.menuAll();
await t.shot('1');
await t.next();
// 2. Филтър: една умишлена грешка в предсказанието
// Отворена прогноза (решение 21): умишлено грешна — опитът пак тръгва, после сравнение.
await t.choose(1); console.log('прогноза:', await t.msg()); await t.next();
// Грешен ред: памукът най-отгоре → мътна вода, подреждаме отново.
for (const i of [4, 0, 1, 2, 3]) { await page.click(`.xp-controls .ord[data-i="${i}"]`); await wait(250); }
await t.btn('.pour'); await wait(5000); await t.shot('2w');
console.log('грешен ред:', await t.msg());
await t.btn('.again-build');
await orderAll(t, 5);
await t.btn('.pour'); await wait(2500); await t.shot('2a'); await wait(2500); await t.shot('2b');
const cmp = await page.textContent('.xp-controls .cmp'); console.log('сравнение:', cmp.replace(/\s+/g, ' ').slice(0, 120));
if (!/Твоята прогноза:\s*Чиста и годна за пиене/.test(cmp)) throw new Error('няма сравнение на прогнозата');
await t.next();
// 3. Станцията и замърсителите
await wait(500); await orderAll(t, 3); await t.shot('3a');
for (let i = 3; i < 5; i++) { await page.click(`.xp-controls .ord[data-i="${i}"]`); await wait(250); }
await wait(800); await t.shot('3b');
await sortAll(t); await t.next();
// 4. Езерото
await t.choose(0); await t.btn('.rain'); await wait(5000); await t.shot('4a');
if (!(await page.locator('.xp-controls .cmp.ok').count())) throw new Error('няма сравнение след дъжда');
await t.next();
// Мярка, която не помага: водораслите се връщат след новия дъжд.
await page.click('.xp-controls .fix-m[data-m="clean"]'); await wait(2600); await t.shot('4m');
console.log('грешна мярка:', await t.msg(), '|', await page.textContent('.bubble'));
await wait(2600);
await t.btn('.fix'); await wait(2800); await t.shot('4b');
// Двете езера след един и същ дъжд (решение 30)
await t.btn('.rain2'); await wait(5000); await t.shot('4c');
const b2 = await page.$$eval('.bubble', (e) => e.map((x) => x.textContent.trim()).filter(Boolean));
console.log('балончета:', b2.join(' | '));
if (!b2.some((x) => /задушават/.test(x)) || !b2.some((x) => /живи/.test(x))) throw new Error('няма сравнението на двете езера');
await t.choose(0); await t.next();
await sortAll(t); await t.next();
await t.shot('5');
await t.done((0.5 + 1 + 0.75) / 3);
