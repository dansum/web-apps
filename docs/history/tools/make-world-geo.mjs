// Прави data/geo/world.json (целият свят, за глобуса в 8.1.2 „Великите географски открития“)
// от Natural Earth 1:110m (world-atlas, обществено достояние).
// Употреба: node tools/make-world-geo.mjs <countries-110m.json> <topojson-client.js>
//   (пакетите: npm pack world-atlas@2.0.2 topojson-client@3.1.0 в отделна папка)
// Държавните граници са днешните и са само за ориентир. Бреговете (land) се рисуват отделно, по-плътно.
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
const [, , atlasPath, tcPath] = process.argv;
if (!tcPath) { console.error('Нужни са два пътя: countries-110m.json, topojson-client'); process.exit(1); }
const topo = createRequire(import.meta.url)(tcPath);
const world = JSON.parse(readFileSync(atlasPath, 'utf8'));
const round = (r) => r.map(([x, y]) => [+x.toFixed(2), +y.toFixed(2)]);
const outer = (g) => !g ? [] : (g.type === 'Polygon' ? [g.coordinates] : g.coordinates).map((p) => p[0]).filter((r) => r.length >= 4);

const countries = [];
for (const f of topo.feature(world, world.objects.countries).features) {
  const rings = outer(f.geometry).map(round);
  if (rings.length) countries.push({ id: f.id == null ? f.properties.name : String(f.id).padStart(3, '0'), rings });
}
const landFc = topo.feature(world, world.objects.land);
const land = (landFc.features || [landFc]).flatMap((f) => outer(f.geometry)).map(round);
writeFileSync(new URL('../data/geo/world.json', import.meta.url), JSON.stringify({
  source: 'Natural Earth 1:110m, чрез world-atlas 2.0.2 (обществено достояние). Днешни граници, опростени — само за ориентир.',
  countries, land }));
console.log(`world.json: ${countries.length} държави, ${land.length} суши, ${countries.reduce((n, c) => n + c.rings.reduce((m, r) => m + r.length, 0), 0)} точки`);
