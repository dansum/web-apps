// Изиграва 5.3.5 „Храносмилателна система на човека“ (js/exp/digestion.js) докрай с една умишлена грешка.
// Очакван резултат: (0.5 + 1 + 1) / 3 — грешките са в (отворената) прогноза на стъпка 2 и във въпроса за жлъчката.
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
// Отворена прогноза (решение 21): умишлено грешна — пак следваме хапката, накрая сравнение.
await t.choose(1); console.log('прогноза:', await t.msg()); await t.next();
for (const id of ['mouth', 'esophagus', 'stomach', 'liver', 'pancreas', 'small', 'large']) {
  await clickOrgan(id);
  if (id === 'stomach') await t.shot('2a');
  // Решение 23: след 2 клика идва въпрос „Какво ще стане, ако…“ (верният е data-i="0").
  if (['esophagus', 'liver', 'small'].includes(id)) {
    const q = await page.textContent('.xp-controls p b'); console.log('въпрос:', q);
    if (id === 'liver') { await t.choose(1); console.log('грешка (жлъчка):', await t.msg()); await t.shot('2q'); }
    await t.choose(0); await t.next();
  }
}
const bad = await page.evaluate(() => document.querySelector('.xp-msg').className);
console.log('последно съобщение:', bad, await t.msg());
await wait(800); await t.shot('2b');
const cmp = await page.textContent('.xp-controls .cmp'); console.log('сравнение:', cmp.replace(/\s+/g, ' ').slice(0, 100));
if (!/Твоята прогноза:\s*В стомаха/.test(cmp)) throw new Error('няма сравнение на прогнозата');
await t.next();
// 3. Храните и кръвта
await wait(800); await t.shot('3'); await sortAll(t); await wait(300); await sortAll(t); await t.next();
// 4. Навици
await t.choose(0); await t.shot('4'); await sortAll(t); await t.next();
await t.shot('5');
await t.done((0.5 + 1 + 1) / 3);
