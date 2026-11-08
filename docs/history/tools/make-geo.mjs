// Прави data/geo/balkans.json от Natural Earth (world-atlas, обществено достояние).
// Употреба: node tools/make-geo.mjs <countries-10m.json> <topojson-client.js>
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
const [, , atlasPath, tcPath] = process.argv;
const topo = createRequire(import.meta.url)(tcPath);
const world = JSON.parse(readFileSync(atlasPath, 'utf8'));
const fc = topo.feature(world, world.objects.countries);
const BBOX = { w: 18.5, e: 31.0, s: 39.0, n: 46.2 };
// Имена на български (Natural Earth id = ISO 3166-1 числов код).
const NAMES = { '100': 'България', '642': 'Румъния', '688': 'Сърбия', '807': 'Северна Македония', '300': 'Гърция',
  '792': 'Турция', '008': 'Албания', '499': 'Черна гора', '070': 'Босна и Херцеговина', '498': 'Молдова',
  '804': 'Украйна', '348': 'Унгария', '191': 'Хърватия', Kosovo: 'Косово' };
function clip(ring) { // Sutherland–Hodgman по правоъгълника
  const edges = [[(p) => p[0] >= BBOX.w, (a, b) => at(a, b, 0, BBOX.w)], [(p) => p[0] <= BBOX.e, (a, b) => at(a, b, 0, BBOX.e)],
    [(p) => p[1] >= BBOX.s, (a, b) => at(a, b, 1, BBOX.s)], [(p) => p[1] <= BBOX.n, (a, b) => at(a, b, 1, BBOX.n)]];
  function at(a, b, k, v) { const t = (v - a[k]) / (b[k] - a[k]); return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]; }
  let out = ring;
  for (const [inside, cut] of edges) {
    const inp = out; out = [];
    for (let i = 0; i < inp.length; i++) {
      const cur = inp[i], prev = inp[(i + inp.length - 1) % inp.length];
      if (inside(cur)) { if (!inside(prev)) out.push(cut(prev, cur)); out.push(cur); }
      else if (inside(prev)) out.push(cut(prev, cur));
    }
    if (!out.length) break;
  }
  return out;
}
function simplify(ring, tol) { // прост филтър по разстояние
  const out = [ring[0]];
  for (const p of ring) { const q = out[out.length - 1]; if (Math.hypot(p[0] - q[0], p[1] - q[1]) >= tol) out.push(p); }
  return out;
}
const countries = [];
for (const f of fc.features) {
  const id = f.id == null ? f.properties.name : String(f.id).padStart(3, '0');
  if (!NAMES[id]) continue;
  const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;
  const rings = [];
  for (const poly of polys) {
    const r = simplify(clip(poly[0]), id === '100' ? 0.02 : 0.05);
    if (r.length >= 4) rings.push(r.map(([x, y]) => [+x.toFixed(3), +y.toFixed(3)]));
  }
  if (rings.length) countries.push({ id, name: NAMES[id], rings });
}
writeFileSync(new URL('../data/geo/balkans.json', import.meta.url), JSON.stringify({
  source: 'Natural Earth 1:10m, чрез world-atlas 2.0.2 (обществено достояние). Днешни граници, опростени.',
  bbox: BBOX, countries }));
console.log(countries.map((c) => `${c.name}: ${c.rings.reduce((n, r) => n + r.length, 0)} точки`).join('\n'));
