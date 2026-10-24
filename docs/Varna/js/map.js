// Карта, вдъхновена от Варна: Черно море на изток, Варненското езеро на запад,
// канал между тях на юг и хълмове с гора на север.
export const N = 36;

export const idx = (i, j) => j * N + i;
export const inside = (i, j) => i >= 0 && j >= 0 && i < N && j < N;
export const dist = (a, b) => Math.hypot(a.i - b.i, a.j - b.j);

export const WATER = new Set(['sea', 'lake', 'canal']);
export const BUILDABLE = new Set(['grass', 'hill']);

// Детерминиран генератор, за да е картата една и съща при всяка нова игра.
export function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Брегът е по-навътре в средата — там е Варненският залив.
const coastAt = j => Math.round(N - 8 - 3.2 * Math.sin(Math.PI * j / N));

export function makeMap(seed = 1852) {
  const r = rng(seed);
  const terrain = new Array(N * N);
  const trees = new Uint8Array(N * N);
  const wobble = Array.from({ length: N }, () => Math.round(r() * 1.4 - 0.7));

  for (let j = 0; j < N; j++) {
    for (let i = 0; i < N; i++) {
      const lx = (i - 2) / 8.5, ly = (j - 28) / 3.6;
      let t = 'grass';
      if (i >= coastAt(j) + wobble[j]) t = 'sea';
      else if (lx * lx + ly * ly < 1 + (r() - 0.5) * 0.15) t = 'lake';
      else if ((j === 28 || j === 29) && i >= 9) t = 'canal';
      else if (j < 7 - (i % 3 === 0 ? 1 : 0)) t = 'hill';
      terrain[idx(i, j)] = t;
    }
  }

  // Плажове има по северния бряг. На юг, при пристанището, брегът е без плаж.
  for (let j = 0; j < 20; j++) {
    for (let i = 0; i < N; i++) {
      const k = idx(i, j);
      if (terrain[k] === 'sea' || WATER.has(terrain[k])) continue;
      if ([[1, 0], [0, 1], [0, -1], [1, 1], [1, -1]].some(([di, dj]) => inside(i + di, j + dj) && terrain[idx(i + di, j + dj)] === 'sea')) {
        terrain[k] = 'beach';
      }
    }
  }

  for (let j = 0; j < N; j++) {
    for (let i = 0; i < N; i++) {
      const k = idx(i, j), t = terrain[k];
      if (!BUILDABLE.has(t)) continue;
      const nearCoast = j < 22 && i > coastAt(j) - 5;
      const p = t === 'hill' ? 0.45 : nearCoast ? 0.22 : j > 29 ? 0.1 : 0.04;
      if (r() < p) trees[k] = 1;
    }
  }
  return { terrain, trees };
}
