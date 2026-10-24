// Пресмятане на факторите за добруване и месечния бюджет на града.
import { N, idx, inside, dist, BUILDABLE } from './map.js';
import { BUILDINGS, FACTORS } from './buildings.js';

const D4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const clamp = v => Math.max(0, Math.min(100, v));

export const MONTHS = ['Януари', 'Февруари', 'Март', 'Април', 'Май', 'Юни', 'Юли', 'Август', 'Септември', 'Октомври', 'Ноември', 'Декември'];
// Колко туристи идват според месеца: лятото е силният сезон.
export const SEASON = [0.3, 0.3, 0.4, 0.6, 1, 1.8, 2.4, 2.4, 1.6, 0.8, 0.4, 0.3];

export function roadNear(s, i, j) {
  return D4.some(([di, dj]) => {
    const t = inside(i + di, j + dj) && s.b[idx(i + di, j + dj)];
    return t && BUILDINGS[t].road;
  });
}

export const needsRoad = t => BUILDINGS[t].needsRoad !== false;

function near(s, i, j, r, test) {
  for (let dj = -r; dj <= r; dj++) {
    for (let di = -r; di <= r; di++) {
      if (inside(i + di, j + dj) && test(s.terrain[idx(i + di, j + dj)])) return true;
    }
  }
  return false;
}

export function canPlace(s, t, i, j) {
  if (!inside(i, j)) return { ok: false, why: '' };
  const k = idx(i, j), ter = s.terrain[k], def = BUILDINGS[t];
  if (s.b[k]) return { ok: false, why: 'Тук вече има нещо. С булдозера можеш да го премахнеш.' };
  if (def.needs === 'canal') {
    if (ter !== 'canal') return { ok: false, why: 'Мостът се строи над канала между езерото и морето.' };
  } else if (!BUILDABLE.has(ter)) {
    const why = {
      sea: 'Тук е Черно море.',
      lake: 'Това е Варненското езеро.',
      canal: 'Това е канал за корабите. Над него може да мине само Аспаруховият мост.',
      beach: 'Плажът е за всички — тук не строим.',
    }[ter];
    return { ok: false, why };
  }
  if (def.needs === 'sea' && !D4.some(([di, dj]) => inside(i + di, j + dj) && s.terrain[idx(i + di, j + dj)] === 'sea')) {
    return { ok: false, why: 'Това се строи на брега, точно до морето — там, където няма плаж.' };
  }
  if (def.needs === 'beach' && !near(s, i, j, 2, x => x === 'beach')) {
    return { ok: false, why: 'Хотелът трябва да е близо до плажа.' };
  }
  if (def.landmark && s.b.includes(t)) return { ok: false, why: 'Тази забележителност вече е построена. Във Варна има само една!' };
  if (s.money < def.cost) return { ok: false, why: `Нямаш достатъчно пари. Трябват ти ${def.cost} €.` };
  return { ok: true };
}

// Разпределя капацитета на училища, поликлиники и др. между най-близките домове.
function cover(homes, sources, key) {
  for (const h of homes) h[key] = 0;
  for (const src of sources) {
    let left = src.cap;
    const close = homes.filter(h => dist(h, src) <= src.r).sort((a, b) => dist(a, src) - dist(b, src));
    for (const h of close) {
      if (left <= 0) break;
      const give = Math.min(h.cap - h[key], left);
      h[key] += give;
      left -= give;
    }
  }
  for (const h of homes) h[key] /= h.cap;
}

export function evaluate(s) {
  const homes = [], polluters = [], parks = [];
  const sources = { edu: [], health: [], transport: [], culture: [] };
  const inactive = new Set();
  let cap = 0, jobs = 0, bizTax = 0, tourism = 0, upkeep = 0, landmarks = 0;

  s.b.forEach((t, k) => {
    if (!t) return;
    const def = BUILDINGS[t], i = k % N, j = (k / N) | 0;
    upkeep += def.upkeep || 0;
    if (needsRoad(t) && !roadNear(s, i, j)) { inactive.add(k); return; }
    if (def.homes) { homes.push({ k, i, j, cap: def.homes }); cap += def.homes; }
    if (def.jobs) { jobs += def.jobs; bizTax += def.tax || 0; }
    if (def.tourism) tourism += def.tourism;
    if (def.serve) sources[def.serve.f].push({ i, j, r: def.serve.r, cap: def.serve.cap });
    if (def.pollution) polluters.push({ i, j, ...def.pollution });
    if (def.park) parks.push({ i, j });
    if (def.landmark) landmarks++;
  });

  const pollution = new Float32Array(N * N);
  for (const p of polluters) {
    for (let j = Math.max(0, p.j - p.r); j <= Math.min(N - 1, p.j + p.r); j++) {
      for (let i = Math.max(0, p.i - p.r); i <= Math.min(N - 1, p.i + p.r); i++) {
        const d = dist(p, { i, j });
        if (d <= p.r) pollution[idx(i, j)] += p.v * (1 - d / (p.r + 1));
      }
    }
  }

  for (const key of Object.keys(sources)) cover(homes, sources[key], key);

  const local = new Map();
  for (const h of homes) {
    const pol = pollution[h.k];
    let nat = 45;
    for (const p of parks) {
      const d = dist(p, h);
      if (d <= 3) nat += 28 * (1 - d / 4);
    }
    let treesNear = 0;
    for (let dj = -2; dj <= 2; dj++) {
      for (let di = -2; di <= 2; di++) {
        if (inside(h.i + di, h.j + dj) && s.trees[idx(h.i + di, h.j + dj)]) treesNear++;
      }
    }
    nat += Math.min(20, treesNear * 4);
    if (near(s, h.i, h.j, 3, x => x === 'sea' || x === 'beach')) nat += 10;
    local.set(h.k, {
      edu: Math.round(h.edu * 100),
      health: Math.round(clamp(h.health * 100 - pol * 0.8)),
      nature: Math.round(clamp(nat - pol)),
      transport: Math.round(h.transport * 100),
      culture: Math.round(clamp(h.culture * 85 + landmarks * 5)),
      pollution: Math.round(pol),
      cap: h.cap,
    });
  }

  let factors = null, wellbeing = null;
  if (cap > 0) {
    const avg = key => {
      let sum = 0;
      for (const v of local.values()) sum += v[key] * v.cap;
      return Math.round(sum / cap);
    };
    factors = {
      home: Math.round(Math.min(100, cap / Math.max(20, jobs * 2) * 100)),
      work: Math.round(Math.min(100, jobs / (cap * 0.5) * 100)),
      edu: avg('edu'), health: avg('health'), nature: avg('nature'),
      transport: avg('transport'), culture: avg('culture'),
    };
    wellbeing = Math.round(FACTORS.reduce((a, f) => a + factors[f.id], 0) / FACTORS.length);
  }

  return { factors, wellbeing, cap, jobs, bizTax, tourism, upkeep, landmarks, inactive, local, pollution,
    activeHomes: homes.length };
}

// Един месец: хората се местят, фирмите плащат данъци, градът плаща поддръжката.
export function monthTick(s, ev) {
  const wb = ev.wellbeing ?? 50;
  const target = ev.cap * (0.4 + 0.6 * wb / 100);
  const step = Math.round((target - s.pop) * 0.3);
  s.pop = Math.max(0, step === 0 ? Math.round(target) : s.pop + step);

  const staffed = ev.jobs ? Math.min(1, (s.pop * 0.5) / ev.jobs) : 0;
  const culture = ev.factors ? ev.factors.culture : 0;
  const taxes = s.pop * 1 + ev.bizTax * staffed;
  const tourism = (ev.tourism + ev.landmarks * 10) * SEASON[s.month] * (0.5 + culture / 100);
  const income = Math.round(taxes + tourism);
  const upkeep = Math.round(ev.upkeep);
  s.money += income - upkeep;
  s.last = { taxes: Math.round(taxes), tourism: Math.round(tourism), upkeep };

  s.month++;
  if (s.month === 12) { s.month = 0; s.year++; }
}
