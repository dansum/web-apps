// „Дневник на града“: графики, фактори, задачи, събития и отчет за учителя.
import { FACTORS, MISSIONS } from './buildings.js';
import { MONTHS } from './sim.js';
import { lineChart, COLORS } from './charts.js';
import { toCSV } from './report.js';

const SHORT = ['ян', 'фев', 'мар', 'апр', 'май', 'юни', 'юли', 'авг', 'сеп', 'окт', 'ное', 'дек'];
export const monthLabel = h => `${SHORT[h.m]} ${String(h.y).slice(2)}`;
// Името на файла е на латиница: някои браузъри не приемат кирилица в името при сваляне.
const BG = { а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ж: 'zh', з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n',
  о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sht', ъ: 'a', ь: 'y', ю: 'yu', я: 'ya' };
const latin = name => [...name].map(c => {
  const t = BG[c.toLowerCase()];
  return t === undefined ? c : c === c.toLowerCase() ? t : t[0].toUpperCase() + t.slice(1);
}).join('').replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'uchenik';
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export function createJournal(getState, onToggle) {
  const root = document.getElementById('journal');
  let tab = 'charts';

  const panes = {
    charts(s, el) {
      if (!s.hist.length) { el.innerHTML = empty(); return; }
      const x = s.hist.map(monthLabel), col = k => s.hist.map(h => h[k]);
      el.innerHTML = '<p class="meta">Посочи графиката, за да видиш стойностите за всеки месец.</p><div class="viz-grid"></div>';
      const grid = el.querySelector('.viz-grid');
      grid.append(
        lineChart({ title: 'Пари в бюджета (€)', series: [{ name: 'Пари', values: col('money') }], xLabels: x }),
        lineChart({ title: 'Жители', series: [{ name: 'Жители', values: col('pop') }], xLabels: x, yMin: 0 }),
        lineChart({ title: 'Добруване (0–100)', series: [{ name: 'Добруване', values: col('wb') }], xLabels: x, yMin: 0, yMax: 100 }),
        lineChart({ title: 'Приходи и разходи на месец (€)', xLabels: x, yMin: 0, series: [
          { name: 'Приходи', values: col('income'), color: COLORS.s1 },
          { name: 'Разходи', values: col('upkeep'), color: COLORS.s2 },
        ] }),
      );
      el.insertAdjacentHTML('beforeend', '<p class="tip">👉 Виж как приходите растат през лятото — тогава във Варна идват туристи.</p>');
    },
    factors(s, el) {
      if (!s.hist.length) { el.innerHTML = empty(); return; }
      const x = s.hist.map(monthLabel);
      el.innerHTML = '<p class="meta">Всеки фактор е на отделна графика от 0 до 100. Кой расте и кой изостава?</p><div class="viz-grid small"></div>';
      const grid = el.querySelector('.viz-grid');
      for (const f of FACTORS) {
        grid.append(lineChart({ title: `${f.icon} ${f.name}`, height: 150, yMin: 0, yMax: 100, xLabels: x,
          series: [{ name: f.name, values: s.hist.map(h => (h.f ? h.f[f.id] : null)) }] }));
      }
    },
    missions(s, el) {
      el.innerHTML = '<ol class="mlist">' + MISSIONS.map((m, n) => {
        const d = s.done.find(x => x.n === n);
        const state = n < s.mission ? 'done' : n === s.mission ? 'now' : 'later';
        const icon = { done: '✅', now: '▶️', later: '🔒' }[state];
        const when = d ? `<span class="when">${MONTHS[d.m]} ${d.y}</span>` : state === 'now' ? '<span class="when">сега</span>' : '';
        const lesson = state === 'done' ? `<details><summary>Какво научихме</summary><p>${esc(m.lesson)}</p></details>` : '';
        return `<li class="${state}"><div class="mrow"><span>${icon}</span><b>${esc(m.text)}</b>${when}</div>${lesson}</li>`;
      }).join('') + '</ol>';
    },
    events(s, el) {
      el.innerHTML = s.events.length
        ? '<ul class="elist">' + [...s.events].reverse().map(e => `<li><span class="when">${MONTHS[e.m]} ${e.y}</span><span>${e.icon} ${esc(e.text)}</span></li>`).join('') + '</ul>'
        : '<p class="meta">Тук ще се появят важните моменти: изпълнени задачи, построени забележителности, нови жители.</p>';
    },
    report(s, el) {
      el.innerHTML = `
        <p>Свали отчет за своя град и го дай на учителя си. В него има по един ред за всеки изигран месец: пари, жители, Добруване, седемте фактора и изпълнените задачи.</p>
        <label class="field">Твоето име <input id="j-name" maxlength="40" autocomplete="off" placeholder="напр. Мария П." value="${esc(s.name)}" /></label>
        <p><button class="btn primary" id="j-dl">⬇️ Свали отчета (CSV)</button></p>
        <p class="meta">Изиграни месеци: <b>${s.hist.length}</b> · изпълнени задачи: <b>${s.mission} от ${MISSIONS.length}</b>. Файлът се отваря и в Excel.</p>`;
      const input = el.querySelector('#j-name');
      input.addEventListener('input', () => { s.name = input.value.trim(); });
      input.addEventListener('keydown', e => e.stopPropagation());
      el.querySelector('#j-dl').onclick = () => {
        if (!s.name) { input.focus(); input.classList.add('bad'); return; }
        input.classList.remove('bad');
        const blob = new Blob([toCSV(s.name, s.hist)], { type: 'text/csv;charset=utf-8' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `varna-stroi_${latin(s.name)}.csv`;
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(a.href), 1000);
      };
    },
  };

  const empty = () => '<p class="meta">Историята започва след първия изигран месец. Пусни играта ▶ и ела пак.</p>';

  function render() {
    root.querySelectorAll('[data-jtab]').forEach(b => b.classList.toggle('on', b.dataset.jtab === tab));
    const el = root.querySelector('.t-pane');
    panes[tab](getState(), el);
  }

  root.querySelectorAll('[data-jtab]').forEach(b => b.onclick = () => { tab = b.dataset.jtab; render(); });
  root.querySelector('.x').onclick = () => api.close();
  root.addEventListener('click', e => { if (e.target === root) api.close(); });

  const api = {
    open(which) { if (which) tab = which; root.hidden = false; render(); onToggle(true); },
    close() { root.hidden = true; onToggle(false); },
    isOpen: () => !root.hidden,
    // Обновява графиките след всеки месец, но не пипа полето за името, докато ученикът пише.
    refresh() { if (!root.hidden && tab !== 'report') render(); },
  };
  return api;
}
