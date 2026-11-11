// Разходка от първо лице в сцена: ходене със стрелките или бутоните (наляво и надясно са крачка встрани), оглеждане с влачене (или Q и E),
// докосване на земята води дотам. Има и малка карта с мястото на детето.
import { THREE } from '../../kit.js';

// ground(x, z) → височина; canStand(x, z) → може ли да се стъпи там;
// obstacles: [{ x, z, r }] или [{ x, z, hw, hd, ry }] (правоъгълници); terrain: мрежи, по които се докосва земята.
export function createWalk(stage, { ground, canStand, obstacles = [], terrain = [], start, eye = 1.65, speed = 7 }) {
  const { camera, controls, renderer } = stage;
  const el = renderer.domElement, host = el.parentElement;
  const st = { x: start.x, z: start.z, yaw: start.yaw || 0, pitch: -0.05, active: false, target: null, bob: 0, stuck: 0 };
  const keys = new Set(), pad = new Set();
  const obs = obstacles.map((o) => (o.r ? o : { ...o, c: Math.cos(o.ry || 0), s: Math.sin(o.ry || 0) }));
  const RAD = 0.55;
  function free(x, z) {
    if (!canStand(x, z)) return false;
    for (const o of obs) {
      const dx = x - o.x, dz = z - o.z;
      if (o.r) { if (dx * dx + dz * dz < (o.r + RAD) ** 2) return false; continue; }
      if (Math.abs(dx) + Math.abs(dz) > o.hw + o.hd + 2) continue;
      const lx = dx * o.c - dz * o.s, lz = dx * o.s + dz * o.c;
      const qx = Math.max(-o.hw, Math.min(o.hw, lx)), qz = Math.max(-o.hd, Math.min(o.hd, lz));
      if ((lx - qx) ** 2 + (lz - qz) ** 2 < RAD * RAD) return false;
    }
    return true;
  }

  // Бутони за ходене (за пръст и за мишка).
  const padEl = document.createElement('div');
  padEl.className = 'walk-pad';
  padEl.hidden = true;
  padEl.innerHTML = '<button data-k="left" aria-label="Крачка наляво">◀</button><button data-k="fwd" aria-label="Напред">▲</button><button data-k="right" aria-label="Крачка надясно">▶</button><span></span><button data-k="back" aria-label="Назад">▼</button><span></span>';
  host.appendChild(padEl);
  padEl.querySelectorAll('button').forEach((b) => {
    const on = (e) => { e.preventDefault(); e.stopPropagation(); pad.add(b.dataset.k); st.target = null; st.auto = null; };
    const off = () => pad.delete(b.dataset.k);
    b.addEventListener('pointerdown', on);
    ['pointerup', 'pointerleave', 'pointercancel'].forEach((n) => b.addEventListener(n, off));
  });
  // Бяло избледняване при пренасяне до ново място.
  const veil = document.createElement('div');
  veil.className = 'walk-veil';
  host.appendChild(veil);
  // Кръгче на земята: дотам отива детето.
  const mark = new THREE.Mesh(new THREE.RingGeometry(0.45, 0.7, 24).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xffd34d, transparent: true, opacity: 0.9, depthWrite: false }));
  mark.visible = false;
  stage.scene.add(mark);

  let drag = null;
  const pd = (e) => { if (st.active) drag = { x: e.clientX, y: e.clientY }; };
  const pm = (e) => {
    if (!st.active || !drag) return;
    st.yaw -= (e.clientX - drag.x) * 0.0045;
    st.pitch = Math.max(-0.9, Math.min(0.9, st.pitch - (e.clientY - drag.y) * 0.0035));
    drag = { x: e.clientX, y: e.clientY };
  };
  const pu = () => { drag = null; };
  el.addEventListener('pointerdown', pd); el.addEventListener('pointermove', pm);
  el.addEventListener('pointerup', pu); el.addEventListener('pointercancel', pu);
  const KEY = { ArrowUp: 'fwd', KeyW: 'fwd', ArrowDown: 'back', KeyS: 'back', ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right', KeyQ: 'turnL', KeyE: 'turnR' };
  const kd = (e) => {
    if (!st.active || !KEY[e.code] || /INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName || '')) return;
    keys.add(KEY[e.code]); st.target = null; st.auto = null; e.preventDefault();
  };
  const ku = (e) => { if (KEY[e.code]) keys.delete(KEY[e.code]); };
  window.addEventListener('keydown', kd); window.addEventListener('keyup', ku);

  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  // Докосване на земята: тръгни натам. Връща true, ако е намерено място.
  function walkToEvent(ev) {
    if (!st.active) return false;
    const r = el.getBoundingClientRect();
    ndc.set(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObjects(terrain, false)[0];
    if (!hit || hit.distance > 90) return false;
    st.target = { x: hit.point.x, z: hit.point.z }; st.auto = null;
    st.stuck = 0;
    return true;
  }

  const saved = {};
  function place() {
    const y = ground(st.x, st.z) + eye + Math.sin(st.bob) * 0.035;
    camera.position.set(st.x, y, st.z);
    const cp = Math.cos(st.pitch);
    controls.target.set(st.x + Math.sin(st.yaw) * cp, y - Math.sin(st.pitch), st.z - Math.cos(st.yaw) * cp);
  }
  const turn = (to, k) => { const da = Math.atan2(Math.sin(to - st.yaw), Math.cos(to - st.yaw)); st.yaw += da * Math.min(1, k); return Math.abs(da); };
  const stop = stage.tick((dt) => {
    if (!st.active) return;
    if (st.auto) {
      // Автоматично ходене по улиците: бързо, по готов път, с плавно завиване; накрая детето се обръща към мястото.
      const a = st.auto;
      mark.visible = false;
      if (a.i < a.pts.length) {
        a.t += dt;
        const left = a.left, v = a.speed * Math.min(1, a.t / 0.5, 0.25 + left / 9); // тръгва и спира плавно
        let step = v * dt;
        while (step > 0 && a.i < a.pts.length) {
          const [px, pz] = a.pts[a.i], dx = px - st.x, dz = pz - st.z, d = Math.hypot(dx, dz);
          if (d <= step) { st.x = px; st.z = pz; step -= d; a.left -= d; a.i++; }
          else { st.x += (dx / d) * step; st.z += (dz / d) * step; a.left -= step; turn(Math.atan2(dx, -dz), dt * 7); step = 0; }
        }
        st.pitch += (-0.04 - st.pitch) * Math.min(1, dt * 4);
        st.bob += dt * 16;
      } else {
        const off = turn(Math.atan2(a.lx - st.x, -(a.lz - st.z)), dt * 6);
        st.pitch += (a.pitch - st.pitch) * Math.min(1, dt * 5);
        if (off < 0.02 && Math.abs(a.pitch - st.pitch) < 0.02) st.auto = null;
      }
      place();
      return;
    }
    const k = (n) => keys.has(n) || pad.has(n);
    st.yaw += ((k('turnR') ? 1 : 0) - (k('turnL') ? 1 : 0)) * dt * 1.9;
    // Напред/назад по посоката на погледа; наляво/надясно — крачка встрани, без завъртане.
    const fw = (k('fwd') ? 1 : 0) - (k('back') ? 0.7 : 0), side = ((k('right') ? 1 : 0) - (k('left') ? 1 : 0)) * 0.75;
    let dx = Math.sin(st.yaw) * fw + Math.cos(st.yaw) * side, dz = -Math.cos(st.yaw) * fw + Math.sin(st.yaw) * side;
    let f = Math.hypot(dx, dz);
    if (f) { dx /= f; dz /= f; f = Math.min(f, 1); }
    if (!f && st.target) {
      const tx = st.target.x - st.x, tz = st.target.z - st.z, d = Math.hypot(tx, tz);
      if (d < 0.5 || st.stuck > 0.4) st.target = null;
      else {
        dx = tx / d; dz = tz / d; f = 1;
        // Завива плавно по посоката на движение.
        let da = Math.atan2(dx, -dz) - st.yaw;
        da = Math.atan2(Math.sin(da), Math.cos(da));
        st.yaw += da * Math.min(1, dt * 3);
      }
    }
    mark.visible = !!st.target;
    if (st.target) mark.position.set(st.target.x, ground(st.target.x, st.target.z) + 0.12, st.target.z);
    if (f) {
      const step = speed * dt * f, nx = st.x + dx * step, nz = st.z + dz * step;
      if (free(nx, nz)) { st.x = nx; st.z = nz; st.stuck = 0; }
      else if (free(nx, st.z)) { st.x = nx; st.stuck += dt * 0.5; }
      else if (free(st.x, nz)) { st.z = nz; st.stuck += dt * 0.5; }
      else st.stuck += dt;
      st.bob += dt * 11;
    }
    place();
  });

  const api = {
    state: st,
    get active() { return st.active; },
    walkToEvent,
    enable() {
      if (st.active) return;
      Object.assign(saved, { min: controls.minDistance, max: controls.maxDistance, polar: controls.maxPolarAngle });
      controls.enabled = false; controls.minDistance = 0.5; controls.maxDistance = 5000; controls.maxPolarAngle = Math.PI;
      stage.stopFollow();
      st.active = true; padEl.hidden = false; keys.clear(); pad.clear();
      place();
    },
    disable() {
      if (!st.active) return;
      st.active = false; st.target = null; st.auto = null; mark.visible = false; padEl.hidden = true;
      controls.enabled = true; controls.maxPolarAngle = saved.polar;
      // Разстоянията се връщат след полета на камерата (вижте restoreLimits).
    },
    walkTo(x, z) { if (st.active) { st.target = { x, z }; st.stuck = 0; } },
    restoreLimits() { if (!st.active && saved.min) { controls.minDistance = saved.min; controls.maxDistance = saved.max; } },
    // Води детето с бързо ходене по точките pts ([[x, z], …]); накрая то се обръща към (lx, lz).
    follow(pts, lx, lz, pitch = -0.1) {
      let len = 0, px = st.x, pz = st.z;
      for (const [x, z] of pts) { len += Math.hypot(x - px, z - pz); px = x; pz = z; }
      st.target = null;
      st.auto = { pts, i: 0, t: 0, left: len, speed: Math.max(20, len / 6), lx, lz, pitch }; // най-дългият път трае около 6 секунди
    },
    // Пренася детето на ново място, обърнато към точката (lx, lz).
    jump(x, z, lx, lz, pitch = 0.05) {
      veil.classList.add('on');
      setTimeout(() => {
        st.x = x; st.z = z; st.target = null; st.auto = null;
        st.yaw = Math.atan2(lx - x, -(lz - z)); st.pitch = pitch;
        if (st.active) place();
        veil.classList.remove('on');
      }, 260);
    },
    dispose() {
      stop(); padEl.remove(); veil.remove();
      el.removeEventListener('pointerdown', pd); el.removeEventListener('pointermove', pm);
      el.removeEventListener('pointerup', pu); el.removeEventListener('pointercancel', pu);
      window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku);
    },
  };
  return api;
}

// Малка карта в ъгъла. paint(g, px): рисува постоянната част; px(x, z) → [пиксел x, пиксел y].
export function createMiniMap(stage, { bounds, paint, size = 116 }) {
  const host = stage.renderer.domElement.parentElement;
  const c = document.createElement('canvas');
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = size, h = Math.round(size * (bounds.z1 - bounds.z0) / (bounds.x1 - bounds.x0));
  c.width = w * dpr; c.height = h * dpr; c.style.width = w + 'px'; c.style.height = h + 'px';
  c.className = 'minimap';
  c.hidden = true;
  host.appendChild(c);
  const px = (x, z) => [((x - bounds.x0) / (bounds.x1 - bounds.x0)) * w, ((z - bounds.z0) / (bounds.z1 - bounds.z0)) * h];
  const base = document.createElement('canvas');
  base.width = c.width; base.height = c.height;
  const bg = base.getContext('2d');
  bg.scale(dpr, dpr);
  paint(bg, px);
  const g = c.getContext('2d');
  return {
    show(on) { c.hidden = !on; },
    // dots: [{ x, z, done }] — местата за разглеждане.
    draw(pose, dots = []) {
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.clearRect(0, 0, c.width, c.height);
      g.drawImage(base, 0, 0);
      g.scale(dpr, dpr);
      for (const d of dots) { const [x, y] = px(d.x, d.z); g.fillStyle = d.done ? '#2fb36b' : '#f2b632'; g.strokeStyle = '#fff'; g.lineWidth = 1.2; g.beginPath(); g.arc(x, y, 3.4, 0, 7); g.fill(); g.stroke(); }
      const [x, y] = px(pose.x, pose.z);
      g.translate(x, y); g.rotate(pose.yaw);
      g.fillStyle = '#d6332a'; g.strokeStyle = '#fff'; g.lineWidth = 1.5;
      g.beginPath(); g.moveTo(0, -7); g.lineTo(5, 5); g.lineTo(0, 2.5); g.lineTo(-5, 5); g.closePath(); g.fill(); g.stroke();
    },
    remove() { c.remove(); },
  };
}
