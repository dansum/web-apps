// Модели за български манастир (Рилският манастир и подобни): крило с килии и дървен чардак,
// каменна отбранителна кула (като Хрельовата), кухня с огнище и котел, стая на книжовниците,
// клепало, ковчег с мощи, планински върхове. Има и „днешен“ вариант (XIX в.) на крилата и на
// голямата църква с шарени арки — за сравнение „тогава / днес“.
// Лицето на всяка сграда гледа по +z (към двора). Нисък полигон, кеширани текстури и геометрии.
import { THREE } from '../../kit.js';
import { M, gableRoof, archGeo } from './architecture.js';
import { MM, scribeDesk, jug } from './medieval.js';

// ---------- текстури ----------
const texCache = new Map();
function tex(key, w, h, draw, rep = [1, 1]) {
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
  // Варосана мазилка с леки петна.
  plaster(ctx, w, h) {
    ctx.fillStyle = '#efe9dc'; ctx.fillRect(0, 0, w, h);
    const r = rnd(3);
    for (let i = 0; i < 260; i++) { ctx.fillStyle = `rgba(${r() > 0.5 ? '120,105,80' : '255,255,250'},${0.04 + r() * 0.06})`; ctx.beginPath(); ctx.arc(r() * w, r() * h, 2 + r() * 9, 0, 7); ctx.fill(); }
  },
  // Шарени арки (днешния вид): клинове в червено, бяло и черно.
  stripes(ctx, w, h) {
    const C = ['#b4432f', '#f2ede2', '#2a2622', '#f2ede2'];
    for (let i = 0; i < 16; i++) { ctx.fillStyle = C[i % 4]; ctx.fillRect(i * w / 16, 0, w / 16 + 1, h); }
  },
  // Стенопис под галерията: светци в арки на син фон.
  fresco(ctx, w, h) {
    ctx.fillStyle = '#2f4f7a'; ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 4; i++) {
      const x = i * w / 4;
      ctx.fillStyle = '#c99a2e'; ctx.fillRect(x + 6, 10, w / 4 - 12, h - 20);
      ctx.fillStyle = '#e9dcc0'; ctx.fillRect(x + 12, 16, w / 4 - 24, h - 32);
      ctx.fillStyle = '#e8c070'; ctx.beginPath(); ctx.arc(x + w / 8, h * 0.3, 16, 0, 7); ctx.fill();
      ctx.fillStyle = '#d9a982'; ctx.beginPath(); ctx.arc(x + w / 8, h * 0.31, 9, 0, 7); ctx.fill();
      ctx.fillStyle = ['#8a2f2a', '#2f6a3a', '#6a3a6a', '#2f4f7a'][i]; ctx.fillRect(x + w / 8 - 16, h * 0.4, 32, h * 0.45);
    }
  },
  // Страница от ръкопис: два стълба редове и червен инициал.
  page(ctx, w, h) {
    ctx.fillStyle = '#f1e6c8'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#a3302a'; ctx.fillRect(w * 0.1, h * 0.1, w * 0.12, h * 0.12);
    ctx.fillStyle = '#3a2a1e';
    const r = rnd(9);
    for (let y = h * 0.12; y < h * 0.9; y += h / 22) {
      const x0 = y < h * 0.24 ? w * 0.26 : w * 0.1;
      ctx.fillRect(x0, y, w * (0.8 - (x0 - w * 0.1) / w) * (0.85 + r() * 0.15), 2);
    }
  },
  // Дървена дъска с жилки.
  board(ctx, w, h) {
    ctx.fillStyle = '#8a6440'; ctx.fillRect(0, 0, w, h);
    const r = rnd(41); ctx.strokeStyle = 'rgba(60,35,15,0.35)'; ctx.lineWidth = 1;
    for (let k = 0; k < 14; k++) { ctx.beginPath(); const y = r() * h; ctx.moveTo(0, y); ctx.bezierCurveTo(w / 3, y + (r() - 0.5) * 8, w * 0.66, y + (r() - 0.5) * 8, w, y); ctx.stroke(); }
  },
  // Рафт с подвързани книги.
  shelf(ctx, w, h) {
    ctx.fillStyle = '#4a321e'; ctx.fillRect(0, 0, w, h);
    const r = rnd(13); const C = ['#7a2f22', '#3a2a1e', '#5a1520', '#6b4524', '#2f3f5a', '#8a5a2b'];
    for (let row = 0; row < 4; row++) {
      let x = 6; const y0 = row * h / 4 + 6, hh = h / 4 - 12;
      while (x < w - 12) { const bw = 10 + r() * 10; ctx.fillStyle = C[Math.floor(r() * C.length)]; ctx.fillRect(x, y0 + r() * 4, bw, hh - r() * 4); ctx.fillStyle = 'rgba(212,175,55,0.7)'; ctx.fillRect(x + 2, y0 + hh * 0.3, bw - 4, 2); x += bw + 2; }
      ctx.fillStyle = '#2e1f12'; ctx.fillRect(0, (row + 1) * h / 4 - 6, w, 6);
    }
  },
};
const MATS = new Map();
export function MonM(name, { color = 0xffffff, rep = [1, 1], rough = 0.9, side } = {}) {
  const k = `${name}|${color}|${rep}|${side}`;
  if (!MATS.has(k)) MATS.set(k, new THREE.MeshStandardMaterial({ color, roughness: rough, side: side ?? THREE.FrontSide, map: tex(name, 256, 256, DRAW[name], rep) }));
  return MATS.get(k);
}

const geoCache = new Map();
const G = (key, make) => { if (!geoCache.has(key)) geoCache.set(key, make()); return geoCache.get(key); };
const box = (w, h, d, m) => new THREE.Mesh(G(`b${w},${h},${d}`, () => new THREE.BoxGeometry(w, h, d)), m);
const cyl = (rt, rb, h, m, seg = 10) => new THREE.Mesh(G(`c${rt},${rb},${h},${seg}`, () => new THREE.CylinderGeometry(rt, rb, h, seg)), m);
const STONE = (rep = [2, 1]) => M(0xffffff, { tex: 'stone', rep });
const WOOD = () => M(0x6b4a2c);
const DARKWOOD = () => M(0x4a3220);
const DARK = () => M(0x24201c);
// Полукръгъл връх на врата или прозорец.
const archTop = (r, m) => new THREE.Mesh(G(`at${r}`, () => new THREE.CircleGeometry(r, 10, 0, Math.PI)), m);
// Триъгълен фронтон в края на покрив на две води.
function gableEnd(span, rise, m) {
  const sh = new THREE.Shape([new THREE.Vector2(-span / 2, 0), new THREE.Vector2(span / 2, 0), new THREE.Vector2(0, rise)]);
  return new THREE.Mesh(G(`ge${span},${rise}`, () => new THREE.ShapeGeometry(sh)), m);
}

// ---------- крило с килии ----------
// Крило по x с дължина len и дълбочина d. Отзад (−z) е дебела каменна стена — отвън манастирът
// прилича на крепост. Отпред (+z, към двора) долу има каменни стълбове и врати, горе — дървен
// чардак (галерия) с парапет, врати на килии и прозорчета. today: днешният вид от XIX в. —
// четири етажа с бели арки и шарени клинове.
export function monasteryWing({ len = 6, d = 1.4, h1 = 0.9, h2 = 0.85, gal = 0.4, bay = 0.8, today = false, ends = [false, false] } = {}) {
  const g = new THREE.Group();
  const chimneys = [];
  const floors = today ? 4 : 2;
  const fh = today ? 0.74 : null;
  const H = today ? floors * fh : h1 + h2;
  const groundH = today ? fh : h1;
  const frontZ = d / 2 - gal;
  const n = Math.max(2, Math.round(len / bay));
  const step = len / n;
  // Задна каменна стена с тесни прозорци.
  const back = box(len, H, 0.16, today ? MonM('plaster', { rep: [len, 2] }) : STONE([Math.round(len * 1.4), 3]));
  back.position.set(0, H / 2, -d / 2 + 0.08); g.add(back);
  if (today) { const bs = box(len, groundH, 0.18, STONE([Math.round(len * 1.4), 1])); bs.position.set(0, groundH / 2, -d / 2 + 0.08); g.add(bs); }
  for (let i = 0; i < n; i++) {
    const x = -len / 2 + step * (i + 0.5);
    for (let f = 1; f < floors; f++) {
      const y = today ? f * fh + fh * 0.55 : h1 + h2 * 0.55;
      const w = box(0.08, 0.16, 0.02, DARK()); w.position.set(x, y, -d / 2 - 0.005); g.add(w);
    }
  }
  // Предна стена на сградата (зад галерията).
  const fwLow = box(len, groundH, 0.12, STONE([Math.round(len * 1.4), 1])); fwLow.position.set(0, groundH / 2, frontZ); g.add(fwLow);
  const fwUp = box(len, H - groundH, 0.1, MonM('plaster', { rep: [Math.max(1, Math.round(len / 2)), 1] })); fwUp.position.set(0, groundH + (H - groundH) / 2, frontZ); g.add(fwUp);
  // Странични стени (по желание — в краищата, които се виждат).
  ends.forEach((on, k) => {
    if (!on) return;
    const s = k ? 1 : -1;
    const e = box(0.14, H, d, today ? MonM('plaster') : STONE([2, 3])); e.position.set(s * len / 2, H / 2, 0); g.add(e);
    const ge = gableEnd(d + 0.5, today ? 0.5 : 0.45, today ? MonM('plaster', { side: THREE.DoubleSide }) : M(0xffffff, { tex: 'stone', rep: [1, 1], side: THREE.DoubleSide }));
    ge.rotation.y = Math.PI / 2; ge.position.set(s * (len / 2 + 0.071), H, 0); g.add(ge);
  });
  // Покрив, стрехи и комини.
  const roof = gableRoof(len + 0.2, d + 0.5, today ? 0.5 : 0.45); roof.position.y = H; g.add(roof);
  const eave = box(len + 0.2, 0.03, d + 0.42, DARKWOOD()); eave.position.y = H; g.add(eave);
  for (let i = 1; i < n; i += 3) {
    const x = -len / 2 + step * i;
    const ch = box(0.13, 0.42, 0.13, STONE([0.4, 0.6])); ch.position.set(x, H + 0.32, -0.05); g.add(ch);
    const cap = box(0.19, 0.04, 0.19, M(0x8a3c22)); cap.position.set(x, H + 0.55, -0.05); g.add(cap);
    chimneys.push(new THREE.Vector3(x, H + 0.6, -0.05));
  }
  if (!today) {
    // Приземен етаж: каменни стълбове, врати с полукръгъл връх.
    for (let i = 0; i <= n; i++) {
      const x = -len / 2 + step * i;
      const p = box(0.12, h1, 0.12, STONE([0.3, 1])); p.position.set(x, h1 / 2, d / 2 - 0.08); g.add(p);
    }
    for (let i = 0; i < n; i++) {
      const x = -len / 2 + step * (i + 0.5);
      if (i % 2 === 0) {
        const dr = box(0.24, 0.48, 0.02, MonM('board', { color: 0xb08050 })); dr.position.set(x, 0.24, frontZ + 0.07); g.add(dr);
        const t = archTop(0.12, MonM('board', { color: 0xb08050 })); t.position.set(x, 0.48, frontZ + 0.071); g.add(t);
      } else { const w = box(0.12, 0.16, 0.02, DARK()); w.position.set(x, 0.55, frontZ + 0.07); g.add(w); }
    }
    // Чардак: под, дървени стълбове, парапет със стругани пречки.
    const floor = box(len, 0.05, gal, WOOD()); floor.position.set(0, h1, d / 2 - gal / 2); g.add(floor);
    const beam = box(len, 0.06, 0.06, DARKWOOD()); beam.position.set(0, h1 - 0.04, d / 2 - 0.03); g.add(beam);
    for (let i = 0; i <= n * 2; i++) {
      const x = -len / 2 + (step / 2) * i;
      const p = cyl(0.025, 0.025, h2, WOOD(), 6); p.position.set(x, h1 + h2 / 2, d / 2 - 0.04); g.add(p);
      const br = box(0.03, 0.16, 0.03, WOOD()); br.position.set(x, H - 0.1, d / 2 - 0.04); g.add(br);
    }
    const rail = box(len, 0.035, 0.04, DARKWOOD()); rail.position.set(0, h1 + 0.3, d / 2 - 0.04); g.add(rail);
    for (let x = -len / 2 + 0.05; x < len / 2; x += 0.11) { const sl = box(0.016, 0.26, 0.016, WOOD()); sl.position.set(x, h1 + 0.15, d / 2 - 0.04); g.add(sl); }
    // Килии на горния етаж: врата и прозорче на всяка.
    for (let i = 0; i < n; i++) {
      const x = -len / 2 + step * (i + 0.5);
      const dr = box(0.2, 0.46, 0.02, MonM('board', { color: 0x9a6c40 })); dr.position.set(x - 0.14, h1 + 0.25, frontZ + 0.06); g.add(dr);
      const w = box(0.14, 0.17, 0.02, DARK()); w.position.set(x + 0.17, h1 + 0.45, frontZ + 0.06); g.add(w);
      const sill = box(0.18, 0.025, 0.04, WOOD()); sill.position.set(x + 0.17, h1 + 0.36, frontZ + 0.07); g.add(sill);
    }
  } else {
    // Днешният вид: приземен етаж с каменни арки, горе три етажа бели арки с шарени клинове.
    for (let f = 0; f < floors; f++) {
      for (let i = 0; i < n; i++) {
        const x = -len / 2 + step * (i + 0.5);
        const a = new THREE.Mesh(archGeo(step, fh, 0.08, 0.72), f === 0 ? STONE([0.5, 0.5]) : MonM('plaster'));
        a.position.set(x, f * fh, d / 2 - 0.04); g.add(a);
        if (f > 0) {
          const r = (step * 0.72) / 2, cy = fh - r - fh * 0.18;
          const ring = new THREE.Mesh(G(`ring${r}`, () => new THREE.RingGeometry(r, r + 0.06, 14, 1, 0, Math.PI)), MonM('stripes', { side: THREE.DoubleSide }));
          ring.position.set(x, f * fh + cy, d / 2 + 0.002); g.add(ring);
        }
        // Врати и прозорци на стаите зад арките.
        const w = box(0.13, 0.22, 0.02, f === 0 ? MonM('board', { color: 0xb08050 }) : DARK());
        w.position.set(x, f * fh + (f === 0 ? 0.2 : 0.32), frontZ + 0.07); g.add(w);
      }
      if (f > 0) {
        const sl = box(len, 0.04, gal, WOOD()); sl.position.set(0, f * fh, d / 2 - gal / 2); g.add(sl);
        const rail = box(len, 0.03, 0.03, DARKWOOD()); rail.position.set(0, f * fh + 0.24, d / 2 - 0.02); g.add(rail);
      }
    }
  }
  g.userData = { chimneys, height: H };
  return g;
}

// Портата: дебел каменен блок със сводест проход и тежки дървени крила, над него — стая с прозорче.
export function monasteryGate({ w = 1.5, d = 1.6, h = 1.9, today = false } = {}) {
  const g = new THREE.Group();
  const wm = today ? MonM('plaster') : STONE([1.5, 2]);
  for (const s of [-1, 1]) { const f = new THREE.Mesh(archGeo(w, h, 0.2, 0.62), wm); f.position.z = s * (d / 2 - 0.1); g.add(f); }
  // Проходът: странични стени и таван между двете лица с арки.
  const r = (w * 0.62) / 2, spring = h * 0.82 - r;
  for (const s of [-1, 1]) { const side = box(w / 2 - r, h, d - 0.4, wm); side.position.set(s * (r + (w / 2 - r) / 2), h / 2, 0); g.add(side); }
  const ceil = box(2 * r, h - spring - r * 0.55, d - 0.4, M(0x8f8676)); ceil.position.y = (h + spring + r * 0.55) / 2; g.add(ceil);
  const top = box(w, 0.06, d, M(0xb5ab98)); top.position.y = h; g.add(top);
  const roof = gableRoof(d + 0.2, w + 0.4, 0.4); roof.rotation.y = Math.PI / 2; roof.position.y = h; g.add(roof);
  const win = box(0.12, 0.2, 0.02, DARK()); win.position.set(0, h - 0.25, d / 2 + 0.005); g.add(win);
  // Крила на портата — отворени навътре.
  const leaves = [];
  for (const s of [-1, 1]) {
    const hinge = new THREE.Group(); hinge.position.set(s * w * 0.31, 0, -d / 2 + 0.24);
    const leaf = box(w * 0.31, h * 0.62, 0.05, MonM('board', { color: 0x9a6c40 })); leaf.position.set(-s * w * 0.155, h * 0.31, 0); hinge.add(leaf);
    for (const y of [0.2, 0.5, 0.8]) { const band = box(w * 0.31, 0.03, 0.06, M(0x2f2f33, { metal: 0.5 })); band.position.set(-s * w * 0.155, h * 0.62 * y, 0); hinge.add(band); }
    hinge.rotation.y = s * 1.3;
    g.add(hinge); leaves.push(hinge);
  }
  g.userData = { leaves };
  return g;
}

// ---------- кула ----------
// Каменна отбранителна кула с пет етажа като Хрельовата кула (XIV в.): долу дялан камък, горе ивици
// камък и тухла със слепи арки, тесни прозорци-бойници и нисък керемиден покрив.
export function defenseTower({ s = 1.15, h = 4.0 } = {}) {
  const g = new THREE.Group();
  const low = h * 0.56;
  const lower = box(s, low, s, STONE([1.4, 3])); lower.position.y = low / 2; g.add(lower);
  const upper = box(s, h - low, s, MM('banded', { rep: [1.4, 1.6] })); upper.position.y = low + (h - low) / 2; g.add(upper);
  const plinth = box(s + 0.1, 0.2, s + 0.1, STONE([1.4, 0.3])); plinth.position.y = 0.1; g.add(plinth);
  const band = box(s + 0.04, 0.05, s + 0.04, M(0xb5603f)); band.position.y = low; g.add(band);
  const cornice = box(s + 0.12, 0.07, s + 0.12, M(0xb5ab98)); cornice.position.y = h; g.add(cornice);
  const brick = M(0xb5603f);
  const dark = DARK();
  for (let f = 0; f < 4; f++) {
    const a = (f * Math.PI) / 2;
    const face = new THREE.Group(); face.rotation.y = a; g.add(face);
    // Две слепи арки в горната част.
    for (const x of [-s * 0.22, s * 0.22]) {
      const ar = new THREE.Mesh(archGeo(s * 0.36, (h - low) * 0.72, 0.03, 0.72), brick); ar.position.set(x, low + 0.08, s / 2 + 0.012); face.add(ar);
      const w = box(0.06, 0.24, 0.02, dark); w.position.set(x, low + (h - low) * 0.42, s / 2 + 0.01); face.add(w);
    }
    // Бойници на долните етажи.
    for (const y of [low * 0.35, low * 0.7]) { const sl = box(0.05, 0.2, 0.02, dark); sl.position.set(f % 2 ? 0.2 : -0.2, y, s / 2 + 0.005); face.add(sl); }
  }
  // Входът е на височина — към него води дървена стълба (за защита).
  const door = box(0.22, 0.4, 0.02, MonM('board', { color: 0x9a6c40 })); door.position.set(0, low * 0.42, s / 2 + 0.01); g.add(door);
  const dt = archTop(0.11, MonM('board', { color: 0x9a6c40 })); dt.position.set(0, low * 0.42 + 0.2, s / 2 + 0.011); g.add(dt);
  const land = box(0.36, 0.04, 0.24, WOOD()); land.position.set(0, low * 0.42 - 0.2, s / 2 + 0.12); g.add(land);
  for (let i = 0; i < 6; i++) { const st = box(0.3, 0.03, 0.09, WOOD()); st.position.set(0.32 + i * 0.1, low * 0.42 - 0.2 - (i + 1) * (low * 0.42 - 0.2) / 6, s / 2 + 0.12); g.add(st); }
  const rail = box(0.7, 0.03, 0.03, DARKWOOD()); rail.position.set(0.6, (low * 0.42 - 0.2) / 2 + 0.2, s / 2 + 0.17); rail.rotation.z = -Math.atan2(low * 0.42 - 0.2, 0.6); g.add(rail);
  // Нисък покрив на четири води.
  const r = new THREE.Mesh(G(`tr${s}`, () => new THREE.ConeGeometry(s * 0.82, 0.5, 4)), M(0xffffff, { tex: 'tiles', rep: [3, 1], flat: true }));
  r.rotation.y = Math.PI / 4; r.position.y = h + 0.3; g.add(r);
  const gold = M(0xd4af37, { metal: 0.7, rough: 0.3 });
  const cv = box(0.025, 0.2, 0.025, gold); cv.position.y = h + 0.62; g.add(cv);
  const ch = box(0.1, 0.025, 0.025, gold); ch.position.y = h + 0.66; g.add(ch);
  g.userData.height = h + 0.7;
  return g;
}

// ---------- днешната голяма църква (XIX в.) ----------
// Дълга църква с три купола, отворени галерии с шарени арки и стенописи под тях. Апсидата е на изток (+x).
export function bigChurch({ L = 4.4, W = 2.0, H = 1.35 } = {}) {
  const g = new THREE.Group();
  const wm = MonM('plaster', { color: 0xf3e6cc, rep: [3, 1] });
  const body = box(L, H, W, wm); body.position.y = H / 2; g.add(body);
  const roof = gableRoof(L + 0.1, W + 0.1, 0.35); roof.position.y = H; g.add(roof);
  const lead = M(0x5f6a72, { metal: 0.4, rough: 0.5 });
  const gold = M(0xd4af37, { metal: 0.7, rough: 0.3 });
  [[-L * 0.3, 0.32], [0, 0.42], [L * 0.3, 0.32]].forEach(([x, r]) => {
    const drum = cyl(r, r * 1.05, 0.5, MonM('stripes', { rep: [3, 1] }), 12); drum.position.set(x, H + 0.45, 0); g.add(drum);
    const dm = new THREE.Mesh(G(`dm${r}`, () => new THREE.SphereGeometry(r * 1.05, 14, 7, 0, Math.PI * 2, 0, Math.PI / 2)), lead); dm.position.set(x, H + 0.7, 0); g.add(dm);
    const cv = box(0.025, 0.2, 0.025, gold); cv.position.set(x, H + 0.8 + r, 0); g.add(cv);
    const cb = box(0.025, 0.025, 0.1, gold); cb.position.set(x, H + 0.84 + r, 0); g.add(cb);
  });
  // Три апсиди.
  for (const z of [-W * 0.3, 0, W * 0.3]) {
    const r = z === 0 ? W * 0.22 : W * 0.13;
    const ap = new THREE.Mesh(G(`ap${r}`, () => new THREE.CylinderGeometry(r, r, H * 0.8, 14, 1, false, 0, Math.PI)), wm); ap.position.set(L / 2, H * 0.4, z); g.add(ap);
  }
  // Галерии с шарени арки на юг (+z), север и запад; под тях стенописи.
  const fres = MonM('fresco', { rep: [3, 1] });
  for (const s of [-1, 1]) {
    const fw = box(L * 0.92, H * 0.85, 0.02, fres); fw.position.set(0, H * 0.45, s * (W / 2 + 0.012)); g.add(fw);
    const n = 7, step = L / n;
    for (let i = 0; i < n; i++) {
      const a = new THREE.Mesh(archGeo(step, H * 0.9, 0.08, 0.75), MonM('stripes', { rep: [1, 1] }));
      a.position.set(-L / 2 + step * (i + 0.5), 0, s * (W / 2 + 0.55)); g.add(a);
    }
    const pr = box(L + 0.1, 0.05, 0.62, M(0xffffff, { tex: 'tiles', rep: [6, 1] })); pr.position.set(0, H * 0.92, s * (W / 2 + 0.3)); pr.rotation.x = s * 0.18; g.add(pr);
    const pf = box(L, 0.04, 0.6, M(0xffffff, { tex: 'limestone', rep: [4, 1] })); pf.position.set(0, 0.02, s * (W / 2 + 0.3)); g.add(pf);
  }
  const wn = 3, wstep = (W + 1.1) / wn;
  for (let i = 0; i < wn; i++) {
    const a = new THREE.Mesh(archGeo(wstep, H * 0.9, 0.08, 0.75), MonM('stripes')); a.rotation.y = Math.PI / 2;
    a.position.set(-L / 2 - 0.55, 0, -(W + 1.1) / 2 + wstep * (i + 0.5)); g.add(a);
  }
  const fw = box(0.02, H * 0.85, W * 0.9, fres); fw.position.set(-L / 2 - 0.012, H * 0.45, 0); g.add(fw);
  const wr = box(0.62, 0.05, W + 1.2, M(0xffffff, { tex: 'tiles', rep: [1, 4] })); wr.position.set(-L / 2 - 0.3, H * 0.92, 0); wr.rotation.z = -0.18; g.add(wr);
  g.userData.height = H + 1.4;
  return g;
}

// ---------- кухня ----------
// Каменна кухня, отворена отпред (разрез): огнище с огън, котел на верига, рафт с гърнета, дърва.
export function monasteryKitchen({ w = 1.8, d = 1.3, h = 1.05 } = {}) {
  const g = new THREE.Group();
  const sm = STONE([2, 1.2]);
  const floor = box(w, 0.04, d, M(0xffffff, { tex: 'limestone', rep: [2, 2] })); floor.position.y = 0.02; g.add(floor);
  const back = box(w, h, 0.14, sm); back.position.set(0, h / 2, -d / 2 + 0.07); g.add(back);
  for (const s of [-1, 1]) { const side = box(0.14, h, d, sm); side.position.set(s * (w / 2 - 0.07), h / 2, 0); g.add(side); }
  for (const s of [-1, 1]) { const p = box(0.14, h, 0.14, sm); p.position.set(s * (w / 2 - 0.07), h / 2, d / 2 - 0.07); g.add(p); }
  const lintel = box(w, 0.12, 0.14, DARKWOOD()); lintel.position.set(0, h - 0.06, d / 2 - 0.07); g.add(lintel);
  const roof = gableRoof(w + 0.2, d + 0.4, 0.38); roof.position.y = h; g.add(roof);
  for (const s of [-1, 1]) { const ge = gableEnd(d + 0.3, 0.38, STONE([1, 0.5])); ge.rotation.y = s * Math.PI / 2; ge.position.set(s * (w / 2 + 0.001), h, 0); g.add(ge); }
  // Огнище с качулка и висок комин.
  const hearth = box(0.9, 0.22, 0.5, STONE([1, 0.3])); hearth.position.set(-0.2, 0.11, -d / 2 + 0.36); g.add(hearth);
  const hood = new THREE.Mesh(G('hood', () => new THREE.CylinderGeometry(0.16, 0.5, 0.42, 4, 1, true)), M(0xe2dccd, { side: THREE.DoubleSide }));
  hood.rotation.y = Math.PI / 4; hood.position.set(-0.2, h * 0.68, -d / 2 + 0.36); g.add(hood);
  const ch = box(0.3, 0.9, 0.3, sm); ch.position.set(-0.2, h + 0.35, -d / 2 + 0.36); g.add(ch);
  const chc = box(0.4, 0.05, 0.4, M(0x8a3c22)); chc.position.set(-0.2, h + 0.82, -d / 2 + 0.36); g.add(chc);
  const logs = new THREE.Group(); logs.position.set(-0.2, 0.23, -d / 2 + 0.36);
  for (const a of [0.5, -0.5, 1.4]) { const l = cyl(0.025, 0.025, 0.34, M(0x5b3f28), 6); l.rotation.set(Math.PI / 2, 0, a); l.position.y = 0.02; logs.add(l); }
  g.add(logs);
  const fireMat = new THREE.MeshStandardMaterial({ color: 0xffa030, emissive: 0xff6a10, emissiveIntensity: 1.2, transparent: true, opacity: 0.9 });
  const flames = [];
  for (const [x, z, s] of [[0, 0, 1], [0.07, 0.04, 0.7], [-0.07, -0.02, 0.8]]) {
    const f = new THREE.Mesh(G('flame', () => new THREE.ConeGeometry(0.05, 0.18, 7)), fireMat); f.position.set(-0.2 + x, 0.34, -d / 2 + 0.36 + z); f.scale.setScalar(s); g.add(f); flames.push(f);
  }
  // Котел на верига над огъня.
  const chain = box(0.012, 0.32, 0.012, M(0x2f2f33)); chain.position.set(-0.2, 0.68, -d / 2 + 0.36); g.add(chain);
  const pot = new THREE.Mesh(G('pot', () => new THREE.SphereGeometry(0.15, 14, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2)), M(0x2a2622, { metal: 0.4, rough: 0.5, side: THREE.DoubleSide }));
  pot.position.set(-0.2, 0.52, -d / 2 + 0.36); g.add(pot);
  const soup = new THREE.Mesh(G('soup', () => new THREE.CircleGeometry(0.14, 14)), M(0xb5873a)); soup.rotation.x = -Math.PI / 2; soup.position.set(-0.2, 0.515, -d / 2 + 0.36); g.add(soup);
  // Рафт с гърнета и купчина дърва.
  const sh = box(0.5, 0.03, 0.18, WOOD()); sh.position.set(0.55, 0.62, -d / 2 + 0.2); g.add(sh);
  [0xb5683a, 0x8a5a3a, 0xc07a4a].forEach((c, i) => { const j = jug(c); j.scale.setScalar(0.7); j.position.set(0.38 + i * 0.16, 0.635, -d / 2 + 0.2); g.add(j); });
  for (let i = 0; i < 7; i++) { const l = cyl(0.03, 0.03, 0.36, M(0x6b4f36), 6); l.rotation.z = Math.PI / 2; l.position.set(0.55, 0.05 + Math.floor(i / 3) * 0.055, -d / 2 + 0.55 + (i % 3) * 0.065 + (Math.floor(i / 3) % 2) * 0.03); g.add(l); }
  // Голяма маса за чистене на зеленчуци.
  const tb = box(0.6, 0.04, 0.3, WOOD()); tb.position.set(0.45, 0.34, d / 2 - 0.4); g.add(tb);
  for (const [x, z] of [[-0.25, -0.12], [0.25, -0.12], [-0.25, 0.12], [0.25, 0.12]]) { const lg = box(0.03, 0.32, 0.03, WOOD()); lg.position.set(0.45 + x, 0.16, d / 2 - 0.4 + z); g.add(lg); }
  g.userData = { flames, smokeAt: new THREE.Vector3(-0.2, h + 0.85, -d / 2 + 0.36), pot };
  return g;
}

// ---------- стая на книжовниците ----------
// Стая, отворена отпред (разрез): четири наклонени пулта, рафтове с книги, прозорец, икона и кандило.
// userData.seats: къде сядат книжовниците; userData.piles: купчинки преписани листове до всеки пулт.
export function scriptorium({ w = 3.0, d = 1.4, h = 1.05 } = {}) {
  const g = new THREE.Group();
  const pm = MonM('plaster', { rep: [2, 1] });
  const floor = box(w, 0.05, d, MonM('board', { rep: [3, 2] })); floor.position.y = 0.025; g.add(floor);
  const back = box(w, h, 0.12, pm); back.position.set(0, h / 2, -d / 2 + 0.06); g.add(back);
  for (const s of [-1, 1]) { const side = box(0.12, h, d, pm); side.position.set(s * (w / 2 - 0.06), h / 2, 0); g.add(side); }
  for (let i = 0; i < 4; i++) { const b = box(w, 0.06, 0.06, DARKWOOD()); b.position.set(0, h - 0.03, -d / 2 + 0.2 + i * (d - 0.3) / 3); g.add(b); }
  const roof = gableRoof(w + 0.2, d + 0.5, 0.45); roof.position.y = h; g.add(roof);
  for (const s of [-1, 1]) { const ge = gableEnd(d + 0.4, 0.45, pm); ge.rotation.y = s * Math.PI / 2; ge.position.set(s * (w / 2 + 0.001), h, 0); g.add(ge); }
  // Рафтове с книги по задната стена и прозорец с решетка.
  for (const x of [-w * 0.32, w * 0.32]) { const sh = box(w * 0.3, 0.72, 0.16, MonM('shelf')); sh.position.set(x, 0.42, -d / 2 + 0.2); g.add(sh); }
  const win = box(0.3, 0.32, 0.02, new THREE.MeshStandardMaterial({ color: 0xbfd8ee, emissive: 0x9fc0e0, emissiveIntensity: 0.4 })); win.position.set(0, 0.62, -d / 2 + 0.125); g.add(win);
  for (const x of [-0.08, 0, 0.08]) { const bar = box(0.012, 0.32, 0.012, M(0x2f2f33)); bar.position.set(x, 0.62, -d / 2 + 0.135); g.add(bar); }
  const icon = box(0.16, 0.22, 0.02, M(0xc99a2e)); icon.position.set(w / 2 - 0.13, 0.66, -0.2); icon.rotation.y = -Math.PI / 2; g.add(icon);
  const lamp = new THREE.Mesh(G('kandilo', () => new THREE.SphereGeometry(0.03, 10, 8)), new THREE.MeshStandardMaterial({ color: 0xc0302a, emissive: 0xff5a20, emissiveIntensity: 1 }));
  lamp.position.set(w / 2 - 0.22, 0.45, -0.2); g.add(lamp);
  // Четири пулта. Книжовникът седи зад пулта и гледа към двора (+z), за да се вижда.
  const desks = [], seats = [], piles = [], flames = [];
  const xs = [-1.05, -0.35, 0.35, 1.05].map((x) => x * w / 3);
  xs.forEach((x) => {
    const dk = scribeDesk();
    dk.remove(dk.userData.shelf);
    dk.rotation.y = Math.PI; dk.position.set(x, 0.05, 0.12); g.add(dk);
    desks.push(dk); flames.push(dk.userData.flame);
    seats.push(new THREE.Vector3(x, 0.05, 0.12 - 0.36));
    // Купчинка преписани листове до пулта: расте по време на опита.
    const pile = box(0.13, 0.1, 0.17, MonM('page')); pile.position.set(x + 0.32, 0.05, 0.12); pile.scale.y = 0.01; pile.userData.base = 0.05; g.add(pile); piles.push(pile);
  });
  g.userData = { desks, seats, piles, flames, lamp };
  return g;
}

// Клепало: дървена дъска на рамка; монах удря по нея с чукче, за да събере братята.
export function klepalo() {
  const g = new THREE.Group();
  for (const s of [-1, 1]) { const p = box(0.06, 0.95, 0.06, DARKWOOD()); p.position.set(s * 0.4, 0.475, 0); g.add(p); }
  const top = box(0.95, 0.07, 0.08, DARKWOOD()); top.position.y = 0.95; g.add(top);
  const pivot = new THREE.Group(); pivot.position.y = 0.92; g.add(pivot);
  for (const s of [-1, 1]) { const c = box(0.01, 0.18, 0.01, M(0x2f2f33)); c.position.set(s * 0.22, -0.09, 0); pivot.add(c); }
  const b = box(0.6, 0.1, 0.035, MonM('board')); b.position.y = -0.22; pivot.add(b);
  g.userData = { board: pivot };
  return g;
}

// Ковчег с мощи: позлатена кутия с покрив, носена на два пръта.
export function reliquary() {
  const g = new THREE.Group();
  const gold = M(0xd4af37, { metal: 0.7, rough: 0.3 });
  const b = box(0.36, 0.16, 0.2, gold); b.position.y = 0.08; g.add(b);
  const lid = new THREE.Mesh(G('rlid', () => { const c = new THREE.CylinderGeometry(0.11, 0.11, 0.36, 4, 1, false, 0, Math.PI); c.rotateZ(Math.PI / 2); return c; }), gold);
  lid.rotation.x = -Math.PI / 2; lid.position.y = 0.16; g.add(lid);
  const cross = box(0.02, 0.1, 0.02, gold); cross.position.y = 0.3; g.add(cross);
  const cb = box(0.06, 0.02, 0.02, gold); cb.position.y = 0.32; g.add(cb);
  const cloth = box(0.4, 0.01, 0.24, M(0x8a1f2b)); cloth.position.y = 0.005; g.add(cloth);
  for (const s of [-1, 1]) { const pole = box(0.9, 0.02, 0.02, DARKWOOD()); pole.position.set(0, 0.0, s * 0.13); g.add(pole); }
  return g;
}

// Планински връх: скала с гора отдолу и сняг на върха (за Рила).
export function peak({ r = 8, h = 7, seed = 1, snow = true } = {}) {
  const g = new THREE.Group();
  const geo = new THREE.ConeGeometry(r, h, 9, 4);
  const p = geo.attributes.position, rr = rnd(seed * 31 + 7);
  for (let i = 0; i < p.count; i++) {
    const y = p.getY(i);
    if (y > h / 2 - 1e-3) continue;
    const k = 1 + (rr() - 0.5) * 0.28;
    p.setX(i, p.getX(i) * k); p.setZ(i, p.getZ(i) * k); p.setY(i, y + (rr() - 0.5) * h * 0.06);
  }
  geo.computeVertexNormals();
  const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: 0x7a8a6a, roughness: 1, flatShading: true }));
  m.position.y = h / 2; g.add(m);
  // Гора по долната половина: тъмнозелен „пояс“.
  const forest = new THREE.Mesh(G(`fb${r},${h}`, () => new THREE.CylinderGeometry(r * 0.62, r * 1.02, h * 0.4, 9, 1, true)), new THREE.MeshStandardMaterial({ color: 0x2f5e36, roughness: 1, flatShading: true }));
  forest.position.y = h * 0.2; g.add(forest);
  if (snow) {
    const cap = new THREE.Mesh(G(`sn${r},${h}`, () => new THREE.ConeGeometry(r * 0.26, h * 0.26, 9)), new THREE.MeshStandardMaterial({ color: 0xf4f6f8, roughness: 0.9, flatShading: true }));
    cap.position.y = h * 0.87 + 0.02; g.add(cap);
  }
  return g;
}
