// Изиграва 3.1.4 „Въздухът и водата“ (js/exp/airwater.js) докрай с една умишлена грешка.
// Очакван резултат: (0.75 + 1 + 1) / 3 — грешката е в предсказанието на стъпка 2.
// Употреба: NODE_PATH=$(npm root -g) node tools/test-airwater.mjs http://localhost:8765/chp/ <папка> [ширина]
import { open } from './xp-lib.mjs';
const [, , base, shots = '.', width = '1280'] = process.argv;
const t = await open(base, '3.1.4', shots, width);
const { page, wait } = t;
// 1. Опознай
await t.menuAll();
await t.shot('1');
await t.next();
// 2. Чаша във вода: една умишлена грешка, после вярно
await t.choose(1); console.log('грешка:', await t.msg());
await t.choose(0);
await t.slider('.press', 100); await wait(2000);
await t.shot('2a');
await t.btn('.tilt'); await wait(4500);
await t.choose(0);
await t.next(); await wait(1500);
await t.shot('2b');
await t.next();
// 3. Три съда и разтваряне
for (const id of ['v-tall', 'v-bowl', 'v-box']) { await t.click(id); await wait(3400); }
await t.shot('3a');
await t.choose(0);
await wait(1200);
await t.click('sugar'); await t.click('sand'); await wait(1000);
await t.btn('.stir'); await wait(5200);
await t.click('glass-a');
await t.shot('3b');
await t.next();
// 4. Филтър и опазване
await t.choose(0);
await t.next(); await wait(7500);
await t.shot('4a');
await t.next();
const GOOD = ['Засаждаме', 'Ходим', 'Спираме'];
for (let i = 0; i < 6; i++) {
  const txt = await page.textContent('.xp-task');
  const good = GOOD.some((g) => txt.includes(g));
  await t.btn(`.act[data-g="${good ? 1 : 0}"]`);
}
await t.shot('4b');
await t.next();
await t.shot('5');
await t.done((0.75 + 1 + 1) / 3);
