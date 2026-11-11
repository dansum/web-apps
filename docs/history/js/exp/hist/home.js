// Домът през XX век: стая, мебели и уреди в три епохи (около 1900, 1960 и 2020 г.).
// Мерките са в метри (човек е около 1,65 м). Лицето на уредите гледа по +z.
// Движещите се и светещите части са в userData (fire, steam, hot, plate, drum, agit, flame, bulb, panel, screen, leds),
// за да ги оживи преживяването и да ги остави отделни при mergeStatic.
import { THREE } from '../../kit.js';
import { bakeColors } from './industrial.js';

// ---------- текстури ----------
const cache = new Map();
function canvasTex(key, w, h, draw, rep = [1, 1]) {
  const k = `${key}|${rep}`;
  if (cache.has(k)) return cache.get(k);
  let base = cache.get(key);
  if (!base) {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    draw(c.getContext('2d'), w, h);
    base = new THREE.CanvasTexture(c);
    base.colorSpace = THREE.SRGBColorSpace;
    base.wrapS = base.wrapT = THREE.RepeatWrapping;
    base.anisotropy = 4;
    cache.set(key, base);
  }
  if (rep[0] === 1 && rep[1] === 1) return base;
  const t = base.clone(); t.needsUpdate = true; t.repeat.set(...rep); cache.set(k, t);
  return t;
}
const rnd = (seed) => () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
const grain = (ctx, x, y, w, h, r, dark = '60,35,15', n = 14) => {
  ctx.strokeStyle = `rgba(${dark},0.18)`; ctx.lineWidth = 1;
  for (let i = 0; i < n; i++) { const yy = y + r() * h; ctx.beginPath(); ctx.moveTo(x, yy); for (let xx = x; xx <= x + w; xx += 16) ctx.lineTo(xx, yy + Math.sin(xx / 21 + i) * 1.6); ctx.stroke(); }
};
const DRAW = {
  // Широки дъски на пода (1900).
  boards(ctx, w, h) {
    const r = rnd(5);
    for (let i = 0; i < 4; i++) { const v = (r() - 0.5) * 22; ctx.fillStyle = `rgb(${128 + v},${88 + v},${54 + v})`; ctx.fillRect(0, i * h / 4, w, h / 4); grain(ctx, 0, i * h / 4, w, h / 4, r); ctx.fillStyle = 'rgba(40,22,10,0.6)'; ctx.fillRect(0, i * h / 4, w, 2); }
    ctx.fillStyle = 'rgba(30,18,8,0.7)'; for (let i = 0; i < 4; i++) for (const x of [20, 236]) { ctx.beginPath(); ctx.arc(x, i * h / 4 + 10, 2, 0, 7); ctx.fill(); ctx.beginPath(); ctx.arc(x, i * h / 4 + h / 4 - 10, 2, 0, 7); ctx.fill(); }
  },
  // Паркет „рибена кост“ (1960).
  parquet(ctx, w, h) {
    const r = rnd(11);
    ctx.fillStyle = '#7a4a26'; ctx.fillRect(0, 0, w, h);
    const s = 32;
    for (let y = 0; y < h; y += s) for (let x = 0; x < w; x += s) {
      const v = (r() - 0.5) * 30; ctx.fillStyle = `rgb(${165 + v},${108 + v},${60 + v})`;
      if (((x + y) / s) % 2) { ctx.fillRect(x + 1, y + 1, s - 2, s / 2 - 2); ctx.fillRect(x + 1, y + s / 2 + 1, s - 2, s / 2 - 2); }
      else { ctx.fillRect(x + 1, y + 1, s / 2 - 2, s - 2); ctx.fillRect(x + s / 2 + 1, y + 1, s / 2 - 2, s - 2); }
    }
  },
  // Светъл ламинат (2020).
  laminate(ctx, w, h) {
    const r = rnd(17);
    for (let i = 0; i < 6; i++) {
      const y = i * h / 6, off = (i * 97) % w;
      for (const x0 of [-off, w - off]) { const v = (r() - 0.5) * 18; ctx.fillStyle = `rgb(${206 + v},${178 + v},${138 + v})`; ctx.fillRect(x0, y, w, h / 6); grain(ctx, x0, y, w, h / 6, r, '120,80,40', 6); ctx.fillStyle = 'rgba(90,60,30,0.35)'; ctx.fillRect(x0, y, 2, h / 6); }
      ctx.fillStyle = 'rgba(90,60,30,0.35)'; ctx.fillRect(0, y, w, 1.5);
    }
  },
  // Варосана стена (1900).
  whitewash(ctx, w, h) {
    ctx.fillStyle = '#f4f2ea'; ctx.fillRect(0, 0, w, h);
    const r = rnd(23); for (let i = 0; i < 320; i++) { ctx.fillStyle = `rgba(${r() > 0.5 ? '150,140,120' : '200,210,225'},${r() * 0.08})`; ctx.beginPath(); ctx.arc(r() * w, r() * h, 3 + r() * 10, 0, 7); ctx.fill(); }
  },
  // Боядисана стена с шарка от валяк (1960).
  roller(ctx, w, h) {
    ctx.fillStyle = '#cfe0c8'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(70,110,80,0.35)';
    for (let y = 16; y < h; y += 32) for (let x = (y / 32) % 2 ? 16 : 0; x < w; x += 32) {
      for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2; ctx.beginPath(); ctx.ellipse(x + Math.cos(a) * 5, y + Math.sin(a) * 5, 5, 2.5, a, 0, 7); ctx.fill(); }
    }
  },
  // Гладка боя (2020).
  paint(ctx, w, h) {
    ctx.fillStyle = '#f3ede4'; ctx.fillRect(0, 0, w, h);
    const r = rnd(31); for (let i = 0; i < 200; i++) { ctx.fillStyle = `rgba(150,130,110,${r() * 0.04})`; ctx.fillRect(r() * w, r() * h, 6, 6); }
  },
  // Тъкана черга на ивици (1900).
  cherga(ctx, w, h) {
    const cols = ['#a8262a', '#1e1e24', '#f0e6cf', '#a8262a', '#2f5a8a', '#f0e6cf', '#d9a441'];
    let y = 0, i = 0; const r = rnd(3);
    while (y < h) { const t = 8 + Math.floor(r() * 18); ctx.fillStyle = cols[i++ % cols.length]; ctx.fillRect(0, y, w, t); y += t; }
    ctx.fillStyle = 'rgba(255,255,255,0.12)'; for (let x = 0; x < w; x += 4) ctx.fillRect(x, 0, 1, h);
  },
  // Килим с шарка (1960).
  carpet(ctx, w, h) {
    ctx.fillStyle = '#7a1f28'; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#d9b46a'; ctx.lineWidth = 8; ctx.strokeRect(14, 14, w - 28, h - 28);
    ctx.strokeStyle = '#1f2f4a'; ctx.lineWidth = 5; ctx.strokeRect(28, 28, w - 56, h - 56);
    ctx.fillStyle = '#d9b46a';
    const c = w / 2; for (const rr of [60, 36]) { ctx.beginPath(); ctx.moveTo(c, c - rr); ctx.lineTo(c + rr, c); ctx.lineTo(c, c + rr); ctx.lineTo(c - rr, c); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#1f2f4a'; }
    ctx.fillStyle = '#e8d8b0'; for (const [x, y] of [[60, 60], [w - 60, 60], [60, h - 60], [w - 60, h - 60]]) { ctx.beginPath(); ctx.arc(x, y, 12, 0, 7); ctx.fill(); }
  },
  // Сив мек килим (2020).
  rug(ctx, w, h) {
    ctx.fillStyle = '#9aa3a8'; ctx.fillRect(0, 0, w, h);
    const r = rnd(9); for (let i = 0; i < 900; i++) { ctx.fillStyle = `rgba(${r() > 0.5 ? '255,255,255' : '40,50,60'},${r() * 0.12})`; ctx.fillRect(r() * w, r() * h, 2, 2); }
    ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 4; ctx.strokeRect(10, 10, w - 20, h - 20);
  },
  // Плат на високоговорителя на радиото.
  grille(ctx, w, h) {
    ctx.fillStyle = '#c8b48a'; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(90,70,40,0.45)'; ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 3) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
    for (let y = 0; y < h; y += 3) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
    ctx.strokeStyle = '#6b4a2c'; ctx.lineWidth = 6; for (const x of [w * 0.33, w * 0.66]) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
  },
  // Скала на радиото с имена на градове.
  dial(ctx, w, h) {
    ctx.fillStyle = '#f6e7b8'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#5a3a1a'; ctx.font = 'bold 22px sans-serif';
    ['София', 'Варна', 'Пловдив', 'Русе'].forEach((s, i) => ctx.fillText(s, 10 + i * 62, h / 2 + 8));
    ctx.fillStyle = '#b02a20'; ctx.fillRect(w * 0.42, 4, 4, h - 8);
  },
  // Писмо с редове (ръкопис).
  letter(ctx, w, h) {
    ctx.fillStyle = '#f4ecd8'; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#2a3a6a'; ctx.lineWidth = 2; const r = rnd(13);
    for (let y = 30; y < h - 20; y += 18) { ctx.beginPath(); ctx.moveTo(20, y); let x = 20; while (x < w - 30) { const s = 10 + r() * 22; ctx.lineTo(x + s, y + (r() - 0.5) * 3); x += s + 6; ctx.moveTo(x, y); } ctx.stroke(); }
  },
  // Шайба на телефона.
  rotary(ctx, w, h) {
    ctx.fillStyle = '#1b1b1f'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#f2efe6'; ctx.beginPath(); ctx.arc(w / 2, h / 2, w * 0.2, 0, 7); ctx.fill();
    ctx.font = 'bold 18px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (let i = 0; i < 10; i++) { const a = -Math.PI / 3 - i * (Math.PI * 1.45 / 9); const x = w / 2 + Math.cos(a) * w * 0.36, y = h / 2 + Math.sin(a) * h * 0.36; ctx.fillStyle = '#e8e4da'; ctx.beginPath(); ctx.arc(x, y, 13, 0, 7); ctx.fill(); ctx.fillStyle = '#222'; ctx.fillText(String((i + 1) % 10), x, y); }
  },
  // Плочки за кухнята (2020).
  tiles(ctx, w, h) {
    ctx.fillStyle = '#c8ccd0'; ctx.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 32) for (let x = 0; x < w; x += 64) { ctx.fillStyle = '#f4f6f7'; ctx.fillRect(x + ((y / 32) % 2) * 32 + 1, y + 1, 62, 30); }
  },
  // Асфалт.
  asphalt(ctx, w, h) {
    ctx.fillStyle = '#55585c'; ctx.fillRect(0, 0, w, h);
    const r = rnd(43); for (let i = 0; i < 1500; i++) { ctx.fillStyle = `rgba(${r() > 0.5 ? '255,255,255' : '0,0,0'},${r() * 0.12})`; ctx.fillRect(r() * w, r() * h, 2, 2); }
  },
  // Панелен блок: стена с прозорци и балкони (рисувано).
  panel(ctx, w, h) {
    ctx.fillStyle = '#d8d2c4'; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(80,80,80,0.35)'; ctx.lineWidth = 2; ctx.strokeRect(1, 1, w - 2, h - 2);
    ctx.fillStyle = '#3a4a58'; ctx.fillRect(w * 0.18, h * 0.22, w * 0.3, h * 0.42);
    ctx.fillStyle = '#4a5a68'; ctx.fillRect(w * 0.58, h * 0.22, w * 0.26, h * 0.6);
    ctx.fillStyle = '#f2efe6'; ctx.fillRect(w * 0.18 + w * 0.145, h * 0.22, 3, h * 0.42); ctx.fillRect(w * 0.18, h * 0.43, w * 0.3, 3);
    ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(w * 0.2, h * 0.24, w * 0.08, h * 0.15);
  },
};
const MATS = new Map();
// Материал с рисувана текстура (name от DRAW) или плътен цвят (name = null).
export function HM(name, { color = 0xffffff, rep = [1, 1], rough = 0.8, metal = 0, emissive = 0, side, transparent = false, opacity = 1 } = {}) {
  const k = `${name}|${color}|${rep}|${rough}|${metal}|${emissive}|${side}|${transparent}|${opacity}`;
  if (!MATS.has(k)) {
    const m = new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal, side: side ?? THREE.FrontSide, transparent, opacity });
    if (name) m.map = canvasTex(name, 256, 256, DRAW[name], rep);
    if (emissive) { m.emissive = new THREE.Color(emissive); }
    MATS.set(k, m);
  }
  return MATS.get(k);
}
const C = (color, o = {}) => HM(null, { color, ...o });
const GEO = new Map();
const G = (key, make) => { if (!GEO.has(key)) GEO.set(key, make()); return GEO.get(key); };
const box = (w, h, d, m) => new THREE.Mesh(G(`b${w},${h},${d}`, () => new THREE.BoxGeometry(w, h, d)), m);
const cyl = (rt, rb, h, m, seg = 16) => new THREE.Mesh(G(`c${rt},${rb},${h},${seg}`, () => new THREE.CylinderGeometry(rt, rb, h, seg)), m);
const sph = (r, m, ws = 16, hs = 10) => new THREE.Mesh(G(`s${r},${ws},${hs}`, () => new THREE.SphereGeometry(r, ws, hs)), m);
const at = (g, o, x, y, z, rx = 0, ry = 0, rz = 0) => { o.position.set(x, y, z); o.rotation.set(rx, ry, rz); g.add(o); return o; };
// Собствен материал (за части, които светват или се сменят).
const own = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.5, ...o });

const IRON = () => C(0x26282b, { rough: 0.55, metal: 0.5 });
const CHROME = () => C(0xd8dde2, { rough: 0.25, metal: 0.8 });
const ENAMEL = () => C(0xf4f4f0, { rough: 0.35 });
const BRASS = () => C(0xc9a640, { rough: 0.35, metal: 0.6 });
const WOODD = () => C(0x6b4426);
const WOODL = () => C(0xb5875a);
const GLASS = () => C(0xcfe6ee, { rough: 0.1, transparent: true, opacity: 0.35 });

// Екран, който се рисува в canvas и може да се сменя (смартфон, телевизор, таблет).
export function screenCanvas(w = 256, h = 160) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return { c, ctx: c.getContext('2d'), tex: t, mat: new THREE.MeshBasicMaterial({ map: t }) };
}

// ---------- стая ----------
// Под и две стени (задна с прозорец и лява). Материалите на пода и стените се сменят с setLook.
export function room({ W = 6, D = 4.4, H = 2.8, win = [-0.2, 1.4, 0.9, 2.1] } = {}) {
  const g = new THREE.Group();
  const t = 0.16;
  const floor = box(W + t, 0.1, D + t, C(0xffffff)); floor.position.set(-t / 2, -0.05, -t / 2); g.add(floor);
  const [x0, x1, y0, y1] = win;
  const back = [];
  const wallPart = (cx, cy, w, h) => { const m = box(w, h, t, C(0xffffff)); m.position.set(cx, cy, -D / 2 - t / 2); g.add(m); back.push(m); };
  wallPart((-W / 2 - t + x0) / 2, H / 2, x0 + W / 2 + t, H);
  wallPart((x1 + W / 2) / 2, H / 2, W / 2 - x1, H);
  wallPart((x0 + x1) / 2, y0 / 2, x1 - x0, y0);
  wallPart((x0 + x1) / 2, (y1 + H) / 2, x1 - x0, H - y1);
  const left = box(t, H, D, C(0xffffff)); left.position.set(-W / 2 - t / 2, H / 2, 0); g.add(left);
  // Перваз на прозореца (вътре) и горен ръб на стените.
  at(g, box(x1 - x0 + 0.12, 0.04, 0.26, C(0xe8e2d4)), (x0 + x1) / 2, y0, -D / 2 + 0.03);
  const capM = C(0xd8d2c4);
  at(g, box(W + t, 0.04, t + 0.02, capM), -t / 2, H + 0.02, -D / 2 - t / 2);
  at(g, box(t + 0.02, 0.04, D, capM), -W / 2 - t / 2, H + 0.02, 0);
  // Первази по пода.
  const skirt = [box(W, 0.08, 0.02, C(0xffffff)), box(0.02, 0.08, D, C(0xffffff))];
  skirt[0].position.set(0, 0.04, -D / 2 + 0.01); skirt[1].position.set(-W / 2 + 0.01, 0.04, 0); g.add(...skirt);
  const LOOKS = [
    { floor: HM('boards', { rep: [3, 4] }), wall: HM('whitewash', { rep: [3, 1.4] }), skirt: C(0x5a3a20) },
    { floor: HM('parquet', { rep: [5, 4] }), wall: HM('roller', { rep: [5, 2.4] }), skirt: C(0x6b4426) },
    { floor: HM('laminate', { rep: [3, 3] }), wall: HM('paint', { rep: [3, 1.4] }), skirt: C(0xf6f4ee) },
  ];
  g.userData = {
    W, D, H, win,
    setLook(e) {
      const L = LOOKS[e];
      floor.material = L.floor; left.material = L.wall; back.forEach((m) => { m.material = L.wall; });
      skirt.forEach((m) => { m.material = L.skirt; });
    },
  };
  g.userData.setLook(0);
  return g;
}

// Прозоречна рамка за отвора (ширина w, височина h, в равнината z = 0). Стил 0: дървена с шест стъкла и
// капаци; 1: бяла дървена с две крила; 2: бяла рамка с голямо стъкло.
export function windowFrame(w, h, style = 0) {
  const g = new THREE.Group();
  const fm = style === 0 ? C(0x7a5232) : C(style === 1 ? 0xf0ede4 : 0xfafafa, { rough: style === 2 ? 0.3 : 0.6 });
  const f = 0.06;
  for (const [x, y, ww, hh] of [[0, h / 2 - f / 2, w, f], [0, -h / 2 + f / 2, w, f], [-w / 2 + f / 2, 0, f, h], [w / 2 - f / 2, 0, f, h]]) at(g, box(ww, hh, 0.08, fm), x, y, 0);
  const glass = new THREE.Mesh(G(`pl${w},${h}`, () => new THREE.PlaneGeometry(w - f * 2, h - f * 2)), GLASS()); g.add(glass);
  if (style === 0) {
    at(g, box(0.04, h, 0.06, fm), 0, 0, 0);
    for (const y of [-h / 6, h / 6]) at(g, box(w, 0.03, 0.05, fm), 0, y, 0);
    // Капаци отвън.
    for (const s of [-1, 1]) { const sh = box(w / 2, h, 0.03, C(0x4f6f4a)); sh.position.set(s * (w * 0.75 + 0.02), 0, -0.1); g.add(sh); for (let k = -3; k <= 3; k++) at(g, box(w / 2 - 0.04, 0.02, 0.035, C(0x3f5f3a)), s * (w * 0.75 + 0.02), k * h / 8, -0.095); }
  } else if (style === 1) {
    at(g, box(0.05, h, 0.07, fm), 0, 0, 0);
    at(g, box(w, 0.04, 0.06, fm), 0, h / 2 - h * 0.22, 0);
    for (const s of [-1, 1]) at(g, box(0.02, 0.08, 0.03, CHROME()), s * 0.06, -0.05, 0.05);
  } else {
    at(g, box(0.05, 0.12, 0.03, CHROME()), w / 2 - 0.12, 0, 0.06);
    // Щора отгоре.
    at(g, box(w + 0.06, 0.1, 0.1, C(0xe6e6e6)), 0, h / 2 + 0.06, 0.06);
  }
  return g;
}

// ---------- готвене ----------
export function woodStove() {
  const g = new THREE.Group();
  for (const [x, z] of [[-0.26, -0.18], [0.26, -0.18], [-0.26, 0.18], [0.26, 0.18]]) at(g, cyl(0.025, 0.035, 0.22, IRON(), 8), x, 0.11, z);
  at(g, box(0.62, 0.5, 0.46, IRON()), 0, 0.47, 0);
  at(g, box(0.68, 0.04, 0.52, C(0x3a3d40, { rough: 0.4, metal: 0.6 })), 0, 0.74, 0);
  // Котлони на плочата и кант от месинг.
  for (const x of [-0.15, 0.15]) at(g, cyl(0.1, 0.1, 0.012, C(0x1d1e20, { metal: 0.6, rough: 0.4 }), 18), x, 0.765, 0.02);
  at(g, box(0.64, 0.025, 0.02, BRASS()), 0, 0.71, 0.24);
  // Вратичка с огън.
  at(g, box(0.24, 0.2, 0.02, C(0x3a3d40, { metal: 0.6, rough: 0.4 })), -0.12, 0.45, 0.235);
  const fire = new THREE.Mesh(G('fireP', () => new THREE.PlaneGeometry(0.16, 0.08)), own(0xffa040, { emissive: 0xff6a10, emissiveIntensity: 1.6 }));
  fire.position.set(-0.12, 0.42, 0.247); g.add(fire);
  for (let i = 0; i < 4; i++) at(g, box(0.01, 0.07, 0.01, IRON()), -0.18 + i * 0.04, 0.42, 0.252);
  at(g, box(0.05, 0.02, 0.03, BRASS()), 0.0, 0.5, 0.26);
  // Фурна вдясно.
  at(g, box(0.22, 0.2, 0.02, C(0x3a3d40, { metal: 0.6, rough: 0.4 })), 0.16, 0.45, 0.235);
  at(g, box(0.12, 0.02, 0.03, BRASS()), 0.16, 0.53, 0.25);
  // Тенджера с капак.
  const pot = cyl(0.11, 0.1, 0.14, C(0x8a5a3a, { metal: 0.5, rough: 0.4 }), 18); pot.position.set(-0.15, 0.84, 0.02); g.add(pot);
  at(g, cyl(0.115, 0.115, 0.015, C(0x7a4a2a, { metal: 0.5, rough: 0.4 }), 18), -0.15, 0.915, 0.02);
  // Кюнец към стената.
  const pipeM = C(0x2f3134, { metal: 0.6, rough: 0.5 });
  at(g, cyl(0.06, 0.06, 1.2, pipeM, 12), 0.18, 1.36, -0.1);
  at(g, cyl(0.06, 0.06, 0.35, pipeM, 12), 0.18, 1.96, -0.3, Math.PI / 2, 0, 0);
  // Дърва до печката.
  for (let i = 0; i < 5; i++) at(g, cyl(0.04, 0.045, 0.4, C(i % 2 ? 0x8a6a48 : 0x6f5238), 7), 0.45 + (i % 3) * 0.08, 0.05 + Math.floor(i / 3) * 0.07, 0.1, 0, 0, Math.PI / 2).rotation.y = Math.PI / 2;
  g.userData = { fire, steam: new THREE.Vector3(-0.15, 0.95, 0.02) };
  return g;
}
export function electricStove() {
  const g = new THREE.Group();
  at(g, box(0.56, 0.84, 0.56, ENAMEL()), 0, 0.42, 0);
  at(g, box(0.58, 0.03, 0.58, C(0xe6e6e0, { rough: 0.3 })), 0, 0.855, 0);
  const plates = [];
  for (const [x, z, r] of [[-0.13, -0.12, 0.08], [0.13, -0.12, 0.1], [-0.13, 0.12, 0.1], [0.13, 0.12, 0.08]]) {
    const p = cyl(r, r, 0.02, own(0x2a2a2c, { metalness: 0.4 }), 20); p.position.set(x, 0.875, z); g.add(p); plates.push(p);
  }
  // Ключове и фурна със стъкло.
  for (let i = 0; i < 4; i++) at(g, cyl(0.022, 0.022, 0.03, C(0x1f1f22), 10), -0.18 + i * 0.12, 0.76, 0.29, Math.PI / 2, 0, 0);
  at(g, box(0.5, 0.02, 0.01, C(0x9aa0a6, { metal: 0.6 })), 0, 0.7, 0.284);
  at(g, box(0.46, 0.42, 0.01, C(0xeeeeea)), 0, 0.38, 0.284);
  at(g, box(0.3, 0.18, 0.012, C(0x2a2e33, { rough: 0.15 })), 0, 0.42, 0.29);
  at(g, box(0.34, 0.025, 0.04, CHROME()), 0, 0.56, 0.31);
  at(g, box(0.56, 0.06, 0.02, C(0x2a2a2c)), 0, 0.04, 0.27);
  // Тенджера върху котлона.
  at(g, cyl(0.1, 0.095, 0.13, C(0xd8dde2, { metal: 0.6, rough: 0.3 }), 18), 0.13, 0.95, -0.12);
  g.userData = { hot: plates[2], steam: new THREE.Vector3(0.13, 1.02, -0.12) };
  return g;
}
// Кухненски шкаф с котлони и микровълнова печка (2020).
export function modernKitchen() {
  const g = new THREE.Group();
  at(g, box(1.0, 0.86, 0.6, C(0xf6f6f4, { rough: 0.35 })), 0, 0.45, 0);
  at(g, box(1.0, 0.06, 0.6, C(0x2a2a2c)), 0, 0.03, 0.02);
  for (const x of [-0.25, 0.25]) { at(g, box(0.48, 0.78, 0.01, C(0xffffff, { rough: 0.3 })), x, 0.46, 0.305); at(g, box(0.18, 0.015, 0.02, C(0x9aa0a6, { metal: 0.7 })), x, 0.8, 0.32); }
  at(g, box(1.04, 0.04, 0.64, C(0x5a4a3c, { rough: 0.4 })), 0, 0.9, 0);
  // Стъклокерамичен плот.
  at(g, box(0.5, 0.01, 0.42, C(0x101114, { rough: 0.1 })), 0.22, 0.925, 0.02);
  for (const [x, z] of [[0.11, -0.08], [0.33, -0.08], [0.11, 0.12], [0.33, 0.12]]) at(g, cyl(0.07, 0.07, 0.003, C(0x3a3a40, { rough: 0.2 }), 20), x, 0.932, z);
  // Микровълнова.
  const mw = new THREE.Group(); mw.position.set(-0.26, 0.92, -0.04); g.add(mw);
  at(mw, box(0.46, 0.28, 0.36, C(0xe8eaec, { rough: 0.3 })), 0, 0.14, 0);
  at(mw, box(0.32, 0.22, 0.01, C(0x1a1c20, { rough: 0.1 })), -0.05, 0.14, 0.181);
  const inner = new THREE.Mesh(G('mwIn', () => new THREE.PlaneGeometry(0.26, 0.16)), own(0x2a2a20, { emissive: 0x000000 }));
  inner.position.set(-0.05, 0.14, 0.188); mw.add(inner);
  const plate = cyl(0.08, 0.08, 0.01, C(0xf0f0f0), 18); plate.position.set(-0.05, 0.075, 0.19); plate.scale.z = 0.15; mw.add(plate);
  at(mw, box(0.08, 0.2, 0.01, C(0x2a2e33)), 0.16, 0.14, 0.181);
  const disp = new THREE.Mesh(G('mwD', () => new THREE.PlaneGeometry(0.06, 0.025)), own(0x103a2a, { emissive: 0x30ff90, emissiveIntensity: 0.8 }));
  disp.position.set(0.16, 0.2, 0.188); mw.add(disp);
  // Плочки на стената зад шкафа.
  at(g, box(1.0, 0.5, 0.02, HM('tiles', { rep: [2, 1] })), 0, 1.17, -0.31);
  // Тенджера.
  at(g, cyl(0.1, 0.1, 0.12, C(0x2f3438, { metal: 0.5, rough: 0.3 }), 18), 0.33, 0.99, 0.12);
  g.userData = { inner, plate, disp, steam: new THREE.Vector3(0.33, 1.05, 0.12) };
  return g;
}

// ---------- храна ----------
// Долап с делви, кошница и наниз чушки (храната се пази в зимника — мазето).
export function pantry1900() {
  const g = new THREE.Group();
  at(g, box(0.7, 1.2, 0.4, WOODD()), 0, 0.6, 0);
  for (const x of [-0.17, 0.17]) { at(g, box(0.32, 0.5, 0.02, C(0x7a5232)), x, 0.32, 0.205); at(g, sph(0.02, BRASS(), 8, 6), x + (x < 0 ? 0.12 : -0.12), 0.34, 0.22); }
  at(g, box(0.7, 0.03, 0.42, C(0x5a3a20)), 0, 0.62, 0.01);
  for (const [x, c] of [[-0.18, 0xb5683a], [0.05, 0x8a4a2a], [0.22, 0xc07a48]]) {
    const pot = new THREE.Group(); pot.position.set(x, 0.635, 0.03); g.add(pot);
    const b = sph(0.09, C(c, { rough: 0.6 }), 14, 10); b.scale.set(1, 1.15, 1); b.position.y = 0.1; pot.add(b);
    at(pot, cyl(0.045, 0.06, 0.06, C(c, { rough: 0.6 }), 12), 0, 0.22, 0);
    at(pot, cyl(0.05, 0.05, 0.015, C(0xe8dcc4), 12), 0, 0.255, 0);
  }
  at(g, box(0.72, 0.04, 0.42, C(0x5a3a20)), 0, 1.22, 0);
  // Кошница с ябълки отгоре.
  at(g, cyl(0.16, 0.12, 0.12, C(0xb08a50, { rough: 0.9 }), 14), -0.1, 1.3, 0);
  for (let i = 0; i < 5; i++) at(g, sph(0.035, C(i % 2 ? 0xc0392b : 0xd8b030), 8, 6), -0.16 + (i % 3) * 0.06, 1.37, -0.03 + Math.floor(i / 3) * 0.06);
  // Наниз червени чушки на стената.
  at(g, cyl(0.006, 0.006, 0.6, C(0xd8c8a0), 4), 0.24, 1.55, -0.12);
  for (let i = 0; i < 8; i++) { const p = new THREE.Mesh(G('pep', () => new THREE.ConeGeometry(0.025, 0.1, 6)), C(0xb0201a, { rough: 0.5 })); p.rotation.set(Math.PI, 0, (i % 2 ? 0.4 : -0.4)); p.position.set(0.24 + (i % 2 ? 0.025 : -0.025), 1.8 - i * 0.065, -0.1); g.add(p); }
  return g;
}
export function fridge1960() {
  const g = new THREE.Group();
  const body = box(0.58, 1.2, 0.56, ENAMEL()); body.position.y = 0.66; g.add(body);
  const top = cyl(0.28, 0.28, 0.58, ENAMEL(), 20); top.scale.set(1, 1, 0.35); top.rotation.z = Math.PI / 2; top.position.set(0, 1.26, 0); g.add(top);
  at(g, box(0.58, 0.06, 0.56, C(0x9aa0a6, { metal: 0.6 })), 0, 0.03, 0);
  at(g, box(0.54, 1.12, 0.02, C(0xfafaf6, { rough: 0.3 })), 0, 0.68, 0.285);
  const handle = box(0.04, 0.14, 0.05, CHROME()); handle.position.set(0.2, 0.95, 0.31); g.add(handle);
  at(g, box(0.16, 0.03, 0.01, CHROME()), 0, 1.15, 0.297);
  g.userData = {};
  return g;
}
export function fridge2020() {
  const g = new THREE.Group();
  const steel = C(0xbfc5ca, { rough: 0.35, metal: 0.6 });
  at(g, box(0.72, 1.86, 0.68, steel), 0, 0.93, 0);
  for (const s of [-1, 1]) { at(g, box(0.355, 1.84, 0.02, C(0xc8ced3, { rough: 0.3, metal: 0.6 })), s * 0.18, 0.93, 0.345); at(g, box(0.02, 0.7, 0.04, C(0x8a9096, { metal: 0.8, rough: 0.3 })), s * 0.02, 1.15, 0.37); }
  const disp = new THREE.Mesh(G('frD', () => new THREE.PlaneGeometry(0.1, 0.06)), own(0x0a1a2a, { emissive: 0x40a0ff, emissiveIntensity: 0.9 }));
  disp.position.set(-0.18, 1.4, 0.357); g.add(disp);
  g.userData = { disp };
  return g;
}

// ---------- пране ----------
// Дървено корито на две столчета, дъска за пране, бакър с вода.
export function trough() {
  const g = new THREE.Group();
  const wood = C(0x9a7048);
  for (const x of [-0.3, 0.3]) { at(g, box(0.3, 0.04, 0.3, wood), x, 0.34, 0); for (const [dx, dz] of [[-0.1, -0.1], [0.1, -0.1], [-0.1, 0.1], [0.1, 0.1]]) at(g, cyl(0.02, 0.02, 0.32, wood, 6), x + dx, 0.16, dz); }
  const tw = new THREE.Group(); tw.position.y = 0.36; g.add(tw);
  at(tw, box(0.95, 0.04, 0.38, C(0x8a6038)), 0, 0.02, 0);
  for (const s of [-1, 1]) { at(tw, box(1.0, 0.22, 0.04, C(0x8a6038)), 0, 0.12, s * 0.21, s * 0.25, 0, 0); at(tw, box(0.04, 0.22, 0.44, C(0x7a5230)), s * 0.5, 0.12, 0, 0, 0, -s * 0.25); }
  const water = new THREE.Mesh(G('trW', () => new THREE.PlaneGeometry(0.92, 0.42)), own(0x7ab0c8, { transparent: true, opacity: 0.8, roughness: 0.1 }));
  water.rotation.x = -Math.PI / 2; water.position.y = 0.17; tw.add(water);
  // Пяна и пране.
  for (let i = 0; i < 6; i++) at(tw, sph(0.04, C(0xf8f8f8, { rough: 0.9 }), 8, 6), -0.3 + i * 0.12, 0.18, (i % 2 ? 0.06 : -0.05));
  at(tw, box(0.3, 0.02, 0.18, C(0xd8c8a8)), 0.15, 0.175, 0.0, 0, 0.3, 0);
  // Дъска за пране, подпряна в коритото.
  const board = new THREE.Group(); board.position.set(-0.32, 0.12, 0); board.rotation.z = 0.6; tw.add(board);
  at(board, box(0.04, 0.55, 0.3, C(0xb08a5a)), 0, 0.2, 0);
  for (let i = 0; i < 8; i++) at(board, box(0.05, 0.02, 0.26, C(0x9a7a4a)), 0.005, 0.02 + i * 0.045, 0);
  // Бакър (меден съд) на пода.
  const bk = new THREE.Group(); bk.position.set(0.68, 0, 0.12); g.add(bk);
  const b = sph(0.15, C(0xb8733a, { metal: 0.7, rough: 0.3 }), 16, 10); b.scale.set(1, 1.1, 1); b.position.y = 0.16; bk.add(b);
  at(bk, cyl(0.1, 0.12, 0.08, C(0xb8733a, { metal: 0.7, rough: 0.3 }), 14), 0, 0.33, 0);
  const handle = new THREE.Mesh(G('bkH', () => new THREE.TorusGeometry(0.11, 0.008, 6, 16, Math.PI)), C(0x5a4030, { metal: 0.5 })); handle.position.y = 0.37; bk.add(handle);
  g.userData = { water };
  return g;
}
export function washer1960() {
  const g = new THREE.Group();
  for (const [x, z] of [[-0.18, -0.18], [0.18, -0.18], [-0.18, 0.18], [0.18, 0.18]]) at(g, cyl(0.02, 0.02, 0.2, CHROME(), 8), x, 0.1, z);
  at(g, cyl(0.3, 0.28, 0.7, ENAMEL(), 24), 0, 0.55, 0);
  at(g, cyl(0.305, 0.305, 0.04, C(0x6a8fb0, { rough: 0.4 }), 24), 0, 0.42, 0);
  at(g, cyl(0.27, 0.27, 0.02, C(0x5a7a8a, { rough: 0.2 }), 24), 0, 0.88, 0);
  const water = cyl(0.26, 0.26, 0.01, own(0x9ac0d0, { transparent: true, opacity: 0.8, roughness: 0.1 }), 24); water.position.y = 0.89; g.add(water);
  const agit = new THREE.Group(); agit.position.y = 0.9; g.add(agit);
  for (let i = 0; i < 3; i++) at(agit, box(0.3, 0.05, 0.03, C(0xe8e8e0)), 0, 0, 0, 0, i * Math.PI / 3, 0);
  at(agit, cyl(0.04, 0.04, 0.08, C(0xe8e8e0), 10), 0, 0.03, 0);
  // Изстисквачка с две валяка отгоре и ръчка.
  const ringer = new THREE.Group(); ringer.position.set(0, 0.92, -0.26); g.add(ringer);
  for (const s of [-1, 1]) at(ringer, box(0.03, 0.3, 0.05, C(0x9aa0a6, { metal: 0.6 })), s * 0.2, 0.15, 0);
  for (const y of [0.18, 0.24]) at(ringer, cyl(0.03, 0.03, 0.38, C(0xf2efe6), 12), 0, y, 0, 0, 0, Math.PI / 2);
  at(ringer, box(0.12, 0.02, 0.02, C(0x2a2a2c)), 0.27, 0.24, 0);
  // Пране в легена до машината.
  const lg = cyl(0.2, 0.15, 0.12, C(0x7aa0c0, { rough: 0.4 }), 18); lg.position.set(0.5, 0.06, 0.15); g.add(lg);
  for (let i = 0; i < 3; i++) at(g, sph(0.07, C([0xf2efe6, 0xc04a4a, 0x6a8ac0][i], { rough: 0.9 }), 8, 6), 0.45 + i * 0.05, 0.13, 0.12 + (i % 2) * 0.06);
  g.userData = { agit, water };
  return g;
}
export function washer2020() {
  const g = new THREE.Group();
  at(g, box(0.6, 0.85, 0.6, C(0xfafafa, { rough: 0.3 })), 0, 0.425, 0);
  at(g, box(0.6, 0.12, 0.02, C(0xeeeeee, { rough: 0.3 })), 0, 0.78, 0.305);
  const disp = new THREE.Mesh(G('wsD', () => new THREE.PlaneGeometry(0.12, 0.05)), own(0x0a1a2a, { emissive: 0x40c0ff, emissiveIntensity: 0.9 }));
  disp.position.set(0.12, 0.78, 0.317); g.add(disp);
  at(g, cyl(0.035, 0.035, 0.03, C(0xb8bec4, { metal: 0.6 }), 16), -0.15, 0.78, 0.32, Math.PI / 2, 0, 0);
  at(g, new THREE.Mesh(G('wsRing', () => new THREE.TorusGeometry(0.19, 0.03, 10, 32)), C(0xc8ced3, { metal: 0.6, rough: 0.3 })), 0, 0.4, 0.31);
  const drum = new THREE.Group(); drum.position.set(0, 0.4, 0.29); g.add(drum);
  at(drum, cyl(0.18, 0.18, 0.02, C(0x6a7078, { metal: 0.7 }), 24), 0, 0, -0.02, Math.PI / 2, 0, 0);
  for (let i = 0; i < 5; i++) { const a = i * 1.26; at(drum, sph(0.06, C([0xc04a4a, 0x3a6ac0, 0xf2efe6, 0xe0b040, 0x4aa060][i], { rough: 0.9 }), 8, 6), Math.cos(a) * 0.09, Math.sin(a) * 0.09, 0); }
  const door = new THREE.Mesh(G('wsDoor', () => new THREE.CircleGeometry(0.17, 28)), GLASS()); door.position.set(0, 0.4, 0.33); g.add(door);
  g.userData = { drum, disp };
  return g;
}

// ---------- светлина ----------
export function keroseneLamp() {
  const g = new THREE.Group();
  const glass = C(0xd0e8e0, { rough: 0.1, transparent: true, opacity: 0.6 });
  at(g, cyl(0.07, 0.08, 0.02, C(0x6a8a7a, { rough: 0.3 }), 16), 0, 0.01, 0);
  at(g, cyl(0.025, 0.05, 0.08, C(0x6a8a7a, { rough: 0.3 }), 12), 0, 0.06, 0);
  const bowl = sph(0.07, C(0x6a9a8a, { rough: 0.15, transparent: true, opacity: 0.75 }), 16, 10); bowl.scale.y = 0.75; bowl.position.y = 0.15; g.add(bowl);
  at(g, cyl(0.04, 0.045, 0.04, BRASS(), 12), 0, 0.22, 0);
  at(g, cyl(0.012, 0.012, 0.03, BRASS(), 8), 0.05, 0.22, 0, 0, 0, Math.PI / 2);
  const flame = new THREE.Mesh(G('flame', () => new THREE.ConeGeometry(0.014, 0.05, 8)), own(0xffd070, { emissive: 0xffa020, emissiveIntensity: 2 }));
  flame.position.y = 0.27; g.add(flame);
  const chim = new THREE.Mesh(G('chim', () => new THREE.LatheGeometry([[0.03, 0], [0.032, 0.03], [0.045, 0.06], [0.03, 0.12], [0.026, 0.2]].map(([x, y]) => new THREE.Vector2(x, y)), 16)), glass);
  chim.position.y = 0.24; g.add(chim);
  g.userData = { flame };
  return g;
}
// Крушка на кабел с емайлиран абажур (висящата част е с дължина len надолу от y = 0).
export function bulbLamp(len = 0.7) {
  const g = new THREE.Group();
  at(g, cyl(0.006, 0.006, len, C(0x1d1d1f), 5), 0, -len / 2, 0);
  at(g, cyl(0.025, 0.025, 0.06, C(0x2a2a2c), 10), 0, -len - 0.02, 0);
  const shade = new THREE.Mesh(G('shade', () => new THREE.ConeGeometry(0.2, 0.12, 24, 1, true)), C(0xf2efe6, { side: THREE.DoubleSide, rough: 0.4 }));
  shade.position.y = -len - 0.08; g.add(shade);
  const bulb = sph(0.045, own(0xfff6d8, { emissive: 0x000000 }), 14, 10); bulb.scale.y = 1.25; bulb.position.y = -len - 0.13; g.add(bulb);
  g.userData = { bulb, bottom: -len - 0.15 };
  return g;
}
// Плосък LED плафон, окачен на две въженца.
export function ledLamp(len = 0.75) {
  const g = new THREE.Group();
  for (const x of [-0.2, 0.2]) at(g, cyl(0.003, 0.003, len, C(0x9aa0a6), 4), x, -len / 2, 0);
  at(g, box(0.75, 0.04, 0.22, C(0x2a2a2c, { rough: 0.4, metal: 0.4 })), 0, -len - 0.02, 0);
  const panel = new THREE.Mesh(G('ledP', () => new THREE.PlaneGeometry(0.7, 0.17)), own(0xffffff, { emissive: 0x000000 }));
  panel.rotation.x = Math.PI / 2; panel.position.y = -len - 0.042; g.add(panel);
  g.userData = { panel, bottom: -len - 0.05 };
  return g;
}

// ---------- мебели ----------
export function table(e = 0) {
  const g = new THREE.Group();
  const m = e === 0 ? C(0x7a5232) : e === 1 ? C(0x8a5a32, { rough: 0.5 }) : C(0xd8c4a0, { rough: 0.5 });
  const H = 0.76;
  at(g, box(1.2, 0.05, 0.8, m), 0, H, 0);
  for (const [x, z] of [[-0.54, -0.34], [0.54, -0.34], [-0.54, 0.34], [0.54, 0.34]]) at(g, e === 2 ? cyl(0.025, 0.02, H, C(0x2a2a2c, { metal: 0.6 }), 8) : box(0.06, H, 0.06, m), x, H / 2, z);
  if (e === 0) at(g, box(1.24, 0.004, 0.84, HM('cherga', { rep: [1, 1] })), 0, H + 0.028, 0).scale.set(0.5, 1, 1);
  if (e === 1) at(g, box(1.26, 0.006, 0.86, C(0xf2f0e8, { rough: 0.9 })), 0, H + 0.028, 0);
  return g;
}
export function chair(e = 0) {
  const g = new THREE.Group();
  const m = e === 0 ? C(0x6b4426) : e === 1 ? C(0x8a5a32, { rough: 0.5 }) : C(0x3a6a7a, { rough: 0.7 });
  const leg = e === 2 ? C(0x2a2a2c, { metal: 0.6 }) : m;
  at(g, box(0.42, 0.04, 0.42, m), 0, 0.45, 0);
  for (const [x, z] of [[-0.18, -0.18], [0.18, -0.18], [-0.18, 0.18], [0.18, 0.18]]) at(g, box(0.035, 0.45, 0.035, leg), x, 0.225, z);
  at(g, box(0.42, 0.42, 0.03, m), 0, 0.7, -0.2);
  if (e === 0) at(g, box(0.36, 0.03, 0.36, C(0xa8262a, { rough: 0.9 })), 0, 0.485, 0);
  return g;
}
// Пейка/миндер с черга и възглавници (1900), диван (1960), мек диван (2020). Дължина по x.
export function seat(e = 0, len = 1.6) {
  const g = new THREE.Group();
  if (e === 0) {
    at(g, box(len, 0.4, 0.55, C(0x7a5232)), 0, 0.2, 0);
    at(g, box(len, 0.03, 0.57, HM('cherga', { rep: [1, 2] })), 0, 0.415, 0);
    for (let i = 0; i < 3; i++) at(g, box(0.4, 0.25, 0.12, C([0xa8262a, 0x2f5a8a, 0xd9a441][i], { rough: 0.9 })), -len / 3 + i * len / 3, 0.55, -0.2);
  } else if (e === 1) {
    for (const [x, z] of [[-len / 2 + 0.08, -0.22], [len / 2 - 0.08, -0.22], [-len / 2 + 0.08, 0.22], [len / 2 - 0.08, 0.22]]) at(g, cyl(0.02, 0.012, 0.18, C(0x5a3a20), 6), x, 0.09, z);
    at(g, box(len, 0.2, 0.62, C(0x4a7a6a, { rough: 0.85 })), 0, 0.28, 0);
    at(g, box(len, 0.42, 0.12, C(0x4a7a6a, { rough: 0.85 })), 0, 0.55, -0.26);
    for (const s of [-1, 1]) at(g, box(0.08, 0.2, 0.62, C(0x8a5a32, { rough: 0.5 })), s * (len / 2 + 0.04), 0.42, 0);
  } else {
    at(g, box(len, 0.22, 0.8, C(0x8a9096, { rough: 0.95 })), 0, 0.2, 0);
    at(g, box(len, 0.4, 0.2, C(0x8a9096, { rough: 0.95 })), 0, 0.5, -0.3);
    for (const s of [-1, 1]) at(g, box(0.18, 0.4, 0.8, C(0x7a8086, { rough: 0.95 })), s * (len / 2 + 0.09), 0.3, 0);
    for (let i = 0; i < 2; i++) at(g, box(0.38, 0.3, 0.1, C([0xe0b040, 0x3a6a7a][i], { rough: 0.95 })), -0.4 + i * 0.8, 0.45, -0.17, -0.25, 0, 0);
  }
  return g;
}
// Ниска масичка/шкафче (за уредите), дължина по x.
export function cabinet(e = 0, len = 1.0, h = 0.6) {
  const g = new THREE.Group();
  const m = e === 0 ? C(0x6b4426) : e === 1 ? C(0x8a5a32, { rough: 0.45 }) : C(0xf2f0ec, { rough: 0.4 });
  at(g, box(len, h, 0.42, m), 0, h / 2, 0);
  if (e === 1) for (const x of [-len / 4, len / 4]) { at(g, box(len / 2 - 0.04, h - 0.1, 0.01, C(0x9a6a3a, { rough: 0.4 })), x, h / 2, 0.215); at(g, box(0.02, 0.08, 0.02, BRASS()), x + (x < 0 ? 0.1 : -0.1), h / 2, 0.23); }
  if (e === 2) at(g, box(len - 0.04, 0.01, 0.01, C(0x2a2a2c)), 0, h / 2, 0.215);
  return g;
}

// ---------- комуникация ----------
export function letterSet() {
  const g = new THREE.Group();
  const paper = new THREE.Mesh(G('letP', () => new THREE.PlaneGeometry(0.21, 0.28)), HM('letter')); paper.rotation.set(-Math.PI / 2, 0, 0.15); paper.position.set(0, 0.002, 0); g.add(paper);
  const env = box(0.2, 0.004, 0.11, C(0xe8dcc0)); env.position.set(0.2, 0.003, 0.08); env.rotation.y = -0.3; g.add(env);
  at(g, box(0.03, 0.005, 0.035, C(0xb02a20)), 0.24, 0.007, 0.06, 0, -0.3, 0);
  at(g, box(0.06, 0.005, 0.03, C(0x2a5a8a)), 0.15, 0.007, 0.1, 0, -0.3, 0);
  // Мастилница и перо.
  at(g, cyl(0.035, 0.04, 0.05, C(0x1e2a3a, { rough: 0.15 }), 14), -0.17, 0.025, -0.08);
  at(g, cyl(0.015, 0.015, 0.02, C(0x1e2a3a), 10), -0.17, 0.06, -0.08);
  const pen = new THREE.Group(); pen.position.set(-0.17, 0.06, -0.08); pen.rotation.set(0.5, 0, -0.4); g.add(pen);
  at(pen, cyl(0.004, 0.003, 0.2, C(0x3a2a1e), 6), 0, 0.1, 0);
  const feather = sph(0.03, C(0xf2efe6, { rough: 0.9 }), 8, 6); feather.scale.set(0.35, 2.2, 0.1); feather.position.y = 0.17; pen.add(feather);
  return g;
}
export function rotaryPhone(color = 0x1b1b1f) {
  const g = new THREE.Group();
  const m = C(color, { rough: 0.25 });
  const body = new THREE.Mesh(G('rpB', () => new THREE.CylinderGeometry(0.07, 0.11, 0.09, 4, 1)), m); body.rotation.y = Math.PI / 4; body.scale.set(1.15, 1, 1); body.position.y = 0.045; g.add(body);
  const dial = new THREE.Mesh(G('rpD', () => new THREE.CircleGeometry(0.05, 24)), HM('rotary')); dial.rotation.x = -Math.PI / 2 + 0.45; dial.position.set(0, 0.075, 0.045); g.add(dial);
  const hs = new THREE.Group(); hs.position.y = 0.11; g.add(hs);
  at(hs, cyl(0.016, 0.016, 0.2, m, 10), 0, 0, -0.01, 0, 0, Math.PI / 2);
  for (const s of [-1, 1]) at(hs, cyl(0.03, 0.025, 0.04, m, 12), s * 0.1, -0.012, -0.01);
  const cord = new THREE.Mesh(G('rpC', () => new THREE.TorusGeometry(0.05, 0.005, 5, 16, Math.PI)), m); cord.position.set(-0.13, 0.04, -0.02); cord.rotation.y = Math.PI / 2; g.add(cord);
  g.userData = { handset: hs };
  return g;
}
// Смартфон (лежи по гръб; екранът гледа нагоре, или изправен с stand = true).
export function smartphone({ screen = null } = {}) {
  const g = new THREE.Group();
  at(g, box(0.075, 0.155, 0.009, C(0x1a1c20, { rough: 0.3, metal: 0.4 })), 0, 0, 0);
  const sc = new THREE.Mesh(G('phS', () => new THREE.PlaneGeometry(0.068, 0.145)), screen ? screen.mat : own(0x0a0a0c));
  sc.position.z = 0.0047; g.add(sc);
  g.userData = { screen: sc };
  return g;
}
export function router() {
  const g = new THREE.Group();
  at(g, box(0.22, 0.04, 0.14, C(0xf4f4f4, { rough: 0.3 })), 0, 0.02, 0);
  for (const x of [-0.08, 0.08]) at(g, cyl(0.007, 0.007, 0.16, C(0x2a2a2c), 6), x, 0.12, -0.06, -0.2, 0, x < 0 ? 0.2 : -0.2);
  const leds = [];
  for (let i = 0; i < 4; i++) { const l = new THREE.Mesh(G('rtL', () => new THREE.PlaneGeometry(0.012, 0.008)), own(0x0a2a0a, { emissive: 0x30ff60, emissiveIntensity: 1 })); l.position.set(-0.05 + i * 0.033, 0.025, 0.0705); g.add(l); leds.push(l); }
  g.userData = { leds };
  return g;
}

// ---------- развлечения ----------
// Рафт с книги и кавал на стената (1900).
export function books1900() {
  const g = new THREE.Group();
  at(g, box(0.9, 0.03, 0.25, WOODD()), 0, 0, 0);
  for (const s of [-1, 1]) at(g, box(0.025, 0.12, 0.025, WOODD()), s * 0.4, -0.06, -0.1);
  const cols = [0x7a2f22, 0x2f4f6a, 0x5a4a2a, 0x3f5f3a, 0x8a5a2a, 0x2a2a2e, 0x6a2a3a];
  let x = -0.4;
  for (let i = 0; i < 11; i++) { const w = 0.03 + (i % 3) * 0.012, h = 0.17 + (i % 4) * 0.025; at(g, box(w, h, 0.17, C(cols[i % cols.length], { rough: 0.7 })), x + w / 2, 0.015 + h / 2, 0); x += w + 0.004; }
  const open = new THREE.Group(); open.position.set(0.25, 0.03, 0.02); g.add(open);
  for (const s of [-1, 1]) { const p = box(0.12, 0.01, 0.17, C(0xf4ecd8)); p.position.set(s * 0.06, 0.01, 0); p.rotation.z = -s * 0.12; open.add(p); }
  // Кавал (дървена свирка) на стената.
  const kaval = new THREE.Group(); kaval.position.set(0, 0.45, -0.1); kaval.rotation.z = 0.25; g.add(kaval);
  at(kaval, cyl(0.014, 0.016, 0.7, C(0x8a5a2a, { rough: 0.4 }), 10), 0, 0, 0, 0, 0, Math.PI / 2);
  for (const x of [-0.3, 0.3]) at(kaval, cyl(0.018, 0.018, 0.02, BRASS(), 10), x, 0, 0, 0, 0, Math.PI / 2);
  for (let i = 0; i < 7; i++) at(kaval, cyl(0.004, 0.004, 0.005, C(0x1a1410), 6), -0.15 + i * 0.045, 0, 0.014, Math.PI / 2, 0, 0);
  return g;
}
export function radio1960() {
  const g = new THREE.Group();
  const wood = C(0x8a4a22, { rough: 0.35 });
  at(g, box(0.56, 0.34, 0.26, wood), 0, 0.17, 0);
  const top = cyl(0.13, 0.13, 0.56, wood, 16); top.scale.set(1, 1, 1); top.rotation.z = Math.PI / 2; top.scale.set(0.35, 1, 1); top.position.set(0, 0.34, 0); g.add(top);
  at(g, box(0.34, 0.2, 0.01, HM('grille')), -0.08, 0.2, 0.131);
  const dial = new THREE.Mesh(G('rdD', () => new THREE.PlaneGeometry(0.4, 0.05)), own(0xf6e7b8, { map: canvasTex('dial', 256, 64, DRAW.dial), emissive: 0x000000 }));
  dial.position.set(0, 0.06, 0.132); g.add(dial);
  for (const y of [0.25, 0.15]) at(g, cyl(0.025, 0.025, 0.03, C(0xf2e6c8), 12), 0.2, y, 0.14, Math.PI / 2, 0, 0);
  // Клавиши отдолу.
  for (let i = 0; i < 5; i++) at(g, box(0.04, 0.02, 0.02, C(0xf6f2e6)), -0.15 + i * 0.05, 0.015, 0.13);
  g.userData = { dial };
  return g;
}
export function tv1960(screen) {
  const g = new THREE.Group();
  const wood = C(0x6a3a1c, { rough: 0.35 });
  for (const [x, z] of [[-0.2, -0.12], [0.2, -0.12], [-0.2, 0.12], [0.2, 0.12]]) at(g, cyl(0.012, 0.008, 0.3, C(0x2a2a2c), 6), x, 0.15, z);
  at(g, box(0.55, 0.44, 0.4, wood), 0, 0.52, 0);
  at(g, box(0.4, 0.32, 0.01, C(0x2a2a2a)), -0.04, 0.53, 0.201);
  const scr = new THREE.Mesh(G('tv60', () => { const s = new THREE.Shape(); const w = 0.17, h = 0.13, r = 0.04; s.moveTo(-w + r, -h); s.lineTo(w - r, -h); s.quadraticCurveTo(w, -h, w, -h + r); s.lineTo(w, h - r); s.quadraticCurveTo(w, h, w - r, h); s.lineTo(-w + r, h); s.quadraticCurveTo(-w, h, -w, h - r); s.lineTo(-w, -h + r); s.quadraticCurveTo(-w, -h, -w + r, -h); return new THREE.ShapeGeometry(s); }), screen ? screen.mat : own(0x3a4040));
  scr.position.set(-0.04, 0.53, 0.207); g.add(scr);
  for (const y of [0.6, 0.48]) at(g, cyl(0.02, 0.02, 0.03, C(0xd8c8a8), 10), 0.22, y, 0.21, Math.PI / 2, 0, 0);
  // Антена „мустаци“.
  at(g, sph(0.035, C(0x2a2a2c), 10, 6), 0, 0.76, 0);
  for (const s of [-1, 1]) at(g, cyl(0.003, 0.003, 0.4, CHROME(), 4), s * 0.1, 0.92, 0, 0, 0, -s * 0.5);
  g.userData = { screen: scr };
  return g;
}
export function tv2020(screen) {
  const g = new THREE.Group();
  at(g, box(1.12, 0.66, 0.04, C(0x111214, { rough: 0.3 })), 0, 0, 0);
  const sc = new THREE.Mesh(G('tv20', () => new THREE.PlaneGeometry(1.08, 0.62)), screen ? screen.mat : own(0x050506));
  sc.position.z = 0.021; g.add(sc);
  g.userData = { screen: sc };
  return g;
}
export function tablet(screen) {
  const g = new THREE.Group();
  at(g, box(0.25, 0.18, 0.008, C(0x2a2c30, { rough: 0.3, metal: 0.4 })), 0, 0, 0);
  const sc = new THREE.Mesh(G('tbS', () => new THREE.PlaneGeometry(0.23, 0.16)), screen ? screen.mat : own(0x050506));
  sc.position.z = 0.0042; g.add(sc);
  g.userData = { screen: sc };
  return g;
}
export function gameConsole() {
  const g = new THREE.Group();
  at(g, box(0.3, 0.06, 0.22, C(0xf2f2f2, { rough: 0.3 })), 0, 0.03, 0);
  at(g, box(0.3, 0.012, 0.22, C(0x1a1c20, { rough: 0.3 })), 0, 0.066, 0);
  const pad = new THREE.Group(); pad.position.set(0.32, 0.02, 0.08); g.add(pad);
  at(pad, box(0.12, 0.03, 0.06, C(0x2a2c30, { rough: 0.4 })), 0, 0, 0);
  for (const s of [-1, 1]) at(pad, sph(0.035, C(0x2a2c30, { rough: 0.4 }), 10, 6), s * 0.06, 0, 0.02).scale.set(1, 0.6, 1);
  for (const [x, c] of [[0.05, 0xc04a4a], [0.07, 0x4aa060], [-0.05, 0x3a3a40]]) at(pad, cyl(0.008, 0.008, 0.01, C(c), 8), x, 0.018, 0);
  return g;
}

// ---------- улицата отвън ----------
export function pole(h = 6) {
  const g = new THREE.Group();
  at(g, cyl(0.09, 0.13, h, C(0xb8b2a6, { rough: 0.9 }), 8), 0, h / 2, 0);
  at(g, box(0.06, 0.06, 1.0, C(0x6a6a6a)), 0, h - 0.3, 0);
  for (const z of [-0.4, 0, 0.4]) at(g, cyl(0.03, 0.03, 0.08, C(0xf2efe6, { rough: 0.3 }), 8), 0, h - 0.24, z);
  return g;
}
// Жица между две точки (леко провиснала).
export function wire(a, b, sag = 0.4) {
  const pts = [];
  for (let i = 0; i <= 12; i++) { const k = i / 12; pts.push(new THREE.Vector3(a.x + (b.x - a.x) * k, a.y + (b.y - a.y) * k - Math.sin(Math.PI * k) * sag, a.z + (b.z - a.z) * k)); }
  return new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 16, 0.012, 4), C(0x1d1d1f));
}
export function streetLight({ led = false } = {}) {
  const g = new THREE.Group();
  at(g, cyl(0.05, 0.08, 5, C(led ? 0x6a7078 : 0x3a3d40, { metal: 0.5, rough: 0.5 }), 8), 0, 2.5, 0);
  at(g, box(0.06, 0.06, 1.2, C(led ? 0x6a7078 : 0x3a3d40, { metal: 0.5 })), 0, 4.95, 0.55);
  const lamp = box(led ? 0.3 : 0.25, led ? 0.06 : 0.14, led ? 0.5 : 0.35, C(led ? 0x8a9096 : 0x4a4d50, { metal: 0.4 }));
  lamp.position.set(0, 4.9, 1.1); g.add(lamp);
  const glow = new THREE.Mesh(G(`slG${led}`, () => new THREE.PlaneGeometry(led ? 0.26 : 0.2, led ? 0.44 : 0.28)), own(0xfff8e0, { emissive: led ? 0xf0f6ff : 0xffd890, emissiveIntensity: 0.6 }));
  glow.rotation.x = Math.PI / 2; glow.position.set(0, 4.86, 1.1); g.add(glow);
  return g;
}
// Панелен блок (лицето по +z). Стил 1: сив (1960 г. — обобщено); стил 2: санирани фасади в цвят.
export function panelBlock({ floors = 5, bays = 6, style = 1 } = {}) {
  const g = new THREE.Group();
  const fw = 3, fh = 2.8, W = bays * fw, H = floors * fh;
  const wall = HM('panel', { rep: [bays, floors], color: style === 2 ? 0xf6e6c8 : 0xffffff });
  const front = new THREE.Mesh(new THREE.PlaneGeometry(W, H), wall); front.position.set(0, H / 2, 6.03); g.add(front);
  at(g, box(W, H, 12, C(style === 2 ? 0xe8d8b8 : 0xc8c2b4)), 0, H / 2, 0);
  at(g, box(W + 0.3, 0.3, 12.3, C(0x8a8a86)), 0, H + 0.15, 0);
  // Балкони.
  for (let f = 1; f < floors; f++) for (let b = 0; b < bays; b += 2) at(g, box(fw * 0.9, 0.9, 0.9, C(style === 2 ? [0xe08a5a, 0x6aa0c0, 0x8ac07a][b / 2 % 3] : 0xb8b2a6)), -W / 2 + fw * (b + 1) - fw / 2 + fw * 0.21, f * fh + 0.45, 6.45);
  if (style === 2) for (let f = 0; f <= floors; f += 1) at(g, box(W + 0.05, 0.08, 0.05, C(0xffffff)), 0, f * fh, 6.03);
  return g;
}
export function bus() {
  const g = new THREE.Group();
  at(g, box(8, 2.2, 2.4, C(0xe6b23a, { rough: 0.5 })), 0, 1.6, 0);
  at(g, box(8.02, 0.7, 2.42, C(0x2a3a4a, { rough: 0.15 })), 0, 2.05, 0);
  for (let i = 0; i < 6; i++) at(g, box(0.08, 0.72, 2.44, C(0xe6b23a)), -3.5 + i * 1.4, 2.05, 0);
  at(g, box(8.02, 0.3, 2.42, C(0xf2efe6)), 0, 2.85, 0);
  at(g, box(8.04, 0.12, 2.44, C(0x8a2a20)), 0, 1.2, 0);
  const wheels = [];
  for (const x of [-2.6, 2.6]) for (const s of [-1, 1]) { const w = cyl(0.5, 0.5, 0.3, C(0x1d1d1f), 14); w.rotation.x = Math.PI / 2; w.position.set(x, 0.5, s * 1.1); g.add(w); wheels.push(w); }
  g.userData = { wheels, r: 0.5, length: 8 };
  return g;
}
export function car(color = 0x3a6ac0) {
  const g = new THREE.Group();
  at(g, box(4.2, 0.7, 1.8, C(color, { rough: 0.3, metal: 0.4 })), 0, 0.65, 0);
  const cab = box(2.3, 0.6, 1.6, C(color, { rough: 0.3, metal: 0.4 })); cab.position.set(-0.2, 1.28, 0); g.add(cab);
  at(g, box(2.32, 0.42, 1.62, C(0x1a2a3a, { rough: 0.1 })), -0.2, 1.3, 0);
  for (const s of [-1, 1]) at(g, box(0.05, 0.12, 0.3, own(0xfff8e0, { emissive: 0xfff2c0, emissiveIntensity: 0.5 })), 2.1, 0.75, s * 0.6);
  const wheels = [];
  for (const x of [-1.35, 1.35]) for (const s of [-1, 1]) { const w = cyl(0.34, 0.34, 0.25, C(0x1d1d1f), 14); w.rotation.x = Math.PI / 2; w.position.set(x, 0.34, s * 0.82); g.add(w); wheels.push(w); }
  g.userData = { wheels, r: 0.34, length: 4.2 };
  return g;
}
// Велосипед (без колоездач), дължина по x.
export function bicycle() {
  const g = new THREE.Group();
  const m = C(0x2a5a3a, { metal: 0.4, rough: 0.5 });
  const wheels = [];
  for (const x of [-0.55, 0.55]) { const w = new THREE.Mesh(G('bkW', () => new THREE.TorusGeometry(0.33, 0.025, 6, 20)), C(0x1d1d1f)); w.position.set(x, 0.35, 0); g.add(w); wheels.push(w); }
  at(g, cyl(0.02, 0.02, 0.9, m, 6), 0, 0.55, 0, 0, 0, Math.PI / 2);
  at(g, cyl(0.02, 0.02, 0.6, m, 6), -0.25, 0.5, 0, 0, 0, 0.6);
  at(g, cyl(0.02, 0.02, 0.6, m, 6), 0.4, 0.55, 0, 0, 0, -0.3);
  at(g, box(0.2, 0.04, 0.08, C(0x2a2a2c)), -0.4, 0.8, 0);
  at(g, box(0.04, 0.04, 0.5, C(0x2a2a2c)), 0.5, 0.88, 0);
  g.userData = { wheels, r: 0.33, length: 1.6 };
  return g;
}

// ---------- хора (в метри) ----------
// Обикновен човек вкъщи: рокля или панталон, риза, коса. look: { dress, top, legs, hair, child, apron, long }.
export function homePerson(look = {}) {
  const L = { top: 0x6a8fb0, legs: 0x3a3f4a, hair: 0x3a2a1e, ...look };
  const g = new THREE.Group();
  const sk = C(0xe0b58f);
  if (L.dress) {
    at(g, cyl(0.15, 0.27, 0.62, C(L.dress), 16), 0, 0.71, 0);
    for (const s of [-1, 1]) { at(g, cyl(0.045, 0.04, 0.4, sk, 8), s * 0.08, 0.2, 0); at(g, box(0.09, 0.06, 0.16, C(0x2a2422)), s * 0.08, 0.03, 0.03); }
    at(g, cyl(0.15, 0.16, 0.42, C(L.top ?? L.dress), 14), 0, 1.22, 0);
  } else {
    for (const s of [-1, 1]) { at(g, cyl(0.065, 0.06, 0.82, C(L.legs), 10), s * 0.085, 0.43, 0); at(g, box(0.1, 0.07, 0.18, C(0x2a2422)), s * 0.085, 0.035, 0.03); }
    at(g, cyl(0.16, 0.15, 0.2, C(L.legs), 14), 0, 0.88, 0);
    at(g, cyl(0.15, 0.165, 0.5, C(L.top), 14), 0, 1.22, 0);
  }
  if (L.apron) { const a = box(0.3, 0.5, 0.02, C(L.apron)); a.position.set(0, 0.85, 0.2); a.rotation.x = -0.15; g.add(a); }
  for (const s of [-1, 1]) { const arm = cyl(0.045, 0.04, 0.55, C(L.top ?? L.dress), 8); arm.position.set(s * 0.2, 1.18, 0); arm.rotation.z = s * 0.12; g.add(arm); at(g, sph(0.045, sk, 8, 6), s * 0.235, 0.89, 0); }
  at(g, cyl(0.05, 0.055, 0.08, sk, 8), 0, 1.47, 0);
  at(g, sph(0.115, sk), 0, 1.6, 0);
  const hair = sph(0.12, C(L.hair), 16, 10); hair.scale.set(1, 0.85, 1); hair.position.set(0, 1.64, -0.02); g.add(hair);
  if (L.long) at(g, box(0.2, 0.26, 0.06, C(L.hair)), 0, 1.5, -0.09);
  if (L.bun) at(g, sph(0.06, C(L.hair), 10, 8), 0, 1.68, -0.11);
  for (const s of [-1, 1]) at(g, sph(0.014, C(0x2a2a2a), 6, 4), s * 0.04, 1.62, 0.105);
  if (L.child) g.scale.setScalar(0.72);
  bakeColors(g);
  return g;
}
