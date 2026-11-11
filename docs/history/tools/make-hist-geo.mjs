// Прави data/geo/bg-history.json: опростени исторически области на България 1878–1947.
// Употреба: node tools/make-hist-geo.mjs <път до пакета polygon-clipping>
//   (напр. npm i polygon-clipping@0.15.7 в отделна папка и после пътя до node_modules/polygon-clipping)
//
// ВАЖНО: това е опростена схема, начертана за курса; не е точна карта.
// Където историческата граница съвпада с днешната (напр. Дунав, Черно море, границата с Гърция
// в Родопите), е взета днешната граница от data/geo/balkans.json (Natural Earth, обществено достояние).
// Останалите линии (Стара планина, южната граница на Източна Румелия, Македония, Беломорието,
// Южна Добруджа, Западните покрайнини) са начертани на ръка по общоизвестни очертания, с точност
// около 10–30 км. Отворени набори с исторически граници (напр. historical-basemaps, GPL-3.0) бяха
// проверени, но не са използвани: слоят за 1880 г. слага Крит в България и няма Източна Румелия.
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
const pcPath = process.argv[2];
if (!pcPath) { console.error('Нужен е път до polygon-clipping'); process.exit(1); }
const pc = createRequire(import.meta.url)(pcPath);
const geo = JSON.parse(readFileSync(new URL('../data/geo/balkans.json', import.meta.url), 'utf8'));
const country = (id) => {
  const c = geo.countries.find((x) => x.id === id);
  return c.rings.map((r) => [close(r)]);
};
function close(r) { const a = r[0], b = r[r.length - 1]; return a[0] === b[0] && a[1] === b[1] ? r : [...r, a]; }
const poly = (pts) => [[close(pts)]];
const land = pc.union(...geo.countries.map((c) => country(c.id)));
const BG = country('100'), RO = country('642'), RS = country('688'), MK = country('807'), GR = country('300');

// Билото на Стара планина и южната граница на Княжеството (Кюстендил, Дупница, Самоков са в него).
const BALKAN = [[22.3, 42.12], [22.7, 42.13], [23.05, 42.12], [23.4, 42.12], [23.7, 42.25], [23.9, 42.36],
  [24.05, 42.52], [24.25, 42.62], [24.6, 42.68], [25.0, 42.72], [25.4, 42.72], [25.8, 42.76], [26.2, 42.8],
  [26.6, 42.86], [27.0, 42.85], [27.4, 42.84], [27.75, 42.76], [28.2, 42.72]];
// Южната граница на Източна Румелия (без Пирин, Средните и Източните Родопи и Странджа).
const RUM_SOUTH = [[23.7, 42.25], [23.95, 42.02], [24.4, 41.95], [24.9, 41.93], [25.4, 41.86], [25.9, 41.8],
  [26.35, 41.72], [26.7, 41.93], [27.1, 42.08], [27.45, 42.2], [27.75, 42.3], [28.2, 42.3]];
const PRINC_CUT = poly([...BALKAN, [29.8, 42.72], [29.8, 46], [21.0, 46], [21.0, 42.12]]);
const RUM_CUT = poly([...BALKAN.slice(4), [29.8, 42.72], [29.8, 42.3], ...RUM_SOUTH.slice().reverse()]);
// Южна Добруджа: от Тутракан до Екрене (Кранево) — границата от 1913 г.
const SDOB_CUT = poly([[26.5, 44.3], [26.62, 44.05], [26.95, 43.85], [27.4, 43.6], [27.75, 43.42], [28.08, 43.33], [29, 43.3], [29, 44.3]]);
// Западни покрайнини: Царибродско, Босилеградско, Струмишко.
const TSAR_CUT = poly([[22.66, 43.22], [22.9, 43.27], [23.1, 43.15], [23.05, 42.85], [22.66, 42.86]]);
const BOSIL_CUT = poly([[22.28, 42.66], [22.62, 42.72], [22.78, 42.45], [22.58, 42.27], [22.28, 42.33]]);
const STRUM_CUT = poly([[22.38, 41.6], [22.95, 41.65], [23.05, 41.35], [22.6, 41.27], [22.38, 41.38]]);
// Беломорието (Западна Тракия): между Места и Марица, до днешната българска граница.
const AEG_CUT = poly([[23.9, 41.5], [24.5, 41.27], [24.8, 40.85], [24.9, 40.6], [26.3, 40.5], [26.7, 41.0], [26.7, 41.9], [24.5, 41.7]]);
// Македония (географската област, много опростено): от Шар и Охрид до Места; без Солун и Халкидики.
const MAC_CUT = poly([[20.75, 42.1], [21.4, 42.27], [21.8, 42.22], [22.3, 42.2], [22.7, 42.13], [23.05, 42.12],
  [23.4, 42.12], [23.7, 42.25], [23.95, 42.02], [24.1, 41.6], [23.9, 41.5], [24.5, 41.27], [24.8, 40.85], [24.3, 40.75],
  [23.85, 40.72], [23.5, 40.95], [23.0, 41.05], [22.5, 41.05], [22.0, 40.95], [21.5, 40.8], [21.2, 40.45], [20.8, 40.35],
  [20.5, 40.55], [20.45, 41.0], [20.5, 41.45], [20.55, 41.9]]);
// Беломорска ивица в Санстефанска България: между Места и Порто Лагос (приблизително).
const SS_AEG_CUT = poly([[24.1, 41.6], [24.5, 41.27], [24.8, 40.85], [25.1, 40.9], [25.5, 41.0], [25.6, 41.4], [25.3, 41.6]]);
// Северна Добруджа: на изток от Дунав, до днешната граница с България.
const NDOB_CUT = poly([[27.27, 44.12], [27.7, 44.2], [28.0, 44.35], [27.93, 44.7], [27.98, 45.0], [28.0, 45.3],
  [28.2, 45.47], [29.0, 45.4], [29.8, 45.3], [29.8, 43.6], [27.27, 43.6]]);
// Нишко и Пиротско (без Царибродско).
const NISH_CUT = poly([[21.45, 43.68], [22.3, 43.7], [22.66, 43.3], [22.66, 42.86], [22.3, 42.9], [21.6, 42.95], [21.35, 43.3]]);

const I = (...a) => pc.intersection(...a), D = (...a) => pc.difference(...a), U = (...a) => pc.union(...a);
const sdob = I(BG, SDOB_CUT);
const knyaz = D(I(BG, PRINC_CUT), SDOB_CUT);
const rumelia = D(I(BG, RUM_CUT), PRINC_CUT);
const south = D(BG, PRINC_CUT, RUM_CUT);
const tsar = D(I(RS, TSAR_CUT), BG), bosil = D(I(RS, BOSIL_CUT), BG), strum = D(I(MK, STRUM_CUT), BG);
const aegean = I(GR, AEG_CUT);
const macedonia = D(I(land, MAC_CUT), BG, STRUM_CUT);
const ndob = I(RO, NDOB_CUT);
const nish = D(I(RS, NISH_CUT), TSAR_CUT);
const ssMakOdr = D(U(I(land, MAC_CUT), I(land, SS_AEG_CUT), south), PRINC_CUT, RUM_CUT);

// anchor: точка вътре в областта, където стои надписът (и където кликат тестовете).
const REGIONS = [
  { id: 'knyaz', name: 'Княжество България', anchor: [25.3, 43.35], g: knyaz },
  { id: 'sdob', name: 'Южна Добруджа', anchor: [27.55, 43.75], g: sdob },
  { id: 'rumelia', name: 'Източна Румелия', anchor: [25.6, 42.3], g: rumelia },
  { id: 'south', name: 'Пирин, Родопите и Странджа', anchor: [24.9, 41.62], g: south },
  { id: 'tsar', name: 'Царибродско', anchor: [22.82, 43.05], g: tsar },
  { id: 'bosil', name: 'Босилеградско', anchor: [22.45, 42.5], g: bosil },
  { id: 'strum', name: 'Струмишко', anchor: [22.65, 41.45], g: strum },
  { id: 'aegean', name: 'Беломорието', anchor: [25.5, 41.08], g: aegean },
  { id: 'macedonia', name: 'Македония', anchor: [21.6, 41.55], g: macedonia },
  { id: 'makodr', name: 'Македония и Одринско', anchor: [21.6, 41.55], g: ssMakOdr },
  { id: 'ndob', name: 'Северна Добруджа', anchor: [28.6, 44.75], g: ndob },
  { id: 'nish', name: 'Нишко и Пиротско', anchor: [22.1, 43.3], g: nish },
];
const area = (r) => Math.abs(r.reduce((s, p, i) => { const q = r[(i + 1) % r.length]; return s + p[0] * q[1] - q[0] * p[1]; }, 0)) / 2;
const r3 = (p) => [+p[0].toFixed(3), +p[1].toFixed(3)];
const out = {
  source: 'Опростена схема, начертана за курса; не е точна карта. Където историческата граница съвпада с днешната, е взета днешната граница от Natural Earth (обществено достояние, чрез data/geo/balkans.json); останалите линии са начертани на ръка по общоизвестни очертания (tools/make-hist-geo.mjs).',
  label: 'Приблизителни граници',
  regions: REGIONS.map(({ id, name, anchor, g }) => ({
    id, name, anchor,
    polygons: g.filter((p) => p[0].length >= 4 && area(p[0]) > 0.004).map((p) => p.map((ring) => ring.slice(0, -1).map(r3))),
  })),
};
for (const r of out.regions) console.log(r.id, r.polygons.length, 'части,', r.polygons.reduce((n, p) => n + p[0].length, 0), 'точки');
writeFileSync(new URL('../data/geo/bg-history.json', import.meta.url), JSON.stringify(out));
