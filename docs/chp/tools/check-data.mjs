// Проверка на data/gradeN.js по схемата (data/SCHEMA.md). Курс „Човекът и природата“ (3.–6. клас).
// Без сверка с план.md: планът по ЧП не е в машинно четим вид като този по история.
// Употреба: node tools/check-data.mjs [3 4 5 …]   (без аргументи: всички налични класове)
import { existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const ALL = ['3', '4', '5', '6'];
const SHAPES = new Set(['box', 'sphere', 'cylinder', 'cone', 'torus', 'capsule', 'ring', 'plane']);
const TYPES = new Set(['mcq', 'multi', 'sort', 'order', 'number', 'pick', 'source']);

let errors = 0, warns = 0;
const err = (where, msg) => { errors++; console.log(`  ✗ ${where}: ${msg}`); };
const warn = (where, msg) => { warns++; console.log(`  ! ${where}: ${msg}`); };

function checkObjects(where, objs, { needNote = true } = {}) {
  if (!Array.isArray(objs) || objs.length < 3 || objs.length > 7) err(where, `сцената трябва да има 3–7 обекта (има ${objs?.length ?? 0})`);
  const ids = new Set();
  for (const o of objs || []) {
    const w = `${where} обект ${o.id}`;
    // В ЧП има стари id с главни букви (fixedPulley); id не се сменят, защото по тях се пази напредъкът.
    if (!o.id || !/^[A-Za-z0-9_]+$/.test(o.id)) err(w, 'id трябва да е латиница, цифри и _');
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
      // В ЧП има подреждане на 8 планети, затова горната граница е 8.
      if (!Array.isArray(q.items) || q.items.length < 3 || q.items.length > 8) err(where, 'order: 3–8 items');
      if (q.items && new Set(q.items).size !== q.items.length) err(where, 'order: повторени елементи');
      break;
    case 'number':
      if (typeof q.answer !== 'number') err(where, 'number: answer трябва да е число');
      break;
    case 'source': {
      const t = q.source?.text || '';
      if (!t) err(where, 'source: липсва source.text');
      else if (t.split(/\s+/).filter(Boolean).length > 60) err(where, `source: откъсът е ${t.split(/\s+/).filter(Boolean).length} думи (до 60)`);
      if (!q.source?.from) err(where, 'source: липсва source.from (автор, заглавие, година)');
      if (!(n >= 3 && n <= 5)) err(where, 'source: 3–5 избора');
      const a = Array.isArray(q.answer) ? q.answer : [q.answer];
      if (!a.length || a.some((x) => !Number.isInteger(x) || x < 0 || x >= n)) err(where, 'source: answer е индекс или масив от индекси в choices');
      break;
    }
    case 'pick':
      if (!objIds.has(q.answer)) err(where, `pick: answer „${q.answer}“ не е обект от сцената`);
      break;
  }
}

async function checkGrade(g) {
  const file = join(root, 'data', `grade${g}.js`);
  console.log(`\n${g}. клас (data/grade${g}.js)`);
  if (!existsSync(file)) { err(g, 'файлът липсва'); return; }
  let c;
  try { c = (await import(pathToFileURL(file).href + `?t=${Date.now()}`)).default; } catch (e) { err(g, `не се зарежда: ${e.message}`); return; }
  if (c.id !== g) err(g, `id трябва да е "${g}"`);
  if (!c.title || !c.source?.pdf || !c.source?.title) err(g, 'липсва title или source');
  if (!Array.isArray(c.units) || c.units.length !== 3) err(g, 'трябва да има точно 3 раздела');
  const seen = [];
  const noPages = [];
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
      if (!s.novelty) warn(sw, 'липсва novelty („Какво е новото в този клас“)');
      else if (s.novelty.length > 260) warn(sw, `novelty е ${s.novelty.length} знака (1–2 кратки изречения)`);
      if (s.mon === undefined) err(sw, 'mon трябва да е обект или null');
      if (s.mon && (!Array.isArray(s.mon.competences) || !s.mon.competences.length)) err(sw, 'mon.competences е празно');
      if (s.mon && !Array.isArray(s.mon.pages)) err(sw, 'mon.pages трябва да е масив (може празен)');
      else if (s.mon && !s.mon.pages.length) noPages.push(s.id);
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
  // Едно предупреждение на клас, за да не се губят другите в списъка.
  if (noPages.length) warn(`${g}. клас`, `празно mon.pages (страниците не са сверени с ${c.source?.pdf || 'PDF файла'}) при ${noPages.length} умения: ${noPages.join(', ')}`);
  if (new Set(seen).size !== seen.length) err(g, 'повторени id на умения');
  console.log(`  ${seen.length} умения, ${(c.units || []).reduce((n, u) => n + u.skills.reduce((m, s) => m + (s.questions?.length || 0), 0), 0)} въпроса`);
}

const grades = process.argv.slice(2).length ? process.argv.slice(2) : ALL.filter((g) => existsSync(join(root, 'data', `grade${g}.js`)));
for (const g of grades) await checkGrade(g);
console.log(`\n${errors ? '✗' : '✓'} грешки: ${errors}, предупреждения: ${warns}`);
process.exit(errors ? 1 : 0);
