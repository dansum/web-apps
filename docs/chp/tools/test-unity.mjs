// Изиграва 5.3.8 „Единство на природата“ (js/exp/unity.js) докрай с една умишлена грешка.
// Очакван резултат: (0.75 + 1 + 1) / 3 — грешката е в (отворената) прогноза на стъпка 2.
// Употреба: NODE_PATH=$(npm root -g) node tools/test-unity.mjs http://localhost:8765/chp/ <папка> [ширина]
import { open } from './xp-lib.mjs';
import { sortAll } from './xp5.mjs';
const [, , base, shots = '.', width = '1280'] = process.argv;
const t = await open(base, '5.3.8', shots, width);
const { page, wait } = t;
await t.menuAll();
await t.shot('1');
await t.next();
// 2. Капката: отворена прогноза — умишлено грешна (= 1 грешка); проследяването пак тръгва
await t.choose(1); console.log('прогноза:', await t.msg()); await wait(1000);
for (const id of ['river', 'cloud', 'tree', 'human']) { await t.click(id); await wait(900); console.log(id, '→', await t.msg()); }
await t.shot('2a'); await wait(1200);
console.log('сравнение:', (await page.textContent('.xp-controls .cmp.miss')).replace(/\s+/g, ' ').trim());
await t.next();
await sortAll(t); await t.shot('2b'); await t.next();
// 3. Гората и реката
// Вярна прогноза, после двата избора: гората остава / гората е изсечена (всеки с дъжд)
await t.choose(0); await wait(1200);
await t.btn('.do-keep'); await t.btn('.rain'); await wait(4800); await t.shot('3k');
console.log('с гора:', (await page.textContent('.xp-stage .wide')).trim());
await t.btn('.do-cut'); await t.btn('.rain'); await wait(4800); await t.shot('3a');
if (!(await page.locator('.xp-controls .cmp.ok').count())) throw new Error('няма сравнение след вярна прогноза');
console.log('без гора:', (await page.textContent('.xp-stage .wide')).trim());
await t.btn('.plant'); await wait(2200); await t.shot('3b'); await t.choose(0); await t.next();
// 4. Пази природата
await wait(800); await t.shot('4'); await sortAll(t); await t.choose(0); await t.next();
await t.shot('5');
await t.done((0.75 + 1 + 1) / 3);
