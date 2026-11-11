// Сгради и природа на София (за „София през епохите“): ротондата „Св. Георги“, базиликата „Св. София“,
// джамията Баня баши, храм-паметникът „Св. Александър Невски“, Народното събрание с паметника на
// Цар Освободител, сгради около площад „Независимост“, вход на метрото, планината Витоша.
// Видът е опростен по снимки на сградите; размерите са сгъстени за сцената.
// Нисък полигон, кеширани геометрии и материали; неподвижните части се сливат с mergeStatic.
import { THREE } from '../../kit.js';
import { M, column, gableRoof, archGeo } from './architecture.js';
import { CM, col } from './city.js';

// ---------- текстури ----------
const texCache = new Map();
function canvasTex(key, w, h, draw, rep = [1, 1]) {
  const k = `${key}|${rep}`;
  if (texCache.has(k)) return texCache.get(k);
  let base = texCache.get(key);
  if (!base) {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    draw(c.getContext('2d'), w, h);
    base = new THREE.CanvasTexture(c);
    base.colorSpace = THREE.SRGBColorSpace;
    base.wrapS = base.wrapT = THREE.RepeatWrapping;
    base.anisotropy = 4;
    texCache.set(key, base);
  }
  if (rep[0] === 1 && rep[1] === 1) return base;
  const t = base.clone(); t.needsUpdate = true; t.repeat.set(...rep); texCache.set(k, t);
  return t;
}
const rnd = (seed) => () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
const DRAW = {
  // Червени тухли с дебел хоросан (както в ротондата и в „Св. София“).
  redBrick(ctx, w, h) {
    const r = rnd(5);
    ctx.fillStyle = '#d8c4a4'; ctx.fillRect(0, 0, w, h);
    const rows = 16, rh = h / rows;
    for (let y = 0; y < rows; y++) {
      const off = (y % 2) * 16;
      for (let x = -32; x < w; x += 32) {
        const v = (r() - 0.5) * 40;
        ctx.fillStyle = `rgb(${172 + v},${82 + v * 0.5},${58 + v * 0.4})`;
        ctx.fillRect(x + off + 2, y * rh + 3, 28, rh - 6);
      }
    }
  },
  // Фасада с прозорци на редове (за големите сгради около площада).
  facade(ctx, w, h) {
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, w, h);
    const r = rnd(23);
    for (let i = 0; i < 120; i++) { ctx.fillStyle = `rgba(120,110,90,${r() * 0.05})`; ctx.fillRect(r() * w, r() * h, 10, 10); }
    for (let y = 0; y < 2; y++) for (let x = 0; x < 2; x++) {
      const x0 = x * 128 + 40, y0 = y * 128 + 30;
      ctx.fillStyle = 'rgba(90,80,60,0.35)'; ctx.fillRect(x0 - 6, y0 - 6, 60, 82);
      ctx.fillStyle = '#34424e'; ctx.fillRect(x0, y0, 48, 70);
      ctx.fillStyle = '#f2ece0'; ctx.fillRect(x0 + 22, y0, 4, 70); ctx.fillRect(x0, y0 + 26, 48, 4);
      ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(x0 + 3, y0 + 3, 16, 20);
    }
  },
  // Гора отдалеч (за Витоша).
  forest(ctx, w, h) {
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, w, h);
    const r = rnd(61);
    for (let i = 0; i < 900; i++) { const v = r(); ctx.fillStyle = `rgba(${v > 0.5 ? '20,40,20' : '255,255,240'},${0.06 + r() * 0.12})`; ctx.beginPath(); ctx.arc(r() * w, r() * h, 2 + r() * 5, 0, 7); ctx.fill(); }
  },
};
const MATS = new Map();
function TM(name, { color = 0xffffff, rep = [1, 1], rough = 0.85 } = {}) {
  const k = `${name}|${color}|${rep}|${rough}`;
  if (!MATS.has(k)) MATS.set(k, new THREE.MeshStandardMaterial({ color, roughness: rough, map: canvasTex(name, 256, 256, DRAW[name], rep) }));
  return MATS.get(k);
}
export const BRICK = (rep = [1, 1]) => TM('redBrick', { rep });
const FACADE = (color, rep) => TM('facade', { color, rep });
const GEO = new Map();
const G = (key, make) => { if (!GEO.has(key)) GEO.set(key, make()); return GEO.get(key); };
const box = (w, h, d, m) => new THREE.Mesh(G(`b${w},${h},${d}`, () => new THREE.BoxGeometry(w, h, d)), m);
const cyl = (rt, rb, h, m, seg = 12, open = false) => new THREE.Mesh(G(`c${rt},${rb},${h},${seg},${open}`, () => new THREE.CylinderGeometry(rt, rb, h, seg, 1, open)), m);
const dome = (r, m, seg = 18, part = Math.PI / 2) => new THREE.Mesh(G(`d${r},${seg},${part}`, () => new THREE.SphereGeometry(r, seg, 10, 0, Math.PI * 2, 0, part)), m);
const halfCyl = (r, h, m, seg = 14) => new THREE.Mesh(G(`hc${r},${h},${seg}`, () => new THREE.CylinderGeometry(r, r, h, seg, 1, false, 0, Math.PI)), m);
const DARK = () => col(0x2a2622);
const GOLD = () => col(0xd8b23a, { metal: 0.75, rough: 0.28 });
const LEAD = () => col(0x8d969c, { rough: 0.45, metal: 0.3 });
const COPPER = () => col(0x5f9a84, { rough: 0.5, metal: 0.2 });

// Арковиден прозорец (тъмен), гледа по +z от точката (x, y, z).
function archWin(g, x, y, z, w = 0.08, h = 0.14, ry = 0, m = DARK()) {
  const p = new THREE.Group(); p.position.set(x, y, z); p.rotation.y = ry; g.add(p);
  const b = box(w, h, 0.012, m); p.add(b);
  const a = new THREE.Mesh(G(`aw${w}`, () => new THREE.CircleGeometry(w / 2, 10, 0, Math.PI)), m); a.position.set(0, h / 2, 0.0065); p.add(a);
  return p;
}
// Прозорци в кръг около цилиндър с радиус r.
function ringWins(g, n, r, y, w, h, m, a0 = 0) {
  for (let i = 0; i < n; i++) { const a = a0 + (i / n) * Math.PI * 2; archWin(g, Math.sin(a) * (r + 0.006), y, Math.cos(a) * (r + 0.006), w, h, a, m); }
}
// Кръст на върха.
function cross(g, x, y, z, s = 1, m = GOLD()) {
  const v = box(0.025 * s, 0.18 * s, 0.025 * s, m); v.position.set(x, y + 0.09 * s, z); g.add(v);
  const h = box(0.1 * s, 0.025 * s, 0.025 * s, m); h.position.set(x, y + 0.13 * s, z); g.add(h);
}
// Полукръгъл купол над цилиндрична кула (барабан) с прозорци.
function drumDome(g, x, y, z, { r = 0.3, h = 0.3, wall, roof, wins = 8, shape = 1, crossS = 1 } = {}) {
  const d = cyl(r, r * 1.03, h, wall, 16); d.position.set(x, y + h / 2, z); g.add(d);
  const sub = new THREE.Group(); sub.position.set(x, y, z); g.add(sub);
  ringWins(sub, wins, r, h * 0.5, r * 0.28, h * 0.42, DARK());
  const cor = cyl(r * 1.08, r * 1.08, 0.035, col(0xe9e2d2), 16); cor.position.set(x, y + h + 0.017, z); g.add(cor);
  const dm = dome(r * 1.02, roof, 18); dm.scale.y = shape; dm.position.set(x, y + h + 0.03, z); g.add(dm);
  const top = y + h + 0.03 + r * 1.02 * shape;
  if (crossS) cross(g, x, top, z, crossS);
  return top;
}

// ---------- ротондата „Св. Георги“ (IV век) ----------
// Кръгла тухлена сграда с купол; долу четири полукръгли ниши, на изток апсида. Входът гледа по +z.
export function rotunda({ r = 0.55 } = {}) {
  const g = new THREE.Group();
  const wall = BRICK([3, 1]);
  const h1 = 0.62, h2 = 0.32;
  const low = cyl(r, r * 1.02, h1, wall, 20); low.position.y = h1 / 2; g.add(low);
  // Ниши отвън (четири издадени полукръга).
  for (let i = 0; i < 4; i++) {
    const a = Math.PI / 4 + i * Math.PI / 2;
    const n = halfCyl(r * 0.36, h1 * 0.78, BRICK([1, 1])); n.position.set(Math.sin(a) * r * 0.88, h1 * 0.39, Math.cos(a) * r * 0.88); n.rotation.y = a - Math.PI / 2; g.add(n);
    const nr = new THREE.Mesh(G('nichR', () => new THREE.SphereGeometry(r * 0.36, 12, 6, 0, Math.PI, 0, Math.PI / 2)), M(0xffffff, { tex: 'tiles', rep: [1, 1] }));
    nr.position.set(Math.sin(a) * r * 0.88, h1 * 0.78, Math.cos(a) * r * 0.88); nr.rotation.y = a; g.add(nr);
  }
  // Апсида на изток (−x).
  const ap = halfCyl(r * 0.42, h1 * 0.85, wall); ap.position.set(-r * 0.92, h1 * 0.425, 0); ap.rotation.y = Math.PI; g.add(ap);
  // Тухлени пояси (по-тъмни ивици) и корниз.
  for (const y of [h1 * 0.33, h1 * 0.66]) { const b = cyl(r * 1.025, r * 1.025, 0.025, col(0x9a4a32), 20); b.position.y = y; g.add(b); }
  const cor = cyl(r * 1.05, r * 1.05, 0.04, col(0xc9b48e), 20); cor.position.y = h1 + 0.02; g.add(cor);
  // Барабан с прозорци и купол.
  const drum = cyl(r * 0.8, r * 0.82, h2, wall, 20); drum.position.y = h1 + h2 / 2; g.add(drum);
  const sub = new THREE.Group(); sub.position.y = h1; g.add(sub);
  ringWins(sub, 8, r * 0.8, h2 * 0.5, 0.07, 0.12, DARK(), Math.PI / 8);
  const dm = dome(r * 0.82, M(0xffffff, { tex: 'tiles', rep: [6, 2] }), 20); dm.scale.y = 0.62; dm.position.y = h1 + h2; g.add(dm);
  // Долни прозорци и вход.
  const subL = new THREE.Group(); g.add(subL);
  for (const a of [Math.PI / 2, Math.PI, -Math.PI / 2]) archWin(subL, Math.sin(a) * (r + 0.006), h1 * 0.58, Math.cos(a) * (r + 0.006), 0.08, 0.13, a);
  const door = archWin(g, 0, 0.14, r + 0.01, 0.16, 0.24, 0, col(0x4a3420)); door.position.y = 0.13;
  g.userData.top = h1 + h2 + r * 0.82 * 0.62;
  return g;
}

// ---------- базиликата „Св. София“ (VI век) ----------
// Кръстовидна тухлена базилика: дълъг кораб по x, напречен кораб, нисък купол над средата, апсида на изток (−x).
export function stSofia({ L = 2.6, W = 1.0, H = 0.78 } = {}) {
  const g = new THREE.Group();
  const wall = BRICK([4, 1]);
  const nave = box(L, H, W, wall); nave.position.y = H / 2; g.add(nave);
  const tx = -L * 0.12;
  const tr = box(W * 0.95, H, W * 2.1, wall); tr.position.set(tx, H / 2, 0); g.add(tr);
  for (const s of [-1, 1]) { const aisle = box(L * 0.8, H * 0.62, W * 0.32, wall); aisle.position.set(L * 0.08, H * 0.31, s * (W / 2 + W * 0.16)); g.add(aisle); }
  const r1 = gableRoof(L + 0.06, W + 0.08, 0.26); r1.position.y = H; g.add(r1);
  const r2 = gableRoof(W * 2.1 + 0.08, W + 0.02, 0.26); r2.rotation.y = Math.PI / 2; r2.position.set(tx, H, 0); g.add(r2);
  for (const s of [-1, 1]) { const ar = box(L * 0.8, 0.025, W * 0.38, M(0xffffff, { tex: 'tiles', rep: [4, 1] })); ar.position.set(L * 0.08, H * 0.62 + 0.04, s * (W / 2 + W * 0.17)); ar.rotation.x = s * 0.32; g.add(ar); }
  // Купол над пресечката.
  const sq = box(W * 0.55, 0.16, W * 0.55, wall); sq.position.set(tx, H + 0.26, 0); g.add(sq);
  const dm = dome(W * 0.3, M(0xffffff, { tex: 'tiles', rep: [4, 1] }), 16); dm.scale.y = 0.6; dm.position.set(tx, H + 0.34, 0); g.add(dm);
  cross(g, tx, H + 0.34 + W * 0.18, 0, 0.9);
  // Апсиди на изток (−x): голяма в средата, малки отстрани.
  const ap = halfCyl(W * 0.36, H * 0.86, wall); ap.rotation.y = Math.PI; ap.position.set(-L / 2, H * 0.43, 0); g.add(ap);
  const apr = new THREE.Mesh(G('ssApR', () => new THREE.SphereGeometry(1, 12, 6, 0, Math.PI, 0, Math.PI / 2)), M(0xffffff, { tex: 'tiles', rep: [2, 1] }));
  apr.scale.set(W * 0.37, W * 0.25, W * 0.37); apr.rotation.y = -Math.PI / 2; apr.position.set(-L / 2, H * 0.86, 0); g.add(apr);
  for (const s of [-1, 1]) { const a2 = halfCyl(W * 0.14, H * 0.55, wall); a2.rotation.y = Math.PI; a2.position.set(-L / 2 + 0.02 + L * 0.1, H * 0.275, s * (W / 2 + W * 0.16)); g.add(a2); }
  // Прозорци с арки по дългите стени и по напречния кораб.
  for (const s of [-1, 1]) {
    for (let i = 0; i < 4; i++) { const x = L * 0.12 + i * L * 0.1; archWin(g, x, H * 0.78, s * (W / 2 + 0.006), 0.07, 0.12, s > 0 ? 0 : Math.PI); }
    for (let i = 0; i < 2; i++) archWin(g, tx - W * 0.2 + i * W * 0.4, H * 0.55, s * (W * 1.05 + 0.006), 0.09, 0.18, s > 0 ? 0 : Math.PI);
  }
  // Западна фасада (+x) с три прозореца и врата.
  for (const z of [-W * 0.22, 0, W * 0.22]) archWin(g, L / 2 + 0.006, H * 0.62, z, 0.07, 0.13, Math.PI / 2);
  archWin(g, L / 2 + 0.007, 0.13, 0, 0.16, 0.22, Math.PI / 2, col(0x4a3420));
  g.userData.top = H + 0.34 + W * 0.18 + 0.2;
  return g;
}

// ---------- минаре (самостоятелно) ----------
export function minaret({ h = 2.0 } = {}) {
  const g = new THREE.Group();
  const stone = CM('stoneBrick', { rep: [1, 4] });
  const b = box(0.32, 0.36, 0.32, M(0xffffff, { tex: 'stone', rep: [0.5, 0.5] })); b.position.y = 0.18; g.add(b);
  const body = cyl(0.12, 0.14, h, stone, 12); body.position.y = 0.36 + h / 2; g.add(body);
  const bal = cyl(0.2, 0.16, 0.07, M(0xece5d6, { tex: 'limestone' }), 14); bal.position.y = 0.36 + h * 0.86; g.add(bal);
  const rail = cyl(0.2, 0.2, 0.08, col(0xd8cdb4, { side: THREE.DoubleSide }), 14, true); rail.position.y = 0.36 + h * 0.86 + 0.07; g.add(rail);
  const up = cyl(0.1, 0.11, h * 0.18, stone, 12); up.position.y = 0.36 + h * 0.95; g.add(up);
  const cone = new THREE.Mesh(G('mnCone', () => new THREE.ConeGeometry(0.12, 0.45, 12)), LEAD()); cone.position.y = 0.36 + h * 1.04 + 0.22; g.add(cone);
  const cres = new THREE.Mesh(G('mnCres', () => new THREE.TorusGeometry(0.03, 0.007, 5, 12, Math.PI * 1.4)), GOLD());
  cres.rotation.z = Math.PI * 0.8; cres.position.y = 0.36 + h * 1.04 + 0.5; g.add(cres);
  g.userData.top = 0.36 + h * 1.04 + 0.55;
  return g;
}

// ---------- джамията Баня баши (XVI век) ----------
// Квадратна зала с голям купол на осмостенен барабан, отпред портик с три малки купола, минаре вдясно.
// Стени от камък с пояси от тухли. Входът гледа по +z.
export function banyaBashi({ s = 1.5, h = 0.8 } = {}) {
  const g = new THREE.Group();
  const wall = CM('stoneBrick', { rep: [2, 1] });
  const hall = box(s, h, s, wall); hall.position.y = h / 2; g.add(hall);
  const cor = box(s + 0.06, 0.05, s + 0.06, M(0xece5d6, { tex: 'limestone' })); cor.position.y = h + 0.025; g.add(cor);
  // Ъглови тежести (малки кули) към купола.
  for (const x of [-1, 1]) for (const z of [-1, 1]) { const t = cyl(0.07, 0.08, 0.2, wall, 8); t.position.set(x * s * 0.42, h + 0.12, z * s * 0.42); g.add(t); const c = new THREE.Mesh(G('bbT', () => new THREE.ConeGeometry(0.08, 0.12, 8)), LEAD()); c.position.set(x * s * 0.42, h + 0.28, z * s * 0.42); g.add(c); }
  const drum = cyl(s * 0.4, s * 0.42, 0.24, CM('stoneBrick', { rep: [2, 0.4] }), 8); drum.position.y = h + 0.14; g.add(drum);
  const subD = new THREE.Group(); subD.position.y = h + 0.02; g.add(subD);
  ringWins(subD, 8, s * 0.39, 0.12, 0.06, 0.1, DARK(), Math.PI / 8);
  const dm = dome(s * 0.41, LEAD(), 20); dm.position.y = h + 0.26; g.add(dm);
  const fin = cyl(0.008, 0.008, 0.1, GOLD(), 5); fin.position.y = h + 0.26 + s * 0.41 + 0.05; g.add(fin);
  const cr = new THREE.Mesh(G('bbCres', () => new THREE.TorusGeometry(0.025, 0.006, 5, 12, Math.PI * 1.4)), GOLD()); cr.rotation.z = Math.PI * 0.8; cr.position.y = h + 0.26 + s * 0.41 + 0.12; g.add(cr);
  // Портик отпред: три арки и три малки купола.
  const pd = 0.42, ph = h * 0.72;
  for (let i = 0; i < 3; i++) {
    const x = (i - 1) * s / 3;
    const a = new THREE.Mesh(archGeo(s / 3, ph, 0.08, 0.72), M(0xffffff, { tex: 'limestone', rep: [1, 1] })); a.position.set(x, 0, s / 2 + pd); g.add(a);
    const sd = dome(s * 0.13, LEAD(), 12); sd.position.set(x, ph + 0.05, s / 2 + pd / 2); g.add(sd);
  }
  const pr = box(s, 0.05, pd + 0.06, M(0xece5d6, { tex: 'limestone' })); pr.position.set(0, ph + 0.025, s / 2 + pd / 2); g.add(pr);
  for (const sx of [-1, 1]) { const side = box(0.06, ph, pd, M(0xffffff, { tex: 'limestone' })); side.position.set(sx * (s / 2 - 0.03), ph / 2, s / 2 + pd / 2); g.add(side); }
  const door = box(0.22, 0.38, 0.02, col(0x5a3d22)); door.position.set(0, 0.19, s / 2 + 0.011); g.add(door);
  // Прозорци на два реда.
  for (const side of [1, 2, 3]) {
    const pg = new THREE.Group(); pg.rotation.y = side * Math.PI / 2; g.add(pg);
    for (const x of [-s / 3, 0, s / 3]) { archWin(pg, x, h * 0.3, s / 2 + 0.006, 0.1, 0.16); archWin(pg, x, h * 0.7, s / 2 + 0.006, 0.07, 0.1); }
  }
  // Минаре в предния десен ъгъл.
  const mn = minaret({ h: 2.3 }); mn.position.set(s / 2 + 0.2, 0, s / 2 - 0.2); g.add(mn);
  g.userData.top = mn.userData.top;
  return g;
}

// ---------- храм-паметникът „Св. Александър Невски“ (1882–1912 г.) ----------
// Кръстовиден храм от светъл камък: голям позлатен купол на висок барабан, по-малки куполи с цвят на мед
// и позлата, полукръгли сводове над рамената, камбанария на запад (+x) със златен купол. Входът е на запад.
export function nevsky({ s = 1 } = {}) {
  const g = new THREE.Group();
  const wall = M(0xe9e3d6, { tex: 'limestone', rep: [3, 1] });
  const trim = col(0xf6f2ea);
  const H = 0.95 * s;
  const core = box(1.7 * s, H, 1.7 * s, wall); core.position.y = H / 2; g.add(core);
  // Рамената на кръста със сводести покриви.
  for (const [x, z, ry] of [[1.25, 0, 0], [-1.15, 0, 0], [0, 1.1, Math.PI / 2], [0, -1.1, Math.PI / 2]]) {
    const len = 0.8 * s;
    const arm = box(ry ? 1.0 * s : len, H * 0.82, ry ? len : 1.0 * s, wall); arm.position.set(x * s, H * 0.41, z * s); g.add(arm);
    const vault = new THREE.Mesh(G('nvV', () => { const c = new THREE.CylinderGeometry(0.5, 0.5, 1, 16, 1, false, 0, Math.PI); c.rotateZ(Math.PI / 2); return c; }), COPPER());
    vault.scale.set(len, 0.55 * s, 1.0 * s); if (ry) { vault.rotation.y = Math.PI / 2; vault.scale.set(len, 0.55 * s, 1.0 * s); }
    vault.position.set(x * s, H * 0.82, z * s); g.add(vault);
    // Голям прозорец-арка на челото на рамото.
    const fx = x ? (x > 0 ? 1 : -1) : 0, fz = z ? (z > 0 ? 1 : -1) : 0;
    const face = new THREE.Group(); face.position.set((x + fx * 0.4) * s + fx * 0.006, 0, (z + fz * 0.4) * s + fz * 0.006); face.rotation.y = fx ? fx * Math.PI / 2 : (fz > 0 ? 0 : Math.PI); g.add(face);
    archWin(face, 0, H * 0.5, 0, 0.34 * s, 0.3 * s);
    for (const dx of [-0.32, 0.32]) archWin(face, dx * s, H * 0.25, 0, 0.1 * s, 0.18 * s);
  }
  // Апсида на изток (−x).
  const ap = halfCyl(0.42 * s, H * 0.7, wall, 16); ap.rotation.y = Math.PI; ap.position.set(-1.55 * s, H * 0.35, 0); g.add(ap);
  const apr = new THREE.Mesh(G('nvApR', () => new THREE.SphereGeometry(1, 14, 6, 0, Math.PI, 0, Math.PI / 2)), COPPER());
  apr.scale.set(0.43 * s, 0.3 * s, 0.43 * s); apr.rotation.y = -Math.PI / 2; apr.position.set(-1.55 * s, H * 0.7, 0); g.add(apr);
  // Корниз.
  const cor = box(1.76 * s, 0.05, 1.76 * s, trim); cor.position.y = H + 0.02; g.add(cor);
  // Голям купол.
  const top = drumDome(g, 0, H + 0.04, 0, { r: 0.46 * s, h: 0.5 * s, wall, roof: GOLD(), wins: 12, shape: 1.05, crossS: 1.3 * s });
  // Малки куполи по ъглите на ядрото.
  for (const [x, z, roof] of [[0.62, 0.62, COPPER()], [-0.62, 0.62, GOLD()], [0.62, -0.62, GOLD()], [-0.62, -0.62, COPPER()]]) drumDome(g, x * s, H + 0.04, z * s, { r: 0.17 * s, h: 0.24 * s, wall, roof, wins: 6, crossS: 0.6 * s });
  // Камбанария на запад (+x), пред входа.
  const bx = 1.95 * s, bs = 0.5 * s, bh = 2.1 * s;
  const tower = box(bs, bh, bs, wall); tower.position.set(bx, bh / 2, 0); g.add(tower);
  for (let i = 0; i < 4; i++) {
    const f = new THREE.Group(); f.position.set(bx, 0, 0); f.rotation.y = i * Math.PI / 2; g.add(f);
    archWin(f, 0, bh * 0.72, bs / 2 + 0.006, 0.2 * s, 0.32 * s);
    archWin(f, 0, bh * 0.42, bs / 2 + 0.006, 0.1 * s, 0.18 * s);
  }
  const tc = box(bs + 0.06, 0.05, bs + 0.06, trim); tc.position.set(bx, bh + 0.025, 0); g.add(tc);
  drumDome(g, bx, bh + 0.05, 0, { r: 0.18 * s, h: 0.22 * s, wall, roof: GOLD(), wins: 6, shape: 1.1, crossS: 0.8 * s });
  // Входен портик с три арки (по-нисък, около камбанарията).
  for (const z of [-0.42, 0.42]) {
    const p = new THREE.Mesh(archGeo(0.32 * s, 0.6 * s, 0.4 * s, 0.6), wall); p.rotation.y = Math.PI / 2; p.position.set(bx, 0, z * s); g.add(p);
    const pr = box(0.42 * s, 0.04, 0.34 * s, COPPER()); pr.position.set(bx, 0.62 * s, z * s); g.add(pr);
  }
  const door = box(0.012, 0.36 * s, 0.22 * s, col(0x5a3d22)); door.position.set(bx + bs / 2 + 0.007, 0.18 * s, 0); g.add(door);
  // Стъпала.
  const st = box(0.3 * s, 0.05, 1.4 * s, M(0xd9d2c4)); st.position.set(bx + 0.38 * s, 0.025, 0); g.add(st);
  g.userData.top = top;
  return g;
}

// ---------- Народното събрание (края на XIX век) ----------
// Двуетажна сграда в стила на Ренесанса: светла мазилка, каменен цокъл, прозорци с арки горе,
// издадена средна част с колони и надпис „Съединението прави силата“. Лицето гледа по +z.
const SIGNS = new Map();
function inscription(text) {
  if (!SIGNS.has(text)) {
    const c = document.createElement('canvas'); c.width = 1024; c.height = 96;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#efe2c2'; ctx.fillRect(0, 0, 1024, 96);
    ctx.fillStyle = '#5a4a2a'; ctx.font = 'bold 60px Georgia, "Times New Roman", serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(text, 512, 52, 990);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    SIGNS.set(text, new THREE.MeshStandardMaterial({ map: t, roughness: 0.8 }));
  }
  return SIGNS.get(text);
}
// Знаме (бяло, зелено, червено), което се вее.
export function flag(colors = [0xffffff, 0x00966e, 0xd62612], { w = 0.36, h = 0.22, pole = 0.6 } = {}) {
  const g = new THREE.Group();
  const p = cyl(0.008, 0.01, pole, col(0xd8d8d8, { metal: 0.5, rough: 0.4 }), 6); p.position.y = pole / 2; g.add(p);
  const cloth = new THREE.Group(); cloth.position.set(0, pole - h / 2, 0); g.add(cloth);
  colors.forEach((c, i) => { const s = box(w, h / colors.length, 0.008, col(c, { side: THREE.DoubleSide })); s.position.set(w / 2, h / 2 - (i + 0.5) * h / colors.length, 0); cloth.add(s); });
  g.userData.cloth = cloth;
  return g;
}
export function parliament({ w = 3.0, d = 1.3 } = {}) {
  const g = new THREE.Group();
  const cream = CM('plaster', { color: 0xead9b0, rep: [3, 1] });
  const trim = col(0xf6efe0);
  const h1 = 0.55, h2 = 0.55, H = h1 + h2;
  const base = box(w, 0.14, d, M(0xffffff, { tex: 'stone', rep: [4, 0.3] })); base.position.y = 0.07; g.add(base);
  const body = box(w - 0.04, H - 0.14, d - 0.04, cream); body.position.y = 0.14 + (H - 0.14) / 2; g.add(body);
  const band = box(w + 0.02, 0.04, d + 0.02, trim); band.position.y = h1; g.add(band);
  const cor = box(w + 0.1, 0.07, d + 0.1, trim); cor.position.y = H + 0.035; g.add(cor);
  const roof = box(w - 0.1, 0.12, d - 0.1, col(0x6a6e72)); roof.position.y = H + 0.12; g.add(roof);
  // Средна част (ризалит).
  const cw = 1.0;
  const mid = box(cw, H + 0.18, 0.16, cream); mid.position.set(0, (H + 0.18) / 2, d / 2 + 0.06); g.add(mid);
  const att = box(cw + 0.06, 0.06, 0.2, trim); att.position.set(0, H + 0.21, d / 2 + 0.06); g.add(att);
  const ins = box(cw - 0.08, 0.1, 0.01, inscription('СЪЕДИНЕНИЕТО ПРАВИ СИЛАТА')); ins.position.set(0, H + 0.06, d / 2 + 0.146); g.add(ins);
  for (let i = 0; i < 4; i++) { const c = column('ionic', { h: h2 * 0.8, r: 0.028, color: 0xf6efe0 }); c.position.set(-0.33 + i * 0.22, h1 + 0.02, d / 2 + 0.17); g.add(c); }
  const door = archWin(g, 0, 0.14, d / 2 + 0.145, 0.22, 0.28, 0, col(0x4a3420)); door.position.y = 0.14 + 0.14;
  const steps = box(cw + 0.1, 0.06, 0.25, M(0xd9d2c4)); steps.position.set(0, 0.03, d / 2 + 0.25); g.add(steps);
  // Прозорци: долу правоъгълни, горе с арки, на двете страни на ризалита и отзад.
  for (const side of [0, 2]) {
    const pg = new THREE.Group(); pg.rotation.y = side * Math.PI / 2; g.add(pg);
    for (let i = 0; i < 10; i++) {
      const x = -w / 2 + 0.18 + i * (w - 0.36) / 9;
      if (side === 0 && Math.abs(x) < cw / 2 + 0.05) continue;
      const lw = box(0.1, 0.18, 0.012, DARK()); lw.position.set(x, h1 * 0.55, d / 2 + 0.006); pg.add(lw);
      archWin(pg, x, h1 + h2 * 0.42, d / 2 + 0.006, 0.1, 0.18);
    }
  }
  for (const side of [1, 3]) {
    const pg = new THREE.Group(); pg.rotation.y = side * Math.PI / 2; g.add(pg);
    for (let i = 0; i < 4; i++) { const x = -d / 2 + 0.2 + i * (d - 0.4) / 3; archWin(pg, x, h1 + h2 * 0.42, w / 2 + 0.006, 0.1, 0.18); const lw = box(0.1, 0.18, 0.012, DARK()); lw.position.set(x, h1 * 0.55, w / 2 + 0.006); pg.add(lw); }
  }
  const fl = flag(); fl.position.set(0, H + 0.24, d / 2 + 0.02); g.add(fl);
  g.userData.flag = fl.userData.cloth;
  g.userData.top = H + 0.84;
  return g;
}

// ---------- паметникът на Цар Освободител (1907 г.) ----------
// Висок гранитен пиедестал, бронзов конник отгоре. Конят гледа по +x.
export function tsarMonument() {
  const g = new THREE.Group();
  const gran = col(0x7a7a78, { rough: 0.6 });
  const b1 = box(0.7, 0.12, 0.5, gran); b1.position.y = 0.06; g.add(b1);
  const b2 = box(0.5, 0.5, 0.32, col(0x8c8a84, { rough: 0.6 })); b2.position.y = 0.37; g.add(b2);
  const b3 = box(0.58, 0.06, 0.38, gran); b3.position.y = 0.65; g.add(b3);
  const br = col(0x3e4a3a, { metal: 0.5, rough: 0.45 });
  // Бронзови фигури около пиедестала (опростени).
  for (const s of [-1, 1]) { const f = cyl(0.04, 0.06, 0.22, br, 8); f.position.set(s * 0.29, 0.25, 0.12); g.add(f); const hd = new THREE.Mesh(G('tmH', () => new THREE.SphereGeometry(0.035, 8, 6)), br); hd.position.set(s * 0.29, 0.39, 0.12); g.add(hd); }
  const hy = 0.68;
  const body = box(0.36, 0.13, 0.12, br); body.position.set(0, hy + 0.2, 0); g.add(body);
  const neck = box(0.08, 0.16, 0.08, br); neck.position.set(0.18, hy + 0.3, 0); neck.rotation.z = -0.5; g.add(neck);
  const head = box(0.13, 0.06, 0.06, br); head.position.set(0.25, hy + 0.36, 0); head.rotation.z = -0.4; g.add(head);
  for (const [x, z] of [[0.13, 0.04], [0.13, -0.04], [-0.13, 0.04], [-0.13, -0.04]]) { const l = box(0.03, 0.15, 0.03, br); l.position.set(x, hy + 0.075, z); g.add(l); }
  const tail = box(0.03, 0.12, 0.03, br); tail.position.set(-0.2, hy + 0.16, 0); tail.rotation.z = 0.4; g.add(tail);
  const rider = cyl(0.04, 0.06, 0.18, br, 8); rider.position.set(-0.01, hy + 0.35, 0); g.add(rider);
  const rh = new THREE.Mesh(G('tmRH', () => new THREE.SphereGeometry(0.04, 8, 6)), br); rh.position.set(-0.01, hy + 0.48, 0); g.add(rh);
  g.userData.top = hy + 0.55;
  return g;
}

// ---------- голяма обществена сграда (около площад „Независимост“, средата на XX век) ----------
// Масивна сграда от светъл камък: редове прозорци, колонада на горния етаж, корниз, знаме. Лицето гледа по +z.
export function stateBuilding({ w = 3.6, d = 1.4, h = 2.0, color = 0xe6dcc6, flagOn = true } = {}) {
  const g = new THREE.Group();
  const fac = FACADE(color, [Math.round(w * 2.4), Math.round(h * 2)]);
  const side = FACADE(color, [Math.round(d * 2.4), Math.round(h * 2)]);
  const plain = col(color);
  const body = new THREE.Mesh(G(`sb${w},${d},${h}`, () => new THREE.BoxGeometry(w, h, d)), [side, side, plain, plain, fac, fac]);
  body.position.y = h / 2; g.add(body);
  const base = box(w + 0.04, 0.28, d + 0.04, M(0xffffff, { tex: 'stone', rep: [5, 0.4] })); base.position.y = 0.14; g.add(base);
  // Колонада горе.
  const ch = h * 0.22;
  const n = Math.round(w / 0.24);
  for (let i = 0; i < n; i++) { const c = column('doric', { h: ch, r: 0.035, color: 0xf2ece0 }); c.position.set(-w / 2 + 0.12 + i * (w - 0.24) / (n - 1), h - ch - 0.06, d / 2 + 0.06); g.add(c); }
  const loggia = box(w - 0.1, ch, 0.02, col(0x5a5650)); loggia.position.set(0, h - ch / 2 - 0.06, d / 2 + 0.005); g.add(loggia);
  const cor = box(w + 0.12, 0.08, d + 0.12, col(0xf2ece0)); cor.position.y = h + 0.02; g.add(cor);
  const roof = box(w - 0.2, 0.1, d - 0.2, col(0x7a7e82)); roof.position.y = h + 0.1; g.add(roof);
  // Вход в средата.
  const ent = box(0.7, 0.55, 0.12, M(0xf2ece0, { tex: 'limestone' })); ent.position.set(0, 0.42, d / 2 + 0.06); g.add(ent);
  const door = box(0.36, 0.38, 0.01, col(0x3a3020)); door.position.set(0, 0.33, d / 2 + 0.125); g.add(door);
  if (flagOn) { const fl = flag(undefined, { pole: 0.7 }); fl.position.set(0, h + 0.15, d / 2 - 0.2); g.add(fl); g.userData.flag = fl.userData.cloth; }
  g.userData.top = h + 0.2;
  return g;
}

// ---------- вход на метрото ----------
// Стълби надолу с парапети и табела „М“. Стълбите слизат по −z.
const MSIGN = new Map();
export function metroEntrance({ w = 0.6 } = {}) {
  const g = new THREE.Group();
  const iron = col(0x3a3f44, { metal: 0.4, rough: 0.5 });
  const hole = box(w, 0.01, 1.0, col(0x2a2a2c)); hole.position.set(0, 0.006, -0.5); g.add(hole);
  for (let i = 0; i < 7; i++) { const st = box(w - 0.04, 0.012, 0.12, col(0x9a9894)); st.position.set(0, 0.014, -0.06 - i * 0.14); g.add(st); }
  for (const s of [-1, 1]) {
    const wl = box(0.04, 0.2, 1.0, M(0xffffff, { tex: 'limestone', rep: [2, 0.4] })); wl.position.set(s * w / 2, 0.1, -0.5); g.add(wl);
    const rail = box(0.02, 0.02, 1.0, iron); rail.position.set(s * w / 2, 0.24, -0.5); g.add(rail);
  }
  const back = box(w + 0.04, 0.24, 0.04, M(0xffffff, { tex: 'limestone', rep: [1, 0.4] })); back.position.set(0, 0.12, -1.0); g.add(back);
  if (!MSIGN.has('m')) {
    const c = document.createElement('canvas'); c.width = 128; c.height = 128;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#1f5fae'; ctx.fillRect(0, 0, 128, 128);
    ctx.fillStyle = '#ffffff'; ctx.font = 'bold 100px Arial, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('M', 64, 70);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    MSIGN.set('m', new THREE.MeshStandardMaterial({ map: t, roughness: 0.5, emissive: 0x0a2a5a, emissiveIntensity: 0.3 }));
  }
  const pole = cyl(0.015, 0.015, 0.7, iron, 6); pole.position.set(w / 2 + 0.12, 0.35, 0.05); g.add(pole);
  const sign = box(0.2, 0.2, 0.03, MSIGN.get('m')); sign.position.set(w / 2 + 0.12, 0.76, 0.05); g.add(sign);
  return g;
}

// ---------- Витоша ----------
// Широка планина на юг: гора в подножието, поляни и камъни горе. Върхът е в средата.
export function vitosha({ w = 46, d = 16, h = 6.5 } = {}) {
  const g = new THREE.Group();
  // Височина: широк хребет с връх в средата; отпред и отзад слиза към полето.
  const H = (x, z) => {
    const u = x / (w / 2), v = (z + d / 2) / d; // v: 0 отзад, 1 отпред
    const ridge = Math.exp(-u * u * 2.2) * (0.75 + 0.25 * Math.cos(u * 5.5));
    const prof = Math.exp(-(((v - 0.4) / 0.27) ** 2));
    return h * ridge * prof * (0.92 + 0.08 * Math.sin(x * 1.3 + z * 0.7));
  };
  const geo = new THREE.PlaneGeometry(w, d, 70, 26);
  geo.rotateX(-Math.PI / 2);
  const p = geo.attributes.position;
  const colors = [];
  const r = rnd(77);
  const cLow = new THREE.Color(0x3f6b35), cMid = new THREE.Color(0x5f8a45), cHigh = new THREE.Color(0x9a9478), cRock = new THREE.Color(0x8a8578);
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), z = p.getZ(i);
    const y = Math.max(0, H(x, z) + (r() - 0.5) * 0.12);
    p.setY(i, y);
    const k = y / h;
    const c = k < 0.35 ? cLow.clone().lerp(cMid, k / 0.35) : k < 0.7 ? cMid.clone().lerp(cHigh, (k - 0.35) / 0.35) : cHigh.clone().lerp(cRock, (k - 0.7) / 0.3);
    c.offsetHSL(0, 0, (r() - 0.5) * 0.04);
    colors.push(c.r, c.g, c.b);
  }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  const m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, flatShading: true, map: canvasTex('forest', 256, 256, DRAW.forest, [8, 3]) });
  const mesh = new THREE.Mesh(geo, m); g.add(mesh);
  // Борове по склоновете (много еднакви тела в една мрежа).
  const cone = new THREE.ConeGeometry(0.28, 0.9, 6); cone.translate(0, 0.45, 0);
  const n = 160;
  const inst = new THREE.InstancedMesh(cone, new THREE.MeshStandardMaterial({ color: 0x2c5531, flatShading: true }), n);
  const mtx = new THREE.Matrix4();
  let k = 0;
  for (let i = 0; i < n * 4 && k < n; i++) {
    const x = (r() - 0.5) * w * 0.85, z = (r() - 0.5) * d;
    const y = H(x, z);
    if (y < 0.15 || y > h * 0.5) continue;
    const s = 0.8 + r() * 0.6;
    mtx.compose(new THREE.Vector3(x, y - 0.05, z), new THREE.Quaternion(), new THREE.Vector3(s, s, s));
    inst.setMatrixAt(k++, mtx);
  }
  inst.count = k;
  g.add(inst);
  g.userData.peak = new THREE.Vector3(0, H(0, -d / 2 + 0.4 * d), -d / 2 + 0.4 * d);
  g.userData.heightAt = H;
  return g;
}
