// Изиграва 6.1.6 „Електрични заряди и строеж на атома“ (js/exp/charges.js) с една умишлена грешка.
// Очакван резултат: (0.75 + 1 + 1) / 3 — грешката е в предсказанието на стъпка 2.
// Употреба: NODE_PATH=$(npm root -g) node tools/test-charges.mjs http://localhost:8765/chp/ <папка> [ширина]
import { open } from './xp-lib.mjs';
const [, , base, shots = '.', width = '1280'] = process.argv;
const t = await open(base, '6.1.6', shots, width);
const { page, wait } = t;
const sortAll = async () => { while (await page.locator('.xp-controls .bin').count()) { const a = await page.evaluate(() => document.querySelector('.ex-area').__xp.answer); await t.btn(`.bin[data-b="${a}"]`); } };
await t.menuAll();
await t.shot('1');
await t.next();
await t.choose(1); console.log('грешка:', await t.msg());
await t.choose(0);
for (let i = 0; i < 4; i++) { await t.btn('.rub'); await wait(1100); }
await wait(1500);
await t.slider('.near', 100); await wait(2500);
await t.shot('2a');
await t.next();
await t.next(); await wait(2000);
await t.shot('2b');
await t.choose(0);
await t.next();
// 3. Атом: неутрален, отрицателен, положителен
await t.btn('.eadd'); await t.btn('.chk');
await t.btn('.eadd'); await t.btn('.chk');
await t.btn('.erem'); await t.btn('.erem'); await t.btn('.chk');
await t.shot('3');
await t.choose(0);
await t.next();
// 4. Буря и примери
await t.slider('.storm', 100); await wait(500);
await t.choose(0); await wait(600);
await t.shot('4a');
await t.next();
await sortAll();
await t.shot('4b');
await t.next();
await t.shot('5');
await t.done((0.75 + 1 + 1) / 3);
