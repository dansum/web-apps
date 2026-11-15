// Версия за Google Cardboard: две картини (за двете очи), погледът следва главата,
// управлението е само с поглед и с бутона на очилата (той докосва екрана).
//  • Задръж погледа върху знак на място (или натисни бутона) → отиваш дотам пеша и се показва табло с обяснение.
//  • Погледни земята и натисни бутона → отиваш там.
//  • Табло с въпроси (напр. към царя): задръж погледа върху въпрос → отговорът.
// Светът е същият като в обикновеното преживяване (build), но без сенки и релеф, за да върви на телефон.
import { THREE } from '../../kit.js';

const EYE = 1.65, DWELL = 1.5, SPEED = 6.5;

// Текст върху canvas с пренасяне на редовете. Връща { texture, w, h } в метри при ширина width.
function textPanel(lines, { width = 2.6, pad = 34, bg = 'rgba(255,255,255,0.96)', border = '#0A2A66' } = {}) {
  const W = 1024, c = document.createElement('canvas'), g = c.getContext('2d');
  const font = (px, weight = 600) => `${weight} ${px}px system-ui, "Segoe UI", Roboto, Arial, sans-serif`;
  const rows = [];
  for (const ln of lines) {
    const px = ln.size || 46;
    g.font = font(px, ln.bold ? 800 : 500);
    let cur = '';
    for (const word of String(ln.text).split(/\s+/)) {
      const t = cur ? cur + ' ' + word : word;
      if (g.measureText(t).width > W - pad * 2 && cur) { rows.push({ ...ln, text: cur, px }); cur = word; } else cur = t;
    }
    rows.push({ ...ln, text: cur, px });
    rows[rows.length - 1].gap = ln.gap ?? 14;
  }
  const H = pad * 2 + rows.reduce((a, r) => a + r.px * 1.28 + (r.gap || 0), 0);
  c.width = W; c.height = Math.ceil(H);
  g.fillStyle = bg; g.beginPath(); g.roundRect(4, 4, W - 8, c.height - 8, 36); g.fill();
  g.lineWidth = 8; g.strokeStyle = border; g.stroke();
  let y = pad;
  for (const r of rows) {
    g.font = font(r.px, r.bold ? 800 : 500);
    g.textBaseline = 'top';
    if (r.badge) { const w = g.measureText(r.text).width + 28; g.fillStyle = '#fff3cf'; g.strokeStyle = '#e0a020'; g.lineWidth = 3; g.beginPath(); g.roundRect(pad - 6, y - 4, w, r.px * 1.3, 14); g.fill(); g.stroke(); g.fillStyle = '#8a5a00'; g.fillText(r.text, pad + 8, y + 2); }
    else { g.fillStyle = r.color || '#1b2a3a'; g.fillText(r.text, pad, y); }
    y += r.px * 1.28 + (r.gap || 0);
  }
  const texture = new THREE.CanvasTexture(c);
  texture.colorSpace = THREE.SRGBColorSpace; texture.anisotropy = 4;
  return { texture, w: width, h: width * c.height / W };
}
function board(lines, opts) {
  const p = textPanel(lines, opts);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(p.w, p.h), new THREE.MeshBasicMaterial({ map: p.texture, transparent: true, depthTest: false, fog: false }));
  m.renderOrder = 20;
  m.userData.h = p.h;
  return m;
}
function dropBoard(m) { if (!m) return; m.parent && m.parent.remove(m); m.material.map.dispose(); m.material.dispose(); m.geometry.dispose(); }

// cfg: { build(stage, { weak }), spots: [{ id, label, note, off }], talk, talkAt: id на мястото с разговор, start: { x, z, yaw }, ground: 'walkY' | 'heightAt' }
export function startCardboard(host, cfg, { speak = true, onExit } = {}) {
  const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 0.95;
  renderer.domElement.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;touch-action:none';
  host.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xdfe9ee);
  scene.fog = new THREE.Fog(0xdfe9ee, 260, 1300);
  scene.add(new THREE.HemisphereLight(0xcfe2ff, 0x9a8f70, 1.5));
  const sun = new THREE.DirectionalLight(0xfff0d8, 3.0); sun.position.set(140, 230, 170); scene.add(sun);
  // Тялото (rig) носи положението и началната посока; главата (camera) се върти от телефона.
  const rig = new THREE.Group(); scene.add(rig);
  const camera = new THREE.PerspectiveCamera(80, 1, 0.1, 3000);
  rig.add(camera);
  const stereo = new THREE.StereoCamera(); stereo.aspect = 0.5; stereo.eyeSep = 0.064;

  const tickers = new Set();
  const world = cfg.build({ scene, camera, renderer, tick(fn) { tickers.add(fn); return () => tickers.delete(fn); }, sun }, { weak: true });
  // По-лека картина за телефон: без релеф по материалите.
  scene.traverse((o) => { if (o.material && o.material.bumpMap) { o.material.bumpMap = null; o.material.needsUpdate = true; } });
  const ground = world[cfg.ground || 'heightAt'];
  const obs = world.obstacles.map((o) => (o.r ? o : { ...o, c: Math.cos(o.ry || 0), s: Math.sin(o.ry || 0) }));
  function free(x, z) {
    if (!world.canStand(x, z)) return false;
    for (const o of obs) {
      const dx = x - o.x, dz = z - o.z;
      if (o.r) { if (dx * dx + dz * dz < (o.r + 0.5) ** 2) return false; continue; }
      if (Math.abs(dx) + Math.abs(dz) > o.hw + o.hd + 2) continue;
      const lx = dx * o.c - dz * o.s, lz = dx * o.s + dz * o.c, qx = Math.max(-o.hw, Math.min(o.hw, lx)), qz = Math.max(-o.hd, Math.min(o.hd, lz));
      if ((lx - qx) ** 2 + (lz - qz) ** 2 < 0.25) return false;
    }
    return true;
  }

  const st = { x: cfg.start.x, z: cfg.start.z, path: null, i: 0, arrive: null, seen: new Set() };
  rig.rotation.y = -(cfg.start.yaw || 0);
  const place = () => rig.position.set(st.x, ground(st.x, st.z) + EYE, st.z);
  place();

  // ---- Знаци с имена над местата ----
  const spotOf = new Map(cfg.spots.map((s) => [s.id, s]));
  const marks = [];
  for (const s of cfg.spots) {
    const p = world.places.get(s.id);
    const c = document.createElement('canvas'); c.width = 512; c.height = 160;
    const g = c.getContext('2d');
    g.font = '800 54px system-ui, "Segoe UI", Roboto, Arial, sans-serif';
    const label = (s.off ? '⚠ ' : '') + s.label, tw = Math.min(g.measureText(label).width, 470);
    g.fillStyle = s.off ? 'rgba(122,138,160,0.95)' : 'rgba(246,184,39,0.97)';
    g.beginPath(); g.roundRect(256 - tw / 2 - 22, 30, tw + 44, 92, 30); g.fill();
    g.lineWidth = 6; g.strokeStyle = '#fff'; g.stroke();
    g.fillStyle = s.off ? '#fff' : '#3a2a08'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(label, 256, 78, 470);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, depthTest: false, transparent: true, fog: false }));
    sp.position.set(p.x, p.y + p.top + 2.2, p.z); sp.renderOrder = 10;
    sp.userData = { vr: 'place', id: s.id };
    scene.add(sp); marks.push(sp);
  }

  // ---- Мерник в средата на погледа ----
  const reticle = new THREE.Group();
  const ringM = new THREE.MeshBasicMaterial({ color: 0xffffff, depthTest: false, fog: false, transparent: true, opacity: 0.9 });
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.018, 0.026, 28), ringM);
  const fill = new THREE.Mesh(new THREE.CircleGeometry(0.018, 24), new THREE.MeshBasicMaterial({ color: 0x2fb36b, depthTest: false, fog: false }));
  ring.renderOrder = fill.renderOrder = 999; fill.scale.setScalar(0.001);
  reticle.add(ring, fill); reticle.position.z = -1.6;
  camera.add(reticle);
  // Кръг на земята: дотам ще отидеш.
  const spot = new THREE.Mesh(new THREE.RingGeometry(0.45, 0.7, 24).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xffd34d, transparent: true, opacity: 0.9, depthWrite: false, fog: false }));
  spot.visible = false; scene.add(spot);

  // ---- Табла: обяснение за място и въпроси ----
  let info = null;
  const buttons = [];
  function clearBoards() { dropBoard(info); info = null; for (const b of buttons) dropBoard(b); buttons.length = 0; }
  const fwd = new THREE.Vector3();
  let near = null; // мястото, при което е детето: таблата се обръщат към него
  // Слага табло на разстояние dist пред детето, по посока на мястото (или на погледа), изместено встрани и по височина.
  function faceUser(m, dist, dy = 0, side = 0) {
    if (near) { fwd.set(near.x - st.x, 0, near.z - st.z); if (fwd.lengthSq() < 0.01) camera.getWorldDirection(fwd); } else camera.getWorldDirection(fwd);
    fwd.y = 0; fwd.normalize();
    m.position.set(st.x + fwd.x * dist - fwd.z * side, ground(st.x, st.z) + EYE + dy, st.z + fwd.z * dist + fwd.x * side);
    m.lookAt(st.x, m.position.y, st.z);
    scene.add(m);
  }
  function say(text) {
    if (!speak || !window.speechSynthesis) return;
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text.replace(/[\p{Extended_Pictographic}\u{FE0F}⚠]/gu, ''));
      u.lang = 'bg-BG';
      const v = speechSynthesis.getVoices().filter((x) => /^bg/i.test(x.lang)); if (v[0]) u.voice = v.find((x) => /natural|online|google/i.test(x.name)) || v[0];
      speechSynthesis.speak(u);
    } catch (e) { /* без глас */ }
  }
  // Таблото стои вляво от мястото, за да не го закрива.
  const SIDE = -1.75;
  function showInfo(lines, text) { dropBoard(info); info = board(lines, { width: 2.5 }); faceUser(info, 2.9, 0.1 + info.userData.h / 2 - 0.3, SIDE); say(text); }
  function showSpot(id) {
    const s = spotOf.get(id);
    clearBoards();
    near = world.places.get(id);
    st.seen.add(id);
    const lines = [];
    if (s.off) lines.push({ text: '⚠ Не е по програмата на МОН', size: 40, badge: true, gap: 20 });
    lines.push({ text: s.label, bold: true, size: 64, color: '#0A2A66', gap: 16 }, { text: s.note, size: 52 });
    lines.push({ text: `Разгледани: ${st.seen.size} от ${cfg.spots.length}`, size: 36, color: '#667', gap: 0 });
    showInfo(lines, `${s.label}. ${s.note}`);
    if (cfg.talk && id === cfg.talkAt) showQuestions(null);
  }
  // Табелки под таблото: първо кого питаш, после неговите въпроси. Отговорът излиза на таблото.
  function showQuestions(who) {
    for (const b of buttons) dropBoard(b);
    buttons.length = 0;
    const items = who
      ? cfg.talk[who].qs.map(([q, a]) => ({ kind: 'ask', who, q, a, text: q })).concat([{ kind: 'who', who: null, text: '← Назад' }])
      : Object.keys(cfg.talk).map((w) => ({ kind: 'who', who: w, text: `${cfg.talk[w].icon} Попитай: ${cfg.talk[w].name}` }));
    items.forEach((it, k) => {
      const b = board([{ text: it.text, size: 60, bold: true, color: '#0A2A66', gap: 0 }], { width: 2.3, pad: 30, bg: it.kind === 'ask' && asked.has(it.who + it.q) ? 'rgba(205,238,221,0.98)' : 'rgba(243,248,255,0.98)', border: '#7aa6e0' });
      b.userData.vr = it.kind; b.userData.item = it;
      faceUser(b, 2.7, -0.45 - k * 0.31, SIDE);
      buttons.push(b);
    });
  }
  const asked = new Set();

  // ---- Поглед: какво е в средата ----
  const ray = new THREE.Raycaster(); ray.far = 400;
  const centre = new THREE.Vector2(0, 0);
  let gaze = null, dwell = 0, groundHit = null;
  function look() {
    ray.setFromCamera(centre, camera);
    const hit = ray.intersectObjects([...buttons, ...marks], false)[0];
    groundHit = null;
    if (hit) return hit.object;
    const g = ray.intersectObject(world.terrain, false)[0];
    if (g && g.distance < 60 && world.canStand(g.point.x, g.point.z)) groundHit = g.point;
    return null;
  }
  function activate(o) {
    if (o.userData.vr === 'place') {
      const p = world.places.get(o.userData.id), s = p.site;
      clearBoards(); near = null;
      st.path = world.route([st.x, st.z], s.stand).map((q) => q.slice()); st.i = 0;
      st.arrive = () => showSpot(o.userData.id);
    } else if (o.userData.vr === 'who') {
      showQuestions(o.userData.item.who);
    } else if (o.userData.vr === 'ask') {
      const it = o.userData.item, T = cfg.talk[it.who];
      asked.add(it.who + it.q);
      showInfo([{ text: T.name, bold: true, size: 60, color: '#0A2A66', gap: 14 }, { text: it.a, size: 52 }, { text: 'Отговорите са съчинени от нас по исторически извори.', size: 32, color: '#667', gap: 0 }], it.a);
      showQuestions(it.who);
    }
  }
  function tap() {
    if (gaze) { activate(gaze); dwell = 0; return; }
    if (groundHit) { st.path = [[groundHit.x, groundHit.z]]; st.i = 0; st.arrive = null; if (near && Math.hypot(groundHit.x - near.x, groundHit.z - near.z) > 14) { clearBoards(); near = null; } }
  }

  // ---- Глава: сензорите на телефона; на компютър — влачене с мишката ----
  const zee = new THREE.Vector3(0, 0, 1), euler = new THREE.Euler(), q0 = new THREE.Quaternion(), q1 = new THREE.Quaternion(-Math.sqrt(0.5), 0, 0, Math.sqrt(0.5));
  let sensor = false, firstYaw = null, mYaw = 0, mPitch = 0;
  const onOri = (e) => {
    if (e.alpha == null) return;
    const orient = (screen.orientation && typeof screen.orientation.angle === 'number' ? screen.orientation.angle : window.orientation || 0) * Math.PI / 180;
    euler.set(e.beta * Math.PI / 180, e.alpha * Math.PI / 180, -e.gamma * Math.PI / 180, 'YXZ');
    camera.quaternion.setFromEuler(euler).multiply(q1).multiply(q0.setFromAxisAngle(zee, -orient));
    if (!sensor) {
      // Първото отчитане: каквото и да сочи компасът, детето започва с лице към началната посока.
      sensor = true;
      camera.getWorldDirection(fwd);
      firstYaw = Math.atan2(fwd.x, -fwd.z);
      rig.rotation.y += firstYaw - (cfg.start.yaw || 0);
    }
  };
  window.addEventListener('deviceorientation', onOri);
  let drag = null, moved = 0;
  const el = renderer.domElement;
  const pd = (e) => { drag = { x: e.clientX, y: e.clientY }; moved = 0; };
  const pm = (e) => {
    if (!drag) return;
    moved += Math.abs(e.clientX - drag.x) + Math.abs(e.clientY - drag.y);
    if (!sensor) { mYaw -= (e.clientX - drag.x) * 0.004; mPitch = Math.max(-1.2, Math.min(1.2, mPitch - (e.clientY - drag.y) * 0.004)); camera.rotation.set(mPitch, mYaw, 0, 'YXZ'); }
    drag = { x: e.clientX, y: e.clientY };
  };
  const pu = () => { if (drag && moved < 12) tap(); drag = null; };
  el.addEventListener('pointerdown', pd); el.addEventListener('pointermove', pm); el.addEventListener('pointerup', pu); el.addEventListener('pointercancel', pu);

  function resize() {
    const w = host.clientWidth || window.innerWidth, h = host.clientHeight || window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize); resize();

  const clock = new THREE.Clock(), tmp = new THREE.Vector3(), size = new THREE.Vector2();
  let running = true;
  function frame() {
    if (!running) return;
    requestAnimationFrame(frame);
    const dt = Math.min(clock.getDelta(), 0.1), t = clock.elapsedTime;
    for (const fn of tickers) fn(dt, t);
    world.tick(dt, t);
    // Ходене по зададения път (спира пред препятствие, когато пътят е „направо към точка“).
    if (st.path) {
      let step = SPEED * dt;
      while (step > 0 && st.path && st.i < st.path.length) {
        const [px, pz] = st.path[st.i], dx = px - st.x, dz = pz - st.z, d = Math.hypot(dx, dz);
        if (d <= step) { st.x = px; st.z = pz; step -= d; st.i++; }
        else {
          const nx = st.x + (dx / d) * step, nz = st.z + (dz / d) * step;
          if (st.path.length === 1 && !st.arrive && !free(nx, nz)) { st.path = null; break; }
          st.x = nx; st.z = nz; step = 0;
        }
      }
      if (st.path && st.i >= st.path.length) { st.path = null; const fn = st.arrive; st.arrive = null; if (fn) fn(); }
      place();
    }
    // Поглед и задържане.
    const g = look();
    if (g !== gaze) { gaze = g; dwell = 0; }
    if (gaze && !st.path) { dwell += dt; if (dwell >= DWELL) { activate(gaze); dwell = 0; gaze = null; } } else dwell = 0;
    fill.scale.setScalar(Math.max(0.001, Math.min(1, dwell / DWELL)));
    ringM.color.setHex(gaze ? 0x2fb36b : groundHit ? 0xffd34d : 0xffffff);
    spot.visible = !gaze && !!groundHit && !st.path;
    if (spot.visible) spot.position.set(groundHit.x, groundHit.y + 0.12, groundHit.z);
    // Знаците пазят горе-долу еднакъв размер на екрана.
    camera.getWorldPosition(tmp);
    for (const m of marks) { const d = m.position.distanceTo(tmp), k = Math.max(1.6, Math.min(34, d * 0.11)); m.scale.set(k * 3.2, k, 1); m.visible = d > 9 && !(near && near.id === m.userData.id); }
    // Две картини една до друга.
    renderer.getSize(size);
    scene.updateMatrixWorld(); camera.updateMatrixWorld();
    stereo.update(camera);
    renderer.setScissorTest(true);
    renderer.setScissor(0, 0, size.x / 2, size.y); renderer.setViewport(0, 0, size.x / 2, size.y); renderer.render(scene, stereo.cameraL);
    renderer.setScissor(size.x / 2, 0, size.x / 2, size.y); renderer.setViewport(size.x / 2, 0, size.x / 2, size.y); renderer.render(scene, stereo.cameraR);
    renderer.setScissorTest(false);
  }
  requestAnimationFrame(frame);

  return {
    state: st, world, camera, rig,
    // За автоматичните тестове: гледай към точка и „натисни бутона“.
    lookAt(x, y, z) { if (!sensor) { camera.lookAt(x, y, z); mYaw = camera.rotation.reorder('YXZ').y; mPitch = camera.rotation.x; } },
    tap, gazed: () => (gaze ? gaze.userData : groundHit ? { vr: 'ground' } : null),
    boards: () => ({ info: !!info, buttons: buttons.length, asked: asked.size }),
    button: (k) => { const b = buttons[k]; return b ? { x: b.position.x, y: b.position.y, z: b.position.z, vr: b.userData.vr } : null; },
    get sensor() { return sensor; },
    stop() {
      running = false;
      if (window.speechSynthesis) speechSynthesis.cancel();
      window.removeEventListener('deviceorientation', onOri); window.removeEventListener('resize', resize);
      clearBoards();
      scene.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) for (const m of [].concat(o.material)) { if (m.map) m.map.dispose(); m.dispose(); } });
      renderer.dispose(); el.remove();
      onExit && onExit();
    },
  };
}
