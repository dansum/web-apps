// Въпроси: показване, проверка и обратна връзка. Общо за упражнения и тестове.
import { esc, shuffle } from './kit.js';
import { speak } from './voice.js';

// ask(el, q, { lowfi, objects, onDone(correct) })
// lowfi: опростената сцена (за въпроси „pick“ в упражнение); без нея „pick“ става избор от етикетите.
export function ask(el, q, { lowfi = null, objects = [], onDone, nextLabel = 'Напред' } = {}) {
  el.innerHTML = '';
  const box = document.createElement('div');
  box.className = 'q';
  box.innerHTML = `<p class="q-text">${esc(q.q)}</p><div class="q-body"></div>
    <div class="q-actions"><button class="btn primary q-check" disabled>Провери</button></div>
    <div class="q-feedback" hidden></div>`;
  el.appendChild(box);
  speak(q.q);
  const body = box.querySelector('.q-body');
  const checkBtn = box.querySelector('.q-check');
  const fb = box.querySelector('.q-feedback');
  const ready = (on) => { checkBtn.disabled = !on; };

  let getAnswer;
  let evaluate;
  let type = q.type;

  if (type === 'pick' && !lowfi) {
    // Във вид на избор от етикетите на обектите в сцената.
    const labels = objects.map((o) => o.label);
    const idx = objects.findIndex((o) => o.id === q.answer);
    q = { ...q, type: 'mcq', choices: labels, answer: idx };
    type = 'mcq';
  }

  if (type === 'mcq' || type === 'multi') {
    const multi = type === 'multi';
    const order = shuffle(q.choices.map((_, i) => i));
    const sel = new Set();
    body.innerHTML = `<div class="choices">${order.map((i) =>
      `<button class="choice" data-i="${i}"><span class="mark">${multi ? '☐' : '○'}</span>${esc(q.choices[i])}</button>`).join('')}</div>
      ${multi ? '<p class="hint">Може да има повече от един верен отговор.</p>' : ''}`;
    body.querySelectorAll('.choice').forEach((b) => b.addEventListener('click', () => {
      const i = +b.dataset.i;
      if (multi) { sel.has(i) ? sel.delete(i) : sel.add(i); } else { sel.clear(); sel.add(i); }
      body.querySelectorAll('.choice').forEach((c) => {
        const on = sel.has(+c.dataset.i);
        c.classList.toggle('on', on);
        c.querySelector('.mark').textContent = multi ? (on ? '☑' : '☐') : (on ? '●' : '○');
      });
      ready(sel.size > 0);
    }));
    getAnswer = () => [...sel];
    evaluate = (a) => {
      const want = multi ? q.answer.slice().sort() : [q.answer];
      const got = a.slice().sort();
      body.querySelectorAll('.choice').forEach((c) => {
        const i = +c.dataset.i;
        if (want.includes(i)) c.classList.add('right');
        else if (sel.has(i)) c.classList.add('wrong');
        c.disabled = true;
      });
      return want.length === got.length && want.every((v, k) => v === got[k]);
    };
  } else if (type === 'sort') {
    const items = shuffle(q.items.map((it, i) => ({ ...it, i })));
    const place = new Map();
    let held = null;
    body.innerHTML = `<p class="hint">Избери картичка, после кликни кошницата. Може и да я провлачиш.</p>
      <div class="pool">${items.map((it) => `<span class="chip" draggable="true" data-i="${it.i}">${esc(it.t)}</span>`).join('')}</div>
      <div class="bins">${q.bins.map((b, k) => `<div class="bin" data-k="${k}"><div class="bin-title">${esc(b)}</div><div class="bin-items"></div></div>`).join('')}</div>`;
    const pool = body.querySelector('.pool');
    const putIn = (chip, k) => {
      const i = +chip.dataset.i;
      if (k === null) { pool.appendChild(chip); place.delete(i); } else {
        body.querySelector(`.bin[data-k="${k}"] .bin-items`).appendChild(chip);
        place.set(i, k);
      }
      chip.classList.remove('held');
      held = null;
      ready(place.size === q.items.length);
    };
    body.querySelectorAll('.chip').forEach((chip) => {
      chip.addEventListener('click', (e) => {
        e.stopPropagation();
        if (held === chip) { chip.classList.remove('held'); held = null; return; }
        // Клик върху картичка в кошница, докато държиш друга: слагаме държаната в същата кошница.
        const inBin = chip.closest('.bin');
        if (held && inBin) { putIn(held, +inBin.dataset.k); return; }
        body.querySelectorAll('.chip').forEach((c) => c.classList.remove('held'));
        held = chip; chip.classList.add('held');
      });
      chip.addEventListener('dragstart', (e) => { e.dataTransfer.setData('text/plain', chip.dataset.i); });
    });
    body.querySelectorAll('.bin').forEach((bin) => {
      const k = +bin.dataset.k;
      bin.addEventListener('click', () => { if (held) putIn(held, k); });
      bin.addEventListener('dragover', (e) => { e.preventDefault(); bin.classList.add('over'); });
      bin.addEventListener('dragleave', () => bin.classList.remove('over'));
      bin.addEventListener('drop', (e) => {
        e.preventDefault(); bin.classList.remove('over');
        const chip = body.querySelector(`.chip[data-i="${e.dataTransfer.getData('text/plain')}"]`);
        if (chip) putIn(chip, k);
      });
    });
    pool.addEventListener('click', () => { if (held) putIn(held, null); });
    getAnswer = () => place;
    evaluate = (p) => {
      let ok = true;
      body.querySelectorAll('.chip').forEach((chip) => {
        const i = +chip.dataset.i;
        const good = p.get(i) === q.items[i].bin;
        chip.classList.add(good ? 'right' : 'wrong');
        if (!good) {
          ok = false;
          chip.title = `Правилно: ${q.bins[q.items[i].bin]}`;
          chip.insertAdjacentHTML('beforeend', ` <small>→ ${esc(q.bins[q.items[i].bin])}</small>`);
        }
        chip.draggable = false;
      });
      return ok;
    };
  } else if (type === 'order') {
    let cur = shuffle(q.items.map((_, i) => i));
    if (cur.every((v, k) => v === k) && cur.length > 1) cur = cur.reverse();
    const draw = () => {
      body.innerHTML = `<p class="hint">Подреди със стрелките.</p><ol class="order">${cur.map((i, k) =>
        `<li data-i="${i}"><span>${esc(q.items[i])}</span>
          <span class="ord-btns"><button class="mini" data-up="${k}" ${k === 0 ? 'disabled' : ''} aria-label="Нагоре">▲</button>
          <button class="mini" data-down="${k}" ${k === cur.length - 1 ? 'disabled' : ''} aria-label="Надолу">▼</button></span></li>`).join('')}</ol>`;
      body.querySelectorAll('[data-up]').forEach((b) => b.addEventListener('click', () => {
        const k = +b.dataset.up; [cur[k - 1], cur[k]] = [cur[k], cur[k - 1]]; draw();
      }));
      body.querySelectorAll('[data-down]').forEach((b) => b.addEventListener('click', () => {
        const k = +b.dataset.down; [cur[k + 1], cur[k]] = [cur[k], cur[k + 1]]; draw();
      }));
    };
    draw();
    ready(true);
    getAnswer = () => cur;
    evaluate = (c) => {
      const ok = c.every((v, k) => v === k);
      body.querySelectorAll('.mini').forEach((b) => { b.disabled = true; });
      body.querySelectorAll('.order li').forEach((li, k) => li.classList.add(+li.dataset.i === k ? 'right' : 'wrong'));
      if (!ok) {
        body.insertAdjacentHTML('beforeend', `<p class="hint">Правилен ред: ${q.items.map(esc).join(' → ')}</p>`);
      }
      return ok;
    };
  } else if (type === 'number') {
    body.innerHTML = `<label class="num"><input type="text" inputmode="decimal" autocomplete="off"> ${esc(q.unit || '')}</label>`;
    const inp = body.querySelector('input');
    inp.addEventListener('input', () => ready(inp.value.trim() !== ''));
    inp.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !checkBtn.disabled) checkBtn.click(); });
    setTimeout(() => inp.focus(), 0);
    getAnswer = () => parseFloat(inp.value.replace(',', '.'));
    evaluate = (v) => {
      inp.disabled = true;
      const ok = Number.isFinite(v) && Math.abs(v - q.answer) <= (q.tolerance || 0) + 1e-9;
      inp.classList.add(ok ? 'right' : 'wrong');
      if (!ok) body.insertAdjacentHTML('beforeend', `<p class="hint">Верният отговор е ${esc(String(q.answer).replace('.', ','))} ${esc(q.unit || '')}.</p>`);
      return ok;
    };
  } else if (type === 'pick') {
    let chosen = null;
    body.innerHTML = '<p class="hint pick-hint">👆 Кликни върху обекта в 3D сцената горе.</p><p class="picked"></p>';
    lowfi.setPickMode(true);
    const prevOnPick = lowfi._onPick;
    lowfi._onPick = (id) => {
      chosen = id;
      const o = objects.find((x) => x.id === id);
      body.querySelector('.picked').innerHTML = `Избра: <b>${esc(o ? o.label : id)}</b>`;
      ready(true);
    };
    getAnswer = () => chosen;
    evaluate = (id) => {
      lowfi.setPickMode(false);
      lowfi._onPick = prevOnPick;
      const ok = id === q.answer;
      lowfi.flash(id, ok);
      if (!ok) {
        lowfi.flash(q.answer, true);
        const o = objects.find((x) => x.id === q.answer);
        body.insertAdjacentHTML('beforeend', `<p class="hint">Правилно е: <b>${esc(o ? o.label : q.answer)}</b></p>`);
      }
      return ok;
    };
  } else {
    body.innerHTML = `<p class="warn">Непознат вид въпрос: ${esc(type)}</p>`;
    getAnswer = () => null;
    evaluate = () => false;
    ready(true);
  }

  checkBtn.addEventListener('click', () => {
    const ok = evaluate(getAnswer());
    checkBtn.remove();
    fb.hidden = false;
    fb.className = 'q-feedback ' + (ok ? 'ok' : 'no');
    fb.innerHTML = `<p class="verdict">${ok ? '✔ Вярно!' : '✘ Не съвсем.'}</p>
      ${q.explain ? `<p>${esc(q.explain)}</p>` : ''}
      <button class="btn primary q-next">${esc(nextLabel)}</button>`;
    speak(`${ok ? 'Вярно!' : 'Не съвсем.'} ${q.explain || ''}`);
    const nb = fb.querySelector('.q-next');
    nb.addEventListener('click', () => onDone && onDone(ok));
    nb.focus({ preventScroll: true });
  });
}
