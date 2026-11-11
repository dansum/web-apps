// Помощници за тестовете на преживяванията от 5. клас (задачите от js/exp/labtasks.js).
export async function sortAll(t) {
  const { page, wait } = t;
  for (let k = 0; k < 30; k++) {
    const ans = await page.evaluate(() => document.querySelector('.ex-area').__xp.answer);
    if (ans === null || ans === undefined) return;
    await page.click(`.xp-controls .bin[data-b="${ans}"]`); await wait(350);
  }
}
export async function orderAll(t, n) {
  for (let i = 0; i < n; i++) { await t.page.click(`.xp-controls .ord[data-i="${i}"]`); await t.wait(250); }
}
