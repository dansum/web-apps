// Изиграва 5.3.5 „Храносмилателна система на човека“ (js/exp/digestion.js) докрай с една умишлена грешка.
// Очакван резултат: (0.75 + 1 + 1) / 3 — грешката е в предсказанието на стъпка 2.
// Употреба: NODE_PATH=$(npm root -g) node tools/test-digestion.mjs http://localhost:8765/chp/ <папка> [ширина]
import { open } from './xp-lib.mjs';
import { sortAll } from './xp5.mjs';
const [, , base, shots = '.', width = '1280'] = process.argv;
const t = await open(base, '5.3.5', shots, width);
const { page, wait } = t;
// Кликва точно върху органа (по котвата му), защото дебелото черво обикаля около тънкото.
async function clickOrgan(id) {
  await page.locator('.xp-stage').scrollIntoViewIfNeeded(); await wait(150);
  const p = await page.evaluate((i) => {
    const xp = document.querySelector('.ex-area').__xp; const s = document.querySelector('.xp-stage').__stage;
    const o = xp.pt(i); const v = o.getWorldPosition(o.position.clone()); v.project(s.camera);
    const r = s.renderer.domElement.getBoundingClientRect();
    return { x: r.left + (v.x * 0.5 + 0.5) * r.width, y: r.top + (-v.y * 0.5 + 0.5) * r.height };
  }, id);
  await page.mouse.click(p.x, p.y); await wait(500);
}
await t.menuAll();
await t.shot('1');
await t.next();
// 2. Хапката: една умишлена грешка в предсказанието
await t.choose(1); console.log('грешка:', await t.msg());
await t.choose(0);
for (const id of ['mouth', 'esophagus', 'stomach', 'liver', 'pancreas', 'small', 'large']) {
  await clickOrgan(id);
  if (id === 'stomach') await t.shot('2a');
}
const bad = await page.evaluate(() => document.querySelector('.xp-msg').className);
console.log('последно съобщение:', bad, await t.msg());
await wait(800); await t.shot('2b'); await t.next();
// 3. Храните и кръвта
await wait(800); await t.shot('3'); await sortAll(t); await wait(300); await sortAll(t); await t.next();
// 4. Навици
await t.choose(0); await t.shot('4'); await sortAll(t); await t.next();
await t.shot('5');
await t.done((0.75 + 1 + 1) / 3);
