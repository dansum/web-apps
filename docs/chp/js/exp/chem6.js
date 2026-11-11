// Общи модели за 6. клас (физика: заряди; химия: атоми, молекули, вещества):
// атоми с цветове по елемент, модели на молекули, модел на атом с ядро и електронни слоеве, лабораторни съдове.
// Моделите НЕ са в мащаб и не са „снимки“ на атоми — това се казва на детето в балончетата.
import { mat, labelSprite, THREE } from '../kit.js';
import { glass } from './labkit.js';

export const ELEM = {
  H: { name: 'водород', Z: 1, color: 0xf5f5f5, r: 0.16 },
  He: { name: 'хелий', Z: 2, color: 0x80deea, r: 0.15 },
  Li: { name: 'литий', Z: 3, color: 0xce93d8, r: 0.26 },
  Be: { name: 'берилий', Z: 4, color: 0xa5d6a7, r: 0.22 },
  B: { name: 'бор', Z: 5, color: 0xffab91, r: 0.21 },
  C: { name: 'въглерод', Z: 6, color: 0x424242, r: 0.2 },
  N: { name: 'азот', Z: 7, color: 0x3f6ee8, r: 0.2 },
  O: { name: 'кислород', Z: 8, color: 0xe53935, r: 0.2 },
  F: { name: 'флуор', Z: 9, color: 0x9ccc65, r: 0.19 },
  Ne: { name: 'неон', Z: 10, color: 0xff8a65, r: 0.19 },
  Na: { name: 'натрий', Z: 11, color: 0xab47bc, r: 0.3 },
  Mg: { name: 'магнезий', Z: 12, color: 0x8bc34a, r: 0.28 },
  Al: { name: 'алуминий', Z: 13, color: 0xb0bec5, r: 0.27 },
  S: { name: 'сяра', Z: 16, color: 0xfdd835, r: 0.26 },
  Cl: { name: 'хлор', Z: 17, color: 0x43a047, r: 0.25 },
  Fe: { name: 'желязо', Z: 26, color: 0xd9822b, r: 0.27 },
  Cu: { name: 'мед', Z: 29, color: 0xc77c4a, r: 0.27 },
};
export const BY_Z = Object.fromEntries(Object.entries(ELEM).map(([s, e]) => [e.Z, s]));

export function atomBall(sym, k = 1) {
  const e = ELEM[sym];
  const m = new THREE.Mesh(new THREE.SphereGeometry(e.r * k, 20, 14), mat(e.color, { roughness: 0.35 }));
  m.userData.sym = sym;
  return m;
}

// Модел на молекула: atoms [[sym, x, y, z]], bonds [[i, j, n]] (n — брой връзки).
export function molecule(atoms, bonds = [], k = 1.6) {
  const g = new THREE.Group();
  const pts = atoms.map(([s, x, y, z]) => { const a = atomBall(s, k); a.position.set(x, y, z); g.add(a); return a; });
  const bm = mat(0xbdbdbd);
  for (const [i, j, n = 1] of bonds) {
    const A = pts[i].position; const B = pts[j].position;
    for (let q = 0; q < n; q++) {
      const off = (q - (n - 1) / 2) * 0.07;
      const c = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 1, 8), bm);
      const d = new THREE.Vector3().subVectors(B, A);
      c.position.copy(A).addScaledVector(d, 0.5);
      c.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize());
      c.scale.y = d.length();
      const side = new THREE.Vector3(-d.y, d.x, 0).normalize().multiplyScalar(off);
      c.position.add(side);
      g.add(c);
    }
  }
  return g;
}

// Готови модели. Разстоянията са условни.
export const MOL = {
  H2: () => molecule([['H', -0.22, 0, 0], ['H', 0.22, 0, 0]], [[0, 1]]),
  O2: () => molecule([['O', -0.3, 0, 0], ['O', 0.3, 0, 0]], [[0, 1, 2]]),
  N2: () => molecule([['N', -0.28, 0, 0], ['N', 0.28, 0, 0]], [[0, 1, 3]]),
  Cl2: () => molecule([['Cl', -0.38, 0, 0], ['Cl', 0.38, 0, 0]], [[0, 1]]),
  H2O: () => molecule([['O', 0, 0.08, 0], ['H', -0.38, -0.22, 0], ['H', 0.38, -0.22, 0]], [[0, 1], [0, 2]]),
  CO2: () => molecule([['C', 0, 0, 0], ['O', -0.55, 0, 0], ['O', 0.55, 0, 0]], [[0, 1, 2], [0, 2, 2]]),
  CO: () => molecule([['C', -0.28, 0, 0], ['O', 0.28, 0, 0]], [[0, 1, 3]]),
  SO2: () => molecule([['S', 0, 0.1, 0], ['O', -0.5, -0.2, 0], ['O', 0.5, -0.2, 0]], [[0, 1, 2], [0, 2, 2]]),
  CH4: () => molecule([['C', 0, 0, 0], ['H', 0.38, 0.38, 0.38], ['H', -0.38, -0.38, 0.38], ['H', -0.38, 0.38, -0.38], ['H', 0.38, -0.38, -0.38]], [[0, 1], [0, 2], [0, 3], [0, 4]]),
  He: () => molecule([['He', 0, 0, 0]]),
};

// Кристал: решетка от атоми или йони (n×n×n), syms редуват по шахматен ред.
export function lattice(syms, n = 3, d = 0.55, k = 1.3) {
  const g = new THREE.Group();
  for (let x = 0; x < n; x++) for (let y = 0; y < n; y++) for (let z = 0; z < n; z++) {
    const s = syms[(x + y + z) % syms.length];
    const a = atomBall(s, k);
    a.position.set((x - (n - 1) / 2) * d, (y - (n - 1) / 2) * d, (z - (n - 1) / 2) * d);
    g.add(a);
  }
  return g;
}

// Модел на атом: ядро (протони — червени, неутрони — сиви) и електрони (сини) по слоеве 2, 8, 8…
// set({ p, n, e }) сменя броя; tick(dt) върти електроните.
export function bohrAtom({ p = 1, n = 0, e = 1, R = 0.55, dR = 0.38 } = {}) {
  const g = new THREE.Group();
  const nuc = new THREE.Group();
  const shells = new THREE.Group();
  g.add(nuc, shells);
  const pM = mat(0xe53935, { roughness: 0.4 }); const nM = mat(0x9e9e9e, { roughness: 0.4 }); const eM = mat(0x1e88e5, { roughness: 0.3, emissive: 0x0d47a1, emissiveIntensity: 0.3 });
  const pG = new THREE.SphereGeometry(0.07, 12, 10); const eG = new THREE.SphereGeometry(0.055, 10, 8);
  const ringM = new THREE.MeshBasicMaterial({ color: 0x90a4ae, transparent: true, opacity: 0.5 });
  const state = { p: 0, n: 0, e: 0, spin: 0 };
  const electrons = [];
  function set(o) {
    Object.assign(state, o);
    nuc.clear(); shells.clear(); electrons.length = 0;
    const tot = state.p + state.n;
    for (let i = 0; i < tot; i++) {
      // спирала от топчета — плътно ядро
      const a = i * 2.4; const r = 0.05 * Math.cbrt(i + 1) * 1.6;
      const b = new THREE.Mesh(pG, nM);
      b.position.set(Math.cos(a) * r, ((i * 0.618) % 1 - 0.5) * r * 2, Math.sin(a) * r);
      nuc.add(b);
    }
    // протоните са разпределени равномерно между неутроните
    let pi = 0;
    nuc.children.forEach((b, i) => {
      const wantP = Math.round((i + 1) * state.p / Math.max(1, tot)) > pi;
      if (wantP && pi < state.p) { b.material = pM; pi++; } else b.material = nM;
    });
    const caps = [2, 8, 8, 18];
    let left = state.e; let sh = 0;
    while (left > 0 && sh < caps.length) {
      const cnt = Math.min(left, caps[sh]);
      const r = R + sh * dR;
      const ring = new THREE.Mesh(new THREE.TorusGeometry(r, 0.006, 4, 64), ringM);
      ring.rotation.x = Math.PI / 2;
      shells.add(ring);
      for (let k = 0; k < cnt; k++) {
        const el = new THREE.Mesh(eG, eM);
        el.userData = { r, a: (k / cnt) * Math.PI * 2, w: 1.2 / (sh + 1) };
        shells.add(el);
        electrons.push(el);
      }
      left -= cnt; sh++;
    }
    tick(0);
  }
  function tick(dt) {
    for (const el of electrons) {
      el.userData.a += dt * el.userData.w;
      el.position.set(Math.cos(el.userData.a) * el.userData.r, 0, Math.sin(el.userData.a) * el.userData.r);
    }
  }
  set({ p, n, e });
  g.userData = { set, tick, state, nuc, shells };
  return g;
}

// Етикет над обект.
export function tagOver(stage, g, text, y, size = 0.2, ref = 7) {
  const l = labelSprite(text, { size });
  l.position.y = y;
  l.raycast = () => {};
  g.add(l);
  stage.steadyLabel(l, ref);
  return l;
}

// Епруветка (отворена отгоре), начало — дъното. fill(k, color).
export function testTube(h = 1.1, r = 0.13) {
  const g = new THREE.Group();
  const wall = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 20, 1, true), glass(0.3));
  wall.position.y = h / 2 + r;
  const bottom = new THREE.Mesh(new THREE.SphereGeometry(r, 20, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), glass(0.3));
  bottom.position.y = r;
  const liqM = new THREE.MeshStandardMaterial({ color: 0x90caf9, transparent: true, opacity: 0.7, depthWrite: false });
  const liq = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.9, r * 0.9, 1, 18), liqM);
  const liqB = new THREE.Mesh(new THREE.SphereGeometry(r * 0.9, 18, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), liqM);
  liqB.position.y = r;
  g.add(wall, bottom, liq, liqB);
  function fill(k, color) {
    if (color !== undefined) liqM.color.setHex(color);
    const H = Math.max(0.001, k * h);
    liq.scale.y = H; liq.position.y = r + H / 2;
    liq.visible = k > 0.005; liqB.visible = k > 0.001;
  }
  fill(0);
  g.userData = { fill, liqM, h, r };
  return g;
}

// Спиртна лампа с пламък; userData.flame.
export function spiritLamp() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.25, 18, 12), glass(0.45));
  body.scale.y = 0.8; body.position.y = 0.2;
  const liq = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0xb3e5fc, transparent: true, opacity: 0.6 }));
  liq.scale.y = 0.8; liq.position.y = 0.2;
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.15, 12), mat(0x9e9e9e, { metalness: 0.5 }));
  neck.position.y = 0.42;
  const flame = new THREE.Group();
  const o = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 10), new THREE.MeshBasicMaterial({ color: 0x64b5f6, transparent: true, opacity: 0.7 }));
  o.scale.set(1, 2.4, 1);
  const i = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 8), new THREE.MeshBasicMaterial({ color: 0xffd54f, transparent: true, opacity: 0.9 }));
  i.scale.set(1, 2.2, 1); i.position.y = 0.04;
  flame.add(o, i);
  flame.position.y = 0.66;
  g.add(body, liq, neck, flame);
  g.userData.flame = flame;
  return g;
}

export const TEACHER = '<p class="warn">⚠ Химичните опити се правят <b>само от учител</b>, в лаборатория, с очила и ръкавици.</p>';
export const NOT_SCALE = '<i>Моделът не е в мащаб. Атомите не изглеждат като топчета — това е само начин да си ги представим.</i>';
