// Изиграва 5.1.3 „Разширение на релса“ (js/exp/expansion.js) докрай с две умишлени грешки.
// Очакван резултат: (0.75 + 0.75 + 1) / 3 — грешките са в предсказанието на стъпка 2 и във въпроса за нагряването в стъпка 3.
// Употреба: NODE_PATH=$(npm root -g) node tools/test-expansion.mjs http://localhost:8765/chp/ <папка> [ширина]
import { open } from './xp-lib.mjs';
const [, , base, shots = '.', width = '1280'] = process.argv;
const t = await open(base, '5.1.3', shots, width);
const { page, wait } = t;
await t.menuAll();
await t.shot('1');
await t.next();
// 2. Релсите: една умишлена грешка в предсказанието
await t.choose(1); console.log('грешка:', await t.msg());
await t.choose(0);
await t.slider('.ts', 36); await wait(800); await t.shot('2a'); await t.next();
await t.slider('.ts', -16); await wait(800); await t.next();
await t.slider('.ts', 36); await wait(2000); await t.shot('2b');
await page.waitForSelector('.xp-controls .choice', { timeout: 10000 });
await t.choose(0); await t.next();
// 3. Топче и халка, термометър
await t.btn('.hot'); await wait(3000);
await t.choose(1); console.log('грешка 3:', await t.msg());
await t.choose(0); await t.btn('.drop'); await wait(1600);
await t.shot('3a');
await t.choose(0); await wait(2500); await t.shot('3b'); await t.next();
await t.slider('.ts', -8); await t.btn('.chk'); await t.shot('3c'); await t.next();
await page.fill('.xp-task .ans', '10'); await t.btn('.chk'); await t.next();
// 4. Жици и капачка
await t.choose(0); await wait(3000); await t.shot('4'); await t.next();
await t.choose(0); await t.next();
await t.shot('5');
await t.done((0.75 + 0.75 + 1) / 3);
