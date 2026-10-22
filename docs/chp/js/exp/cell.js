// 5.3.1 „Клетъчен строеж на организмите“ — 3D микроскоп и разрязана клетка.
// Стъпки: подготви микроскопа → фокусирай → части на клетката → едноклетъчни и многоклетъчни.
import { createStage, labelSprite, mat, zoneRing, addHitBox, THREE, esc } from '../kit.js';
import { createShell, stepScore } from './shell.js';

// ---------- микроскоп ----------
const PARTS = {
  eyepiece: { label: 'Окуляр', note: 'През него гледаш. Увеличава 10 пъти (10×).' },
  tube: { label: 'Тубус', note: 'Тръба, която свързва окуляра с обективите.' },
  revolver: { label: 'Револвер с обективи', note: 'Въртиш го, за да смениш обектива: 10× или 40×.' },
  stage: { label: 'Предметна масичка', note: 'Тук се поставя препаратът, захванат с щипките.' },
  knob: { label: 'Винт', note: 'Въртиш го, за да стане образът ясен (фокусиране).' },
  light: { label: 'Осветител', note: 'Свети отдолу през препарата.' },
  arm: { label: 'Статив', note: 'За него хващаш микроскопа, когато го пренасяш.' },
};

function part(id, mesh) {
  mesh.userData.pickId = id;
  return mesh;
}

function buildMicroscope() {
  const g = new THREE.Group();
  const body = mat(0xf2f4f7, { roughness: 0.35, metalness: 0.2 });
  const dark = mat(0x2b2f36, { roughness: 0.5, metalness: 0.3 });
  const chrome = mat(0xd0d6de, { roughness: 0.2, metalness: 0.8 });

  const base = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.25, 2.2), body);
  base.position.set(0, 0.125, 0.1);
  g.add(part('arm', base));
  const light = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.26, 0.18, 24),
    new THREE.MeshStandardMaterial({ color: 0xfff3c4, emissive: 0xffe28a, emissiveIntensity: 0.9 }));
  light.position.set(0, 0.34, 0.45);
  g.add(part('light', light));

  // Статив: стойка отзад и наклонена дръжка към главата.
  const post = new THREE.Mesh(new THREE.BoxGeometry(0.42, 1.5, 0.42), body);
  post.position.set(0, 0.95, -0.7);
  g.add(part('arm', post));
  const arm = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.9, 0.36), body);
  arm.position.set(0, 1.85, -0.55);
  arm.rotation.x = 0.35;
  g.add(part('arm', arm));

  // Предметна масичка (подвижна при фокусиране).
  const stageG = new THREE.Group();
  const plate = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.08, 1.2), dark);
  stageG.add(part('stage', plate));
  for (const s of [1, -1]) {
    const clip = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.03, 0.08), chrome);
    clip.position.set(s * 0.42, 0.06, 0.35);
    clip.rotation.y = s * 0.3;
    stageG.add(part('stage', clip));
  }
  const hole = new THREE.Mesh(new THREE.CircleGeometry(0.12, 20), new THREE.MeshBasicMaterial({ color: 0xfff6d0 }));
  hole.rotation.x = -Math.PI / 2;
  hole.position.set(0, 0.041, 0.45);
  stageG.add(hole);
  stageG.position.set(0, 1.05, 0);
  g.add(stageG);
  g.userData.stage = stageG;

  // Тубус, окуляр, револвер и обективи.
  const head = new THREE.Group();
  head.position.set(0, 2.15, 0.45);
  const turret = new THREE.Group();
  head.add(turret);
  const rev = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.3, 0.18, 28), chrome);
  turret.add(part('revolver', rev));
  const objectives = [];
  const objCols = [0xd23b3b, 0x2f7de1, 0xf1c232];
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2;
    const ob = new THREE.Group();
    const cyl = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.06, 0.35 + i * 0.08, 16), chrome);
    const band = new THREE.Mesh(new THREE.CylinderGeometry(0.083, 0.083, 0.04, 16), mat(objCols[i]));
    band.position.y = 0.05;
    ob.add(part('revolver', cyl), part('revolver', band));
    ob.position.set(Math.sin(a) * 0.2, -0.25 - i * 0.04, Math.cos(a) * 0.2);
    ob.rotation.x = Math.cos(a) * 0.25;
    ob.rotation.z = -Math.sin(a) * 0.25;
    turret.add(ob);
    objectives.push(ob);
  }
  const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.2, 0.9, 24), body);
  tube.position.set(0, 0.5, -0.15);
  tube.rotation.x = -0.35;
  head.add(part('tube', tube));
  const eye = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.35, 24), dark);
  eye.position.set(0, 1.05, -0.36);
  eye.rotation.x = -0.35;
  head.add(part('eyepiece', eye));
  const eyeRim = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.025, 8, 24), chrome);
  eyeRim.position.set(0, 1.22, -0.42);
  eyeRim.rotation.x = Math.PI / 2 - 0.35;
  head.add(part('eyepiece', eyeRim));
  const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.3, 0.75), body);
  bridge.position.set(0, 0.1, -0.6);
  head.add(part('arm', bridge));
  g.add(head);
  g.userData.revolver = rev;
  g.userData.turret = turret;
  g.userData.objectives = objectives;

  // Винтове от двете страни.
  const knobs = [];
  for (const s of [1, -1]) {
    const k = new THREE.Group();
    const big = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.12, 20), dark);
    big.rotation.z = Math.PI / 2;
    const ridge = new THREE.Mesh(new THREE.TorusGeometry(0.26, 0.025, 6, 24), chrome);
    ridge.rotation.y = Math.PI / 2;
    const small = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.16, 16), chrome);
    small.rotation.z = Math.PI / 2;
    small.position.x = s * 0.12;
    const notch = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.05, 0.05), chrome);
    notch.position.set(0, 0.22, 0);
    k.add(part('knob', big), part('knob', ridge), part('knob', small), part('knob', notch));
    k.position.set(s * 0.34, 1.5, -0.62);
    g.add(k);
    knobs.push(k);
  }
  g.userData.knobs = knobs;
  return g;
}

function slideModel(color, label) {
  const g = new THREE.Group();
  const glass = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.025, 0.32),
    new THREE.MeshStandardMaterial({ color: 0xdff3ff, transparent: true, opacity: 0.55, roughness: 0.05 }));
  const spot = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.03, 16), mat(color, { transparent: true, opacity: 0.85 }));
  const tag = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.03, 0.3), mat(0xffffff));
  tag.position.x = -0.33;
  g.add(glass, spot, tag);
  const l = labelSprite(label, { size: 0.2 });
  l.position.set(0, 0.25, 0);
  g.add(l);
  return g;
}

// ---------- образ в окуляра ----------
function rng(seed) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}

function drawOnion(ctx, size, zoom) {
  const r = rng(7);
  ctx.fillStyle = '#f6efd8';
  ctx.fillRect(0, 0, size, size);
  const cw = 70 * zoom;
  const ch = 26 * zoom;
  ctx.lineJoin = 'round';
  for (let row = -1; row < size / ch + 1; row++) {
    const off = (row % 2) * cw * 0.5;
    for (let col = -1; col < size / cw + 1; col++) {
      const x = col * cw + off + (r() - 0.5) * 6 * zoom;
      const y = row * ch + (r() - 0.5) * 3 * zoom;
      const w = cw * (0.92 + r() * 0.1);
      ctx.fillStyle = `hsl(${45 + r() * 10}, 55%, ${84 + r() * 6}%)`;
      ctx.strokeStyle = '#9c7c46';
      ctx.lineWidth = 2.2 * zoom;
      ctx.beginPath();
      ctx.moveTo(x, y + ch / 2);
      ctx.lineTo(x + w * 0.1, y);
      ctx.lineTo(x + w * 0.9, y);
      ctx.lineTo(x + w, y + ch / 2);
      ctx.lineTo(x + w * 0.9, y + ch);
      ctx.lineTo(x + w * 0.1, y + ch);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      if (r() < 0.75) {
        ctx.fillStyle = '#8f5fa8';
        ctx.beginPath();
        ctx.ellipse(x + w * (0.3 + r() * 0.4), y + ch * 0.5, 5 * zoom, 3.6 * zoom, 0, 0, Math.PI * 2);
        ctx.fill();
        if (zoom > 2) {
          ctx.fillStyle = '#5d3474';
          ctx.beginPath();
          ctx.arc(x + w * 0.5, y + ch * 0.5, 1.2 * zoom, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  }
  // кръг на зрителното поле
  const grd = ctx.createRadialGradient(size / 2, size / 2, size * 0.36, size / 2, size / 2, size * 0.5);
  grd.addColorStop(0, 'rgba(0,0,0,0)');
  grd.addColorStop(1, 'rgba(0,0,0,0.85)');
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, size, size);
}

// ---------- клетки ----------
function clipMat(color, opacity, clip, extra = {}) {
  return new THREE.MeshStandardMaterial({
    color, transparent: opacity < 1, opacity, roughness: 0.5,
    side: THREE.DoubleSide, clippingPlanes: [clip], depthWrite: opacity >= 1, ...extra,
  });
}

function granules(count, box, clip, color = 0xb68b4c, sphere = false) {
  const g = new THREE.Group();
  const geo = new THREE.SphereGeometry(0.035, 6, 4);
  const m = clipMat(color, 1, clip);
  const r = rng(3 + count);
  for (let i = 0; i < count; i++) {
    let x, y, z;
    do {
      x = (r() - 0.5) * box[0]; y = (r() - 0.5) * box[1]; z = (r() - 0.5) * box[2];
    } while (sphere && (x * x) / (box[0] * box[0] / 4) + (y * y) / (box[1] * box[1] / 4) + (z * z) / (box[2] * box[2] / 4) > 1);
    const s = new THREE.Mesh(geo, m);
    s.position.set(x, y, z);
    g.add(s);
  }
  return g;
}

function buildPlantCell(clip) {
  const g = new THREE.Group();
  const W = 3.2; const H = 1.6; const D = 1.6;
  const wall = new THREE.Mesh(new THREE.BoxGeometry(W, H, D), clipMat(0x6dbb4a, 0.35, clip, { emissive: 0x1d4a10, emissiveIntensity: 0.3 }));
  const wallEdges = new THREE.LineSegments(new THREE.EdgesGeometry(wall.geometry),
    new THREE.LineBasicMaterial({ color: 0x2e7d32, clippingPlanes: [clip] }));
  const memb = new THREE.Mesh(new THREE.BoxGeometry(W - 0.16, H - 0.16, D - 0.16), clipMat(0xf2c94c, 0.4, clip));
  const membEdges = new THREE.LineSegments(new THREE.EdgesGeometry(memb.geometry),
    new THREE.LineBasicMaterial({ color: 0xd4a017, clippingPlanes: [clip] }));
  const cyto = new THREE.Mesh(new THREE.BoxGeometry(W - 0.22, H - 0.22, D - 0.22), clipMat(0xf6e7b0, 0.22, clip));
  const gran = granules(110, [W - 0.4, H - 0.4, D - 0.4], clip);
  const vac = new THREE.Mesh(new THREE.SphereGeometry(0.62, 32, 20), clipMat(0x9fd3f0, 0.45, clip));
  vac.scale.set(1.7, 0.95, 0.95);
  vac.position.set(0.5, 0, 0);
  const nuc = new THREE.Mesh(new THREE.SphereGeometry(0.33, 32, 20), clipMat(0x8e44ad, 1, clip, { roughness: 0.35 }));
  nuc.position.set(-0.95, 0.05, 0.05);
  const nucleolus = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 12), clipMat(0x4a235a, 1, clip));
  nucleolus.position.copy(nuc.position).add(new THREE.Vector3(0.05, 0.05, 0.05));
  g.add(wall, wallEdges, memb, membEdges, cyto, gran, vac, nuc, nucleolus);
  g.userData.parts = { wall, memb, cyto, nuc, vac };
  g.userData.pins = {
    wall: new THREE.Vector3(W / 2 - 0.02, H / 2 - 0.02, 0.0),
    memb: new THREE.Vector3(-W / 2 + 0.1, -H / 2 + 0.1, 0.0),
    cyto: new THREE.Vector3(-0.2, -0.45, 0.0),
    nuc: new THREE.Vector3(-0.95, 0.05, 0.1),
  };
  return g;
}

function buildAnimalCell(clip) {
  const g = new THREE.Group();
  const geo = new THREE.SphereGeometry(1, 48, 32);
  const p = geo.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const k = 1 + 0.08 * Math.sin(v.x * 3.1 + v.y * 2.3) + 0.05 * Math.cos(v.z * 4 + v.x);
    v.multiplyScalar(k);
    p.setXYZ(i, v.x * 1.15, v.y * 0.75, v.z);
  }
  geo.computeVertexNormals();
  const memb = new THREE.Mesh(geo, clipMat(0xf28fb0, 0.45, clip));
  const cyto = new THREE.Mesh(geo.clone().scale(0.95, 0.95, 0.95), clipMat(0xfde2ea, 0.25, clip));
  const gran = granules(80, [1.9, 1.2, 1.6], clip, 0xc06080, true);
  const nuc = new THREE.Mesh(new THREE.SphereGeometry(0.3, 32, 20), clipMat(0x8e44ad, 1, clip, { roughness: 0.35 }));
  nuc.position.set(0.1, 0.05, 0.05);
  g.add(memb, cyto, gran, nuc);
  g.userData.parts = { memb, cyto, nuc };
  g.userData.pins = {
    memb: new THREE.Vector3(-1.12, 0.25, 0.0),
    cyto: new THREE.Vector3(0.6, -0.3, 0.0),
    nuc: new THREE.Vector3(0.1, 0.05, 0.1),
  };
  return g;
}

const PART_NAMES = {
  wall: 'Клетъчна стена',
  memb: 'Клетъчна мембрана',
  cyto: 'Цитоплазма',
  nuc: 'Ядро (наследствено вещество)',
};
const PART_NOTES = {
  wall: 'Твърда обвивка извън мембраната. Има я при растенията, няма я при животните.',
  memb: 'Тънка обвивка около клетката. Пропуска вещества навън и навътре.',
  cyto: 'Полутечна среда вътре в клетката. В нея са другите части.',
  nuc: 'Съдържа наследственото вещество. Управлява живота на клетката.',
};

// ---------- организми за сортиране ----------
const ORGS = [
  { id: 'amoeba', label: 'Амеба', uni: true, note: 'Едноклетъчна. Движи се, като променя формата си.' },
  { id: 'paramecium', label: 'Чехълче', uni: true, note: 'Едноклетъчно. Плува с хиляди ресни.' },
  { id: 'bacterium', label: 'Бактерия', uni: true, note: 'Едноклетъчна и много малка — вижда се само с микроскоп.' },
  { id: 'yeast', label: 'Дрожди', uni: true, note: 'Едноклетъчни гъби. Правят тестото да втасва.' },
  { id: 'leaf', label: 'Лист', uni: false, note: 'Част от растение. Изграден е от милиони клетки.' },
  { id: 'mushroom', label: 'Печурка', uni: false, note: 'Многоклетъчна гъба.' },
  { id: 'ant', label: 'Мравка', uni: false, note: 'Многоклетъчно животно — дори малкото тяло има милиони клетки.' },
  { id: 'onion', label: 'Лук', uni: false, note: 'Многоклетъчно растение. Ти видя клетките на кожицата му.' },
];

function orgModel(id) {
  const g = new THREE.Group();
  switch (id) {
    case 'amoeba': {
      const geo = new THREE.SphereGeometry(0.45, 32, 20);
      const m = new THREE.Mesh(geo, mat(0xb9a7e0, { transparent: true, opacity: 0.85 }));
      m.scale.set(1.2, 0.5, 1);
      m.position.y = 0.25;
      g.add(m);
      const n = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 8), mat(0x6a3d9a));
      n.position.set(0.1, 0.3, 0);
      g.add(n);
      g.userData.blob = { geo, base: geo.attributes.position.array.slice() };
      break;
    }
    case 'paramecium': {
      const b = new THREE.Mesh(new THREE.CapsuleGeometry(0.18, 0.7, 8, 16), mat(0x9ccc65, { transparent: true, opacity: 0.9 }));
      b.rotation.z = Math.PI / 2;
      b.position.y = 0.25;
      g.add(b);
      const cil = mat(0x689f38);
      for (let i = 0; i < 26; i++) {
        const a = (i / 26) * Math.PI * 2;
        const c = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.1, 3), cil);
        c.position.set(Math.cos(a) * 0.5, 0.25 + Math.sin(a) * 0.2, 0);
        c.rotation.z = a;
        g.add(c);
      }
      break;
    }
    case 'bacterium': {
      const b = new THREE.Mesh(new THREE.CapsuleGeometry(0.12, 0.35, 6, 12), mat(0x4fc3f7));
      b.rotation.z = Math.PI / 2;
      b.position.y = 0.15;
      g.add(b);
      const fl = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.01, 4, 16, Math.PI * 1.5), mat(0x0288d1));
      fl.position.set(-0.4, 0.15, 0);
      g.add(fl);
      break;
    }
    case 'yeast': {
      const m = mat(0xe8d4a2);
      const a = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 12), m);
      a.scale.set(1.2, 1, 1);
      a.position.y = 0.22;
      const b = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 8), m);
      b.position.set(0.3, 0.3, 0);
      g.add(a, b);
      break;
    }
    case 'leaf': {
      const s = new THREE.Shape();
      s.moveTo(0, -0.5); s.quadraticCurveTo(0.45, 0, 0, 0.55); s.quadraticCurveTo(-0.45, 0, 0, -0.5);
      const m = new THREE.Mesh(new THREE.ShapeGeometry(s, 12), mat(0x43a047, { side: THREE.DoubleSide }));
      m.rotation.x = -Math.PI / 2.4;
      m.position.y = 0.3;
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.3, 4), mat(0x2e7d32));
      stem.position.set(0, 0.12, 0.55);
      stem.rotation.x = 1.2;
      g.add(m, stem);
      break;
    }
    case 'mushroom': {
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.13, 0.4, 12), mat(0xf5f0e6));
      stem.position.y = 0.2;
      const cap = new THREE.Mesh(new THREE.SphereGeometry(0.32, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), mat(0xc49a6c));
      cap.position.y = 0.38;
      g.add(stem, cap);
      break;
    }
    case 'ant': {
      const m = mat(0x3e2723);
      for (const [x, r] of [[0.3, 0.09], [0.08, 0.1], [-0.22, 0.15]]) {
        const s = new THREE.Mesh(new THREE.SphereGeometry(r, 12, 8), m);
        s.position.set(x, 0.16, 0);
        if (x < 0) s.scale.set(1.3, 1, 1);
        g.add(s);
      }
      for (let i = 0; i < 3; i++) {
        for (const sz of [1, -1]) {
          const l = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.28, 4), m);
          l.position.set(0.12 - i * 0.1, 0.08, sz * 0.12);
          l.rotation.x = sz * 1.0;
          g.add(l);
        }
      }
      break;
    }
    case 'onion': {
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.3, 20, 14), mat(0xb5651d));
      bulb.scale.set(1, 0.9, 1);
      bulb.position.y = 0.28;
      const top = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.3, 10), mat(0x8d4a16));
      top.position.y = 0.65;
      g.add(bulb, top);
      break;
    }
    default: break;
  }
  return g;
}

// ---------- преживяване ----------
export function mount(container, { onComplete }) {
  const STEPS = ['Подготви микроскопа', 'Фокусирай', 'Части на клетката', 'Едноклетъчни и многоклетъчни'];
  const shell = createShell(container, { steps: STEPS });
  const stage = createStage(shell.stageEl, {
    background: 0xe9eef5, camPos: [3.2, 3.6, 5.2], target: [0, 1.3, 0], shadows: true, maxDistance: 14, minDistance: 1.5,
    maxPolarAngle: Math.PI * 0.62,
  });
  const { scene, renderer, camera } = stage;
  renderer.localClippingEnabled = true;

  // ---- лаборатория ----
  const lab = new THREE.Group();
  scene.add(lab);
  const table = new THREE.Mesh(new THREE.BoxGeometry(9, 0.3, 5), mat(0xc8a47a, { roughness: 0.6 }));
  table.position.y = -0.15;
  table.receiveShadow = true;
  lab.add(table);
  const floorWall = new THREE.Mesh(new THREE.PlaneGeometry(30, 14), mat(0xdfe7f1));
  floorWall.position.set(0, 4, -4);
  lab.add(floorWall);
  const micro = buildMicroscope();
  micro.traverse((m) => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
  lab.add(micro);
  // Лабораторни дреболии.
  const beaker = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.7, 24, 1, true),
    new THREE.MeshStandardMaterial({ color: 0xcfefff, transparent: true, opacity: 0.4, side: THREE.DoubleSide }));
  beaker.position.set(-3, 0.35, -1);
  const water = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.35, 24), mat(0x7fc4ef, { transparent: true, opacity: 0.6 }));
  water.position.set(-3, 0.18, -1);
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.15, 12, 8), mat(0xffffff));
  lab.add(beaker, water);

  const SLIDES = [
    { id: 'onion', label: 'Лукова кожица', color: 0xe0c070, pos: [2.3, 0.02, 1.2] },
    { id: 'cheek', label: 'Бузна лигавица', color: 0xe07aa0, pos: [2.3, 0.02, 0.4] },
    { id: 'pond', label: 'Капка от локва', color: 0x7cb342, pos: [2.3, 0.02, -0.4] },
  ];
  const slides = {};
  for (const s of SLIDES) {
    const m = slideModel(s.color, s.label);
    m.position.set(...s.pos);
    m.userData.pickId = 'slide:' + s.id;
    lab.add(m);
    slides[s.id] = m;
  }

  // ---- светът на клетката (далеч от лабораторията) ----
  const cellWorld = new THREE.Group();
  cellWorld.position.set(0, 40, 0);
  cellWorld.visible = false;
  scene.add(cellWorld);
  const clip = new THREE.Plane(new THREE.Vector3(0, 0, -1), 0.0);
  const plant = buildPlantCell(clip);
  plant.position.set(-2.2, 0, 0);
  const animal = buildAnimalCell(clip);
  animal.position.set(2.4, 0, 0);
  cellWorld.add(plant, animal);
  for (const [cell, title] of [[plant, 'Растителна клетка (лук)'], [animal, 'Животинска клетка (буза)']]) {
    const l = labelSprite(title, { size: 0.3 });
    l.position.set(0, 1.35, 0);
    cell.add(l);
  }
  const glow = new THREE.PointLight(0xffffff, 1.2, 20);
  glow.position.set(0, 3, 4);
  cellWorld.add(glow);

  // ---- капка вода (за сортиране) ----
  const dropWorld = new THREE.Group();
  dropWorld.position.set(0, -40, 0);
  dropWorld.visible = false;
  scene.add(dropWorld);
  const dropFloor = new THREE.Mesh(new THREE.CircleGeometry(7, 64), mat(0xdcefe6));
  dropFloor.rotation.x = -Math.PI / 2;
  dropWorld.add(dropFloor);

  let tip = null;
  function say(anchor, html, cls = '', lift = 0.5) {
    if (tip) tip.remove();
    tip = stage.bubble(anchor, html, { lift, cls });
  }
  function clearTip() { if (tip) { tip.remove(); tip = null; } }

  const scores = [];
  let clickHandler = null;
  let hoverHandler = null;
  stage.onClick((hit) => clickHandler && clickHandler(hit));
  stage.onHover((r) => hoverHandler && hoverHandler(r));

  function partAnchor(id) {
    let found = null;
    micro.traverse((m) => { if (!found && m.userData.pickId === id) found = m; });
    return found;
  }

  // ---------- 1. Подготви микроскопа ----------
  function step1() {
    shell.step(0);
    clearTip();
    lab.visible = true; cellWorld.visible = false; dropWorld.visible = false;
    stage.flyTo([3.2, 3.6, 5.2], [0, 1.3, 0]);
    let mistakes = 0;
    let phase = 0;
    const tasks = [
      { text: 'Започваме с <b>луковата кожица</b>. Кликни препарата и той ще отиде на масичката.', target: 'slide:onion' },
      { text: 'Къде ще гледаш? <b>Кликни окуляра.</b>', target: 'eyepiece' },
      { text: 'Кое въртиш, за да стане образът ясен? <b>Кликни винта.</b>', target: 'knob' },
      { text: 'Откъде идва светлината? <b>Кликни осветителя.</b>', target: 'light' },
    ];
    const draw = () => {
      shell.task(`<p>${tasks[phase].text}</p><p class="small">Посочи с мишката която и да е част, за да видиш името ѝ.</p>`);
      shell.score(`Задача ${phase + 1} от ${tasks.length} · грешки: ${mistakes}`);
    };
    draw();
    shell.setControls('');
    hoverHandler = (r) => {
      if (!r) return;
      const id = r.userData.pickId;
      if (PARTS[id]) say(r, `<b>${esc(PARTS[id].label)}</b>`, 'tag', 0.35);
    };
    clickHandler = (hit) => {
      if (!hit) return;
      const id = hit.root.userData.pickId;
      const want = tasks[phase].target;
      if (id === want) {
        if (id === 'slide:onion') {
          const sl = slides.onion;
          const st = micro.userData.stage;
          lab.remove(sl);
          st.add(sl);
          sl.position.set(0, 0.06, 0.45);
          sl.children[3].visible = false;
          say(st, '✔ Препаратът е на масичката, точно над светлината.', 'good', 0.4);
        } else {
          say(hit.root, `✔ <b>${esc(PARTS[id].label)}</b>: ${esc(PARTS[id].note)}`, 'good', 0.4);
        }
        phase++;
        shell.msg('Вярно!', 'good');
        if (phase >= tasks.length) {
          scores.push(stepScore(mistakes, 3));
          hoverHandler = null; clickHandler = null;
          shell.task('<p>Микроскопът е готов. Сега ще погледнем през окуляра.</p>');
          const c = shell.setControls('<button class="btn primary">Погледни през окуляра →</button>');
          c.querySelector('button').addEventListener('click', step2);
          return;
        }
        draw();
      } else {
        mistakes++;
        const name = PARTS[id] ? PARTS[id].label : id.startsWith('slide:') ? 'друг препарат' : 'това';
        shell.msg(`Това е ${name}. Опитай пак.`, 'bad');
        if (PARTS[id]) say(hit.root, `<b>${esc(PARTS[id].label)}</b>: ${esc(PARTS[id].note)}`, 'bad', 0.4);
        draw();
      }
    };
  }

  // ---------- 2. Фокусирай ----------
  function step2() {
    shell.step(1);
    clearTip();
    hoverHandler = null;
    stage.flyTo([1.8, 2.6, 2.6], [0, 1.4, 0.3]);
    let mistakes = 0;
    let obj = 10;
    let phase = 0;
    const targets = { 10: 0.62, 40: 0.31 };
    const off = document.createElement('canvas');
    off.width = off.height = 360;
    const renderView = () => drawOnion(off.getContext('2d'), 360, obj === 10 ? 1 : 3.2);
    renderView();
    shell.task(`<canvas class="eyepiece" width="360" height="360"></canvas>
      <label class="small">Винт (фокус) <input class="slider focus" type="range" min="0" max="1" step="0.005" value="0.1"></label>
      <div class="row"><span class="small">Обектив:</span>
        <button class="btn objb" data-o="10">10×</button><button class="btn objb" data-o="40">40×</button></div>
      <p class="instr"></p>`);
    const view = container.querySelector('.eyepiece');
    const vctx = view.getContext('2d');
    const slider = container.querySelector('.focus');
    const instr = container.querySelector('.instr');
    const objBtns = container.querySelectorAll('.objb');
    const blurOf = () => Math.abs(+slider.value - targets[obj]) * 40;
    const paint = () => {
      vctx.drawImage(off, 0, 0);
      view.style.filter = `blur(${blurOf().toFixed(1)}px)`;
      const st = micro.userData.stage;
      st.position.y = 0.85 + +slider.value * 0.35;
      for (const k of micro.userData.knobs) k.rotation.x = +slider.value * Math.PI * 4;
    };
    const setObj = (o) => {
      obj = o;
      objBtns.forEach((b) => b.classList.toggle('primary', +b.dataset.o === o));
      micro.userData.turret.rotation.y = o === 10 ? 0 : (Math.PI * 2) / 3;
      renderView();
      paint();
    };
    const draw = () => {
      instr.innerHTML = [
        'Обективът е <b>10×</b>. Върти винта (плъзгача), докато клетките станат ясни, после натисни „Ясно е!“.',
        'Сега смени на обектив <b>40×</b> и пак фокусирай.',
        '',
      ][phase];
      shell.score(`Грешки: ${mistakes}`);
    };
    slider.addEventListener('input', paint);
    objBtns.forEach((b) => b.addEventListener('click', () => {
      const o = +b.dataset.o;
      if (phase === 0 && o === 40) { shell.msg('Първо фокусирай при 10×. Започва се винаги с малкото увеличение.', 'bad'); return; }
      setObj(o);
    }));
    setObj(10);
    draw();
    const c = shell.setControls('<button class="btn primary sharp">Ясно е!</button>');
    const sharpBtn = c.querySelector('.sharp');
    sharpBtn.addEventListener('click', () => {
      if (phase === 1 && obj !== 40) { shell.msg('Смени обектива на 40×.', 'bad'); return; }
      if (blurOf() > 1.6) {
        mistakes++;
        shell.msg('Още е размазано. Върти бавно винта.', 'bad');
        draw();
        return;
      }
      shell.msg('Отлично! Клетките се виждат ясно.', 'good');
      phase++;
      if (phase === 1) {
        say(micro.userData.revolver, '✔ При 10× виждаш много клетки, подредени като тухлички.', 'good', 0.3);
        draw();
        return;
      }
      clearTip();
      // Въпрос за увеличението.
      instr.innerHTML = `Окулярът увеличава <b>10×</b>, а обективът — <b>40×</b>. Колко пъти е увеличен образът?
        <label class="num"><input class="mag" type="text" inputmode="numeric"> пъти</label>`;
      sharpBtn.remove();
      const c2 = shell.setControls('<button class="btn primary">Провери</button>');
      const inp = container.querySelector('.mag');
      inp.focus();
      c2.querySelector('button').addEventListener('click', () => {
        const v = parseInt(inp.value, 10);
        if (v === 400) {
          shell.msg('Вярно: 10 × 40 = 400 пъти.', 'good');
        } else {
          mistakes++;
          shell.msg('Не е точно. Умножи двете числа: 10 × 40 = 400.', 'bad');
        }
        inp.disabled = true;
        scores.push(stepScore(mistakes, 3));
        const c3 = shell.setControls('<button class="btn primary">Влез в клетката →</button>');
        c3.querySelector('button').addEventListener('click', step3);
      });
    });
  }

  // ---------- 3. Части на клетката ----------
  function step3() {
    shell.step(2);
    clearTip();
    lab.visible = false;
    cellWorld.visible = true;
    scene.background = new THREE.Color(0x0f1e33);
    stage.controls.maxPolarAngle = Math.PI;
    stage.controls.maxDistance = 14;
    const base = cellWorld.position;
    camera.position.set(base.x, base.y + 1.5, base.z + 9);
    stage.flyTo([base.x, base.y + 1.2, base.z + 7.5], [base.x, base.y, base.z], 0.8);
    let mistakes = 0;
    const todo = [
      ...Object.keys(plant.userData.pins).map((k) => ({ cell: plant, part: k })),
      ...Object.keys(animal.userData.pins).map((k) => ({ cell: animal, part: k })),
    ];
    const pins = [];
    for (const t of todo) {
      const p = new THREE.Mesh(new THREE.SphereGeometry(0.09, 16, 12),
        new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.6, depthTest: false }));
      p.renderOrder = 20;
      p.position.copy(t.cell.userData.pins[t.part]);
      p.userData.pickId = 'pin';
      p.userData.t = t;
      t.cell.add(p);
      pins.push(p);
      t.pin = p;
      t.tag = stage.bubble(p, '?', { lift: 0.25, cls: 'tag' });
    }
    let held = null;
    const drawChips = () => {
      shell.task(`<p>Клетката е разрязана наполовина, за да видиш какво има вътре.</p>
        <p><b>Избери име отдолу, после кликни бялата точка</b> на правилното място. Направи го и за двете клетки.</p>
        <div class="xp-chips">${Object.keys(PART_NAMES).map((k) => `<span class="chip" data-k="${k}">${esc(PART_NAMES[k])}</span>`).join('')}</div>
        <label class="small"><input type="checkbox" class="whole"> Покажи цялата клетка (без разрез)</label>`);
      container.querySelectorAll('.xp-chips .chip').forEach((ch) => ch.addEventListener('click', () => {
        container.querySelectorAll('.xp-chips .chip').forEach((x) => x.classList.remove('held'));
        held = ch.dataset.k;
        ch.classList.add('held');
      }));
      container.querySelector('.whole').addEventListener('change', (e) => {
        clip.constant = e.target.checked ? 10 : 0;
      });
    };
    drawChips();
    shell.setControls('');
    const left = () => todo.filter((t) => !t.done).length;
    shell.score(`Остават: ${left()} · грешки: ${mistakes}`);
    hoverHandler = null;
    clickHandler = (hit) => {
      if (!hit || hit.root.userData.pickId !== 'pin') return;
      const t = hit.root.userData.t;
      if (t.done) return;
      if (!held) { shell.msg('Първо избери име отдолу.', 'bad'); return; }
      if (held === t.part) {
        t.done = true;
        t.tag.set(`✔ ${esc(PART_NAMES[t.part])}`);
        t.tag.el.classList.add('good');
        hit.root.material.color.setHex(0x2fb36b);
        hit.root.material.emissive.setHex(0x1f8a50);
        shell.msg(PART_NOTES[t.part], 'good');
      } else {
        mistakes++;
        shell.msg(`Не е „${PART_NAMES[held]}“. ${t.cell === animal && held === 'wall' ? 'Животинската клетка няма клетъчна стена!' : 'Огледай къде е точката.'}`, 'bad');
      }
      shell.score(`Остават: ${left()} · грешки: ${mistakes}`);
      if (!left()) compare(mistakes, pins, todo);
    };
  }

  function compare(mistakes0, pins, todo) {
    clickHandler = null;
    let mistakes = mistakes0;
    shell.task(`<p><b>Сравни двете клетки.</b> Коя част има растителната клетка, но я няма животинската?</p>
      <div class="choices">${['Клетъчна мембрана', 'Клетъчна стена', 'Цитоплазма', 'Ядро'].map((c, i) =>
        `<button class="choice" data-i="${i}">${esc(c)}</button>`).join('')}</div>`);
    shell.setControls('');
    container.querySelectorAll('.xp-task .choice').forEach((b) => b.addEventListener('click', () => {
      const ok = +b.dataset.i === 1;
      if (!ok) { mistakes++; b.classList.add('wrong'); shell.msg('Не. Тази част я има и при двете клетки.', 'bad'); return; }
      b.classList.add('right');
      container.querySelectorAll('.xp-task .choice').forEach((x) => { x.disabled = true; });
      shell.msg('Вярно! Клетъчната стена прави растителните клетки здрави и с постоянна форма.', 'good');
      scores.push(stepScore(mistakes, 4));
      const c = shell.setControls('<button class="btn primary">Напред →</button>');
      c.querySelector('button').addEventListener('click', () => {
        for (const t of todo) t.tag.remove();
        for (const p of pins) p.parent.remove(p);
        step4();
      });
    }));
  }

  // ---------- 4. Едноклетъчни и многоклетъчни ----------
  let stopDrag = null;
  function step4() {
    shell.step(3);
    clearTip();
    cellWorld.visible = false;
    dropWorld.visible = true;
    scene.background = new THREE.Color(0xe8f5ee);
    stage.controls.maxPolarAngle = Math.PI * 0.47;
    const base = dropWorld.position;
    camera.position.set(base.x, base.y + 8, base.z + 10);
    stage.flyTo([base.x, base.y + 7, base.z + 9], [base.x, base.y, base.z + 1], 0.6);

    const zU = zoneRing(0x2f7de1, 1.6);
    zU.position.set(-2.6, 0.02, 3.4);
    const zM = zoneRing(0xe08a1e, 1.6);
    zM.position.set(2.6, 0.02, 3.4);
    for (const [z, t, col] of [[zU, 'Едноклетъчни', '#2f7de1'], [zM, 'Многоклетъчни', '#e08a1e']]) {
      const l = labelSprite(t, { size: 0.38, color: '#fff', bg: col, border: col });
      l.position.set(0, 0.45, 1.9);
      z.add(l);
      dropWorld.add(z);
    }
    const models = [];
    const order = ORGS.slice().sort(() => Math.random() - 0.5);
    order.forEach((o, i) => {
      const g = orgModel(o.id);
      const a = (i / order.length) * Math.PI * 2;
      g.position.set(Math.cos(a) * 3.2, 0, Math.sin(a) * 1.6 - 1.2);
      g.scale.setScalar(1.6);
      g.userData.pickId = o.id;
      g.userData.dragId = o.id;
      g.userData.o = o;
      g.userData.home = g.position.clone();
      g.userData.phase = i;
      const l = labelSprite(o.label, { size: 0.18 });
      l.position.y = 0.85;
      g.add(l);
      g.traverse((m) => { if (m.isMesh) m.castShadow = true; });
      addHitBox(g, 0.8);
      dropWorld.add(g);
      models.push(g);
    });
    const stopAnim = stage.tick((dt, t) => {
      for (const g of models) {
        if (g.userData.blob) {
          const { geo, base: b } = g.userData.blob;
          const p = geo.attributes.position;
          for (let i = 0; i < p.count; i++) {
            const x = b[i * 3]; const y = b[i * 3 + 1]; const z = b[i * 3 + 2];
            const k = 1 + 0.18 * Math.sin(t * 1.5 + x * 6 + z * 4);
            p.setXYZ(i, x * k, y, z * k);
          }
          p.needsUpdate = true;
        }
        if (!g.userData.locked) g.rotation.y = Math.sin(t * 0.6 + g.userData.phase) * 0.4;
      }
    });
    let mistakes = 0;
    let placed = 0;
    shell.task(`<p>Някои организми са изградени само от <b>една клетка</b>, а други — от <b>много клетки</b>.</p>
      <p><b>Провлачи всеки организъм</b> в правилния кръг. Кликни върху него, за да прочетеш за него.</p>`);
    shell.setControls('');
    const upd = () => shell.score(`Подредени: ${placed} от ${ORGS.length} · грешки: ${mistakes}`);
    upd();
    clickHandler = (hit) => {
      if (!hit) return clearTip();
      const o = hit.root.userData.o;
      if (o) say(hit.root, `<b>${esc(o.label)}</b><br>${esc(o.note)}`, '', 1.1);
    };
    const local = new THREE.Vector3();
    stopDrag = stage.enableDrag({
      planeY: base.y,
      onStart: () => clearTip(),
      onDrop: (g, p, start) => {
        local.copy(p); // позицията е спрямо dropWorld
        const o = g.userData.o;
        const inU = Math.hypot(local.x - zU.position.x, local.z - zU.position.z) < 1.7;
        const inM = Math.hypot(local.x - zM.position.x, local.z - zM.position.z) < 1.7;
        if (!inU && !inM) { g.position.copy(start); return; }
        if ((inU && o.uni) || (inM && !o.uni)) {
          g.userData.locked = true;
          placed++;
          const zone = inU ? zU : zM;
          const n = models.filter((m) => m.userData.locked && m.userData.o.uni === o.uni).length - 1;
          g.position.set(zone.position.x + ((n % 2) - 0.5) * 1.2, 0, zone.position.z + (Math.floor(n / 2) - 0.5) * 1.0);
          say(g, `✔ ${esc(o.note)}`, 'good', 1.1);
          shell.msg('Вярно!', 'good');
        } else {
          mistakes++;
          g.position.copy(start);
          say(g, `✘ ${esc(o.note)}`, 'bad', 1.1);
          shell.msg('Не е там. Прочети описанието.', 'bad');
        }
        upd();
        if (placed === ORGS.length) {
          stopDrag(); stopDrag = null;
          scores.push(stepScore(mistakes, 4));
          const c = shell.setControls('<button class="btn primary">Виж резултата</button>');
          c.querySelector('button').addEventListener('click', () => {
            clearTip();
            const ratio = scores.reduce((a, b) => a + b, 0) / scores.length;
            shell.finish(ratio, onComplete, () => {
              stopAnim();
              for (const m of models) dropWorld.remove(m);
              dropWorld.remove(zU, zM);
              restart();
            });
          });
        }
      },
    });
  }

  function restart() {
    scores.length = 0;
    scene.background = new THREE.Color(0xe9eef5);
    stage.controls.maxPolarAngle = Math.PI * 0.62;
    clip.constant = 0;
    // препаратът обратно на масата
    const sl = slides.onion;
    if (sl.parent !== lab) {
      sl.parent.remove(sl);
      lab.add(sl);
      sl.position.set(...SLIDES[0].pos);
      sl.children[3].visible = true;
    }
    micro.userData.stage.position.y = 1.05;
    camera.position.set(3.2, 3.6, 5.2);
    step1();
  }

  void lamp;
  step1();
  return { dispose() { if (stopDrag) stopDrag(); stage.dispose(); } };
}
