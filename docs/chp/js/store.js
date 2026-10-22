// Напредък на ученика: пази се в браузъра и в текстов файл, който се сваля и качва.

const KEY = 'chp-progress-v1';
const HEADER = 'CHP-PROGRESS v1';
const SALT = 'chp-3d-kan';

export const LEVELS = [
  { id: 0, name: 'Не е започнато', points: 0, cls: 'lv0' },
  { id: 1, name: 'Опитано', points: 0, cls: 'lv1' },
  { id: 2, name: 'Запознат', points: 50, cls: 'lv2' },
  { id: 3, name: 'Владее', points: 80, cls: 'lv3' },
  { id: 4, name: 'Овладяно', points: 100, cls: 'lv4' },
];

function empty() {
  return { name: '', updated: null, skills: {}, tests: {}, articles: {}, daily: {}, lastCourse: null };
}

// Брой довършени задачи (упражнения, тестове, статии) за деня.
function countTask() {
  const d = today();
  state.daily = state.daily || {};
  state.daily[d] = (state.daily[d] || 0) + 1;
}
export function tasksToday() {
  return (state.daily && state.daily[today()]) || 0;
}
export function setLastCourse(id) {
  if (state.lastCourse === id) return;
  state.lastCourse = id;
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* няма значение */ }
}

let state = empty();
const listeners = new Set();

function readLocal() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) state = { ...empty(), ...JSON.parse(raw) };
  } catch (e) {
    state = empty();
  }
}
readLocal();

function save() {
  state.updated = new Date().toISOString();
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch (e) { /* частен режим: работим само в паметта */ }
  for (const fn of listeners) fn(state);
}

export function onChange(fn) { listeners.add(fn); return () => listeners.delete(fn); }
export function getState() { return state; }

export function setName(name) {
  state.name = String(name || '').trim().slice(0, 60);
  save();
}

export function level(skillId) {
  return state.skills[skillId]?.level ?? 0;
}

function today() { return new Date().toISOString().slice(0, 10); }

function setLevel(skillId, lv) {
  const s = state.skills[skillId] || { level: 0, attempts: 0 };
  s.level = lv;
  s.last = today();
  state.skills[skillId] = s;
}

// Упражнение: под 70% → Опитано, поне 70% → Запознат, 100% → Владее.
// Упражнението не сваля нивото; „Овладяно“ се получава само от тест.
export function applyPractice(skillId, ratio) {
  const cur = level(skillId);
  const got = ratio >= 0.999 ? 3 : ratio >= 0.7 ? 2 : 1;
  const s = state.skills[skillId] || { level: 0, attempts: 0 };
  s.attempts = (s.attempts || 0) + 1;
  state.skills[skillId] = s;
  setLevel(skillId, Math.max(cur, got));
  countTask();
  save();
  return { before: cur, after: level(skillId) };
}

// Тест: верен отговор вдига с едно ниво (от 0 или 1 направо на „Запознат“);
// грешен сваля с едно ниво, но не под „Запознат“ (или „Опитано“, ако е било по-ниско).
export function applyTestAnswer(skillId, correct) {
  const cur = level(skillId);
  let next;
  if (correct) next = cur <= 1 ? 2 : Math.min(4, cur + 1);
  else next = cur > 2 ? cur - 1 : Math.max(cur, 1);
  setLevel(skillId, next);
  return { before: cur, after: next };
}

export function recordTest(testId, score) {
  const t = state.tests[testId] || { best: 0 };
  t.best = Math.max(t.best || 0, score);
  t.lastScore = score;
  t.last = today();
  state.tests[testId] = t;
  countTask();
  save();
}

export function markArticle(id) {
  if (!state.articles[id]) countTask();
  state.articles[id] = true;
  save();
}

export function coursePercent(course) {
  const skills = course.units.flatMap((u) => u.skills);
  if (!skills.length) return 0;
  const pts = skills.reduce((s, sk) => s + LEVELS[level(sk.id)].points, 0);
  return Math.round(pts / skills.length);
}

// ---- файл ----

function checksum(str) {
  // FNV-1a, 32 бита. Само показва, че файлът е пипан на ръка; не е защита.
  let h = 0x811c9dc5;
  const s = SALT + str;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}

export function exportText() {
  const json = JSON.stringify(state);
  return `${HEADER}\n${json}\n${checksum(json)}\n`;
}

// Някои браузъри отказват имена на файлове на кирилица, затова името е на латиница
// (обтекаема система за транслитерация).
const TR = { а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ж: 'zh', з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sht', ъ: 'a', ь: 'y', ю: 'yu', я: 'ya' };
function latin(s) {
  return [...s].map((ch) => {
    const lo = ch.toLowerCase();
    if (!(lo in TR)) return ch;
    const t = TR[lo];
    return ch === lo ? t : t.charAt(0).toUpperCase() + t.slice(1);
  }).join('');
}

export function exportFileName() {
  const name = latin(state.name || 'uchenik').replace(/[^A-Za-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '') || 'uchenik';
  return `napredak-${name}-${today()}.txt`;
}

export function download() {
  const blob = new Blob([exportText()], { type: 'text/plain;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = exportFileName();
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
}

// Връща { ok, warning?, error? }.
export function importText(text) {
  const lines = String(text).replace(/^﻿/, '').split(/\r?\n/);
  if (lines[0].trim() !== HEADER) return { ok: false, error: 'Това не е файл с напредък от този курс.' };
  let data;
  try {
    data = JSON.parse(lines[1]);
  } catch (e) {
    return { ok: false, error: 'Файлът е повреден и не може да се прочете.' };
  }
  if (!data || typeof data !== 'object' || typeof data.skills !== 'object') {
    return { ok: false, error: 'Файлът е повреден и не може да се прочете.' };
  }
  const warning = (lines[2] || '').trim() !== checksum(lines[1])
    ? 'Внимание: файлът изглежда редактиран на ръка.' : null;
  state = { ...empty(), ...data };
  save();
  return { ok: true, warning };
}

export function reset() {
  state = empty();
  save();
}
