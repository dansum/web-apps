// Изиграва 5.3.4 „Отделяне“ (js/exp/excretion.js) докрай с една умишлена грешка.
// Очакван резултат: (0.75 + 1 + 1) / 3 — грешката е в (отворената) прогноза на стъпка 2.
// Употреба: NODE_PATH=$(npm root -g) node tools/test-excretion.mjs http://localhost:8765/chp/ <папка> [ширина]
import { open } from './xp-lib.mjs';
import { sortAll, orderAll } from './xp5.mjs';
const [, , base, shots = '.', width = '1280'] = process.argv;
const t = await open(base, '5.3.4', shots, width);
const { page, wait } = t;
await t.menuAll();
await t.shot('1');
await t.next();
// 2. Растенията: отворена прогноза — умишлено грешна (= 1 грешка); опитът пак тръгва
await t.choose(1); console.log('прогноза:', await t.msg());
await t.btn('.sun'); await wait(3400); await t.shot('2a');
console.log('сравнение:', (await page.textContent('.xp-controls .cmp.miss')).replace(/\s+/g, ' ').trim());
await t.btn('.fall'); await wait(3000); await t.shot('2b');
await t.choose(0); await t.next();
// 3. Бозайникът
await wait(500); await t.shot('3'); await sortAll(t); await orderAll(t, 4); await t.next();
// 4. Ако отделянето спре: вярна прогноза, после трите действия (вода, жега, спрени бъбреци)
await t.choose(0); await wait(1200);
await t.btn('.act-water'); await wait(3800); await t.shot('4w');
console.log('вода:', (await page.textContent('.xp-stage .wide')).trim());
await t.btn('.act-heat'); await wait(3800); await t.shot('4h');
console.log('жега:', (await page.textContent('.xp-stage .wide')).trim());
await t.btn('.act-stop'); await wait(3800); await t.shot('4');
if (!(await page.locator('.xp-controls .cmp.ok').count())) throw new Error('няма сравнение след вярна прогноза');
console.log('бъбреци:', (await page.textContent('.xp-stage .wide')).trim());
await t.next(); await t.choose(0); await t.next();
await t.shot('5');
await t.done((0.75 + 1 + 1) / 3);
