// Изиграва 3.3.3 „Хигиена и здравословно хранене“ (js/exp/hygiene.js) докрай с една умишлена грешка.
// Очакван резултат: (0.75 + 1 + 1) / 3 — грешката е в предсказанието на стъпка 2.
// Употреба: NODE_PATH=$(npm root -g) node tools/test-hygiene.mjs http://localhost:8765/chp/ <папка> [ширина]
import { open } from './xp-lib.mjs';
const [, , base, shots = '.', width = '1280'] = process.argv;
const t = await open(base, '3.3.3', shots, width);
const { page, wait } = t;
await t.menuAll();
await t.shot('1');
await t.next();
// 2. Зъбът: една умишлена грешка, после вярно
await t.choose(1); console.log('грешка:', await t.msg());
await t.choose(0);
await t.slider('.days', 10); await wait(1500);
await t.shot('2a');
// Четкане: хващаме четката и я движим напред-назад по зъба.
await page.locator('.xp-stage').scrollIntoViewIfNeeded();
for (let k = 0; k < 6 && !(await page.locator('.xp-controls .choice').count()); k++) {
  const a = await t.pos('brush', 'dragId'); const b = await t.pos('tooth');
  if (!a) break;
  await page.mouse.move(a.x, a.y); await page.mouse.down();
  for (let s = 1; s <= 30; s++) {
    const f = s / 30; const sx = b.x + Math.sin(f * Math.PI * 6) * 60;
    await page.mouse.move(a.x + (sx - a.x) * Math.min(1, f * 3), a.y + (b.y - a.y) * Math.min(1, f * 3));
  }
  await page.mouse.up(); await wait(500);
  console.log(await page.textContent('.xp-score'));
}
await wait(1500);
await t.shot('2b');
await t.choose(0);
await t.next();
// 3. Стойка
for (const [c, id] of [['back', 'sitter'], ['bag', 'backpack'], ['book', 'book']]) {
  await page.click(`.xp-task .chip[data-t="${c}"]`);
  await t.click(id);
}
await wait(1200);
await t.shot('3');
await t.next();
// 4. Вода и храни
await t.choose(0);
await t.next();
for (const id of ['apple', 'carrot', 'yogurt', 'bread']) await t.drag(id, 'zone-daily');
for (const id of ['chips', 'soda', 'candy']) await t.drag(id, 'zone-rare');
console.log(await page.textContent('.xp-score'));
await t.shot('4s');
await t.choose(0);
await t.shot('4');
await t.next();
await t.shot('5');
await t.done((0.75 + 1 + 1) / 3);
