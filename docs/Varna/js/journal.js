// „Дневник на града“: графики, фактори, задачи, събития и отчет за учителя.
import { FACTORS, MISSIONS, BUILDINGS } from './buildings.js';
import { MONTHS } from './sim.js';
import { lineChart, COLORS } from './charts.js';
import { toCSV } from './report.js';
import { tr, EN } from './i18n.js';

const SHORT = tr(['ян', 'фев', 'мар', 'апр', 'май', 'юни', 'юли', 'авг', 'сеп', 'окт', 'ное', 'дек'],
  ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']);
export const monthLabel = h => `${SHORT[h.m]} ${String(h.y).slice(2)}`;

// Събитията се пазят като вид + данни, а текстът се прави при показване — на избрания език.
function eventLine(e) {
  if (!e.kind) return `${e.icon || ''} ${esc(e.text || '')}`; // записи от по-стара версия
  if (e.kind === 'mission') {
    const m = MISSIONS[e.n];
    return `🏅 ${tr(`Изпълнена задача ${e.n + 1}`, `Task ${e.n + 1} complete`)}: ${esc(m ? m.short : '')}`;
  }
  if (e.kind === 'built') {
    const d = BUILDINGS[e.t];
    return `${d ? d.icon : '🏛️'} ${tr('Построена', 'Built')}: ${esc(d ? d.name : e.t)}`;
  }
  if (e.kind === 'pop') return `👥 ${tr(`Градът стигна ${e.mark} жители`, `The city reached ${e.mark} residents`)}`;
  if (e.kind === 'debt') return `⚠️ ${tr('Бюджетът падна под нулата', 'The budget fell below zero')}`;
  if (e.kind === 'recovered') return `💶 ${tr('Бюджетът отново е на плюс', 'The budget is back above zero')}`;
  return '';
}
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
      el.innerHTML = `<p class="meta">${tr('Посочи графиката, за да видиш стойностите за всеки месец.', 'Point at a chart to see the numbers for each month.')}</p><div class="viz-grid"></div>`;
      const grid = el.querySelector('.viz-grid');
      grid.append(
        lineChart({ title: tr('Пари в бюджета (€)', 'Money in the budget (€)'), series: [{ name: tr('Пари', 'Money'), values: col('money') }], xLabels: x }),
        lineChart({ title: tr('Жители', 'Residents'), series: [{ name: tr('Жители', 'Residents'), values: col('pop') }], xLabels: x, yMin: 0 }),
        lineChart({ title: tr('Добруване (0–100)', 'Well-being (0–100)'), series: [{ name: tr('Добруване', 'Well-being'), values: col('wb') }], xLabels: x, yMin: 0, yMax: 100 }),
        lineChart({ title: tr('Приходи и разходи на месец (€)', 'Income and spending per month (€)'), xLabels: x, yMin: 0, series: [
          { name: tr('Приходи', 'Income'), values: col('income'), color: COLORS.s1 },
          { name: tr('Разходи', 'Spending'), values: col('upkeep'), color: COLORS.s2 },
        ] }),
      );
      el.insertAdjacentHTML('beforeend', `<p class="tip">👉 ${tr('Виж как приходите растат през лятото — тогава във Варна идват туристи.', 'See how income goes up in summer — that is when tourists come to Varna.')}</p>`);
    },
    factors(s, el) {
      if (!s.hist.length) { el.innerHTML = empty(); return; }
      const x = s.hist.map(monthLabel);
      el.innerHTML = `<p class="meta">${tr('Всеки фактор е на отделна графика от 0 до 100. Кой расте и кой изостава?', 'Each factor has its own chart from 0 to 100. Which ones are growing and which are falling behind?')}</p><div class="viz-grid small"></div>`;
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
        const when = d ? `<span class="when">${MONTHS[d.m]} ${d.y}</span>` : state === 'now' ? `<span class="when">${tr('сега', 'now')}</span>` : '';
        const lesson = state === 'done' ? `<details><summary>${tr('Какво научихме', 'What we learned')}</summary><p>${esc(m.lesson)}</p></details>` : '';
        return `<li class="${state}"><div class="mrow"><span>${icon}</span><b>${esc(m.text)}</b>${when}</div>${lesson}</li>`;
      }).join('') + '</ol>';
    },
    events(s, el) {
      el.innerHTML = s.events.length
        ? '<ul class="elist">' + [...s.events].reverse().map(e => `<li><span class="when">${MONTHS[e.m]} ${e.y}</span><span>${eventLine(e)}</span></li>`).join('') + '</ul>'
        : `<p class="meta">${tr('Тук ще се появят важните моменти: изпълнени задачи, построени забележителности, нови жители.', 'Important moments will appear here: completed tasks, landmarks built, new residents.')}</p>`;
    },
    report(s, el) {
      el.innerHTML = tr(`
        <p>Свали отчет за своя град и го дай на учителя си. В него има по един ред за всеки изигран месец: пари, жители, Добруване, седемте фактора и изпълнените задачи.</p>
        <label class="field">Твоето име <input id="j-name" maxlength="40" autocomplete="off" placeholder="напр. Мария П." value="${esc(s.name)}" /></label>
        <p><button class="btn primary" id="j-dl">⬇️ Свали отчета (CSV)</button></p>
        <p class="meta">Изиграни месеци: <b>${s.hist.length}</b> · изпълнени задачи: <b>${s.mission} от ${MISSIONS.length}</b>. Файлът се отваря и в Excel.</p>`, `
        <p>Download a report about your city and give it to your teacher. It has one row for each month you played: money, residents, Well-being, the seven factors and the tasks you completed.</p>
        <label class="field">Your name <input id="j-name" maxlength="40" autocomplete="off" placeholder="e.g. Maria P." value="${esc(s.name)}" /></label>
        <p><button class="btn primary" id="j-dl">⬇️ Download the report (CSV)</button></p>
        <p class="meta">Months played: <b>${s.hist.length}</b> · tasks completed: <b>${s.mission} of ${MISSIONS.length}</b>. The file also opens in Excel.</p>`);
      const input = el.querySelector('#j-name');
      input.addEventListener('input', () => { s.name = input.value.trim(); });
      input.addEventListener('keydown', e => e.stopPropagation());
      el.querySelector('#j-dl').onclick = () => {
        if (!s.name) { input.focus(); input.classList.add('bad'); return; }
        input.classList.remove('bad');
        const blob = new Blob([toCSV(s.name, s.hist)], { type: 'text/csv;charset=utf-8' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `${EN ? 'varna-builds' : 'varna-stroi'}_${latin(s.name)}.csv`;
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(a.href), 1000);
      };
    },
  };

  const empty = () => `<p class="meta">${tr('Историята започва след първия изигран месец. Пусни играта ▶ и ела пак.', 'The history starts after the first month of play. Press ▶ and come back later.')}</p>`;

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
