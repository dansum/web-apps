// Помощници за тестовете на преживяванията от 5. клас (задачите от js/exp/labtasks.js).
export async function sortAll(t) {
  const { page, wait } = t;
  for (let k = 0; k < 30; k++) {
    const ans = await page.evaluate(() => document.querySelector('.ex-area').__xp.answer);
    if (typeof ans !== 'number') return;
    await page.click(`.xp-controls .bin[data-b="${ans}"]`); await wait(350);
  }
}
export async function orderAll(t, n) {
  for (let i = 0; i < n; i++) { await t.page.click(`.xp-controls .ord[data-i="${i}"]`); await t.wait(250); }
}
// Попълва протокола от fillTask. wrong = true: първо една умишлена грешка в първата клетка.
export async function fillAll(t, wrong = false) {
  const { page, wait } = t;
  const ans = await page.evaluate(() => document.querySelector('.ex-area').__xp.fill);
  if (!ans) throw new Error('няма протокол за попълване');
  const put = async (k, v) => {
    const row = `.xp-controls .fill-row[data-k="${k}"]`;
    if (await page.$(`${row} .fill-num`)) { await page.fill(`${row} .fill-num`, String(v).replace('.', ',')); }
    else await page.click(`${row} .fill-opt[data-i="${v}"]`);
    await wait(120);
  };
  if (wrong) {
    for (let k = 0; k < ans.length; k++) {
      const isNum = await page.$(`.xp-controls .fill-row[data-k="${k}"] .fill-num`);
      await put(k, k === 0 ? (isNum ? ans[k] + 7 : (ans[k] + 1) % 3) : ans[k]);
    }
    await page.click('.xp-controls .fill-check'); await wait(400);
    console.log('грешка в протокола:', await t.msg());
  }
  for (let k = 0; k < ans.length; k++) {
    const done = await page.$(`.xp-controls .fill-row[data-k="${k}"][data-ok]`);
    if (!done) await put(k, ans[k]);
  }
  await page.click('.xp-controls .fill-check'); await wait(500);
}
