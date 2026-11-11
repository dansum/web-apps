// Прави data/geo/europe.json (Европа, Средиземно море и Близкия изток) от Natural Earth
// (world-atlas, обществено достояние) и data/geo/preselenie.json — опростени исторически области
// за Великото преселение на народите (6.1.2).
// Употреба: node tools/make-europe-geo.mjs <countries-50m.json> <topojson-client.js> <polygon-clipping.umd.js>
//   (пакетите: npm pack world-atlas@2.0.2 topojson-client@3.1.0 polygon-clipping@0.15.7 в отделна папка)
//
// ВАЖНО: историческите области са опростена схема, начертана за курса; не е точна карта.
// Сухоземните очертания (бреговете) са от Natural Earth; линиите на сушата (Рейн, Дунав, делението на
// империята, източната граница, Стара планина) са начертани на ръка по общоизвестни очертания, с точност
// около 50–150 км. Държавните граници на картата са днешните и са само за ориентир.
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
const [, , atlasPath, tcPath, pcPath] = process.argv;
if (!pcPath) { console.error('Нужни са три пътя: countries-50m.json, topojson-client, polygon-clipping'); process.exit(1); }
const req = createRequire(import.meta.url);
const topo = req(tcPath), pc = req(pcPath);
const world = JSON.parse(readFileSync(atlasPath, 'utf8'));
const fc = topo.feature(world, world.objects.countries);
const BBOX = { w: -11, e: 50, s: 29.5, n: 60 };

function clip(ring) { // Sutherland–Hodgman по правоъгълника
  const at = (a, b, k, v) => { const t = (v - a[k]) / (b[k] - a[k]); return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]; };
  const edges = [[(p) => p[0] >= BBOX.w, (a, b) => at(a, b, 0, BBOX.w)], [(p) => p[0] <= BBOX.e, (a, b) => at(a, b, 0, BBOX.e)],
    [(p) => p[1] >= BBOX.s, (a, b) => at(a, b, 1, BBOX.s)], [(p) => p[1] <= BBOX.n, (a, b) => at(a, b, 1, BBOX.n)]];
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
function simplify(ring, tol) {
  const out = [ring[0]];
  for (const p of ring) { const q = out[out.length - 1]; if (Math.hypot(p[0] - q[0], p[1] - q[1]) >= tol) out.push(p); }
  return out;
}
const area = (r) => Math.abs(r.reduce((s, p, i) => { const q = r[(i + 1) % r.length]; return s + p[0] * q[1] - q[0] * p[1]; }, 0) / 2);
const round = (r) => r.map(([x, y]) => [+x.toFixed(3), +y.toFixed(3)]);

const countries = [];
for (const f of fc.features) {
  if (!f.geometry) continue;
  const id = f.id == null ? f.properties.name : String(f.id).padStart(3, '0');
  const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;
  const rings = [];
  for (const poly of polys) {
    const c = clip(poly[0]);
    if (c.length < 4 || area(c) < 0.02) continue; // много малките острови не се виждат при този мащаб
    const r = simplify(c, id === '100' ? 0.04 : 0.09);
    if (r.length >= 4) rings.push(round(r));
  }
  if (rings.length) countries.push({ id, name: '', rings });
}
writeFileSync(new URL('../data/geo/europe.json', import.meta.url), JSON.stringify({
  source: 'Natural Earth 1:50m, чрез world-atlas 2.0.2 (обществено достояние). Днешни граници, опростени — само за ориентир.',
  bbox: BBOX, countries }));
console.log(`europe.json: ${countries.length} държави, ${countries.reduce((n, c) => n + c.rings.reduce((m, r) => m + r.length, 0), 0)} точки`);

// ---------- исторически области ----------
const close = (r) => { const a = r[0], b = r[r.length - 1]; return a[0] === b[0] && a[1] === b[1] ? r : [...r, a]; };
const land = pc.union(...countries.map((c) => c.rings.map((r) => [close(r)])));
const cut = (pts) => pc.intersection(land, [[close(pts)]]);

// Делението на империята от 395 г. (от север на юг): Сирмиум, по Дрина, до Адриатика при Котор,
// после по морето между Италия и Гърция и до залива Сирт в Африка.
const SPLIT = [[19.6, 45.0], [19.3, 44.3], [19.3, 43.3], [18.9, 42.6], [18.75, 42.25], [18.9, 40.2], [18.4, 37.5], [19.0, 33.0], [19.0, 30.2]];
// Западна Римска империя (около 395 г.): Британия до Адриановия вал, Рейн и горният Дунав, Северна Африка.
const WEST = [
  [-3.3, 54.95], [-1.4, 55.05], [1.5, 53.5], [4.0, 52.3], [6.0, 51.85], [7.0, 50.75], [7.6, 50.35], [8.3, 49.95],
  [8.4, 49.0], [7.6, 47.6], [9.5, 47.6], [10.0, 48.4], [12.1, 48.95], [13.5, 48.6], [16.4, 48.25], [17.1, 48.15],
  [18.9, 47.8], [19.05, 47.5], [18.9, 46.0], [19.4, 45.2],
  ...SPLIT,
  [14.0, 31.0], [11.0, 32.0], [10.0, 33.2], [8.0, 34.0], [5.0, 34.6], [2.0, 35.0], [-1.0, 34.8], [-4.5, 34.5], [-6.6, 33.9],
  [-10.8, 33.9], [-10.8, 44.0], [-6.0, 48.5], [-6.2, 49.8], [-5.6, 51.9], [-4.85, 52.8], [-4.75, 53.5], [-3.8, 54.3],
];
// Източна Римска империя: долният Дунав, Тракия, Гърция, Мала Азия, Сирия, Палестина, Египет, Киренайка.
const EAST = [
  ...SPLIT.slice().reverse(),
  [21.0, 44.7], [22.5, 44.6], [22.9, 43.9], [24.0, 43.7], [25.5, 43.65], [26.5, 44.0], [27.3, 44.1], [28.0, 44.4],
  [28.2, 45.2], [29.7, 45.2], [30.5, 44.6], [36.0, 43.0], [41.5, 41.7], [41.5, 40.5], [41.0, 39.8], [41.2, 38.5],
  [40.8, 37.2], [40.5, 35.2], [38.5, 34.0], [37.5, 32.5], [36.5, 30.0], [35.0, 29.4], [29.5, 29.4], [25.0, 30.6],
  [23.0, 31.6], [20.0, 31.3],
];
// България при основаването (681 г.): земите между Дунав и Стара планина и Добруджа.
// Опростено: земите на север от Дунав и западната граница не са показани точно.
const BG681 = [[24.0, 43.75], [25.5, 43.65], [26.5, 44.0], [27.3, 44.1], [28.0, 44.4], [28.2, 45.2], [29.7, 45.2],
  [30.0, 44.5], [28.8, 43.0], [27.95, 42.7], [27.0, 42.85], [26.0, 42.78], [25.0, 42.72], [24.0, 42.78]];

const regions = [
  { id: 'west', name: 'Западна Римска империя', anchor: [6.0, 44.2], polygons: cut(WEST) },
  { id: 'east', name: 'Източна Римска империя', anchor: [33.0, 39.2], polygons: cut(EAST) },
  { id: 'bg681', name: 'България, 681 г.', anchor: [26.5, 43.5], polygons: cut(BG681) },
].map((r) => ({ ...r, polygons: r.polygons.map((p) => p.map(round)) }));
writeFileSync(new URL('../data/geo/preselenie.json', import.meta.url), JSON.stringify({
  source: 'Опростена схема, начертана за курса; не е точна карта. Бреговете са от Natural Earth (обществено достояние, чрез data/geo/europe.json); линиите на сушата са начертани на ръка по общоизвестни очертания (tools/make-europe-geo.mjs).',
  label: 'Приблизителни граници', regions }));
for (const r of regions) console.log(`${r.name}: ${r.polygons.length} части, ${r.polygons.reduce((n, p) => n + p[0].length, 0)} точки`);
