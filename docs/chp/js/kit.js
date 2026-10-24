// Общи инструменти за 3D сцените: сцена, етикети, балончета с текст, избор и влачене.
import * as THREE from './vendor/three.module.min.js';
import { OrbitControls } from './vendor/OrbitControls.js';
import { speakEl } from './voice.js';

export { THREE };

export function hasWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch (e) {
    return false;
  }
}

// Създава сцена в контейнера. Връща обект с всичко нужно и функция dispose().
export function createStage(container, opts = {}) {
  const {
    background = 0xeaf4ff,
    camPos = [0, 6, 10],
    target = [0, 0.8, 0],
    shadows = false,
    fog = null,
    minDistance = 3,
    maxDistance = 30,
    maxPolarAngle = Math.PI * 0.47,
  } = opts;

  container.classList.add('stage');
  const width = () => container.clientWidth || 600;
  const height = () => container.clientHeight || 400;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(width(), height());
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  if (shadows) {
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  }
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(background);
  if (fog) scene.fog = new THREE.Fog(fog.color, fog.near, fog.far);

  const camera = new THREE.PerspectiveCamera(45, width() / height(), 0.05, 200);
  camera.position.set(...camPos);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(...target);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.minDistance = minDistance;
  controls.maxDistance = maxDistance;
  controls.maxPolarAngle = maxPolarAngle;
  controls.enablePan = false;
  controls.update();

  const hemi = new THREE.HemisphereLight(0xffffff, 0x8a9a6a, 1.1);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xffffff, 1.6);
  sun.position.set(5, 10, 6);
  if (shadows) {
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    const s = sun.shadow.camera;
    s.left = -10; s.right = 10; s.top = 10; s.bottom = -10; s.near = 1; s.far = 40;
    sun.shadow.bias = -0.0005;
  }
  scene.add(sun);

  // Слой за HTML балончета над платното.
  const overlay = document.createElement('div');
  overlay.className = 'stage-overlay';
  container.appendChild(overlay);

  const tickers = new Set();
  let follow = null;
  const steadyLabels = new Set();
  const tmpL = new THREE.Vector3();
  const followPos = new THREE.Vector3();
  const followDelta = new THREE.Vector3();
  controls.addEventListener('start', () => { follow = null; });
  const bubbles = new Set();
  let tween = null;
  let running = true;
  const clock = new THREE.Clock();

  function onResize() {
    renderer.setSize(width(), height());
    camera.aspect = width() / height();
    camera.updateProjectionMatrix();
  }
  const ro = new ResizeObserver(onResize);
  ro.observe(container);

  const tmp = new THREE.Vector3();
  function placeBubbles() {
    for (const b of bubbles) {
      const p = b.anchor.isObject3D ? b.anchor.getWorldPosition(tmp) : tmp.copy(b.anchor);
      p.y += b.lift;
      p.project(camera);
      const visible = p.z < 1 && p.x > -1.2 && p.x < 1.2 && p.y > -1.2 && p.y < 1.2;
      b.el.style.display = visible ? '' : 'none';
      let x = (p.x * 0.5 + 0.5) * width();
      let y = (-p.y * 0.5 + 0.5) * height();
      // Балончето остава вътре в сцената.
      const bw = b.el.offsetWidth; const bh = b.el.offsetHeight;
      x = Math.min(Math.max(x, bw / 2 + 4), width() - bw / 2 - 4);
      y = Math.min(Math.max(y, bh + 10), height() - 4);
      b.el.style.transform = `translate(${x}px, ${y}px) translate(-50%, -100%)`;
    }
  }

  function frame() {
    if (!running) return;
    requestAnimationFrame(frame);
    const dt = Math.min(clock.getDelta(), 0.1); // на слаб компютър анимацията не забавя прекалено
    const t = clock.elapsedTime;
    if (tween) {
      tween.k = Math.min(1, tween.k + dt / tween.dur);
      const e = tween.k < 0.5 ? 2 * tween.k * tween.k : 1 - Math.pow(-2 * tween.k + 2, 2) / 2;
      camera.position.lerpVectors(tween.p0, tween.p1, e);
      controls.target.lerpVectors(tween.t0, tween.t1, e);
      if (tween.k >= 1) tween = null;
    }
    for (const fn of tickers) fn(dt, t);
    // Етикетите пазят приблизително еднакъв размер на екрана, колкото и близо да е камерата.
    for (const sp of steadyLabels) {
      sp.getWorldPosition(tmpL);
      const f = Math.min(1.4, Math.max(0.35, camera.position.distanceTo(tmpL) / sp.userData.refDist));
      sp.scale.set(sp.userData.baseScale.x * f, sp.userData.baseScale.y * f, 1);
    }
    if (follow && !tween) {
      // Камерата следва избрания обект, като пази разстоянието си до него.
      follow.obj.getWorldPosition(followPos);
      followPos.y += follow.lift;
      followDelta.copy(followPos).sub(controls.target).multiplyScalar(Math.min(1, dt * 4));
      controls.target.add(followDelta);
      camera.position.add(followDelta);
    }
    controls.update();
    renderer.render(scene, camera);
    placeBubbles();
  }
  requestAnimationFrame(frame);

  // Избор с клик/докосване. Връща корена (обекта с userData.pickId) или null.
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  function setNdc(ev) {
    const r = renderer.domElement.getBoundingClientRect();
    ndc.x = ((ev.clientX - r.left) / r.width) * 2 - 1;
    ndc.y = -((ev.clientY - r.top) / r.height) * 2 + 1;
    ray.setFromCamera(ndc, camera);
  }
  function hiddenUp(obj) {
    for (let o = obj; o; o = o.parent) if (o.visible === false) return true;
    return false;
  }
  function rootOf(obj, key) {
    while (obj) {
      if (obj.userData && obj.userData[key] !== undefined) return obj;
      obj = obj.parent;
    }
    return null;
  }
  function pickAt(ev, key = 'pickId', candidates = scene.children) {
    setNdc(ev);
    const hits = ray.intersectObjects(candidates, true);
    for (const h of hits) {
      if (hiddenUp(h.object)) continue;
      const r = rootOf(h.object, key);
      if (r && r.visible !== false) return { root: r, point: h.point };
    }
    return null;
  }

  // Различава клик от завъртане на камерата.
  function onClick(handler, key = 'pickId') {
    let down = null;
    const pd = (ev) => { down = { x: ev.clientX, y: ev.clientY }; };
    const pu = (ev) => {
      if (!down) return;
      const moved = Math.hypot(ev.clientX - down.x, ev.clientY - down.y);
      down = null;
      if (moved > 6) return;
      handler(pickAt(ev, key), ev);
    };
    renderer.domElement.addEventListener('pointerdown', pd);
    renderer.domElement.addEventListener('pointerup', pu);
    return () => {
      renderer.domElement.removeEventListener('pointerdown', pd);
      renderer.domElement.removeEventListener('pointerup', pu);
    };
  }

  // Посочване (hover) за мишка.
  function onHover(handler, key = 'pickId') {
    let last = null;
    const pm = (ev) => {
      if (ev.pointerType && ev.pointerType !== 'mouse') return;
      const hit = pickAt(ev, key);
      const r = hit ? hit.root : null;
      renderer.domElement.style.cursor = r ? 'pointer' : '';
      if (r !== last) { last = r; handler(r); }
    };
    renderer.domElement.addEventListener('pointermove', pm);
    return () => renderer.domElement.removeEventListener('pointermove', pm);
  }

  // Влачене на обекти по хоризонтална равнина (y = planeY).
  function enableDrag({ key = 'dragId', planeY = 0, onStart, onMove, onDrop, lift = 0.4 } = {}) {
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -planeY);
    const hitPoint = new THREE.Vector3();
    const offset = new THREE.Vector3();
    let drag = null;
    const el = renderer.domElement;
    const pd = (ev) => {
      const hit = pickAt(ev, key);
      if (!hit || hit.root.userData.locked) return;
      setNdc(ev);
      if (!ray.ray.intersectPlane(plane, hitPoint)) return;
      drag = { obj: hit.root, startPos: hit.root.position.clone(), baseY: hit.root.position.y };
      // Обектът следва точката под пръста (позицията е спрямо родителя му).
      offset.set(0, 0, 0);
      if (hit.root.parent) offset.setFromMatrixPosition(hit.root.parent.matrixWorld).negate();
      controls.enabled = false;
      el.setPointerCapture(ev.pointerId);
      onStart && onStart(drag.obj);
    };
    const pm = (ev) => {
      if (!drag) return;
      setNdc(ev);
      if (!ray.ray.intersectPlane(plane, hitPoint)) return;
      drag.obj.position.set(hitPoint.x + offset.x, drag.baseY + lift, hitPoint.z + offset.z);
      onMove && onMove(drag.obj, drag.obj.position);
    };
    const pu = (ev) => {
      if (!drag) return;
      const d = drag;
      drag = null;
      controls.enabled = true;
      try { el.releasePointerCapture(ev.pointerId); } catch (e) { /* няма значение */ }
      d.obj.position.y = d.baseY;
      onDrop && onDrop(d.obj, d.obj.position, d.startPos);
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
    };
  }

  // HTML балонче, закачено за 3D точка или обект.
  function bubble(anchor, html, { lift = 1.2, cls = '' } = {}) {
    const el = document.createElement('div');
    el.className = 'bubble ' + cls;
    el.innerHTML = html;
    overlay.appendChild(el);
    const b = { el, anchor, lift };
    bubbles.add(b);
    placeBubbles();
    // На глас се четат обясненията; етикетите и уредите („tag“) и кратките надписи – не.
    const talk = !/\btag\b|-mag\b/.test(cls);
    const sayIt = () => { if (talk && el.textContent.trim().split(/\s+/).length >= 4) speakEl(el); };
    let lastSet = 0;
    sayIt();
    return {
      el,
      set(htmlNew) {
        if (el.innerHTML === htmlNew) return;
        el.innerHTML = htmlNew;
        // Показания, които се сменят често, не се четат.
        const now = performance.now();
        if (now - lastSet > 1500) sayIt();
        lastSet = now;
      },
      remove() { bubbles.delete(b); el.remove(); },
    };
  }

  function clearBubbles() {
    for (const b of bubbles) b.el.remove();
    bubbles.clear();
  }

  function flyTo(pos, tgt, dur = 1.0) {
    tween = {
      k: 0, dur,
      p0: camera.position.clone(), p1: new THREE.Vector3(...pos),
      t0: controls.target.clone(), t1: new THREE.Vector3(...tgt),
    };
  }

  // Приближава камерата към обект, гледайки от сегашната посока, и после го следва.
  function focusOn(obj, { dist = 4, height = 1.6, lift = 0.5, dur = 0.9, keepFollow = true } = {}) {
    const p = obj.getWorldPosition(new THREE.Vector3());
    const dir = camera.position.clone().sub(controls.target).setY(0);
    if (dir.lengthSq() < 1e-4) dir.set(0, 0, 1);
    dir.normalize().multiplyScalar(dist);
    const tgt = p.clone(); tgt.y += lift;
    const pos = p.clone().add(dir); pos.y += height + lift;
    flyTo(pos.toArray(), tgt.toArray(), dur);
    follow = keepFollow ? { obj, lift } : null;
  }
  function stopFollow() { follow = null; }
  // refDist: разстоянието, при което етикетът е с нормалния си размер.
  function steadyLabel(sprite, refDist = 12) {
    sprite.userData.baseScale = sprite.scale.clone();
    sprite.userData.refDist = refDist;
    steadyLabels.add(sprite);
  }

  function dispose() {
    running = false;
    ro.disconnect();
    clearBubbles();
    controls.dispose();
    scene.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
      if (o.material) {
        const ms = Array.isArray(o.material) ? o.material : [o.material];
        for (const m of ms) {
          if (m.map) m.map.dispose();
          m.dispose();
        }
      }
    });
    renderer.dispose();
    renderer.domElement.remove();
    overlay.remove();
  }

  // Екранни координати на обект по pickId — за автоматичните тестове.
  function screenOf(id, key = 'pickId') {
    let found = null;
    scene.traverse((o) => {
      if (!found && o.userData && o.userData[key] === id) {
        for (let p = o; p; p = p.parent) if (p.visible === false) return;
        found = o;
      }
    });
    if (!found) return null;
    const v = found.getWorldPosition(new THREE.Vector3());
    const box = new THREE.Box3().setFromObject(found);
    if (!box.isEmpty()) box.getCenter(v);
    v.project(camera);
    const r = renderer.domElement.getBoundingClientRect();
    return { x: r.left + (v.x * 0.5 + 0.5) * r.width, y: r.top + (-v.y * 0.5 + 0.5) * r.height };
  }
  const api = {
    THREE, scene, camera, renderer, controls, overlay, sun, hemi, screenOf,
    tick(fn) { tickers.add(fn); return () => tickers.delete(fn); },
    pickAt, onClick, onHover, enableDrag, bubble, clearBubbles, flyTo, focusOn, stopFollow, steadyLabel, dispose,
  };
  container.__stage = api;
  return api;
}

// Малко меню в ъгъла на сцената: списък с обекти, от който детето избира.
// items: [{ id, label, icon }]; onSelect(id). Връща { setActive, mark, setItems, show, remove }.
export function cornerMenu(stage, { title = 'Избери', items = [], onSelect, corner = 'left' } = {}) {
  const host = stage.renderer.domElement.parentElement;
  const el = document.createElement('div');
  el.className = 'corner-menu ' + corner;
  host.appendChild(el);
  let open = true;
  let active = null;
  const marked = new Set();
  function draw() {
    el.innerHTML = `<button class="cm-head" aria-expanded="${open}">${esc(title)} <span>${open ? '▾' : '▸'}</span></button>
      <div class="cm-list" ${open ? '' : 'hidden'}>${items.map((it) => `<button class="cm-item ${it.id === active ? 'on' : ''}" data-id="${esc(it.id)}">
        <span class="cm-ico">${esc(it.icon || '•')}</span><span class="cm-lbl">${esc(it.label)}</span>${marked.has(it.id) ? '<span class="cm-ok">✓</span>' : ''}</button>`).join('')}</div>`;
    el.querySelector('.cm-head').addEventListener('click', () => { open = !open; draw(); });
    el.querySelectorAll('.cm-item').forEach((b) => b.addEventListener('click', () => {
      active = b.dataset.id;
      // На тесен екран менюто се свива след избор, за да не закрива сцената.
      if ((host.clientWidth || 600) < 480) open = false;
      draw();
      onSelect && onSelect(active);
    }));
  }
  // По-тесен екран: менюто започва свито.
  if ((host.clientWidth || 600) < 480) open = false;
  draw();
  ['pointerdown', 'wheel', 'touchstart'].forEach((ev) => el.addEventListener(ev, (e) => e.stopPropagation(), { passive: true }));
  return {
    el,
    setActive(id) { active = id; draw(); },
    mark(id) { marked.add(id); draw(); },
    setItems(next) { items = next; marked.clear(); active = null; draw(); },
    setTitle(t) { title = t; draw(); },
    show(on) { el.hidden = !on; },
    remove() { el.remove(); },
  };
}

// Етикет-спрайт с текст, който винаги гледа към камерата.
export function labelSprite(text, { size = 0.32, color = '#1b2a3a', bg = 'rgba(255,255,255,0.92)', border = '#c7d3e0' } = {}) {
  const pad = 18;
  const font = '600 44px system-ui, "Segoe UI", Roboto, Arial, sans-serif';
  const c = document.createElement('canvas');
  const ctx = c.getContext('2d');
  ctx.font = font;
  const w = Math.ceil(ctx.measureText(text).width) + pad * 2;
  const h = 64;
  c.width = w; c.height = h;
  ctx.font = font;
  ctx.fillStyle = bg;
  roundRect(ctx, 2, 2, w - 4, h - 4, 18);
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = border;
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.textBaseline = 'middle';
  ctx.fillText(text, pad, h / 2 + 2);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  const mat = new THREE.SpriteMaterial({ map: tex, depthTest: false, transparent: true });
  const s = new THREE.Sprite(mat);
  s.scale.set(size * (w / h), size, 1);
  s.renderOrder = 10;
  return s;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// Материал с плоско оцветяване (нисък полигон, стилизирано).
export function mat(color, extra = {}) {
  const { flat, ...rest } = extra;
  return new THREE.MeshStandardMaterial({ color, roughness: 0.75, metalness: 0.0, flatShading: !!flat, ...rest });
}

// Пръстен-зона на земята, в която се пускат обекти при сортиране.
export function zoneRing(color, radius = 1.4) {
  const g = new THREE.Group();
  const disc = new THREE.Mesh(
    new THREE.CircleGeometry(radius, 48),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.18, depthWrite: false })
  );
  disc.rotation.x = -Math.PI / 2;
  disc.position.y = 0.02;
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(radius - 0.08, radius, 64),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.85, depthWrite: false })
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.025;
  g.add(disc, ring);
  g.userData.radius = radius;
  g.userData.disc = disc;
  return g;
}

// Невидима кутия около обекта (с етикета), за по-лесно кликане и влачене с пръст.
export function addHitBox(group, minSize = 0.8) {
  group.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(group.matrixWorld).invert();
  const box = new THREE.Box3();
  group.traverse((o) => {
    if (!o.isMesh && !o.isSprite) return;
    const b = new THREE.Box3().setFromObject(o);
    if (!b.isEmpty()) box.union(b.applyMatrix4(inv));
  });
  if (box.isEmpty()) return null;
  const size = box.getSize(new THREE.Vector3());
  const c = box.getCenter(new THREE.Vector3());
  minSize /= Math.max(group.scale.x, 1e-6); // кутията е в локалните мерки на групата
  const hit = new THREE.Mesh(
    new THREE.BoxGeometry(Math.max(size.x, minSize), Math.max(size.y, minSize), Math.max(size.z, minSize)),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  hit.position.copy(c);
  hit.userData.isHitBox = true;
  group.add(hit);
  return hit;
}

export function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
}
