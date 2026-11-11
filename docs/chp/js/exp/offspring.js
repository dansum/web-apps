// 6.3.3 „Размножаване“ — лабораторна маса: увеличена схема на цвят в разрез, два цвята и пчела, картофена грудка,
// ягода с вкореняващо се стъбло, хидра с пъпка, птиче яйце и схема на полови клетки (увеличено, не в мащаб).
// Чувствителна тема: само растения и животни, като в учебник, спокойно и научно (review: true).
// Стъпки: опознай → опрашване и оплождане (опит с торбичка, прашецова тръбичка) → безполово и полово, етапи,
// полови клетки → сравни и предскажи.
import { mat, THREE } from '../kit.js';
import { scaffold, explore, choice, nextBtn, finishBtn, view, stepScore, labRoom, glass } from './labkit.js';
import { sortTask, orderTask } from './labtasks.js';
import { curveOf, tube, organMat } from './anatomy.js';
import { flowerModel, potModel, eggModel, clamp01, lerp } from './nature3.js';
import { badge, spot, tagOn } from './bio6.js';

const FX = -0.4; // схемата на цвета

export function mount(container, { onComplete }) {
  const STEPS = ['Опознай', 'Опрашване и оплождане', 'Безполово и полово', 'Сравни и предскажи'];
  const ctx = scaffold(container, { steps: STEPS, stage: { background: 0xf3f0f7, camPos: [0, 4, 11], target: [0, 1.2, 0], maxDistance: 22 } });
  const { shell, stage, scene } = ctx;
  labRoom(scene, { w: 14, d: 4.6 });
  const note = badge(shell, '⚠ Схемите са увеличени — не са в мащаб');

  // ---------- Голяма схема на цвят в разрез ----------
  const fl = new THREE.Group(); fl.position.set(FX, 0, 0); scene.add(fl);
  const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.08, 0.9, 10), mat(0x689f38)); stand.position.y = 0.45; fl.add(stand);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.35, 0.05, 20), mat(0x78909c)); base.position.y = 0.025; fl.add(base);
  const sepals = [];
  for (let i = 0; i < 5; i++) { const s = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 6), mat(0x7cb342)); s.scale.set(1.4, 0.25, 0.6); const a = (i / 5) * Math.PI * 2; s.position.set(Math.cos(a) * 0.2, 0.92, Math.sin(a) * 0.2); s.rotation.y = -a; s.rotation.z = 0.3; fl.add(s); sepals.push(s); }
  const petM = mat(0xf48fb1, { side: THREE.DoubleSide });
  const petals = [];
  for (let i = 0; i < 4; i++) { const p = new THREE.Mesh(new THREE.SphereGeometry(0.5, 14, 10), petM); p.scale.set(1, 0.08, 0.6); const a = Math.PI * (1.15 + i * 0.23); p.position.set(Math.cos(a) * 0.55, 1.15, Math.sin(a) * 0.55); p.rotation.y = -a; p.rotation.z = 0.7; fl.add(p); petals.push(p); }
  // плодник: завръз (прозрачен), стълбче, близалце
  const ovaryM = new THREE.MeshStandardMaterial({ color: 0x9ccc65, transparent: true, opacity: 0.45, depthWrite: false });
  const ovary = new THREE.Mesh(new THREE.SphereGeometry(0.24, 18, 14), ovaryM); ovary.scale.set(1, 1.15, 1); ovary.position.y = 1.15; fl.add(ovary);
  const style = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.05, 0.6, 10), organMat(0x9ccc65, { emissive: 0x000000 })); style.position.y = 1.65; fl.add(style);
  const stigma = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 8), organMat(0xc0ca33, { emissive: 0x000000 })); stigma.scale.set(1.3, 0.5, 1.3); stigma.position.y = 1.97; fl.add(stigma);
  const ovules = [];
  for (let i = 0; i < 3; i++) { const o = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), organMat(0xfff9c4, { emissive: 0x000000 })); o.position.set((i - 1) * 0.1, 1.12 + (i % 2) * 0.06, 0.05); fl.add(o); ovules.push(o); }
  const eggDot = new THREE.Mesh(new THREE.SphereGeometry(0.022, 8, 6), mat(0xe91e63)); eggDot.position.set(0, 1.18, 0.1); fl.add(eggDot);
  // тичинки
  const stamens = new THREE.Group(); fl.add(stamens);
  const pollenDots = [];
  for (let i = 0; i < 5; i++) {
    const a = Math.PI * (0.1 + i * 0.2) + Math.PI; const g = new THREE.Group(); g.rotation.y = -a; stamens.add(g);
    const fil = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.75, 6), mat(0xfff59d)); fil.position.set(0.18, 1.35, 0); fil.rotation.z = -0.35; g.add(fil);
    const anth = new THREE.Mesh(new THREE.CapsuleGeometry(0.035, 0.08, 4, 8), mat(0xffb300)); anth.position.set(0.31, 1.72, 0); g.add(anth);
    for (let k = 0; k < 3; k++) { const d = new THREE.Mesh(new THREE.SphereGeometry(0.015, 6, 4), mat(0xffeb3b)); d.position.set(0.33 + k * 0.02, 1.75 + k * 0.02, 0.03); g.add(d); pollenDots.push(d); }
  }
  const grain = new THREE.Mesh(new THREE.SphereGeometry(0.035, 10, 8), new THREE.MeshBasicMaterial({ color: 0xffd600 })); grain.visible = false; fl.add(grain);
  const tubeC = curveOf([[0.02, 1.98, 0.04], [0.01, 1.7, 0.04], [0.0, 1.38, 0.05], [0.0, 1.2, 0.08]]);
  const pTube = tube(tubeC, 0.012, organMat(0xffd54f, { emissive: 0xffc107, emissiveIntensity: 0.5 }), 30); pTube.visible = false; fl.add(pTube);
  const spermDot = new THREE.Mesh(new THREE.SphereGeometry(0.022, 8, 6), new THREE.MeshBasicMaterial({ color: 0x1e88e5 })); spermDot.visible = false; fl.add(spermDot);
  const at = {
    flower: spot(fl, 'flower', [0, 1.35, 0], 0.45),
    stamen: spot(stamens.children[2], 'stamen', [0.31, 1.72, 0], 0.15),
    pistil: spot(fl, 'pistil', [0, 1.6, 0.05], 0.15),
    stigma: spot(fl, 'stigma', [0, 1.98, 0], 0.13),
    ovary: spot(fl, null, [0, 1.15, 0.1]),
  };
  tagOn(stage, fl, 'цвят в разрез (увеличено)', [0, 2.45, 0], 0.18);
  const F = { k: 0, phase: -1, t: 0, done: null };
  const resetFlower = () => {
    F.phase = -1; F.k = 0; grain.visible = false; pTube.visible = false; spermDot.visible = false;
    ovary.scale.set(1, 1.15, 1); ovaryM.color.set(0x9ccc65); ovaryM.opacity = 0.45;
    ovules.forEach((o) => { o.material.color.set(0xfff9c4); o.material.emissiveIntensity = 0; });
    [...petals, ...stamens.children, style, stigma].forEach((p) => { p.visible = true; }); eggDot.visible = true;
  };

  // ---------- Два цвята в саксии и пчела ----------
  const pots = [1.6, 2.7].map((x, i) => {
    const p = potModel(0.22, 0.3); p.position.set(x, 0, 0.5); scene.add(p);
    const f = flowerModel(0xf06292, 0.75); f.position.y = p.userData.soilY; p.add(f);
    const head = f.children[f.children.length - 1];
    const fruit = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 10), mat(0xc62828)); fruit.position.y = 0.75; fruit.visible = false; f.add(fruit);
    const bag = new THREE.Mesh(new THREE.SphereGeometry(0.24, 14, 10), new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.35, depthWrite: false, roughness: 0.1 })); bag.scale.set(1, 1.3, 1); bag.position.y = 0.75; bag.visible = false; f.add(bag);
    const id = ['potA', 'potB'][i];
    const a = spot(p, id, [0, 0.95, 0], 0.3);
    tagOn(stage, p, ['цвят 1', 'цвят 2'][i], [0, 1.4, 0], 0.16);
    return { p, f, head, fruit, bag, a, covered: false };
  });
  const bee = new THREE.Group(); scene.add(bee);
  { const b = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), mat(0xffc107)); b.scale.set(1.5, 1, 1); bee.add(b);
    for (const x of [-0.03, 0.03]) { const s = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.012, 4, 14), mat(0x212121)); s.rotation.y = Math.PI / 2; s.position.x = x; bee.add(s); }
    for (const z of [1, -1]) { const w = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), new THREE.MeshStandardMaterial({ color: 0xe3f2fd, transparent: true, opacity: 0.7 })); w.scale.set(1, 0.15, 0.6); w.position.set(0, 0.06, z * 0.06); w.userData.z = z; bee.add(w); } }
  const B = { t: 0, run: null };

  // ---------- Безполово: картоф, ягода, хидра ----------
  const potato = new THREE.Group(); potato.position.set(-3.6, 0, 0.6); scene.add(potato);
  { const tb = new THREE.Mesh(new THREE.SphereGeometry(0.28, 14, 10), mat(0xc9a227)); tb.scale.set(1.4, 0.85, 1); tb.position.y = 0.24; potato.add(tb);
    [[0.2, 0.42, 0.1], [-0.15, 0.4, -0.05], [0.0, 0.44, 0.15]].forEach(([x, y, z], i) => { const s = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.03, 0.18 + i * 0.05, 6), mat(0xd7e8b0)); s.position.set(x, y + 0.06, z); s.rotation.z = (i - 1) * 0.4; potato.add(s); }); }
  const potatoAt = spot(potato, 'potato', [0, 0.3, 0], 0.4);
  const straw = new THREE.Group(); straw.position.set(-2.3, 0, 0.3); scene.add(straw);
  const leafy = (s) => { const g = new THREE.Group(); for (let i = 0; i < 5; i++) { const l = new THREE.Mesh(new THREE.SphereGeometry(0.12 * s, 8, 6), mat(0x388e3c)); l.scale.set(1.3, 0.25, 0.9); const a = i * 1.26; l.position.set(Math.cos(a) * 0.12 * s, 0.15 * s, Math.sin(a) * 0.12 * s); l.rotation.y = -a; l.rotation.z = 0.4; g.add(l); } return g; };
  const mother = leafy(1.4); straw.add(mother);
  { const berry = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), mat(0xe53935)); berry.scale.y = 1.3; berry.position.set(0.12, 0.08, 0.2); straw.add(berry); }
  straw.add(tube([[0.1, 0.05, 0], [0.4, 0.2, 0.1], [0.75, 0.03, 0.15]], 0.012, mat(0x8d6e63), 16));
  const daughter = leafy(0.7); daughter.position.set(0.8, 0, 0.15); straw.add(daughter);
  for (let i = 0; i < 4; i++) { const r = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.08, 3), mat(0xf5f5f5)); r.position.set(0.8 + (i - 1.5) * 0.02, -0.02, 0.15); daughter.parent.add(r); }
  const strawAt = spot(straw, 'strawberry', [0.4, 0.2, 0.1], 0.4);
  const jar = new THREE.Group(); jar.position.set(-5.0, 0, 0.2); scene.add(jar);
  { const g = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 1.0, 22, 1, true), glass(0.25)); g.position.y = 0.5; jar.add(g);
    const w = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.85, 22), new THREE.MeshStandardMaterial({ color: 0x80deea, transparent: true, opacity: 0.25, depthWrite: false })); w.position.y = 0.43; jar.add(w); }
  const hydraM = mat(0x8fd3c0);
  const hydra = (s) => { const g = new THREE.Group(); const b = new THREE.Mesh(new THREE.CylinderGeometry(0.04 * s, 0.06 * s, 0.45 * s, 8), hydraM); b.position.y = 0.22 * s; g.add(b); const ts = []; for (let i = 0; i < 6; i++) { const tn = new THREE.Group(); tn.position.y = 0.45 * s; tn.rotation.y = i * 1.05; const c = new THREE.Mesh(new THREE.CylinderGeometry(0.008 * s, 0.01 * s, 0.3 * s, 4), hydraM); c.position.y = 0.15 * s; tn.add(c); tn.rotation.z = 0.6; g.add(tn); ts.push(tn); } g.userData.ts = ts; return g; };
  const hyd = hydra(1.6); hyd.position.set(0, 0.05, 0); jar.add(hyd);
  const bud = hydra(0.6); bud.position.set(0.06, 0.35, 0); bud.rotation.z = -1.0; hyd.add(bud);
  const hydraAt = spot(jar, 'hydra', [0, 0.55, 0], 0.4);
  tagOn(stage, jar, 'хидра (увеличено)', [0, 1.25, 0], 0.16);

  // ---------- Птиче яйце и схема на полови клетки ----------
  const nest = new THREE.Group(); nest.position.set(3.9, 0, 0.9); scene.add(nest);
  { const n = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.08, 8, 20), mat(0x8d6e63)); n.rotation.x = Math.PI / 2; n.position.y = 0.08; nest.add(n); const e = eggModel(); e.scale.setScalar(1.4); nest.add(e); }
  const eggAt = spot(nest, 'birdegg', [0, 0.15, 0], 0.3);
  const cells = new THREE.Group(); cells.position.set(4.7, 0, -0.6); scene.add(cells);
  { const post = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.06, 1.2, 8), mat(0x90a4ae)); post.position.y = 0.6; cells.add(post);
    const disc = new THREE.Mesh(new THREE.CircleGeometry(0.85, 40), mat(0xe3f2fd)); disc.position.set(0, 1.9, 0.05); cells.add(disc);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.85, 0.04, 8, 40), mat(0x546e7a)); rim.position.set(0, 1.9, 0.05); cells.add(rim); }
  const eggCell = new THREE.Group(); eggCell.position.set(0.15, 1.9, 0.2); cells.add(eggCell);
  { const c = new THREE.Mesh(new THREE.SphereGeometry(0.3, 20, 14), new THREE.MeshStandardMaterial({ color: 0xffe0b2, transparent: true, opacity: 0.85 })); c.scale.z = 0.3; eggCell.add(c);
    const nu = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 8), mat(0xff8a65)); nu.position.z = 0.06; eggCell.add(nu); }
  const sperm = [];
  for (let i = 0; i < 4; i++) {
    const g = new THREE.Group(); cells.add(g);
    const h = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), mat(0x5c6bc0)); h.scale.set(1.4, 1, 0.6); g.add(h);
    const tl = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.003, 0.2, 4), mat(0x5c6bc0)); tl.rotation.z = Math.PI / 2; tl.position.x = -0.13; g.add(tl);
    g.userData = { a: i * 1.6, tl }; sperm.push(g);
  }
  const cellsAt = spot(cells, 'egg', [0, 1.9, 0.2], 0.55);
  tagOn(stage, cells, 'схема: яйцеклетка и сперматозоиди', [0, 2.95, 0], 0.15);

  // ---------- Жива сцена ----------
  stage.tick((dt, t) => {
    hyd.userData.ts.forEach((tn, i) => { tn.rotation.z = 0.6 + Math.sin(t * 1.5 + i) * 0.15; });
    bud.userData.ts.forEach((tn, i) => { tn.rotation.z = 0.6 + Math.sin(t * 1.8 + i) * 0.15; });
    sperm.forEach((g, i) => { const a = g.userData.a + t * 0.4; const r = 0.62 + Math.sin(t * 0.7 + i) * 0.05; g.position.set(0.15 + Math.cos(a) * r * 0.9, 1.9 + Math.sin(a) * r * 0.8, 0.22); g.rotation.z = a + Math.PI / 2 + Math.PI; g.userData.tl.rotation.y = Math.sin(t * 14 + i) * 0.4; });
    eggCell.rotation.z = Math.sin(t * 0.3) * 0.1;
    petals.forEach((p, i) => { p.rotation.x = Math.sin(t * 0.8 + i) * 0.03; });
    bee.children.forEach((c) => { if (c.userData.z) c.rotation.x = c.userData.z * Math.sin(t * 40) * 0.6; });
    // пчелата
    if (B.run) {
      B.run.t += dt; const k = Math.min(1, B.run.t / 5);
      const x = lerp(0.6, 3.6, k); bee.position.set(x, 1.45 + Math.abs(Math.sin(k * Math.PI * 3)) * 0.35, 0.5 + Math.sin(k * 9) * 0.1);
      bee.rotation.y = 0;
      pots.forEach((P) => {
        const near = Math.abs(bee.position.x - P.p.position.x) < 0.2;
        if (near && !P.covered) P.pollinated = true;
      });
      if (k >= 1) {
        B.run.grow = (B.run.grow || 0) + dt;
        const g = clamp01(B.run.grow / 1.5);
        pots.forEach((P) => {
          if (P.pollinated) { P.head.scale.setScalar(1 - g * 0.6); P.fruit.visible = true; P.fruit.scale.setScalar(0.3 + g * 0.9); P.head.visible = g < 0.95; }
          else { P.head.rotation.z = g * 0.9; P.head.children.forEach((c) => c.material && c.material.color && c.material.color.lerp(new THREE.Color(0x8d6e63), g * 0.05)); }
        });
        if (g >= 1) { const d = B.run.done; B.run = null; d && d(); }
      }
    } else { B.t += dt; bee.position.set(2.15 + Math.cos(B.t * 0.8) * 0.9, 1.6 + Math.sin(B.t * 2) * 0.12, 0.6 + Math.sin(B.t * 0.8) * 0.4); bee.rotation.y = -B.t * 0.8; }
    // оплождане в схемата
    if (F.phase >= 0) {
      F.t += dt;
      if (F.phase === 0) { const k = Math.min(1, F.t / 1.0); grain.visible = true; grain.position.set(lerp(0.3, 0.02, k), lerp(1.75, 2.0, k) + Math.sin(k * Math.PI) * 0.2, 0.04); if (k >= 1) { F.phase = 1; F.t = 0; pTube.visible = true; } }
      else if (F.phase === 1) { const k = Math.min(1, F.t / 1.6); pTube.scale.set(1, 1, 1); pTube.geometry.setDrawRange(0, Math.floor(k * pTube.geometry.index.count / 3) * 3); if (k >= 1) { F.phase = 2; F.t = 0; spermDot.visible = true; } }
      else if (F.phase === 2) { const k = Math.min(1, F.t / 1.0); tubeC.getPoint(k, spermDot.position); if (k >= 1) { F.phase = 3; F.t = 0; spermDot.visible = false; ovules[1].material.emissive.set(0xffeb3b); ovules[1].material.emissiveIntensity = 0.8; const d = F.done; F.done = null; F.phase = -1; d && d(); } }
      else if (F.phase === 4) { const k = Math.min(1, F.t / 2.0);
        ovary.scale.set(1 + k * 0.9, 1.15 + k * 0.9, 1 + k * 0.9); ovaryM.color.set(0x9ccc65).lerp(new THREE.Color(0xd32f2f), k); ovaryM.opacity = 0.45 + k * 0.2;
        ovules.forEach((o) => { o.material.color.set(0xfff9c4).lerp(new THREE.Color(0x6d4c41), k); o.material.emissiveIntensity = 0; });
        if (k > 0.3) { [...petals, ...stamens.children, style, stigma].forEach((p) => { p.visible = false; }); pTube.visible = false; grain.visible = false; eggDot.visible = false; }
        if (k >= 1) { F.phase = -1; const d = F.done; F.done = null; d && d(); } }
    }
  });
  const resetPots = () => { B.run = null; pots.forEach((P) => { P.covered = false; P.pollinated = false; P.bag.visible = false; P.fruit.visible = false; P.head.visible = true; P.head.scale.setScalar(1); P.head.rotation.z = 0; P.head.children.forEach((c) => c.material && c.material.color && c.material.color.set(c.geometry.type === 'SphereGeometry' && c.scale.y < 0.5 ? 0xf06292 : 0xffd54f)); }); };

  // ---------- 1. Опознай ----------
  function step1() {
    shell.step(0);
    ctx.clearTip();
    resetFlower(); resetPots();
    view(ctx, [-0.3, 1.0, 0], 5.8, { halfH: 1.6, elev: 0.25 });
    const it = (id, label, icon, n, obj, dist = 2.6) => ({ id, label, icon, note: n, obj: () => obj, dist, lift: 0, bubble: 0.35 });
    explore(ctx, {
      title: 'Разгледай',
      intro: '<p><b>Размножаването</b> е създаването на нови организми от същия вид. Благодарение на него животът на Земята продължава.</p><p><b>Разгледай всичко</b> от менюто в ъгъла.</p>',
      items: [
        it('flower', 'Цвят', '🌸', 'Цветът е орган за <b>полово</b> размножаване на цветните растения. Ярките венчелистчета привличат насекомите.', at.flower, 3),
        it('stamen', 'Тичинка', '🟡', 'В прашниците на тичинките се образува <b>прашец</b>. В прашеца има <b>мъжки полови клетки</b>.', at.stamen, 2.2),
        it('pistil', 'Плодник', '🟢', 'Плодникът има близалце, стълбче и завръз. В завръза са <b>семепъпките</b>, а в тях — <b>яйцеклетките</b> (женски полови клетки).', at.pistil, 2.2),
        it('potato', 'Картофена грудка', '🥔', 'От пъпките („очите“) на грудката израстват нови растения. Това е <b>безполово (вегетативно)</b> размножаване.', potatoAt),
        it('strawberry', 'Ягода', '🍓', 'Ягодата пуска дълги стъбла, които се вкореняват. Така се появява ново растение — също <b>безполово</b>.', strawAt),
        it('hydra', 'Хидра с пъпка', '🌊', 'Хидрата е малко водно животно. На тялото ѝ израства <b>пъпка</b>, която става нова хидра — безполово размножаване. Хидрата може да се размножава и полово.', hydraAt),
        it('birdegg', 'Птиче яйце', '🥚', 'Птиците снасят яйца. В оплодено яйце се развива зародиш, от който се излюпва малкото.', eggAt),
        it('egg', 'Полови клетки', '🔬', 'Схема (силно увеличено): голямата <b>яйцеклетка</b> е женската полова клетка, малките подвижни <b>сперматозоиди</b> — мъжките. При <b>оплождането</b> те се сливат.', cellsAt, 3),
      ],
      onNext: step2,
    });
  }

  // ---------- 2. Опрашване и оплождане ----------
  function step2() {
    shell.step(1);
    resetPots();
    view(ctx, [2.15, 1.0, 0.5], 1.5, { halfH: 1.0, elev: 0.25 });
    shell.task('<p>Двата цвята са от един вид. Пчелата лети от цвят на цвят и пренася прашец.</p>');
    let mistakes = 0;
    choice(ctx, {
      q: 'Ако покрием единия цвят с торбичка, ще образува ли той плод?',
      options: [
        { t: 'Не, защото прашецът няма да стигне до близалцето му.', ok: true, why: 'Да проверим! Кликни върху цвета, който ще покриеш.' },
        { t: 'Да, плодът се образува и без прашец.', ok: false, why: 'Какво пренася пчелата и за какво е нужно то?' },
        { t: 'Да, торбичката ще го опраши.', ok: false, why: 'Торбичката не носи прашец — тя го спира.' },
      ],
      hint: 'Плодът се образува след опрашване и оплождане.',
      onRight: (m) => { mistakes = m; cover(); },
    });
    function cover() {
      shell.setControls('');
      ctx.click = (id) => {
        const P = pots.find((x) => x.a.userData.pickId === id);
        if (!P) return;
        ctx.click = null; shell.msg('');
        P.covered = true; P.bag.visible = true;
        ctx.say(P.a, 'Покрит с торбичка', 'tag', 0.4);
        const c = shell.setControls('<div class="row"><button class="btn primary run">🐝 Пусни пчелата</button></div>');
        c.querySelector('.run').addEventListener('click', () => {
          c.querySelector('.run').disabled = true; ctx.clearTip();
          B.run = { t: 0, done: () => {
            const open = pots.find((x) => !x.covered);
            ctx.say(open.a, '✔ Опрашеният цвят прецъфтя и от завръза се образува <b>плод</b>. Покритият цвят не образува плод.', 'good wide', 0.5);
            nextBtn(ctx, 'Виж отблизо →', inside);
          } };
        });
      };
      shell.msg('Кликни върху цвета, който ще покриеш с торбичка.', '');
    }
    function inside() {
      ctx.clearTip();
      resetFlower();
      view(ctx, [FX, 1.5, 0], 0.9, { halfH: 0.75, elev: 0.15 });
      shell.task('<p>Какво става в цвета след опрашването? <b>Кликни близалцето</b> на плодника, за да попадне прашецово зрънце на него.</p>');
      shell.setControls('');
      ctx.click = (id) => {
        if (id !== 'stigma') { if (id === 'pistil' || id === 'flower') shell.msg('Близалцето е най-горната, лепкава част на плодника.', ''); return; }
        ctx.click = null; shell.msg('');
        F.phase = 0; F.t = 0;
        F.done = () => {
          ctx.say(at.ovary, 'Прашецовото зрънце образува <b>прашецова тръбичка</b>. По нея мъжката полова клетка стига до яйцеклетката в семепъпката. Те се сливат — това е <b>оплождане</b>.', 'wide', 0.6);
          const c = shell.setControls('<div class="row"><button class="btn primary fr">⏩ Мине време</button></div>');
          c.querySelector('.fr').addEventListener('click', () => {
            c.querySelector('.fr').disabled = true; ctx.clearTip();
            F.phase = 4; F.t = 0;
            F.done = () => {
              ctx.say(at.ovary, '✔ От семепъпките се образуват <b>семена</b>, а от завръза — <b>плод</b>.', 'good wide', 0.6);
              choice(ctx, {
                q: 'От коя част на цвета се образува плодът?',
                options: [
                  { t: 'От завръза на плодника.', ok: true, why: 'Вярно! А семената — от оплодените семепъпки.' },
                  { t: 'От тичинките.', ok: false, why: 'Тичинките дават прашеца. Виж какво порасна.' },
                  { t: 'От венчелистчетата.', ok: false, why: 'Венчелистчетата окапаха. Кое се уголеми?' },
                ],
                hint: 'Виж частта, която почервеня и порасна.',
                mistakes,
                onRight: (m) => { ctx.scores[0] = stepScore(m, 3); nextBtn(ctx, 'Напред →', step3); },
              });
            };
          });
        };
      };
    }
  }

  // ---------- 3. Безполово и полово ----------
  function step3() {
    shell.step(2);
    ctx.clearTip();
    ctx.click = null;
    resetFlower(); resetPots();
    view(ctx, [-0.3, 1.0, 0], 5.8, { halfH: 1.6, elev: 0.25 });
    shell.task('<p><b>Безполовото</b> размножаване е от един родител, без полови клетки. При <b>половото</b> се сливат мъжка и женска полова клетка. Кое е кое?</p>');
    const sh = (a, t) => () => ctx.say(a, t, 'tag', 0.3);
    sortTask(ctx, {
      bins: ['Безполово', 'Полово'],
      items: [
        { t: 'Нов картоф израства от грудка.', bin: 0, show: sh(potatoAt, 'грудка'), why: 'Част от растението дава ново растение.' },
        { t: 'Ягодата пуска вкореняващи се стъбла.', bin: 0, show: sh(strawAt, 'ягода'), why: 'Вегетативно размножаване.' },
        { t: 'Хидрата образува пъпка.', bin: 0, show: sh(hydraAt, 'хидра'), why: 'Пъпкуване — от един родител.' },
        { t: 'Ябълково дърво израства от семе.', bin: 1, show: sh(at.flower, 'цвят → семе'), why: 'Семето е резултат от оплождане.' },
        { t: 'Пиле се излюпва от оплодено яйце.', bin: 1, show: sh(eggAt, 'яйце'), why: 'Имало е оплождане.' },
        { t: 'Мушкато израства от отрязано клонче (резник).', bin: 0, why: 'Резниците са вегетативно размножаване.' },
      ],
      hint: 'Има ли сливане на полови клетки?',
      onDone: (m) => {
        ctx.clearTip();
        orderTask(ctx, {
          q: 'Подреди етапите на половото размножаване при цветните растения.',
          items: ['опрашване', 'прашецова тръбичка', 'оплождане', 'образуване на семе и плод', 'покълване на семето'],
          hint: 'Първо прашецът трябва да стигне до близалцето.',
          mistakes: m,
          onDone: (m2) => {
            view(ctx, [4.7, 1.8, -0.6], 1.0, { halfH: 1.0, elev: 0.1 });
            choice(ctx, {
              q: 'Какво се образува, когато сперматозоидът се слее с яйцеклетката?',
              options: [
                { t: 'Оплодена яйцеклетка (зигота), от която се развива новият организъм.', ok: true, why: 'Вярно! Новият организъм получава белези и от двамата родители.' },
                { t: 'Два нови сперматозоида.', ok: false, why: 'Клетките се сливат в една. Как се нарича тя?' },
                { t: 'Нищо — клетките се отблъскват.', ok: false, why: 'При оплождането клетките се сливат.' },
              ],
              hint: 'Оплодена ...',
              mistakes: m2,
              onRight: (m3) => { ctx.scores[1] = stepScore(m3, 3); nextBtn(ctx, 'Напред →', step4); },
            });
          },
        });
      },
    });
  }

  // ---------- 4. Сравни и предскажи ----------
  function step4() {
    shell.step(3);
    ctx.clearTip();
    view(ctx, [-2.0, 0.6, 0.4], 2.4, { halfH: 1.0, elev: 0.35 });
    shell.task('<p>Сравни двата начина на размножаване.</p>');
    sortTask(ctx, {
      bins: ['Безполово', 'Полово', 'И двете'],
      items: [
        { t: 'Участва само един родител.', bin: 0, why: 'Като при картофа и хидрата.' },
        { t: 'Образуват се полови клетки и има оплождане.', bin: 1, why: 'Яйцеклетка + сперматозоид (мъжка полова клетка).' },
        { t: 'Потомството е еднакво с родителя.', bin: 0, why: 'Новото растение от грудката е като майчиното.' },
        { t: 'Потомството е разнообразно — прилича и на двамата родители.', bin: 1, why: 'Затова братята и сестрите се различават.' },
        { t: 'Увеличава броя на организмите от вида.', bin: 2, why: 'И двата начина продължават живота на вида.' },
      ],
      hint: 'Колко родители има и има ли полови клетки?',
      onDone: (m) => {
        choice(ctx, {
          q: 'Градинар има особено сладък сорт ягоди. Как да получи нови растения, които са съвсем същите?',
          options: [
            { t: 'Чрез вкореняващите се стъбла — безполово.', ok: true, why: 'Вярно! Новите растения са копие на майчиното. Затова градинарите размножават сортовете вегетативно.' },
            { t: 'От семената.', ok: false, why: 'Растенията от семена са разнообразни — приличат и на двамата родители.' },
            { t: 'Не може — ягодите не се размножават.', ok: false, why: 'Виж ягодата на масата.' },
          ],
          hint: 'Кой начин дава потомство, еднакво с родителя?',
          mistakes: m,
          onRight: (m2) => {
            choice(ctx, {
              q: 'Рибата снася хайвер във водата, а мъжката риба отделя сперматозоиди над него. Какво е оплождането?',
              options: [
                { t: 'Външно — във водата.', ok: true, why: 'Вярно! При рибите и жабите оплождането най-често е външно, а при птиците и бозайниците — вътрешно.' },
                { t: 'Вътрешно — в тялото на женската.', ok: false, why: 'Къде се срещат половите клетки, ако хайверът вече е във водата?' },
                { t: 'Няма оплождане.', ok: false, why: 'Има две полови клетки, които се сливат. Къде?' },
              ],
              hint: 'Къде са яйцата, когато се срещат с мъжките клетки?',
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
