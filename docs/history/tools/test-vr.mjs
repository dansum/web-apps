// Проверява версията за Google Cardboard (vr.html) на двете преживявания: двойна картина, поглед към място + бутон → ходене и табло,
// въпрос към царя (Търновград), знак „Не е по програмата на МОН“ (Фес), ходене към точка на земята.
// Сензорите на телефон не могат да се проверят тук: погледът се задава от теста.
// Употреба: NODE_PATH=$(npm root -g) node tools/test-vr.mjs http://localhost:8765/history/ <папка>
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
const [, , base, shots = '.'] = process.argv;
const browser = await chromium.launch();
let ok = true;
for (const [exp, first, second] of [['tarnovgrad', 'gate', 'royals'], ['shkoli', 'students', 'fes']]) {
  const page = await browser.newPage({ viewport: { width: 844, height: 390 } });
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(`${base}vr.html?exp=${exp}`);
  // Първо се отговаря на прозорчето за съгласие (тук — отказ), както би направило дете.
  await page.waitForSelector('#d4c button', { timeout: 8000 }).then((b) => b.click()).catch(() => {});
  await page.click('#go');
  await page.waitForFunction(() => !!window.__vr, null, { timeout: 60000 });
  const wait = (ms) => page.waitForTimeout(ms);
  await wait(3000);
  // Отива до място: гледа към табелката му и „натиска бутона“; чака да пристигне.
  const go = async (id) => {
    await page.evaluate((id) => { const v = window.__vr, p = v.world.places.get(id); v.lookAt(p.x, p.y + p.top + 2.2, p.z); }, id);
    await wait(700);
    const g = await page.evaluate(() => window.__vr.gazed());
    await page.evaluate(() => window.__vr.tap());
    await page.waitForFunction(() => !window.__vr.state.path, null, { timeout: 150000 });
    await wait(600);
    const r = await page.evaluate((id) => { const v = window.__vr, s = v.world.places.get(id).site.stand; return { d: Math.hypot(v.state.x - s[0], v.state.z - s[1]), ...v.boards(), seen: v.state.seen.size }; }, id);
    console.log(exp, id, '| поглед:', JSON.stringify(g), '| до мястото m', r.d.toFixed(1), '| табло', r.info, '| табелки с въпроси', r.buttons, '| разгледани', r.seen);
    return { g, r };
  };
  const a = await go(first);
  await page.screenshot({ path: `${shots}/vr-${exp}-1.png` });
  const b = await go(second);
  await page.screenshot({ path: `${shots}/vr-${exp}-2.png` });
  let extra = true;
  if (exp === 'tarnovgrad') {
    // Задържане на погледа върху въпрос (без бутон) дава отговора.
    // Задържане на погледа (без бутон): първо „Попитай царя“, после първия му въпрос.
    const dwellOn = (k) => page.evaluate(async (k) => {
      const v = window.__vr, b = v.button(k);
      v.lookAt(b.x, b.y, b.z);
      await new Promise((r) => setTimeout(r, 9000));
      return v.boards();
    }, k);
    const s1 = await dwellOn(0);
    const s2 = await dwellOn(0);
    console.log(exp, 'при царя: табелки', b.r.buttons, '→ след избор', s1.buttons, '→ зададени въпроси', s2.asked);
    extra = b.r.buttons === 2 && s1.buttons === 7 && s2.asked === 1;
    await page.screenshot({ path: `${shots}/vr-${exp}-3.png` });
  } else {
    // Поглед към земята + бутон: тръгва натам.
    const moved = await page.evaluate(async () => {
      const v = window.__vr, x0 = v.state.x, z0 = v.state.z;
      v.lookAt(x0 + 5, 0.1, z0 + 5);
      await new Promise((r) => setTimeout(r, 800));
      const g = v.gazed(); v.tap();
      await new Promise((r) => setTimeout(r, 6000));
      return { g, d: Math.hypot(v.state.x - x0, v.state.z - z0) };
    });
    console.log(exp, 'поглед към земята:', JSON.stringify(moved.g), '| изминати m', moved.d.toFixed(1));
    extra = moved.g && moved.g.vr === 'ground' && moved.d > 1;
  }
  console.log(exp, 'грешки в конзолата:', errors.length ? errors : 'няма');
  ok = ok && a.g && a.g.id === first && a.r.d < 1 && a.r.info && b.g && b.g.id === second && b.r.d < 1 && b.r.info && b.r.seen === 2 && extra && !errors.length;
  await page.close();
}
await browser.close();
process.exit(ok ? 0 : 1);
