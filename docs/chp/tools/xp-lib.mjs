// Общи помощници за тестовете на 3D преживяванията (Playwright).
// Употреба в тест: const t = await open(base, '5.2.3', shots, width); … await t.done(want);
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');

export async function open(base, skillId, shots = '.', width = '1280') {
  const W = +width, H = W < 600 ? 844 : 900;
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: W, height: H } });
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('requestfailed', (r) => { if (!/youtube/.test(r.url())) errors.push('заявка: ' + r.url()); });
  await page.goto(`${base}#/s/${skillId}`);
  await page.waitForSelector('.xp .xp-controls', { timeout: 20000 });
  // Съобщението за бисквитки закрива сцената: отказваме.
  const no = page.getByRole('button', { name: 'Отказвам' });
  if (await no.isVisible().catch(() => false)) await no.click();
  await page.locator('.xp-stage').scrollIntoViewIfNeeded();
  const wait = (ms) => page.waitForTimeout(ms);
  await wait(1500);
  const pos = (id, key = 'pickId') => page.evaluate(([i, k]) => {
    const s = document.querySelector('.xp-stage');
    if (!s) throw new Error('няма сцена: ' + location.hash + ' | ' + document.body.innerText.slice(0, 300));
    return s.__stage.screenOf(i, k);
  }, [id, key]);
  const t = {
    page, wait, W, errors,
    async shot(name) {
      await page.evaluate(() => { const e = document.querySelector('.xp'); scrollTo(0, e.getBoundingClientRect().top + scrollY - 70); });
      await wait(200);
      await page.locator('.xp').screenshot({ path: `${shots}/${skillId}-${name}-${W}.png` }); },
    async click(id) {
      await page.locator('.xp-stage').scrollIntoViewIfNeeded(); await wait(150);
      const p = await pos(id);
      if (!p) throw new Error('няма ' + id);
      const r = await page.$eval('.xp-stage', (el) => { const b = el.getBoundingClientRect(); return { l: b.left, t: b.top, r: b.right, b: b.bottom }; });
      if (p.x < r.l || p.x > r.r || p.y < Math.max(0, r.t) || p.y > r.b) throw new Error(`${id} е извън сцената (${Math.round(p.x)}, ${Math.round(p.y)})`);
      await page.mouse.click(p.x, p.y); await wait(400);
    },
    pos,
    async drag(id, toId) {
      await page.locator('.xp-stage').scrollIntoViewIfNeeded(); await wait(150);
      const a = await pos(id, 'dragId'); const b = await pos(toId);
      if (!a || !b) throw new Error('няма ' + id + ' / ' + toId);
      await page.mouse.move(a.x, a.y); await page.mouse.down();
      for (let k = 1; k <= 12; k++) await page.mouse.move(a.x + (b.x - a.x) * k / 12, a.y + (b.y - a.y) * k / 12);
      await page.mouse.up(); await wait(400);
    },
    // Избор в .choices по индекс в options.
    async choose(i) { await page.click(`.xp-controls .choice[data-i="${i}"]`); await wait(400); },
    async btn(sel) { await page.click(`.xp-controls ${sel}`); await wait(500); },
    async next() { const b = page.locator('.xp-controls .nx'); await b.last().click(); await wait(1300); },
    msg: () => page.textContent('.xp-msg'),
    async menuAll() {
      // Отваря менюто (на тесен екран е свито) и разглежда всичко.
      const head = page.locator('.corner-menu .cm-head');
      const items = page.locator('.corner-menu .cm-item');
      const n = await page.locator('.corner-menu .cm-item').count() || null;
      if (!n) await head.click();
      const cnt = await items.count();
      for (let i = 0; i < cnt; i++) {
        if (!(await items.nth(i).isVisible())) await head.click();
        await items.nth(i).click(); await wait(700);
      }
    },
    async slider(sel, v) {
      await page.$eval(`.xp-panel ${sel}`, (el, val) => { el.value = val; el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); }, String(v));
      await wait(300);
    },
    async done(want) {
      const ratio = await page.evaluate(() => document.querySelector('.ex-area').__xp.ratio);
      const txt = await page.textContent('.xp-task');
      console.log('резултат:', ratio, 'очакван:', want, '|', txt.replace(/\s+/g, ' ').trim().slice(0, 60));
      // „Започни отначало“ връща на стъпка 1 с меню за разглеждане.
      await page.click('.xp-controls .again'); await wait(1200);
      const title = await page.textContent('.xp-title');
      const fresh = /^1\./.test(title) && (await page.locator('.corner-menu:not([hidden])').count()) > 0;
      console.log('отначало:', title, fresh ? '✓' : '✗');
      console.log('грешки в конзолата:', errors.length ? errors : 'няма');
      await browser.close();
      process.exit(ratio != null && Math.abs(ratio - want) < 1e-6 && fresh && !errors.length ? 0 : 1);
    },
  };
  return t;
}
