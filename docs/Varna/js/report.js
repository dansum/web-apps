// Отчетът на ученика като CSV: един ред за всеки изигран месец.
// Отваря се в Excel и се зарежда на страницата „Резултати на класа“.
// Заглавията на колоните са на езика на играта; при четене се приемат и двата езика.
import { FACTORS } from './buildings.js';
import { tr, EN } from './i18n.js';

export const COLUMNS = [
  ['name', 'ученик', 'student'], ['year', 'година', 'year'], ['month', 'месец', 'month'],
  ['money', 'пари', 'money'], ['pop', 'жители', 'residents'], ['wb', 'добруване', 'well-being'],
  ['home', 'дом', 'home'], ['work', 'работа', 'work'], ['edu', 'образование', 'education'],
  ['health', 'здраве', 'health'], ['nature', 'природа', 'nature'], ['transport', 'транспорт', 'transport'],
  ['culture', 'култура', 'culture'],
  ['income', 'приходи', 'income'], ['upkeep', 'разходи', 'spending'], ['missions', 'задачи', 'tasks'],
];

const cell = v => {
  const t = v === null || v === undefined ? '' : String(v);
  return /[;"\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
};

export function toCSV(name, hist) {
  const head = COLUMNS.map(c => (EN ? c[2] : c[1])).join(';');
  const rows = hist.map(h => COLUMNS.map(([k]) => {
    if (k === 'name') return cell(name);
    if (k === 'month') return h.m + 1;
    if (k === 'year') return h.y;
    if (FACTORS.some(f => f.id === k)) return cell(h.f ? h.f[k] : '');
    return cell(h[k]);
  }).join(';'));
  return '\ufeff' + [head, ...rows].join('\r\n') + '\r\n';
}

function splitLine(line, sep) {
  const out = [];
  let cur = '', q = false;
  for (let n = 0; n < line.length; n++) {
    const c = line[n];
    if (q) {
      if (c === '"' && line[n + 1] === '"') { cur += '"'; n++; }
      else if (c === '"') q = false;
      else cur += c;
    } else if (c === '"') q = true;
    else if (c === sep) { out.push(cur); cur = ''; }
    else cur += c;
  }
  out.push(cur);
  return out.map(s => s.trim());
}

// Връща { rows: [месеци], error: текст или null }.
export function parseCSV(text, fallbackName) {
  const lines = text.replace(/^\ufeff/, '').split(/\r?\n/).filter(l => l.trim());
  if (!lines.length) return { rows: [], error: tr('Файлът е празен.', 'The file is empty.') };
  const sep = (lines[0].match(/;/g) || []).length >= (lines[0].match(/,/g) || []).length ? ';' : ',';
  const head = splitLine(lines[0], sep).map(h => h.toLowerCase());
  const pos = {};
  for (const [k, bg, en] of COLUMNS) pos[k] = head.indexOf(bg) >= 0 ? head.indexOf(bg) : head.indexOf(en);
  if (pos.year < 0 || pos.month < 0 || pos.wb < 0) {
    return { rows: [], error: tr('Това не прилича на отчет от „Варна строи“ — липсват колоните „година“, „месец“ или „добруване“.',
      'This does not look like a “Varna Builds” report — the “year”, “month” or “well-being” columns are missing.') };
  }
  const num = (cells, k) => {
    if (pos[k] < 0) return null;
    const v = parseFloat(String(cells[pos[k]] ?? '').replace(',', '.'));
    return Number.isFinite(v) ? v : null;
  };
  const rows = lines.slice(1).map(line => {
    const c = splitLine(line, sep);
    const f = {};
    for (const x of FACTORS) f[x.id] = num(c, x.id);
    return {
      name: (pos.name >= 0 && c[pos.name]) || fallbackName,
      y: num(c, 'year'), m: (num(c, 'month') ?? 1) - 1,
      money: num(c, 'money'), pop: num(c, 'pop'), wb: num(c, 'wb'), f,
      income: num(c, 'income'), upkeep: num(c, 'upkeep'), missions: num(c, 'missions') ?? 0,
    };
  }).filter(r => r.y !== null);
  return { rows, error: rows.length ? null : tr('Във файла няма изиграни месеци.', 'The file has no months of play.') };
}
