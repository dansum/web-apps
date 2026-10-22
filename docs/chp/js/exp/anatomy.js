// Общи помощни функции за анатомичните преживявания (body.js, breathing.js).
import { THREE } from '../kit.js';

// Стилове на модула — добавят се само веднъж.
export function injectStyle(id, css) {
  if (document.getElementById(id)) return;
  const s = document.createElement('style');
  s.id = id;
  s.textContent = css;
  document.head.appendChild(s);
}

// Материал за орган (всеки орган получава свой, за да може да свети отделно).
export function organMat(color, extra = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.5, metalness: 0, emissive: 0x000000, ...extra });
}

// Прозрачна „кожа“.
export function glassMat(color, opacity = 0.3, extra = {}) {
  return new THREE.MeshStandardMaterial({
    color, transparent: true, opacity, depthWrite: false, roughness: 0.35, metalness: 0, ...extra,
  });
}

export function curveOf(points, closed = false) {
  return new THREE.CatmullRomCurve3(points.map((p) => (p.isVector3 ? p : new THREE.Vector3(...p))), closed, 'catmullrom', 0.5);
}

export function tube(curveOrPoints, radius, material, segs = 48, radial = 8) {
  const curve = typeof curveOrPoints.getPoint === 'function' ? curveOrPoints : curveOf(curveOrPoints);
  const m = new THREE.Mesh(new THREE.TubeGeometry(curve, segs, radius, radial, false), material);
  m.userData.curve = curve;
  return m;
}

// Невидима дебела тръба за по-лесно кликане по тънки обекти.
export function hitTube(curve, radius = 0.1) {
  const m = new THREE.Mesh(new THREE.TubeGeometry(curve, 24, radius, 6, false), new THREE.MeshBasicMaterial({ visible: false }));
  m.userData.isHitBox = true;
  return m;
}

// Светене на орган: k = 0 изключва.
export function glowOf(group) {
  const ms = [];
  group.traverse((o) => {
    if (o.isMesh && !o.userData.isHitBox && o.material && o.material.emissive && !ms.includes(o.material)) ms.push(o.material);
  });
  return {
    mats: ms,
    set(k, color) {
      for (const m of ms) {
        if (color !== undefined) m.emissive.set(color); else m.emissive.copy(m.color);
        m.emissiveIntensity = k;
      }
    },
  };
}

// Точки, които текат по крива (кръв, въздух). update(dt, rate) ги придвижва.
export function flowDots(curve, { n = 8, r = 0.03, color = 0xff0000, speed = 0.2, reverse = false } = {}) {
  const geo = new THREE.SphereGeometry(r, 8, 6);
  const m = new THREE.MeshBasicMaterial({ color });
  const im = new THREE.InstancedMesh(geo, m, n);
  im.frustumCulled = false;
  const offs = Array.from({ length: n }, (_, i) => (i + Math.random() * 0.6) / n);
  const dummy = new THREE.Object3D();
  const p = new THREE.Vector3();
  const len = curve.getLength();
  im.userData.update = (dt, rate = 1) => {
    for (let i = 0; i < n; i++) {
      offs[i] = (offs[i] + (dt * speed * rate) / Math.max(len, 0.2) + 1) % 1;
      curve.getPointAt(reverse ? 1 - offs[i] : offs[i], p);
      dummy.position.copy(p);
      dummy.updateMatrix();
      im.setMatrixAt(i, dummy.matrix);
    }
    im.instanceMatrix.needsUpdate = true;
  };
  im.userData.update(0);
  return im;
}

// Влачене по вертикална равнина z = planeZ (в световни координати).
// onDrop(obj, localPos, startLocalPos). Връща функция за спиране.
export function verticalDrag(stage, { key = 'dragId', planeZ = 0, onStart, onMove, onDrop } = {}) {
  const el = stage.renderer.domElement;
  const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), -planeZ);
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const hitPoint = new THREE.Vector3();
  const grab = new THREE.Vector3();
  let drag = null;
  const setRay = (ev) => {
    const r = el.getBoundingClientRect();
    ndc.set(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, stage.camera);
    return ray.ray.intersectPlane(plane, hitPoint);
  };
  const pd = (ev) => {
    const hit = stage.pickAt(ev, key);
    if (!hit || hit.root.userData.locked) return;
    if (!setRay(ev)) return;
    const obj = hit.root;
    const wp = obj.getWorldPosition(new THREE.Vector3());
    grab.copy(wp).sub(hitPoint);
    grab.z = 0;
    drag = { obj, start: obj.position.clone() };
    stage.controls.enabled = false;
    try { el.setPointerCapture(ev.pointerId); } catch (e) { /* няма значение */ }
    onStart && onStart(obj);
  };
  const pm = (ev) => {
    if (!drag) return;
    if (!setRay(ev)) return;
    const w = hitPoint.clone().add(grab);
    const parent = drag.obj.parent;
    const local = parent ? parent.worldToLocal(w) : w;
    drag.obj.position.set(local.x, local.y, drag.obj.position.z);
    onMove && onMove(drag.obj, drag.obj.position);
  };
  const pu = (ev) => {
    if (!drag) return;
    const d = drag;
    drag = null;
    stage.controls.enabled = true;
    try { el.releasePointerCapture(ev.pointerId); } catch (e) { /* няма значение */ }
    onDrop && onDrop(d.obj, d.obj.position, d.start);
  };
  el.addEventListener('pointerdown', pd);
  el.addEventListener('pointermove', pm);
  el.addEventListener('pointerup', pu);
  el.addEventListener('pointercancel', pu);
  return () => {
    el.removeEventListener('pointerdown', pd);
    el.removeEventListener('pointermove', pm);
    el.removeEventListener('pointerup', pu);
    el.removeEventListener('pointercancel', pu);
    if (drag) { stage.controls.enabled = true; drag = null; }
  };
}

// Плавно преместване на обекти (в локалните им координати).
export function mover(stage) {
  const moving = new Map();
  stage.tick((dt) => {
    for (const [o, mv] of moving) {
      mv.k = Math.min(1, mv.k + dt / mv.dur);
      const e = mv.k < 0.5 ? 2 * mv.k * mv.k : 1 - Math.pow(-2 * mv.k + 2, 2) / 2;
      o.position.lerpVectors(mv.from, mv.to, e);
      if (mv.arc) o.position.y += Math.sin(e * Math.PI) * mv.arc;
      if (mv.k >= 1) { moving.delete(o); o.position.copy(mv.to); mv.done && mv.done(); }
    }
  });
  return {
    move(o, to, dur = 0.6, { arc = 0, done } = {}) {
      moving.set(o, { from: o.position.clone(), to: to.clone(), k: 0, dur, arc, done });
    },
    busy(o) { return moving.has(o); },
    clear() { moving.clear(); },
  };
}

// Бутони-избор в панела. Връща HTML; wireChoices закача обработчиците.
export function choicesHTML(name, opts) {
  return `<div class="choices" data-q="${name}">${opts.map((o) => `<button class="choice" data-v="${o.v}">${o.t}</button>`).join('')}</div>`;
}
