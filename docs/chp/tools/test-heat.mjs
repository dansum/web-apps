// Изиграва 5.1.4 „Топлопроводност и конвекция“ (js/exp/heat.js) докрай с четири умишлени грешки.
// Очакван резултат: (0.75 + 1 + 0.25) / 3 — една грешка в (отворената) прогноза на стъпка 2
// и три в стъпка 4: топене, кипене и тенджерата (конвекция).
// Употреба: NODE_PATH=$(npm root -g) node tools/test-heat.mjs http://localhost:8765/chp/ <папка> [ширина]
import { open } from './xp-lib.mjs';
import { sortAll, orderAll } from './xp5.mjs';
const [, , base, shots = '.', width = '1280'] = process.argv;
const t = await open(base, '5.1.4', shots, width);
const { page, wait } = t;
await t.menuAll();
await t.shot('1');
await t.next();
// 2. Пръчките: отворена прогноза — умишлено грешна (= 1 грешка); опитът пак тръгва
await t.choose(1); console.log('прогноза:', await t.msg());
await t.btn('.pour');
await page.waitForSelector('.xp-controls .cmp.miss', { timeout: 20000 }); await t.shot('2a');
console.log('сравнение:', (await page.textContent('.xp-controls .cmp')).replace(/\s+/g, ' ').trim());
await t.next();
await page.waitForSelector('.xp-controls .ord', { timeout: 20000 });
await orderAll(t, 4); await t.shot('2b'); await t.next();
// 3. Конвекция
await t.choose(0); await t.btn('.fire'); await wait(4500); await t.shot('3a');
if (!(await page.locator('.xp-controls .cmp.ok').count())) throw new Error('няма сравнение след вярна прогноза');
await t.btn('.mid'); await wait(2500); await t.next();
await wait(800); await t.click('spot-high'); await wait(3800); await t.shot('3b');
await t.click('spot-low'); await wait(3200);
await t.choose(0); await t.next();
// 4. Преходите
await wait(500); await t.shot('4');
await sortAll(t);
// Топене и кипене: опитът в чашата с термометъра
await wait(800); await t.btn('.heat'); await wait(4000); await t.shot('4m');
await page.waitForSelector('.xp-controls .choice', { timeout: 30000 }); await t.shot('4n');
await t.choose(1); console.log('грешка топене:', await t.msg());
await t.choose(0); await t.next();
await t.choose(2); console.log('грешка кипене:', await t.msg());
await t.choose(0); await t.next();
await t.choose(0); await t.shot('4b'); await t.next();
await t.choose(1); console.log('грешка тенджера:', await t.msg());
await t.choose(0); await t.shot('4c'); await t.next();
await t.shot('5');
await t.done((0.75 + 1 + 0.25) / 3);
