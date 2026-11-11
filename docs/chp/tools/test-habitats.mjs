// Изиграва 3.2.5 „Среда на живот, приспособления и опазване“ (js/exp/habitats.js) с една умишлена грешка.
// Очакван резултат: (0.75 + 1 + 1) / 3 — грешката е в предсказанието на стъпка 2.
// Употреба: NODE_PATH=$(npm root -g) node tools/test-habitats.mjs http://localhost:8765/chp/ <папка> [ширина]
import { open } from './xp-lib.mjs';
const [, , base, shots = '.', width = '1280'] = process.argv;
const t = await open(base, '3.2.5', shots, width);
const { page, wait } = t;
await t.menuAll();
await t.shot('1');
await t.next();
// 2. Езерото пресъхва: една умишлена грешка, после вярно
await t.choose(1); console.log('грешка:', await t.msg());
await t.choose(0);
await t.slider('.weeks', 8); await wait(2500);
await t.shot('2a');
await t.next(); await wait(3000);
await t.choose(0);
await t.shot('2b');
await t.next();
// 3. Обитатели на водата и приспособления
for (const id of ['fish', 'lily', 'crab']) { await t.click(id); console.log(id, await page.textContent('.xp-score'), await t.msg()); }
await t.shot('3a');
for (const [c, id] of [['fins', 'fish'], ['webs', 'duck'], ['paws', 'mole'], ['stem', 'cactus']]) {
  await page.click(`.xp-task .chip[data-t="${c}"]`);
  await t.click(id); console.log(c, await t.msg());
}
await t.shot('3');
await t.next();
// 4. Предскажи и опази
await t.choose(0);
await t.next();
for (let i = 0; i < 6; i++) {
  const txt = await page.textContent('.xp-task');
  const good = ['Не берем', 'Не рушим', 'Слагаме'].some((g) => txt.includes(g));
  await t.btn(`.act[data-g="${good ? 1 : 0}"]`);
}
await wait(800);
await t.shot('4');
await t.next();
await t.shot('5');
await t.done((0.75 + 1 + 1) / 3);
