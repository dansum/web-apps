// Проверка на data/gradeN.js по схемата (data/SCHEMA.md) и по плана (план.md).
// Употреба: node tools/check-data.mjs [3 4 5 …]   (без аргументи: всички налични класове)
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const ALL = ['3', '4', '5', '6', '7', '8', '9', '10'];
const SHAPES = new Set(['box', 'sphere', 'cylinder', 'cone', 'torus', 'capsule', 'ring', 'plane']);
const TYPES = new Set(['mcq', 'multi', 'sort', 'order', 'number', 'pick']);

// Уменията от плана: редовете „| … | 5.1.1 Заглавие | …“ в раздел 7.
function planSkills() {
  const md = readFileSync(join(root, 'план.md'), 'utf8');
  const out = {};
  for (const m of md.matchAll(/\|\s*(\d+)\.(\d)\.(\d+)\s+([^|]+?)\s*\|/g)) {
    const g = m[1];
    (out[g] ||= []).push(`${m[1]}.${m[2]}.${m[3]}`);
  }
  return out;
}

let errors = 0, warns = 0;
const err = (where, msg) => { errors++; console.log(`  ✗ ${where}: ${msg}`); };
const warn = (where, msg) => { warns++; console.log(`  ! ${where}: ${msg}`); };

function checkObjects(where, objs, { needNote = true } = {}) {
  if (!Array.isArray(objs) || objs.length < 3 || objs.length > 7) err(where, `сцената трябва да има 3–7 обекта (има ${objs?.length ?? 0})`);
  const ids = new Set();
  for (const o of objs || []) {
    const w = `${where} обект ${o.id}`;
    if (!o.id || !/^[a-z0-9_]+$/.test(o.id)) err(w, 'id трябва да е латиница, цифри и _');
    if (ids.has(o.id)) err(w, 'повторен id');
    ids.add(o.id);
    if (!o.label) err(w, 'липсва label');
    if (!SHAPES.has(o.shape)) err(w, `непозната форма ${o.shape}`);
    if (!/^#[0-9a-fA-F]{6}$/.test(o.color || '')) err(w, 'color трябва да е #rrggbb');
    if (o.pos && (!Array.isArray(o.pos) || o.pos.length !== 3 || o.pos.some((v) => typeof v !== 'number' || Math.abs(v) > 4.5))) err(w, 'pos трябва да е [x,y,z] в −4…4');
    if (needNote && !o.note) err(w, 'липсва note');
    if (o.note && o.note.length > 140) warn(w, `note е ${o.note.length} знака (до 140)`);
  }
  return ids;
}

function checkQuestion(where, q, objIds) {
  if (!TYPES.has(q.type)) return err(where, `непознат тип ${q.type}`);
  if (!q.q) err(where, 'липсва текст q');
  if (!q.explain) err(where, 'липсва explain');
  const n = q.choices?.length;
  if (q.choices) {
    const norm = q.choices.map((c) => String(c).trim().toLowerCase());
    if (new Set(norm).size !== norm.length) warn(where, 'еднакви избори');
  }
  if (q.type === 'sort' && q.items) {
    const norm = q.items.map((it) => String(it.t).trim().toLowerCase());
    if (new Set(norm).size !== norm.length) warn(where, 'sort: еднакви елементи');
  }
  switch (q.type) {
    case 'mcq':
      if (!(n >= 2 && n <= 5)) err(where, 'mcq: 2–5 избора');
      else if (n < 3) warn(where, `mcq с ${n} избора (препоръчват се поне 3)`);
      if (!Number.isInteger(q.answer) || q.answer < 0 || q.answer >= n) err(where, 'mcq: answer е индекс извън choices');
      break;
    case 'multi':
      if (!(n >= 3 && n <= 6)) err(where, 'multi: 3–6 избора');
      if (!Array.isArray(q.answer) || !q.answer.length || q.answer.some((a) => !Number.isInteger(a) || a < 0 || a >= n)) err(where, 'multi: answer трябва да е масив от индекси');
      break;
    case 'sort':
      if (!Array.isArray(q.bins) || q.bins.length < 2) err(where, 'sort: поне 2 bins');
      if (!Array.isArray(q.items) || q.items.length < 4 || q.items.length > 8) err(where, 'sort: 4–8 items');
      for (const it of q.items || []) if (!it.t || !Number.isInteger(it.bin) || it.bin < 0 || it.bin >= q.bins.length) err(where, `sort: лош елемент ${JSON.stringify(it)}`);
      break;
    case 'order':
      if (!Array.isArray(q.items) || q.items.length < 3 || q.items.length > 7) err(where, 'order: 3–7 items');
      if (q.items && new Set(q.items).size !== q.items.length) err(where, 'order: повторени елементи');
      break;
    case 'number':
      if (typeof q.answer !== 'number') err(where, 'number: answer трябва да е число');
      break;
    case 'pick':
      if (!objIds.has(q.answer)) err(where, `pick: answer „${q.answer}“ не е обект от сцената`);
      break;
  }
}

async function checkGrade(g, plan) {
  const file = join(root, 'data', `grade${g}.js`);
  console.log(`\n${g}. клас (data/grade${g}.js)`);
  if (!existsSync(file)) { err(g, 'файлът липсва'); return; }
  let c;
  try { c = (await import(pathToFileURL(file).href + `?t=${Date.now()}`)).default; } catch (e) { err(g, `не се зарежда: ${e.message}`); return; }
  if (c.id !== g) err(g, `id трябва да е "${g}"`);
  if (!c.title || !c.source?.pdf || !c.source?.title) err(g, 'липсва title или source');
  if (!Array.isArray(c.units) || c.units.length !== 3) err(g, 'трябва да има точно 3 раздела');
  const seen = [];
  (c.units || []).forEach((u, k) => {
    const uw = `раздел ${u.id}`;
    if (u.id !== `${g}-${k + 1}`) err(uw, `id трябва да е ${g}-${k + 1}`);
    if (!u.title) err(uw, 'липсва title');
    if (u.mon === undefined) err(uw, 'mon трябва да е обект или null');
    const a = u.article;
    if (!a) err(uw, 'липсва статия');
    else {
      if (a.id !== `${u.id}-a`) err(uw, `статията трябва да има id ${u.id}-a`);
      if (!a.title) err(uw, 'статията няма title');
      const ids = checkObjects(`${uw} статия`, a.scene?.objects);
      if (!Array.isArray(a.steps) || a.steps.length < 3 || a.steps.length > 6) err(uw, 'статията трябва да има 3–6 стъпки');
      for (const st of a.steps || []) {
        if (!ids.has(st.focus)) err(uw, `стъпка с непознат focus ${st.focus}`);
        if (!st.text) err(uw, 'стъпка без text');
        else if (st.text.length > 450) warn(uw, `текст на стъпка е ${st.text.length} знака (до 400)`);
      }
    }
    for (const s of u.skills || []) {
      const sw = `умение ${s.id}`;
      seen.push(s.id);
      if (!s.id?.startsWith(`${g}.${k + 1}.`)) err(sw, `id трябва да започва с ${g}.${k + 1}.`);
      if (!s.title) err(sw, 'липсва title');
      if (s.mon === undefined) err(sw, 'mon трябва да е обект или null');
      if (s.mon && (!Array.isArray(s.mon.competences) || !s.mon.competences.length)) err(sw, 'mon.competences е празно');
      if (s.mon && !Array.isArray(s.mon.pages)) err(sw, 'mon.pages трябва да е масив (може празен)');
      if (!s.mon && !s.assumption) err(sw, 'без mon трябва да има assumption');
      if (s.quality !== 'low' && !s.experience) err(sw, 'quality "high" изисква experience');
      const ids = checkObjects(sw, s.scene?.objects);
      const qs = s.questions || [];
      if (qs.length < 6 || qs.length > 8) err(sw, `трябва да има 6–8 въпроса (има ${qs.length})`);
      qs.forEach((q, i) => checkQuestion(`${sw} въпрос ${i + 1}`, q, ids));
      const types = new Set(qs.map((q) => q.type));
      if (types.size < 2) warn(sw, 'всички въпроси са от един тип');
    }
  });
  const want = plan[g] || [];
  const missing = want.filter((id) => !seen.includes(id));
  const extra = seen.filter((id) => !want.includes(id));
  if (missing.length) err(g, `липсват умения от плана: ${missing.join(', ')}`);
  if (extra.length) err(g, `умения, които ги няма в плана: ${extra.join(', ')}`);
  if (new Set(seen).size !== seen.length) err(g, 'повторени id на умения');
  console.log(`  ${seen.length} умения, ${(c.units || []).reduce((n, u) => n + u.skills.reduce((m, s) => m + (s.questions?.length || 0), 0), 0)} въпроса`);
}

const grades = process.argv.slice(2).length ? process.argv.slice(2) : ALL.filter((g) => existsSync(join(root, 'data', `grade${g}.js`)));
const plan = planSkills();
for (const g of grades) await checkGrade(g, plan);
console.log(`\n${errors ? '✗' : '✓'} грешки: ${errors}, предупреждения: ${warns}`);
process.exit(errors ? 1 : 0);
