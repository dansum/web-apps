// Изиграва 5.2.3 „Свещ под стъкленица“ (js/exp/candle.js) докрай с една умишлена грешка.
// Очакван резултат: (0.75 + 1 + 0.75 + 1) / 4 — грешки: (отворената) прогноза на стъпка 2 и обяснението в стъпка 4.
// Употреба: NODE_PATH=$(npm root -g) node tools/test-candle.mjs http://localhost:8765/chp/ <папка> [ширина]
import { open } from './xp-lib.mjs';
const [, , base, shots = '.', width = '1280'] = process.argv;
const t = await open(base, '5.2.3', shots, width);
const { page, wait } = t;
// 1. Опознай
await t.menuAll();
await t.shot('1');
await t.next();
// 2. Отворена прогноза: умишлено грешна (малката стъкленица) = 1 грешка; опитът пак тръгва
await t.choose(1); console.log('прогноза:', await t.msg()); await wait(1000);
await t.click('jar-s'); await t.click('jar-m');
await t.btn('.cover-all');
await page.waitForSelector('.xp-controls .cmp.miss', { timeout: 45000 }); await wait(500); await t.shot('2');
console.log('сравнение:', (await page.textContent('.xp-controls .cmp')).replace(/\s+/g, ' ').trim());
await t.next();
await page.waitForSelector('.xp-controls .choice', { timeout: 20000 }); await wait(500);
await t.choose(0);
await t.next();
// 3. Проби и разпознаване
await page.click('.xp-task .chip[data-t="splint"]');
for (const id of ['gas-a', 'gas-b', 'gas-c']) await t.click(id);
await page.click('.xp-task .chip[data-t="lime"]');
await t.click('gas-a'); await wait(1200);
await t.shot('3');
await t.btn('.know');
await t.click('gas-b'); await wait(1500);
await t.click('gas-a');
await t.next();
// 4. Газирана вода: предсказание, отваряне, една умишлена грешка в обяснението, риби
await t.choose(0); await wait(1000);
await t.click('soda-cold'); await t.click('soda-warm');
await wait(4600); await t.shot('4a');
if (!(await page.locator('.xp-controls .cmp.ok').count())) throw new Error('няма сравнение след вярна прогноза');
await t.next();
const cnt = await page.$$eval('.xp-stage .tag', (els) => els.map((e) => e.textContent).filter((x) => /мехурчета/.test(x)));
console.log('броячи:', cnt.join(' | '));
await t.choose(1); console.log('грешка:', await t.msg());
await t.choose(0);
await t.choose(0);
await t.next();
// 5. Предскажи и пренеси
await t.choose(0);
await page.waitForSelector('.xp-controls .cmp.ok', { timeout: 20000 }); await t.shot('5a');
await t.next();
await page.waitForSelector('.xp-controls .choice:not([disabled])', { timeout: 20000 });
await t.choose(0);
await t.next();
await t.shot('5');
await t.done((0.75 + 1 + 0.75 + 1) / 4);
