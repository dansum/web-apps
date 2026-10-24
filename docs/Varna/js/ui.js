// Панелите около картата: горна лента, фактори, мисия, инструменти, съобщения.
import { FACTORS, GROUPS, TOOLS, BUILDINGS } from './buildings.js';
import { MONTHS, SEASON } from './sim.js';

const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export const face = v => v === null ? '😶' : v >= 75 ? '😄' : v >= 55 ? '🙂' : v >= 35 ? '😐' : '😟';
const barColor = v => `hsl(${Math.round(v * 1.2)},70%,45%)`;

export function stats(s, ev) {
  $('st-money').textContent = `💶 ${Math.round(s.money)} €`;
  $('st-money').classList.toggle('neg', s.money < 0);
  $('st-pop').textContent = `👥 ${s.pop}`;
  $('st-date').textContent = `${SEASON[s.month] >= 1.6 ? '☀️' : s.month < 2 || s.month === 11 ? '❄️' : '🌤️'} ${MONTHS[s.month]} ${s.year}`;
  $('st-wb').innerHTML = `${face(ev.wellbeing)} <span>Добруване ${ev.wellbeing ?? '—'}</span>`;
}

export function speed(v) {
  document.querySelectorAll('[data-speed]').forEach(b => b.classList.toggle('on', +b.dataset.speed === v));
}

export function factors(ev, selected, onPick) {
  const el = $('factors');
  el.innerHTML = '<h3>Добруване на града</h3>' + FACTORS.map(f => {
    const v = ev.factors ? ev.factors[f.id] : null;
    return `<button class="factor${selected === f.id ? ' on' : ''}" data-f="${f.id}" title="${esc(f.name)}: натисни, за да видиш картата">
      <span class="ic">${f.icon}</span><span class="nm">${f.name}</span>
      <span class="bar"><i style="width:${v ?? 0}%;background:${barColor(v ?? 0)}"></i></span>
      <span class="val">${v ?? '—'}</span></button>`;
  }).join('');
  el.querySelectorAll('.factor').forEach(b => b.onclick = () => onPick(b.dataset.f));
}

export function mission(m, n, total) {
  $('mission').innerHTML = m
    ? `<div class="lbl">Задача ${n} от ${total}</div><p>${esc(m.text)}</p>`
    : `<div class="lbl">Всички задачи са изпълнени!</div><p>Продължи да строиш свободно.</p>`;
}

let group = 'tools';
export function toolbar(s, tool, onTool) {
  $('groups').innerHTML = GROUPS.map(g => `<button class="${g.id === group ? 'on' : ''}" data-g="${g.id}">${g.name}</button>`).join('');
  $('groups').querySelectorAll('button').forEach(b => b.onclick = () => { group = b.dataset.g; toolbar(s, tool, onTool); });

  const items = [...Object.entries(TOOLS), ...Object.entries(BUILDINGS)].filter(([, d]) => d.group === group);
  $('tools').innerHTML = items.map(([id, d]) => {
    const built = d.landmark && s.b.includes(id);
    const cost = d.cost ? `<span class="cost">${built ? 'построена' : d.cost + ' €'}</span>` : '';
    const cls = [id === tool ? 'on' : '', built ? 'done' : '', d.cost > s.money ? 'poor' : ''].join(' ');
    return `<button class="tool ${cls}" data-t="${id}" title="${esc(d.name)}"><span class="ic">${d.icon}</span><span class="nm">${esc(d.name)}</span>${cost}</button>`;
  }).join('');
  $('tools').querySelectorAll('.tool').forEach(b => b.onclick = () => onTool(b.dataset.t));
}

export function showGroupOf(id) {
  const d = TOOLS[id] || BUILDINGS[id];
  if (d) group = d.group;
}

export function info(html) {
  const el = $('info');
  if (!html) { el.hidden = true; return; }
  el.innerHTML = `<button class="x" aria-label="Затвори">✕</button>${html}`;
  el.hidden = false;
  el.querySelector('.x').onclick = () => { el.hidden = true; };
}

let toastTimer;
export function toast(msg, kind = '') {
  const el = $('toast');
  el.textContent = msg;
  el.className = 'show ' + kind;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.className = ''; }, 2600);
}

let birdTimer;
export function advisor(msg) {
  const el = $('advisor');
  el.querySelector('p').textContent = msg;
  el.hidden = false;
  clearTimeout(birdTimer);
  birdTimer = setTimeout(() => { el.hidden = true; }, 9000);
  el.onclick = () => { el.hidden = true; };
}

// Показва прозорец и връща номера на натиснатия бутон.
export function modal(html, buttons = ['Добре']) {
  return new Promise(resolve => {
    const m = $('modal'), card = $('modal-card');
    card.innerHTML = html + `<div class="actions">${buttons.map((b, n) => `<button class="btn${n === 0 ? ' primary' : ''}" data-n="${n}">${b}</button>`).join('')}</div>`;
    m.hidden = false;
    card.querySelectorAll('.actions button').forEach(b => b.onclick = () => { m.hidden = true; resolve(+b.dataset.n); });
  });
}

export const isModalOpen = () => !$('modal').hidden;

export { esc, barColor };
