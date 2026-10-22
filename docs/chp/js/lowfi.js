// Опростена 3D сцена за уменията, които още са „В разработка“:
// прости тела с етикети; клик показва кратък текст до обекта.
import { createStage, labelSprite, mat, addHitBox, THREE, esc } from './kit.js';

function geometryFor(shape) {
  switch (shape) {
    case 'sphere': return new THREE.SphereGeometry(0.6, 32, 20);
    case 'cylinder': return new THREE.CylinderGeometry(0.5, 0.5, 1.1, 32);
    case 'cone': return new THREE.ConeGeometry(0.6, 1.2, 32);
    case 'torus': return new THREE.TorusGeometry(0.5, 0.18, 16, 48);
    case 'capsule': return new THREE.CapsuleGeometry(0.35, 0.7, 8, 16);
    case 'ring': return new THREE.TorusGeometry(0.6, 0.06, 12, 64);
    case 'plane': return new THREE.BoxGeometry(1.4, 0.06, 1);
    case 'box':
    default: return new THREE.BoxGeometry(1, 1, 1);
  }
}

export function mountLowfi(container, objects = [], { onPick } = {}) {
  const stage = createStage(container, { camPos: [0, 3.6, 8], target: [0, 0.9, 0] });
  const { scene } = stage;

  const ground = new THREE.Mesh(
    new THREE.CylinderGeometry(5, 5.2, 0.3, 64),
    mat(0xcfdcc6)
  );
  ground.position.y = -0.15;
  scene.add(ground);

  const roots = new Map();
  const n = objects.length;
  objects.forEach((o, i) => {
    const g = new THREE.Group();
    const mesh = new THREE.Mesh(geometryFor(o.shape), mat(o.color || '#88aacc'));
    // scale е число или [x, y, z]
    if (Array.isArray(o.scale) && o.scale.length === 3) mesh.scale.set(...o.scale.map((v) => +v || 1));
    else mesh.scale.setScalar(+o.scale || 1);
    if (o.shape === 'torus' || o.shape === 'ring') mesh.rotation.x = Math.PI / 2.4;
    g.add(mesh);
    const box = new THREE.Box3().setFromObject(mesh);
    const top = box.max.y;
    const label = labelSprite(o.label || o.id, { size: 0.3 });
    label.position.y = top + 0.35;
    g.add(label);
    // Позиция: от данните или по кръг.
    const a = (i / Math.max(1, n)) * Math.PI * 2;
    const pos = o.pos || [Math.cos(a) * 3, 0, Math.sin(a) * 3];
    g.position.set(pos[0], Math.max(0, pos[1] || 0) + (-box.min.y), pos[2]);
    g.userData.pickId = o.id;
    g.userData.baseY = g.position.y;
    g.userData.phase = i * 0.9;
    g.userData.top = top + 0.6;
    addHitBox(g, 0.7);
    scene.add(g);
    roots.set(o.id, g);
  });

  stage.tick((dt, t) => {
    for (const g of roots.values()) {
      g.position.y = g.userData.baseY + Math.sin(t * 1.4 + g.userData.phase) * 0.05;
      g.children[0].rotation.y += dt * 0.25;
    }
  });

  let open = null;
  function show(id) {
    if (open) { open.remove(); open = null; }
    const o = objects.find((x) => x.id === id);
    const g = roots.get(id);
    if (!o || !g || !o.note) return;
    open = stage.bubble(g, `<b>${esc(o.label)}</b><br>${esc(o.note)}`, { lift: g.userData.top });
  }

  stage.onHover((r) => {
    for (const g of roots.values()) g.children[0].material.emissive?.setHex(g === r ? 0x333333 : 0x000000);
  });

  let pickMode = false;
  stage.onClick((hit) => {
    if (!hit) { if (open) { open.remove(); open = null; } return; }
    const id = hit.root.userData.pickId;
    if (pickMode && onPick) { onPick(id); return; }
    show(id);
  });

  container.__find = (id) => roots.get(id);
  return {
    stage,
    show,
    setPickMode(on) {
      pickMode = on;
      if (open) { open.remove(); open = null; }
    },
    flash(id, ok) {
      const g = roots.get(id);
      if (!g) return;
      const m = g.children[0].material;
      const old = m.color.getHex();
      m.color.setHex(ok ? 0x2fb36b : 0xe0443e);
      setTimeout(() => m.color.setHex(old), 900);
    },
    dispose() { stage.dispose(); },
  };
}
