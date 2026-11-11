// Изиграва 3.3.2 „Скелет, мускули и първа помощ“ (js/exp/skeleton.js) докрай с една умишлена грешка.
// Очакван резултат: (0.75 + 1 + 1) / 3 — грешката е в предсказанието на стъпка 2.
// Употреба: NODE_PATH=$(npm root -g) node tools/test-skeleton.mjs http://localhost:8765/chp/ <папка> [ширина]
import { open } from './xp-lib.mjs';
const [, , base, shots = '.', width = '1280'] = process.argv;
const t = await open(base, '3.3.2', shots, width);
const { page, wait } = t;
await t.menuAll();
await t.shot('1');
await t.next();
// 2. Ръката и куклата без кости
await t.choose(1); console.log('грешка:', await t.msg());
await t.choose(0);
await t.slider('.bend', 100); await wait(1500);
await t.shot('2a');
await t.next();
await t.next(); await wait(1800);
await t.shot('2b');
await t.choose(0);
await t.next();
// 3. Три случая за първа помощ
for (let k = 0; k < 3; k++) { await t.choose(0); await wait(500); if (k === 1) await t.shot('3'); await t.next(); }
await t.next();
// 4. Каска и правила
await t.choose(0);
await t.next();
for (let i = 0; i < 5; i++) {
  const txt = await page.textContent('.xp-task');
  const good = ['Слагаме', 'Загряваме'].some((g) => txt.includes(g));
  await t.btn(`.act[data-g="${good ? 1 : 0}"]`);
}
await t.shot('4');
await t.next();
await t.shot('5');
await t.done((0.75 + 1 + 1) / 3);
