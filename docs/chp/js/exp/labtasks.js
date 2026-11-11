// Общи задачи в панела за преживяванията от 5. клас (5.1.4–5.2.5):
// сортиране по групи с насочване към обекта в сцената и подреждане по ред.
import { shuffle, esc } from '../kit.js';

// Сортиране: детето взема примерите един по един и избира група.
// items: [{ t, bin, why?, no?, show?() }]. show() може да насочи камерата и да покаже балонче.
// ctx.answer пази верния отговор за автоматичните тестове.
export function sortTask(ctx, { lead = '', bins, items, hint = '', mixed = true, mistakes = 0, onDone }) {
  const { shell } = ctx;
  const list = mixed ? shuffle(items) : items.slice();
  let k = 0;
  let m = mistakes;
  const draw = () => {
    const it = list[k];
    ctx.answer = it.bin;
    const c = shell.setControls(`${lead ? `<p>${lead}</p>` : ''}<p class="small">${k + 1} от ${list.length}</p>
      <p><b>${it.t}</b></p>
      <div class="choices">${bins.map((b, i) => `<button class="choice bin" data-b="${i}">${esc(b)}</button>`).join('')}</div>`);
    if (it.show) it.show();
    c.querySelectorAll('.bin').forEach((b) => b.addEventListener('click', () => {
      if (b.disabled) return;
      const i = +b.dataset.b;
      if (i !== it.bin) {
        m++;
        b.classList.add('wrong');
        b.disabled = true;
        shell.msg(`${it.no || `Не е „${bins[i]}“. Помисли пак.`}${m >= 2 && hint ? ' Подсказка: ' + hint : ''}`, 'bad');
        return;
      }
      shell.msg(it.why || 'Вярно!', 'good');
      k++;
      if (k < list.length) draw();
      else { ctx.answer = null; shell.setControls(''); onDone(m); }
    }));
  };
  draw();
}

// Подреждане: детето кликва примерите по ред. items е в правилния ред; data-i е верният индекс.
export function orderTask(ctx, { q, items, hint = '', mistakes = 0, onDone }) {
  const { shell } = ctx;
  let m = mistakes;
  let k = 0;
  const c = shell.setControls(`<p><b>${q}</b></p><ol class="small ord-done"></ol>
    <div class="choices">${shuffle(items.map((_, i) => i)).map((i) => `<button class="choice ord" data-i="${i}">${items[i]}</button>`).join('')}</div>`);
  const done = c.querySelector('.ord-done');
  c.querySelectorAll('.ord').forEach((b) => b.addEventListener('click', () => {
    if (b.disabled) return;
    const i = +b.dataset.i;
    if (i !== k) {
      m++;
      b.classList.add('wrong');
      setTimeout(() => b.classList.remove('wrong'), 700);
      shell.msg(`Това не е № ${k + 1}.${m >= 2 && hint ? ' Подсказка: ' + hint : ''}`, 'bad');
      return;
    }
    b.disabled = true;
    b.classList.add('right');
    b.style.display = 'none';
    done.insertAdjacentHTML('beforeend', `<li>${items[i]}</li>`);
    k++;
    if (k === items.length) { shell.msg('Вярно подредено!', 'good'); onDone(m); }
    else shell.msg('');
  }));
  return c;
}

// Кликване в сцената на точно определен обект (или няколко). ok(id) → true/false/null (null = пренебрегни).
export function pickTask(ctx, { ok, onWrong, onRight }) {
  let m = 0;
  ctx.click = (id) => {
    if (!id) return;
    const r = ok(id);
    if (r === null || r === undefined) return;
    if (!r) { m++; onWrong && onWrong(id, m); return; }
    onRight && onRight(id, m);
  };
  return { get mistakes() { return m; } };
}
