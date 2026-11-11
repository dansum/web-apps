// 6.3.1 „Движение на вещества в организмите“ — лабораторна маса: растение в саксия в разрез (проводящи съдове),
// опит с два стръка в оцветена вода и прозрачна схема на бозайник с кръвоносна система (не в мащаб).
// Стъпки: опознай → опит: как водата се изкачва по стъблото (симулация с лампа, вентилатор и торбичка)
// → пътят на веществата в растението → кръвта свързва храненето, дишането и отделянето.
import { mat, THREE } from '../kit.js';
import { scaffold, explore, choice, nextBtn, finishBtn, view, stepScore, labRoom, glass, fmt } from './labkit.js';
import { sortTask, orderTask } from './labtasks.js';
import { curveOf, flowDots, organMat, glowOf, tube } from './anatomy.js';
import { badge, spot, tagOn, glassMammal } from './bio6.js';

const PX = -3.6; // саксията
const GX = -0.5; // чашите
const AX = 3.4; // бозайникът
const L = 1.3; // дължина на стръка над водата

export function mount(container, { onComplete }) {
  const STEPS = ['Опознай', 'Опит: водата се изкачва', 'Пътят в растението', 'Кръвта свързва всичко'];
  const ctx = scaffold(container, { steps: STEPS, stage: { background: 0xeef5ec, camPos: [0, 4, 11], target: [0, 1.2, 0], maxDistance: 22 } });
  const { shell, stage, scene } = ctx;
  labRoom(scene, { w: 13, d: 4.6 });
  const note = badge(shell, '⚠ Схеми — не са в мащаб');

  // ---------- Растение в саксия (разрез) ----------
  const plant = new THREE.Group(); plant.position.set(PX, 0, 0); scene.add(plant);
  const potM = mat(0xc1673f, { side: THREE.DoubleSide });
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.45, 0.9, 28, 1, true, Math.PI * 0.3, Math.PI * 1.4), potM);
  pot.position.y = 0.45; plant.add(pot);
  const soil = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.44, 0.84, 28, 1, false, Math.PI * 0.3, Math.PI * 1.4), mat(0x5d4037, { side: THREE.DoubleSide }));
  soil.position.y = 0.43; plant.add(soil);
  // корен с разклонения и коренови власинки (пред разреза)
  const rootM = organMat(0xf3e5c0);
  const rootMain = curveOf([[0, 0.86, 0.3], [0.02, 0.55, 0.32], [-0.03, 0.2, 0.3]]);
  plant.add(tube(rootMain, 0.035, rootM, 16));
  const branches = [[[0.01, 0.62, 0.32], [0.25, 0.45, 0.34], [0.35, 0.3, 0.36]], [[0, 0.5, 0.32], [-0.22, 0.38, 0.34], [-0.33, 0.22, 0.36]], [[0, 0.75, 0.32], [-0.2, 0.68, 0.34], [-0.3, 0.55, 0.36]]];
  branches.forEach((b) => plant.add(tube(curveOf(b), 0.018, rootM, 10)));
  for (let i = 0; i < 40; i++) {
    const h = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.06, 3), rootM);
    const b = branches[i % 3]; const c = curveOf(b).getPoint(0.4 + (i % 7) * 0.08);
    h.position.copy(c); h.rotation.z = (i % 5) - 2; plant.add(h);
  }
  // стъбло: прозрачно, с два проводящи съда вътре
  const stemM = new THREE.MeshStandardMaterial({ color: 0x8bc34a, transparent: true, opacity: 0.45, depthWrite: false });
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 2.1, 16), stemM); stem.position.set(0, 1.9, 0.3); plant.add(stem);
  const xylC = curveOf([[-0.03, 0.25, 0.3], [-0.01, 0.86, 0.31], [-0.03, 1.9, 0.31], [-0.03, 2.75, 0.31], [-0.5, 2.6, 0.33]]);
  const phlC = curveOf([[0.55, 2.4, 0.33], [0.04, 2.6, 0.31], [0.04, 1.6, 0.31], [0.03, 0.86, 0.31], [0.25, 0.45, 0.34]]);
  const xyl = tube(xylC, 0.016, organMat(0x42a5f5, { emissive: 0x000000 }), 40); plant.add(xyl);
  const phl = tube(phlC, 0.016, organMat(0xffa726, { emissive: 0x000000 }), 40); plant.add(phl);
  const water = flowDots(xylC, { n: 14, r: 0.022, color: 0x1e88e5, speed: 0.25 }); plant.add(water);
  const sugar = flowDots(phlC, { n: 10, r: 0.022, color: 0xef6c00, speed: 0.2 }); plant.add(sugar);
  const leafM = mat(0x43a047, { side: THREE.DoubleSide });
  const leaves = [];
  [[-0.55, 2.6, -0.35, 0.3], [0.6, 2.4, 0.35, -0.3], [-0.45, 2.05, -0.25, 0.5], [0.5, 1.75, 0.3, -0.5]].forEach(([x, y, rz, rx]) => {
    const l = new THREE.Mesh(new THREE.SphereGeometry(0.32, 14, 8), leafM); l.scale.set(1.5, 0.08, 0.7); l.position.set(x, y, 0.3); l.rotation.set(rx, 0, rz);
    plant.add(l); leaves.push(l);
  });
  const vapor = [];
  for (let i = 0; i < 14; i++) { const d = new THREE.Mesh(new THREE.SphereGeometry(0.025, 6, 4), new THREE.MeshBasicMaterial({ color: 0xb3e5fc, transparent: true, opacity: 0.8 })); d.userData.k = i / 14; d.userData.l = leaves[i % 4]; plant.add(d); vapor.push(d); }
  const at = {
    root: spot(plant, 'root', [0, 0.45, 0.35], 0.35),
    stem: spot(plant, 'stem', [0, 1.4, 0.3], 0.25),
    leaf: spot(plant, 'leaf', [-0.55, 2.6, 0.3], 0.35),
  };
  const pGlow = { xyl: glowOf(xyl), phl: glowOf(phl) };

  // ---------- Два стръка в оцветена вода ----------
  const cups = new THREE.Group(); cups.position.set(GX, 0, 0.2); scene.add(cups);
  const shoot = (x, withLeaves) => {
    const g = new THREE.Group(); g.position.x = x; cups.add(g);
    const gl = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.19, 0.6, 22, 1, true), glass(0.3)); gl.position.y = 0.3; g.add(gl);
    const wtr = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.18, 0.4, 22), new THREE.MeshStandardMaterial({ color: 0xe53935, transparent: true, opacity: 0.55 })); wtr.position.y = 0.2; g.add(wtr);
    const s = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.04, L + 0.3, 10), new THREE.MeshStandardMaterial({ color: 0xc5e1a5, transparent: true, opacity: 0.7, depthWrite: false })); s.position.y = 0.25 + (L + 0.3) / 2; g.add(s);
    const front = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1, 8), new THREE.MeshBasicMaterial({ color: 0xd32f2f })); g.add(front);
    const head = new THREE.Group(); head.position.y = 0.4 + L; g.add(head);
    const petM = mat(0xffffff); const petals = [];
    for (let i = 0; i < 10; i++) { const p = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 6), petM); p.scale.set(1, 0.45, 0.6); const a = (i / 10) * Math.PI * 2; p.position.set(Math.cos(a) * 0.1, (i % 2) * 0.03, Math.sin(a) * 0.1); p.rotation.y = -a; head.add(p); petals.push(p); }
    const lv = [];
    if (withLeaves) [[0.55, 1], [0.85, -1], [1.1, 1]].forEach(([k, sd]) => { const l = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 6), mat(0x66bb6a, { side: THREE.DoubleSide })); l.scale.set(1.4, 0.08, 0.6); l.position.set(sd * 0.2, 0.25 + k * L, 0); l.rotation.z = sd * 0.5; g.add(l); lv.push(l); });
    else [0.55, 0.85, 1.1].forEach((k) => { const sc = new THREE.Mesh(new THREE.SphereGeometry(0.025, 6, 4), mat(0x8d6e63)); sc.position.set(0.035, 0.25 + k * L, 0); g.add(sc); });
    const bag = new THREE.Mesh(new THREE.SphereGeometry(0.45, 14, 10), new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.25, depthWrite: false, roughness: 0.1 }));
    bag.scale.set(0.9, 1.3, 0.8); bag.position.y = 0.25 + 0.95 * L; bag.visible = false; g.add(bag);
    const drops = [];
    for (let i = 0; i < 8; i++) { const d = new THREE.Mesh(new THREE.SphereGeometry(0.018, 6, 4), new THREE.MeshBasicMaterial({ color: 0xb3e5fc, transparent: true, opacity: 0.85 })); d.userData.k = i / 8; d.userData.l = lv[i % Math.max(1, lv.length)]; d.visible = withLeaves; g.add(d); drops.push(d); }
    const o = { g, front, petM, lv, bag, drops, h: 0, withLeaves };
    o.set = (h) => { o.h = Math.min(1, h); const y0 = 0.4; const len = Math.max(0.001, o.h * L); front.scale.y = len; front.position.y = y0 + len / 2; petM.color.set(0xffffff).lerp(new THREE.Color(0xf06292), Math.max(0, (o.h - 0.92) / 0.08)); };
    o.set(0);
    return o;
  };
  const A = shoot(-0.45, true); const B = shoot(0.45, false);
  tagOn(stage, A.g, 'с листа', [0, 2.15, 0], 0.17);
  tagOn(stage, B.g, 'без листа', [0, 2.15, 0], 0.17);
  const cupsAt = spot(cups, 'cups', [0, 1.0, 0], 0.6);
  const aTop = spot(A.g, null, [0, 1.75, 0]); const bTop = spot(B.g, null, [0, 1.75, 0]);
  // лампа и вентилатор
  const lamp = new THREE.Group(); lamp.position.set(GX - 1.5, 0, -0.6); scene.add(lamp);
  { const base = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.2, 0.06, 16), mat(0x37474f)); base.position.y = 0.03;
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.9, 8), mat(0x546e7a)); arm.position.y = 0.95;
    const shade = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.28, 16, 1, true), mat(0x26a69a, { side: THREE.DoubleSide })); shade.position.set(0.15, 1.9, 0); shade.rotation.z = 0.9;
    lamp.add(base, arm, shade); }
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 8), new THREE.MeshBasicMaterial({ color: 0x9e9e9e })); bulb.position.set(0.24, 1.84, 0); lamp.add(bulb);
  const lampLight = new THREE.PointLight(0xfff1c1, 0, 4); lampLight.position.set(0.4, 1.7, 0.2); lamp.add(lampLight);
  const fan = new THREE.Group(); fan.position.set(GX + 1.45, 0, -0.5); scene.add(fan);
  { const st = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.0, 8), mat(0x90a4ae)); st.position.y = 0.5;
    const ft = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.22, 0.05, 16), mat(0x90a4ae)); ft.position.y = 0.025;
    const cage = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.015, 6, 28), mat(0x78909c)); cage.position.y = 1.15; cage.rotation.y = Math.PI / 2 + 0.6;
    fan.add(st, ft, cage); }
  const blades = new THREE.Group(); blades.position.y = 1.15; blades.rotation.y = 0.6; fan.add(blades);
  for (let i = 0; i < 3; i++) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.26, 0.1), mat(0x4fc3f7)); b.position.y = 0.14; const p = new THREE.Group(); p.rotation.x = (i / 3) * Math.PI * 2; p.add(b); blades.add(p); }

  // ---------- Прозрачен бозайник ----------
  const stand = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.2, 0.12, 30), mat(0xb0bec5)); stand.position.set(AX, 0.06, 0); scene.add(stand);
  const dog = glassMammal(); dog.position.set(AX, 0.12, 0); dog.rotation.y = -0.08; scene.add(dog);
  const cy = dog.userData.cy;
  const heart = new THREE.Group();
  { const hm = new THREE.Mesh(new THREE.SphereGeometry(0.13, 18, 14), organMat(0xc62828, { emissive: 0x000000 })); hm.scale.set(1, 1.15, 0.9); heart.add(hm); }
  heart.position.set(0.4, cy - 0.16, 0.05); dog.add(heart);
  const lungsD = new THREE.Group();
  for (const s of [-1, 1]) { const l = new THREE.Mesh(new THREE.SphereGeometry(0.11, 14, 10), organMat(0xf48fb1, { emissive: 0x000000 })); l.scale.set(1.3, 0.9, 0.8); l.position.set(0.56, cy + 0.12, s * 0.12); lungsD.add(l); }
  dog.add(lungsD);
  const gut = new THREE.Group();
  { const gc = curveOf([[0.05, cy - 0.15, 0.1], [-0.15, cy - 0.25, -0.15], [-0.35, cy - 0.15, 0.12], [-0.2, cy - 0.05, -0.12], [-0.45, cy - 0.28, 0], [-0.6, cy - 0.12, 0.05]]);
    gut.add(tube(gc, 0.05, organMat(0xffb74d, { emissive: 0x000000 }), 40)); }
  dog.add(gut);
  const kidneys = new THREE.Group();
  for (const s of [-1, 1]) { const k = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 10), organMat(0x8e3b2f, { emissive: 0x000000 })); k.scale.set(0.8, 1.2, 0.7); k.position.set(-0.3, cy + 0.18, s * 0.14); kidneys.add(k); }
  dog.add(kidneys);
  const brainD = new THREE.Mesh(new THREE.SphereGeometry(0.13, 12, 10), organMat(0xf8bbd0)); brainD.position.copy(dog.userData.head.position).add(new THREE.Vector3(-0.05, 0.08, 0)); dog.add(brainD);
  // кръвоносни съдове: малък кръг (сърце–дробове) и голям кръг (сърце–тяло)
  const smallC = curveOf([[0.42, cy - 0.05, 0.05], [0.55, cy + 0.2, 0.12], [0.62, cy + 0.12, 0], [0.55, cy + 0.2, -0.12], [0.42, cy - 0.05, -0.05]], true);
  const bigC = curveOf([[0.42, cy - 0.2, 0], [0.2, cy - 0.32, 0.06], [-0.2, cy - 0.32, 0.1], [-0.55, cy - 0.25, 0.06], [-0.6, cy + 0.12, 0], [-0.3, cy + 0.28, 0], [0.1, cy + 0.3, 0], [0.75, cy + 0.32, 0], [0.95, cy + 0.25, 0], [0.6, cy - 0.02, 0]], true);
  const legC = curveOf([[0.4, cy - 0.25, 0.12], [0.45, 0.45, 0.2], [0.45, 0.1, 0.2], [0.55, 0.12, 0.25], [0.55, 0.5, 0.2], [0.45, cy - 0.15, 0.14]], true);
  const vesM = organMat(0xd32f2f, { emissive: 0x000000 });
  const vessels = new THREE.Group();
  [smallC, bigC, legC].forEach((c) => vessels.add(tube(c, 0.018, vesM, 64)));
  dog.add(vessels);
  const blood = [smallC, bigC, legC].map((c, i) => flowDots(c, { n: [8, 22, 10][i], r: 0.026, color: 0xb71c1c, speed: 0.4 }));
  blood.forEach((d) => dog.add(d));
  // вещества: кислород от дробовете, храна от червата, отпадни вещества към бъбреците
  const o2C = curveOf([[0.52, cy + 0.3, 0.25], [0.52, cy + 0.15, 0.15], [0.5, cy + 0.08, 0.05]]);
  const co2C = curveOf([[0.55, cy + 0.12, -0.05], [0.58, cy + 0.2, -0.15], [0.6, cy + 0.36, -0.25]]);
  const foodC = curveOf([[-0.25, cy - 0.2, 0], [-0.25, cy - 0.26, 0.05], [-0.22, cy - 0.32, 0.1]]);
  const wasteC = curveOf([[-0.42, cy + 0.2, 0], [-0.36, cy + 0.19, 0.08], [-0.3, cy + 0.18, 0.14]]);
  const cargo = [[o2C, 0x29b6f6], [co2C, 0x9e9e9e], [foodC, 0xfdd835], [wasteC, 0x66bb6a]].map(([c, col]) => { const d = flowDots(c, { n: 4, r: 0.022, color: col, speed: 0.12 }); dog.add(d); return d; });
  const dGlow = { heart: glowOf(heart), lungs: glowOf(lungsD), gut: glowOf(gut), kidneys: glowOf(kidneys), vessels: glowOf(vessels) };
  const dat = {
    heart: spot(dog, 'heart', [0.4, cy - 0.16, 0.05], 0.18),
    vessels: spot(dog, 'vessels', [0.45, 0.35, 0.2], 0.2),
    lungs: spot(dog, 'lungs', [0.5, cy + 0.1, 0], 0.22),
    gut: spot(dog, 'gut', [-0.3, cy - 0.18, 0], 0.25),
    kidneys: spot(dog, 'kidneys', [-0.3, cy + 0.18, 0], 0.18),
    legcells: spot(dog, null, [0.5, 0.05, 0.2]),
  };
  tagOn(stage, dog, 'схема на бозайник', [0, cy + 0.85, 0], 0.18);
  tagOn(stage, plant, 'растение в разрез', [0, 3.15, 0.3], 0.18);

  // ---------- Жива сцена ----------
  const S = { flow: 1, lamp: false, fan: false, bag: false, run: null, beat: 0 };
  const rate = (o) => (o.withLeaves ? 0.2 * (S.lamp ? 1.6 : 1) * (S.fan ? 1.6 : 1) * (S.bag ? 0.4 : 1) : 0.05);
  stage.tick((dt, t) => {
    const f = S.flow;
    water.userData.update(dt, f); sugar.userData.update(dt, f);
    vapor.forEach((d) => { const q = (d.userData.k + t * 0.15) % 1; const l = d.userData.l; d.position.set(l.position.x + Math.sin(q * 9 + d.userData.k * 20) * 0.15, l.position.y + 0.05 + q * 0.6, 0.3 + Math.cos(d.userData.k * 30) * 0.15); d.material.opacity = 0.8 * (1 - q) * f; });
    leaves.forEach((l, i) => { l.rotation.y = Math.sin(t * 0.8 + i) * 0.06; });
    blood.forEach((d) => d.userData.update(dt, f));
    cargo.forEach((d) => d.userData.update(dt, f));
    S.beat += dt * 7 * f;
    heart.scale.setScalar(1 + Math.max(0, Math.sin(S.beat)) * 0.12 * f);
    lungsD.scale.set(1, 1 + Math.sin(t * 1.6) * 0.05 * f, 1);
    dog.userData.head.rotation.y = Math.sin(t * 0.5) * 0.15;
    // опит
    lampLight.intensity = S.lamp ? 2.2 : 0;
    bulb.material.color.set(S.lamp ? 0xfff59d : 0x9e9e9e);
    if (S.fan) blades.children.forEach((p) => { p.rotation.x += dt * 12; });
    A.bag.visible = S.bag;
    for (const o of [A, B]) o.drops.forEach((d) => { if (!d.userData.l) return; const q = (d.userData.k + t * 0.25 * (S.fan ? 2 : 1)) % 1; d.position.set(d.userData.l.position.x + (S.fan ? -q * 0.4 : 0), d.userData.l.position.y + q * 0.45, Math.sin(d.userData.k * 9) * 0.1); d.visible = !S.bag && o.h > 0.3; });
    if (S.run) {
      S.run.t += dt;
      const k = Math.min(1, S.run.t / S.run.dur);
      const hrs = k * S.run.hours;
      for (const o of S.run.who) o.set(S.run.h0.get(o) + rate(o) * hrs);
      if (S.run.tick) S.run.tick(hrs);
      if (k >= 1) { const done = S.run.done; S.run = null; done && done(); }
    }
  });
  const runFor = (hours, who, { dur = 2.4, tick, done } = {}) => { S.run = { t: 0, dur, hours, who, h0: new Map(who.map((o) => [o, o.h])), tick, done }; };

  // ---------- 1. Опознай ----------
  function step1() {
    shell.step(0);
    ctx.clearTip();
    Object.assign(S, { flow: 1, lamp: false, fan: false, bag: false, run: null });
    A.set(0); B.set(0);
    Object.values(dGlow).forEach((g) => g.set(0)); Object.values(pGlow).forEach((g) => g.set(0));
    view(ctx, [0, 1.4, 0], 5.2, { halfH: 2, elev: 0.25 });
    const it = (id, label, icon, note, obj, dist = 3) => ({ id, label, icon, note, obj: () => obj, dist, lift: 0, bubble: 0.35 });
    explore(ctx, {
      title: 'Разгледай',
      intro: '<p>Във всеки многоклетъчен организъм веществата <b>се движат</b>: от органа, който ги поема, до всяка клетка, и от клетките — до органите, които ги изхвърлят.</p><p><b>Разгледай всичко</b> от менюто в ъгъла.</p>',
      items: [
        it('root', 'Корен', '🪴', 'С <b>кореновите власинки</b> коренът поема от почвата <b>вода с разтворени минерални соли</b>.', at.root),
        it('stem', 'Стъбло', '🌿', 'В стъблото има <b>проводящи съдове</b>. По едни (синьо) водата и минералните соли се изкачват <b>от корена към листата</b>. По други (оранжево) захарта от листата отива <b>към всички органи</b>.', at.stem),
        it('leaf', 'Лист', '🍃', 'В листа се образуват хранителни вещества. През малки отвори — <b>устица</b> — листът изпарява вода. Изпарението „издърпва“ водата нагоре по стъблото.', at.leaf),
        it('cups', 'Опит с оцветена вода', '🧪', 'Два стръка с бели цветове стоят във вода, оцветена с хранителен оцветител. Единият е <b>с листа</b>, другият — <b>без листа</b>.', cupsAt, 3.2),
        it('heart', 'Сърце', '❤️', 'Сърцето е мускулна помпа. То тласка <b>кръвта</b> по кръвоносните съдове без спиране.', dat.heart, 3),
        it('vessels', 'Кръвоносни съдове', '🩸', 'Кръвоносните съдове стигат до всяка част на тялото. Кръвта в тях носи вещества <b>до клетките и от клетките</b>.', dat.vessels, 3),
        it('lungs', 'Бели дробове', '🫁', 'В белите дробове <b>кислородът</b> (синьо) влиза в кръвта, а <b>въглеродният диоксид</b> (сиво) излиза от нея.', dat.lungs, 3),
      ],
      onNext: step2,
    });
  }

  // ---------- 2. Опит: водата се изкачва ----------
  function step2() {
    shell.step(1);
    A.set(0); B.set(0);
    view(ctx, [GX, 1.1, 0.2], 1.9, { halfH: 1.2, elev: 0.15 });
    ctx.say(cupsAt, 'Водата в чашите е оцветена в червено. Ще видим докъде се изкачва по стъблото.', 'wide', 1.2);
    shell.task('<p>Двата стръка са в оцветена вода. Единият е <b>с листа</b>, другият — <b>без листа</b>.</p>');
    let mistakes = 0;
    choice(ctx, {
      q: 'В кой стрък оцветената вода ще стигне по-бързо до цвета?',
      options: [
        { t: 'В стръка с листа.', ok: true, why: 'Да проверим! Плъзни часовете.' },
        { t: 'В стръка без листа.', ok: false, why: 'Листата изпаряват вода. Как това влияе на водата в стъблото?' },
        { t: 'Еднакво бързо и в двата.', ok: false, why: 'Двата стръка се различават по нещо важно. Какво правят листата с водата?' },
      ],
      hint: 'Изпарението от листата тегли водата нагоре.',
      onRight: (m) => { mistakes = m; hours(); },
    });
    function hours() {
      ctx.clearTip();
      shell.task(`<p>Плъзни <b>часовете</b> и наблюдавай червения цвят в стъблата.</p>
        <label class="small">Часове: <b class="hv">0</b><input class="slider hs" type="range" min="0" max="6" step="1" value="0"></label>`);
      const sl = container.querySelector('.hs');
      let tA = null; let tB = null;
      const upd = () => {
        const h = +sl.value; container.querySelector('.hv').textContent = h;
        A.set(rate(A) * h); B.set(rate(B) * h);
        const cm = (o) => fmt(o.h * 20, 0);
        if (!tA) { tA = stage.bubble(aTop, '', { lift: 0.25, cls: 'tag' }); tB = stage.bubble(bTop, '', { lift: 0.25, cls: 'tag' }); }
        tA.set(`${cm(A)} от 20 cm`); tB.set(`${cm(B)} от 20 cm`);
        if (h >= 6 && !c.querySelector('.nx')) {
          sl.disabled = true;
          tA.remove(); tB.remove();
          ctx.say(cupsAt, '✔ С листата водата стигна до цвета и той порозовя. Без листа тя се изкачва много по-бавно. Листата <b>изпаряват</b> вода и тя се изтегля нагоре по съдовете.', 'good wide', 1.2);
          nextBtn(ctx, 'Опитай да ускориш →', speed);
        }
      };
      const c = shell.setControls('');
      sl.addEventListener('input', upd);
    }
    function speed() {
      ctx.clearTip();
      A.set(0);
      shell.task(`<p>Нов стрък с листа. Нагласи условията така, че оцветената вода да стигне до цвета <b>само за 2 часа</b>.</p>
        <label class="small"><input type="checkbox" class="lampc"> 💡 Лампа (светлина и топлина)</label><br>
        <label class="small"><input type="checkbox" class="fanc"> 🌀 Вентилатор (вятър)</label><br>
        <label class="small"><input type="checkbox" class="bagc"> 🛍 Найлонова торбичка върху листата</label>
        <p class="small">Модел: числата са приблизителни.</p>`);
      const cb = (s, k) => { const el = container.querySelector(s); el.checked = S[k]; el.addEventListener('change', () => { S[k] = el.checked; }); };
      cb('.lampc', 'lamp'); cb('.fanc', 'fan'); cb('.bagc', 'bag');
      const c = shell.setControls('<div class="row"><button class="btn primary run">▶ Пусни 2 часа</button></div>');
      const btn = c.querySelector('.run');
      ctx.answer = { lamp: true, fan: true, bag: false };
      btn.addEventListener('click', () => {
        if (S.run) return;
        A.set(0); btn.disabled = true; ctx.clearTip();
        runFor(2, [A], {
          done: () => {
            btn.disabled = false;
            if (A.h >= 1) {
              btn.disabled = true; ctx.answer = null;
              container.querySelectorAll('.lampc,.fanc,.bagc').forEach((e) => { e.disabled = true; });
              ctx.say(aTop, '✔ Светлината, топлината и вятърът увеличават изпарението от листата. Колкото повече вода се изпарява, толкова по-бързо се изкачва нова.', 'good wide', 0.3);
              choice(ctx, {
                q: 'Защо торбичката върху листата забавя изкачването на водата?',
                options: [
                  { t: 'Въздухът в торбичката става влажен и листата изпаряват по-малко вода.', ok: true, why: 'Вярно! По-малко изпарение — по-бавно движение на водата.' },
                  { t: 'Торбичката спира светлината напълно.', ok: false, why: 'Торбичката е прозрачна. Какво става с въздуха около листата в нея?' },
                  { t: 'Торбичката притиска стъблото.', ok: false, why: 'Торбичката е около листата, а не около стъблото. Виж капчиците в нея.' },
                ],
                hint: 'Виж какво се събира по стените на торбичката.',
                mistakes,
                onRight: (m) => { ctx.scores[0] = stepScore(m, 3); nextBtn(ctx, 'Напред →', step3); },
              });
              return;
            }
            const why = S.bag ? 'Торбичката задържа влагата около листата.' : !S.lamp && !S.fan ? 'Нищо не ускорява изпарението.' : 'Само едно от условията не стига.';
            ctx.say(aTop, `Водата стигна до ${fmt(A.h * 20, 0)} от 20 cm. ${why}`, 'bad wide', 0.3);
          },
        });
      });
    }
  }

  // ---------- 3. Пътят в растението ----------
  function step3() {
    shell.step(2);
    ctx.clearTip();
    Object.assign(S, { lamp: false, fan: false, bag: false });
    view(ctx, [PX, 1.6, 0.3], 1.5, { halfH: 1.6, elev: 0.15 });
    shell.task('<p>Проследи по схемата пътя на <b>водата</b> в растението.</p>');
    const look = [at.root, at.root, at.stem, at.leaf, at.leaf];
    const say = ['коренови власинки', 'съдове в корена', 'съдове в стъблото', 'жилки на листа', 'устица → въздух'];
    orderTask(ctx, {
      q: 'Подреди пътя на водата: от почвата до въздуха.',
      items: ['Кореновите власинки поемат вода от почвата.', 'Водата влиза в проводящите съдове на корена.', 'Изкачва се по съдовете в стъблото.', 'Стига до жилките на листата.', 'Изпарява се през устицата.'],
      hint: 'Водата влиза в растението през корена, а излиза през листата.',
      onPick: (i) => { pGlow.xyl.set(0.7, 0x42a5f5); ctx.say(look[i], say[i], 'tag', 0.2); },
      onDone: (m) => {
        pGlow.xyl.set(0);
        ctx.clearTip();
        shell.task('<p>Растението има два вида проводящи съдове. Накъде се движи всяко вещество?</p>');
        sortTask(ctx, {
          bins: ['От корена към листата', 'От листата към другите органи'],
          items: [
            { t: 'вода', bin: 0, why: 'Водата се изкачва от корена.', show: () => { pGlow.phl.set(0); pGlow.xyl.set(0.7, 0x42a5f5); } },
            { t: 'минерални соли, разтворени във водата', bin: 0, why: 'Солите идват от почвата заедно с водата.', show: () => { pGlow.phl.set(0); pGlow.xyl.set(0.7, 0x42a5f5); } },
            { t: 'захар, образувана в листата', bin: 1, why: 'Захарта се образува в листата и отива към корена, цветовете и плодовете.', show: () => { pGlow.xyl.set(0); pGlow.phl.set(0.7, 0xffa726); } },
            { t: 'хранителни вещества за корена и плодовете', bin: 1, why: 'Те се образуват в листата и се разнасят по другия вид съдове.', show: () => { pGlow.xyl.set(0); pGlow.phl.set(0.7, 0xffa726); } },
          ],
          hint: 'Какво взема коренът от почвата и какво прави листът?',
          mistakes: m,
          onDone: (m2) => {
            Object.values(pGlow).forEach((g) => g.set(0));
            choice(ctx, {
              q: 'Градинар отрязва всички листа на доматите. Какво ще стане?',
              options: [
                { t: 'Водата ще се изкачва по-бавно, а растението няма да образува хранителни вещества.', ok: true, why: 'Вярно! Листата „теглят“ водата и правят храната за цялото растение.' },
                { t: 'Растението ще расте по-бързо, защото водата ще отива само в плодовете.', ok: false, why: 'Спомни си опита: какво стана със стръка без листа?' },
                { t: 'Нищо няма да се промени.', ok: false, why: 'Листата правят две важни неща. Кои?' },
              ],
              hint: 'Спомни си стръка без листа.',
              mistakes: m2,
              onRight: (m3) => { ctx.scores[1] = stepScore(m3, 3); nextBtn(ctx, 'Напред →', step4); },
            });
          },
        });
      },
    });
  }

  // ---------- 4. Кръвта свързва всичко ----------
  function step4() {
    shell.step(3);
    ctx.clearTip();
    view(ctx, [AX, 1.0, 0], 1.7, { halfH: 1.1, elev: 0.25 });
    shell.task('<p>При животните веществата пренася <b>кръвта</b>. Къде всяко вещество влиза в кръвта или излиза от нея?</p>');
    const show = (id) => () => { Object.values(dGlow).forEach((g) => g.set(0)); dGlow[id].set(0.6, 0xffeb3b); ctx.say(dat[id], { lungs: 'бели дробове', gut: 'черва', kidneys: 'бъбреци' }[id], 'tag', 0.15); };
    sortTask(ctx, {
      bins: ['Бели дробове', 'Черва', 'Бъбреци'],
      items: [
        { t: 'Кислородът влиза в кръвта.', bin: 0, show: show('lungs'), why: 'В белите дробове кислородът от въздуха минава в кръвта (дишане).' },
        { t: 'Въглеродният диоксид излиза от кръвта.', bin: 0, show: show('lungs'), why: 'Издишваме въглероден диоксид.' },
        { t: 'Хранителните вещества влизат в кръвта.', bin: 1, show: show('gut'), why: 'В червата смляната храна минава в кръвта (хранене).' },
        { t: 'Ненужните вещества се изхвърлят с урината.', bin: 2, show: show('kidneys'), why: 'Бъбреците пречистват кръвта (отделяне).' },
      ],
      hint: 'Дишане — бели дробове, хранене — черва, отделяне — бъбреци.',
      onDone: (m) => {
        Object.values(dGlow).forEach((g) => g.set(0));
        ctx.clearTip();
        choice(ctx, {
          q: 'Ако кръвоносен съд в крака се притисне силно за дълго (например от много стегнат ластик), какво ще стане с клетките след него?',
          options: [
            { t: 'Няма да получават кислород и храна, а ненужните вещества ще се трупат.', ok: true, why: 'Вярно! Виж: когато кръвта спре, нищо не стига до клетките.' },
            { t: 'Нищо, клетките имат запас за дни.', ok: false, why: 'Клетките постоянно имат нужда от кислород. Откъде го получават?' },
            { t: 'Клетките ще получават кислород направо от въздуха.', ok: false, why: 'Кожата на бозайниците не доставя кислород до клетките в крака. Какво го носи?' },
          ],
          hint: 'Кислородът и храната пътуват с кръвта.',
          mistakes: m,
          onRight: (m2) => {
            S.flow = 0;
            dGlow.vessels.set(0.3, 0x5c6bc0);
            ctx.say(dat.legcells, 'Кръвта спря: кислородът и храната не стигат до клетките. Затова нищо не бива да стяга силно ръка или крак за дълго.', 'wide', 0.05);
            setTimeout(() => { if (shell.controls.isConnected) { S.flow = 1; dGlow.vessels.set(0); } }, 4500);
            choice(ctx, {
              q: 'Защо транспортната система е важна за целия многоклетъчен организъм?',
              options: [
                { t: 'Свързва храненето, дишането и отделянето: носи вещества до всяка клетка и от нея.', ok: true, why: 'Вярно! Без транспорт органите за хранене, дишане и отделяне не биха били свързани с клетките.' },
                { t: 'Защото само тя има клетки.', ok: false, why: 'Всички органи са изградени от клетки. Какво прави кръвта?' },
                { t: 'Защото тя образува храната.', ok: false, why: 'Храната при животните идва от червата. Кой я разнася?' },
              ],
              hint: 'Кислородът, храната и ненужните вещества пътуват с кръвта.',
              mistakes: m2,
              onRight: (m3) => { ctx.scores[2] = stepScore(m3, 3); finishBtn(ctx, onComplete, restart); },
            });
          },
        });
      },
    });
  }

  function restart() {
    ctx.scores.length = 0;
    ctx.ratio = null;
    ctx.answer = null;
    step1();
  }
  step1();
  return { dispose() { note.remove(); stage.dispose(); } };
}
