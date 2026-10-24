// „Резултати на класа“: зарежда отчетите на учениците и ги обобщава в графики.
// Всичко се смята в браузъра; нищо не се изпраща към сървър.
import { FACTORS, MISSIONS } from './buildings.js';
import { parseCSV } from './report.js';
import { lineChart, barChart, fmt } from './charts.js';
import { rng } from './map.js';

const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const avg = xs => { const v = xs.filter(x => x !== null && x !== undefined); return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null; };

const students = new Map(); // име → месеци
let errors = [];
let demo = false;
let sort = { key: 'name', dir: 1 };

async function addFiles(files) {
  if (demo) { students.clear(); errors = []; demo = false; }
  for (const file of files) {
    const text = await file.text();
    const { rows, error } = parseCSV(text, file.name.replace(/\.csv$/i, ''));
    if (error) { errors.push(`${file.name}: ${error}`); continue; }
    const byName = new Map();
    for (const r of rows) {
      if (!byName.has(r.name)) byName.set(r.name, []);
      byName.get(r.name).push(r);
    }
    // Ако един ученик е изпратил отчета си два пъти, пазим по-дългия.
    for (const [name, list] of byName) {
      if (!students.has(name) || students.get(name).length <= list.length) students.set(name, list);
    }
  }
  render();
}

function summary(name, rows) {
  const last = rows[rows.length - 1];
  const weakest = FACTORS.filter(f => last.f[f.id] !== null)
    .reduce((a, f) => (!a || last.f[f.id] < last.f[a.id] ? f : a), null);
  return { name, rows, last, months: rows.length, missions: Math.max(...rows.map(r => r.missions || 0)),
    wb: last.wb, pop: last.pop, money: last.money, weakest };
}

function render() {
  const list = [...students].map(([n, r]) => summary(n, r));
  $('loaded').innerHTML = (list.length
    ? `<p><b>Заредени ученици: ${list.length}</b>${demo ? ' <span class="tag">примерни данни</span>' : ''}</p>` : '') +
    (errors.length ? `<ul class="errs">${errors.map(e => `<li>⚠️ ${esc(e)}</li>`).join('')}</ul>` : '');
  $('clear').hidden = $('print').hidden = !list.length && !errors.length;
  const out = $('results');
  out.hidden = !list.length;
  out.innerHTML = '';
  if (!list.length) return;

  const N = list.length;
  const tiles = [
    ['Ученици', N, ''],
    ['Средно Добруване', avg(list.map(s => s.wb)), 'от 100, в последния месец'],
    ['Средно задачи', avg(list.map(s => s.missions)), `от ${MISSIONS.length}`],
    ['Средно жители', avg(list.map(s => s.pop)), 'в последния месец'],
    ['Средно месеци', avg(list.map(s => s.months)), 'изиграни'],
  ];
  out.insertAdjacentHTML('beforeend', `<section class="tiles">${tiles.map(([l, v, sub]) => `
    <div class="tile"><span class="tl">${l}</span><span class="tv">${l === 'Средно задачи' ? (v ?? 0).toFixed(1).replace('.', ',') : fmt(v)}</span><span class="ts">${sub}</span></div>`).join('')}</section>`);

  // Изводи за учителя: най-слабият и най-силният фактор, задачата, на която са спрели повечето.
  const fAvg = FACTORS.map(f => ({ f, v: avg(list.map(s => s.last.f[f.id])) })).filter(x => x.v !== null);
  const weak = fAvg.reduce((a, x) => (x.v < a.v ? x : a), fAvg[0]);
  const strong = fAvg.reduce((a, x) => (x.v > a.v ? x : a), fAvg[0]);
  const stuck = new Map();
  for (const s of list) if (s.missions < MISSIONS.length) stuck.set(s.missions, (stuck.get(s.missions) || 0) + 1);
  const top = [...stuck].sort((a, b) => b[1] - a[1])[0];
  const finished = list.filter(s => s.missions >= MISSIONS.length).length;
  const ideas = [];
  if (weak) ideas.push(`<li><b>Най-слаб фактор за класа: ${weak.f.icon} ${weak.f.name} (${fmt(weak.v)}).</b> Обсъдете: ${esc(weak.f.why)} <i>Подсказка за учениците: ${esc(weak.f.tip)}</i></li>`);
  if (strong && strong !== weak) ideas.push(`<li><b>Най-силен фактор: ${strong.f.icon} ${strong.f.name} (${fmt(strong.v)}).</b> Попитайте учениците какво направиха, за да го вдигнат.</li>`);
  if (top) ideas.push(`<li><b>${top[1]} от ${N} ученици са спрели на задача ${top[0] + 1}: „${esc(MISSIONS[top[0]].text)}“</b> Може да я решите заедно на дъската.</li>`);
  if (finished) ideas.push(`<li>${finished} от ${N} ученици са изпълнили всички задачи.</li>`);
  out.insertAdjacentHTML('beforeend', `<section class="page-card"><h2>Какво да обсъдим в час</h2><ul class="ideas">${ideas.join('')}</ul></section>`);

  const charts = document.createElement('section');
  charts.className = 'viz-grid wide';
  out.appendChild(charts);

  charts.append(barChart({
    title: 'Колко ученици изпълниха всяка задача',
    max: N,
    bars: MISSIONS.map((m, n) => {
      const c = list.filter(s => s.missions > n).length;
      return { label: `${n + 1}. ${m.short}`, value: c, note: `${c} от ${N} ученици — ${m.text}` };
    }),
  }));

  charts.append(barChart({
    title: 'Средно ниво на факторите в последния месец (0–100)',
    max: 100,
    bars: fAvg.map(({ f, v }) => {
      const low = [...list].filter(s => s.last.f[f.id] !== null).sort((a, b) => a.last.f[f.id] - b.last.f[f.id]).slice(0, 3);
      return { label: `${f.icon} ${f.name}`, value: v, note: `Най-ниско при: ${low.map(s => `${s.name} (${fmt(s.last.f[f.id])})`).join(', ')}` };
    }),
  }));

  // Месеците се броят от началото на играта на всеки ученик, за да са сравними.
  const maxM = Math.max(...list.map(s => s.months));
  const x = Array.from({ length: maxM }, (_, i) => `м. ${i + 1}`);
  const over = (key, title, opts = {}) => {
    const series = list.map(s => ({ name: s.name, faint: true, values: x.map((_, i) => (s.rows[i] ? s.rows[i][key] : null)) }));
    const mean = x.map((_, i) => avg(list.map(s => (s.rows[i] ? s.rows[i][key] : null))));
    charts.append(lineChart({ title, xLabels: x, ...opts, series: [...series, { name: 'Средно за класа', values: mean }] }));
  };
  over('wb', 'Добруване по месеци (0–100)', { yMin: 0, yMax: 100 });
  over('pop', 'Жители по месеци', { yMin: 0 });
  over('money', 'Пари в бюджета по месеци (€)');
  out.insertAdjacentHTML('beforeend', '<p class="meta">На линейните графики сивите линии са отделните ученици, синята е средното за класа. Посочете линия, за да видите чия е.</p>');

  const cols = [
    ['name', 'Ученик'], ['months', 'Месеци'], ['missions', 'Задачи'], ['wb', 'Добруване'],
    ['pop', 'Жители'], ['money', 'Пари (€)'], ['weakest', 'Най-слаб фактор'],
  ];
  const val = (s, k) => (k === 'weakest' ? (s.weakest ? s.last.f[s.weakest.id] : 999) : s[k]);
  const sorted = [...list].sort((a, b) => {
    const A = val(a, sort.key), B = val(b, sort.key);
    return (typeof A === 'string' ? A.localeCompare(B, 'bg') : (A ?? -1e9) - (B ?? -1e9)) * sort.dir;
  });
  const table = document.createElement('section');
  table.className = 'page-card';
  table.innerHTML = `<h2>Всички ученици</h2><div class="table-wrap"><table class="results"><thead><tr>${cols.map(([k, l]) =>
    `<th><button data-sort="${k}">${l}${sort.key === k ? (sort.dir > 0 ? ' ▲' : ' ▼') : ''}</button></th>`).join('')}</tr></thead><tbody>${sorted.map(s => `
      <tr><td>${esc(s.name)}</td><td>${s.months}</td><td>${s.missions} / ${MISSIONS.length}</td><td>${fmt(s.wb)}</td>
      <td>${fmt(s.pop)}</td><td>${fmt(s.money)}</td><td>${s.weakest ? `${s.weakest.icon} ${s.weakest.name} (${fmt(s.last.f[s.weakest.id])})` : '—'}</td></tr>`).join('')}
    </tbody></table></div>`;
  table.querySelectorAll('[data-sort]').forEach(b => b.onclick = () => {
    sort = { key: b.dataset.sort, dir: sort.key === b.dataset.sort ? -sort.dir : (b.dataset.sort === 'name' ? 1 : -1) };
    render();
  });
  out.appendChild(table);
}

// Измислени ученици, за да види учителят как изглежда страницата, преди да има истински отчети.
function demoData() {
  const r = rng(2026);
  const letters = 'АБВГДЕЖЗИКЛМНОП';
  const bias = { home: 8, work: 4, edu: 10, health: 2, nature: -14, transport: -10, culture: -6 };
  students.clear(); errors = []; demo = true;
  for (let k = 0; k < 14; k++) {
    const name = `Ученик ${letters[k]}`, months = 14 + Math.floor(r() * 30), skill = 0.4 + r() * 0.6;
    const rows = [];
    let money = 2600, pop = 6;
    for (let t = 0; t < months; t++) {
      const m = t % 12, y = 2026 + Math.floor(t / 12);
      const wb = Math.round(Math.min(95, 25 + (40 + 30 * skill) * (1 - Math.exp(-t / (6 + 6 * (1 - skill)))) + (r() - 0.5) * 6));
      const f = {};
      for (const x of FACTORS) f[x.id] = Math.max(0, Math.min(100, Math.round(wb + bias[x.id] * (1.3 - skill) + (r() - 0.5) * 16)));
      pop = Math.round(pop + (8 + 30 * skill) * (0.6 + r() * 0.8));
      const summer = [5, 6, 7, 8].includes(m) ? 60 * skill : 0;
      const income = Math.round(pop * 1 + 30 + summer), upkeep = Math.round(20 + t * 2.2 * (1.2 - skill));
      money = Math.round(money + income - upkeep - (r() < 0.25 ? 300 + r() * 500 : 0));
      const missions = Math.min(MISSIONS.length, Math.floor((t / months) * (3 + skill * 8.5)));
      rows.push({ name, y, m, money, pop, wb, f, income, upkeep, missions });
    }
    students.set(name, rows);
  }
  render();
}

$('files').addEventListener('change', e => { addFiles([...e.target.files]); e.target.value = ''; });
const drop = $('drop');
['dragenter', 'dragover'].forEach(t => drop.addEventListener(t, e => { e.preventDefault(); drop.classList.add('over'); }));
['dragleave', 'drop'].forEach(t => drop.addEventListener(t, e => { e.preventDefault(); drop.classList.remove('over'); }));
drop.addEventListener('drop', e => addFiles([...e.dataTransfer.files].filter(f => /\.csv$/i.test(f.name) || f.type.includes('csv'))));
$('demo').onclick = demoData;
$('clear').onclick = () => { students.clear(); errors = []; demo = false; render(); };
$('print').onclick = () => window.print();
