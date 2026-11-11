// Обща „сглобка“ за по-реалистичните сцени с два режима — „Отгоре“ и „Разходка“:
// светлини и сенки, превключвател, разходка с малка карта, знаци над местата, светване при посочване,
// щракане, полет до място или ходене дотам, и самооблекчаване на бавен компютър.
// Светът (build) връща: { places: Map, obstacles, terrain, heightAt, canStand, route(from, to), tick(dt, t), paintMap, mapBounds }.
// Всяко място има: { id, group, mats, x, y, z, top, site: { stand: [x, z], pitch, top: [цел, отместване], off } }.
import { createStage, THREE } from '../../kit.js';
import { createWalk, createMiniMap } from './walk.js';

function diamond(fill, text) {
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const g = c.getContext('2d');
  g.save(); g.translate(32, 32); g.rotate(Math.PI / 4); g.fillStyle = fill; g.strokeStyle = '#fff'; g.lineWidth = 6; g.beginPath(); g.rect(-15, -15, 30, 30); g.stroke(); g.fill(); g.restore();
  if (text) { g.fillStyle = '#fff'; g.font = '900 30px system-ui, Arial, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, 32, 34); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function createRig(shell, { home, build, start, shadow = { x: 0, z: 0, half: 120 }, limits = { min: 20, max: 300 }, markRef = 90, markSize = 3.4 }) {
  const aspect = (shell.stageEl.clientWidth || 600) / (shell.stageEl.clientHeight || 400);
  const far = aspect < 1.4 ? 1.35 / Math.max(aspect, 0.5) : 1;
  const weak = (navigator.hardwareConcurrency || 4) <= 2;
  const stage = createStage(shell.stageEl, {
    background: 0xdfe9ee, camPos: [home[0][0] - home[1][2] * 0.5, home[0][1] + home[1][1] * 1.9 * far, home[0][2] + home[1][2] * 1.7 * far], target: home[0],
    minDistance: 0.5, maxDistance: limits.max, shadows: !weak, fog: { color: 0xdfe9ee, near: 320, far: 1500 },
  });
  const { scene, camera, controls, renderer } = stage;
  renderer.setPixelRatio(weak ? 1 : Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.95;
  camera.near = 0.3; camera.far = 3200; camera.updateProjectionMatrix();
  const POLAR = Math.PI * 0.47;
  const setTopLimits = () => { controls.minDistance = limits.min; controls.maxDistance = limits.max; controls.maxPolarAngle = POLAR; };
  stage.hemi.color.setHex(0xcfe2ff); stage.hemi.groundColor.setHex(0x9a8f70); stage.hemi.intensity = 1.25;
  stage.sun.color.setHex(0xfff0d8); stage.sun.intensity = 3.3;
  scene.add(stage.sun.target);
  const sunDir = new THREE.Vector3(0.45, 0.72, 0.52).normalize();
  // Сянката покрива цялата сцена отгоре, а при разходка — само околността, за да е остра.
  function fitShadow(cx, cz, half) {
    stage.sun.target.position.set(cx, 8, cz);
    stage.sun.position.copy(stage.sun.target.position).addScaledVector(sunDir, 320);
    if (weak) return;
    const sc = stage.sun.shadow.camera;
    sc.left = -half; sc.right = half; sc.top = half; sc.bottom = -half; sc.near = 20; sc.far = 700;
    sc.updateProjectionMatrix();
  }
  if (!weak) { stage.sun.shadow.mapSize.set(2048, 2048); stage.sun.shadow.bias = -0.0004; stage.sun.shadow.normalBias = 0.25; }
  fitShadow(shadow.x, shadow.z, shadow.half);

  const world = build(stage, { weak });
  const places = world.places;
  const walk = createWalk(stage, { ground: world.heightAt, canStand: world.canStand, obstacles: world.obstacles, terrain: [world.terrain], start });
  const map = createMiniMap(stage, { bounds: world.mapBounds, paint: world.paintMap });

  // Знак над местата за разглеждане: жълт; сив с „!“ за местата извън програмата на МОН.
  const markTex = diamond('#f6b827'), markOff = diamond('#7a8aa0', '!');
  for (const p of places.values()) {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: p.site.off ? markOff : markTex, depthTest: false, transparent: true }));
    sp.position.set(p.x, p.y + p.top + 1.6, p.z); sp.scale.setScalar(markSize); sp.renderOrder = 9; sp.raycast = () => {};
    scene.add(sp); stage.steadyLabel(sp, markRef);
    p.marker = sp; p.wanted = false; p.done = false;
  }

  const toggle = document.createElement('div');
  toggle.className = 'mode-toggle';
  toggle.innerHTML = '<button data-m="top" class="on">🦅 Отгоре</button><button data-m="walk">🚶 Разходка</button>';
  shell.stageEl.appendChild(toggle);
  ['pointerdown', 'touchstart'].forEach((n) => toggle.addEventListener(n, (e) => e.stopPropagation(), { passive: true }));
  let mode = 'top', modeTimer = null, fovTo = 45, menu = null;
  const look = (tgt, off, dur = 1.2) => stage.flyTo([tgt[0] + off[0] * far, tgt[1] + off[1] * far, tgt[2] + off[2] * far], tgt, dur);
  function setMode(m) {
    if (m === mode) return;
    mode = m;
    clearTimeout(modeTimer);
    toggle.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.dataset.m === m));
    map.show(m === 'walk');
    fovTo = m === 'walk' ? 66 : 45; // при разходка се гледа по-широко, както с очи
    if (menu) { const open = !menu.el.querySelector('.cm-list').hidden; if (open === (m === 'walk')) menu.el.querySelector('.cm-head').click(); }
    if (m === 'walk') {
      controls.minDistance = 0.5; controls.maxPolarAngle = Math.PI;
      const s = walk.state, y = world.heightAt(s.x, s.z) + 1.65;
      stage.flyTo([s.x, y, s.z], [s.x + Math.sin(s.yaw), y - 0.05, s.z - Math.cos(s.yaw)], 1.5);
      modeTimer = setTimeout(() => walk.enable(), 1550);
    } else {
      walk.disable();
      controls.minDistance = 0.5; controls.maxPolarAngle = POLAR;
      look(home[0], home[1], 1.5);
      modeTimer = setTimeout(setTopLimits, 1600);
      fitShadow(shadow.x, shadow.z, shadow.half);
    }
  }
  toggle.addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) setMode(b.dataset.m); });

  let hovered = null, selected = null, clickHandler = null;
  stage.tick((dt, t) => {
    world.tick(dt, t);
    if (Math.abs(camera.fov - fovTo) > 0.05) { camera.fov += (fovTo - camera.fov) * Math.min(1, dt * 3); camera.updateProjectionMatrix(); }
    if (walk.active) { const s = walk.state; fitShadow(Math.round(s.x / 4) * 4, Math.round(s.z / 4) * 4, 55); map.draw(s, [...places.values()].filter((p) => p.wanted || p.done).map((p) => ({ x: p.x, z: p.z, done: p.done }))); }
    for (const p of places.values()) {
      const want = p.id === hovered || p.id === selected ? 1 : p.wanted ? 0.3 + 0.3 * Math.sin(t * 2.4) : 0;
      p.glow += (want - p.glow) * Math.min(1, dt * 8);
      p.marker.visible = p.wanted && p.group.visible;
      p.marker.position.y = p.y + p.top + 1.6 + Math.sin(t * 2 + p.x) * 0.25;
    }
  });
  stage.onHover((r) => { hovered = r && clickHandler ? r.userData.pickId : null; if (!clickHandler) renderer.domElement.style.cursor = ''; });
  stage.onClick((hit, ev) => {
    if (hit && clickHandler) {
      const p = places.get(hit.root.userData.pickId);
      // При разходка щракването върху пода значи „отиди там“.
      if (walk.active && hit.point.y < p.y + 0.45 && world.canStand(hit.point.x, hit.point.z)) { walk.walkTo(hit.point.x, hit.point.z); return; }
      clickHandler(p.id);
    } else if (walk.active) walk.walkToEvent(ev);
  });

  let tip = null;
  // Самооблекчаване: ако кадрите са бавни, първо без сенки и релеф, после с по-малко точки. (?q=high го изключва.)
  let tier = new URLSearchParams(location.search).get('q') === 'high' ? -1 : 0, frames = 0, slow = 0, tLast = 0;
  stage.tick(() => {
    if (tier < 0 || tier > 1) return;
    const now = performance.now(), ms = now - tLast; tLast = now;
    if (++frames < 25) return;
    if (ms > 45) slow++;
    if (frames < 60) return;
    if (slow > 21) {
      if (tier === 0) { stage.sun.castShadow = false; scene.traverse((o) => { if (o.material && o.material.bumpMap) { o.material.bumpMap = null; o.material.needsUpdate = true; } }); renderer.setPixelRatio(1); }
      else renderer.setPixelRatio(0.6);
      renderer.setSize(shell.stageEl.clientWidth, shell.stageEl.clientHeight);
      tier++;
    } else tier = 9;
    frames = 20; slow = 0;
  });

  look(home[0], home[1], 2.6); // начален полет
  const firstLimits = setTimeout(setTopLimits, 2700);
  const rig = {
    stage, world, places, walk, map, far, weak, look, setMode, home,
    get mode() { return mode; },
    set menu(m) { menu = m; },
    setClick(fn) { clickHandler = fn; if (!fn) hovered = null; },
    select(id) { selected = id; },
    allowWalk(on) { toggle.hidden = !on; if (!on) setMode('top'); },
    // Показва място: отгоре — полет на камерата; при разходка — ходене дотам.
    showPlace(id) {
      const p = places.get(id), s = p.site;
      selected = id;
      if (mode === 'walk') { clearTimeout(modeTimer); walk.enable(); walk.follow(world.route([walk.state.x, walk.state.z], s.stand), p.x, p.z, s.pitch ?? -0.1); }
      else look(s.top[0], s.top[1]);
      return p;
    },
    say(anchor, html, opts = {}) { if (tip) tip.remove(); tip = stage.bubble(anchor, html, opts); return tip; },
    clearTip() { if (tip) { tip.remove(); tip = null; } },
    dispose() { clearTimeout(modeTimer); clearTimeout(firstLimits); toggle.remove(); map.remove(); walk.dispose(); stage.dispose(); },
  };
  return rig;
}
