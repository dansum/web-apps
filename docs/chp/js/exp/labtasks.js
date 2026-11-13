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
// onPick(i) се вика при всеки верен избор (напр. за да се покаже нещо в сцената).
export function orderTask(ctx, { q, items, hint = '', mistakes = 0, onPick, onDone }) {
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
    if (onPick) onPick(i);
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

// Попълване на протокол: детето само попълва клетките (избор от думи или число), после натиска „Провери“.
// rows: [{ label, options: [..], answer: индекс, why? }] или [{ label, number: true, answer, tol = 0, unit, why? }].
// Грешните клетки се оцветяват и могат да се поправят; всяка неуспешна проверка е една грешка.
// ctx.fill пази верните отговори за автоматичните тестове.
export function fillTask(ctx, { lead = '', rows, hint = '', mistakes = 0, onDone }) {
  const { shell } = ctx;
  let m = mistakes;
  const val = rows.map(() => null);
  ctx.fill = rows.map((r) => r.answer);
  const c = shell.setControls(`${lead ? `<p>${lead}</p>` : ''}
    ${rows.map((r, k) => `<div class="fill-row" data-k="${k}" style="margin:8px 0"><div class="small"><b>${r.label}</b></div>
      ${r.number
        ? `<input class="fill-num" type="text" inputmode="decimal" autocomplete="off" style="width:6em;font:inherit;padding:4px 6px;border:2px solid #bfe9dc;border-radius:8px" aria-label="${esc(r.label)}"> ${esc(r.unit || '')}`
        : `<div class="xp-chips">${r.options.map((o, i) => `<span class="chip fill-opt" role="button" tabindex="0" data-i="${i}">${esc(o)}</span>`).join('')}</div>`}</div>`).join('')}
    <div class="row"><button class="btn primary fill-check" disabled>Провери</button></div>`);
  const btn = c.querySelector('.fill-check');
  const upd = () => { btn.disabled = val.some((v) => v === null); };
  c.querySelectorAll('.fill-row').forEach((row) => {
    const k = +row.dataset.k;
    row.querySelectorAll('.fill-opt').forEach((ch) => {
      const pick = () => {
        if (row.dataset.ok) return;
        row.querySelectorAll('.fill-opt').forEach((x) => x.classList.remove('held', 'wrong'));
        ch.classList.add('held');
        val[k] = +ch.dataset.i;
        upd();
      };
      ch.addEventListener('click', pick);
      ch.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(); } });
    });
    const inp = row.querySelector('.fill-num');
    if (inp) inp.addEventListener('input', () => {
      const v = parseFloat(inp.value.replace(',', '.'));
      val[k] = Number.isFinite(v) ? v : null;
      inp.style.borderColor = '#bfe9dc';
      upd();
    });
  });
  btn.addEventListener('click', () => {
    const bad = [];
    rows.forEach((r, k) => {
      const row = c.querySelector(`.fill-row[data-k="${k}"]`);
      if (row.dataset.ok) return;
      const ok = r.number ? Math.abs(val[k] - r.answer) <= (r.tol || 0) + 1e-9 : val[k] === r.answer;
      const inp = row.querySelector('.fill-num');
      const ch = row.querySelector('.fill-opt.held');
      if (ok) {
        row.dataset.ok = '1';
        if (inp) { inp.disabled = true; inp.style.borderColor = 'var(--green)'; }
        if (ch) { ch.classList.remove('held'); ch.classList.add('right'); }
      } else {
        bad.push(r);
        if (inp) inp.style.borderColor = 'var(--red)';
        if (ch) { ch.classList.remove('held'); ch.classList.add('wrong'); val[k] = null; }
      }
    });
    if (bad.length) {
      m++;
      upd();
      shell.msg(`Провери пак: ${bad.map((r) => `„${r.label}“`).join(', ')}. ${bad[0].why || ''}${m >= 2 && hint ? ' Подсказка: ' + hint : ''}`, 'bad');
      return;
    }
    btn.disabled = true;
    ctx.fill = null;
    shell.msg('Протоколът е попълнен вярно!', 'good');
    onDone(m);
  });
  return c;
}
