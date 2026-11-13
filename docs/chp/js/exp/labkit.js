// Общи части за малките лабораторни опити (5.1.3, 5.2.3, 6.1.2, 6.1.4, 6.2.3):
// рамка + сцена, меню за опознаване, въпрос с избор, стрелка за сила, лабораторна маса.
import { createStage, cornerMenu, mat, shuffle, THREE, esc } from '../kit.js';
import { createShell, stepScore } from './shell.js';

export { stepScore };

// Рамка, сцена, меню в ъгъла и общо насочване на кликовете.
export function scaffold(container, { steps, stage: stageOpts = {} }) {
  const shell = createShell(container, { steps });
  const stage = createStage(shell.stageEl, { background: 0xeef2f6, shadows: false, ...stageOpts });
  let tip = null;
  const ctx = {
    container, shell, stage, scene: stage.scene, camera: stage.camera,
    scores: [], ratio: null,
    click: null, menuPick: null,
    say(anchor, html, cls = '', lift = 0.6) {
      if (tip) tip.remove();
      tip = stage.bubble(anchor, html, { lift, cls });
      return tip;
    },
    clearTip() { if (tip) { tip.remove(); tip = null; } },
    result() { return ctx.scores.reduce((a, b) => a + b, 0) / Math.max(1, ctx.scores.length); },
  };
  stage.onClick((hit) => ctx.click && ctx.click(hit ? hit.root.userData.pickId : null, hit));
  ctx.menu = cornerMenu(stage, { title: 'Разгледай', items: [], onSelect: (id) => ctx.menuPick && ctx.menuPick(id) });
  ctx.menu.show(false);
  container.__xp = ctx; // за автоматичните тестове
  return ctx;
}

// Стъпка 1: опознаване с меню в ъгъла. items: [{ id, label, icon, note, obj: () => Object3D, dist, lift }]
export function explore(ctx, { title, intro, items, need = items.length, onNext }) {
  const { shell, stage, menu } = ctx;
  shell.task(intro);
  menu.setTitle(title);
  menu.setItems(items.map(({ id, label, icon }) => ({ id, label, icon })));
  menu.show(true);
  const seen = new Set();
  const c = shell.setControls('<div class="row"><button class="btn primary nx" disabled>Напред →</button></div>');
  const next = c.querySelector('.nx');
  const upd = () => shell.score(`Разгледани: ${seen.size} от ${items.length}`);
  upd();
  const visit = (id) => {
    const it = items.find((x) => x.id === id);
    if (!it) return;
    const o = it.obj();
    stage.focusOn(o, { dist: it.dist || 4.5, height: 1.2, lift: it.lift ?? 0.3, keepFollow: false });
    ctx.say(o, `<b>${esc(it.icon || '')} ${esc(it.label)}</b><br>${it.note}`, 'wide', it.bubble ?? 0.9);
    seen.add(id);
    menu.mark(id);
    menu.setActive(id);
    upd();
    if (seen.size >= need && next.disabled) {
      next.disabled = false;
      shell.msg('Браво! Можеш да продължиш.', 'good');
    }
  };
  ctx.click = (id) => { if (!id) return ctx.clearTip(); visit(id); };
  ctx.menuPick = visit;
  next.addEventListener('click', () => {
    menu.show(false);
    ctx.menuPick = null;
    ctx.click = null;
    ctx.clearTip();
    shell.score('');
    onNext();
  });
  return { visit };
}

// Въпрос с избор в панела. options: [{ t, ok, why }]. data-i е индексът в options (за тестовете).
export function choice(ctx, { q, options, hint, onRight, mistakes = 0 }) {
  const { shell } = ctx;
  const order = shuffle(options.map((_, i) => i));
  const c = shell.setControls(`<p><b>${q}</b></p><div class="choices">${order.map((i) => `<button class="choice" data-i="${i}">${options[i].t}</button>`).join('')}</div>`);
  let m = mistakes;
  c.querySelectorAll('.choice').forEach((b) => b.addEventListener('click', () => {
    if (b.disabled) return;
    const o = options[+b.dataset.i];
    if (!o.ok) {
      m++;
      b.classList.add('wrong');
      b.disabled = true;
      shell.msg(`${o.why}${m >= 2 && hint ? ' Подсказка: ' + hint : ''}`, 'bad');
      return;
    }
    b.classList.add('right');
    c.querySelectorAll('.choice').forEach((x) => { x.disabled = true; });
    shell.msg(o.why, 'good');
    onRight(m, c);
  }));
  return c;
}

// Отворена прогноза (решение 21, 5. клас): детето може да избере и грешна прогноза.
// Изборът се заключва, опитът тръгва и после compare() показва прогнозата до резултата.
// options: [{ t, ok }]; onPick(o, i, c) се вика веднага след избора. Грешната прогноза се брои
// като 1 грешка в ctx.predMiss (за оценката на стъпката), но съобщението е спокойно.
export function predict(ctx, { q, options, note = 'Запомни прогнозата си. Сега провери!', onPick }) {
  const { shell } = ctx;
  const order = shuffle(options.map((_, i) => i));
  const c = shell.setControls(`<p><b>${q}</b></p><div class="choices">${order.map((i) => `<button class="choice pred" data-i="${i}">${options[i].t}</button>`).join('')}</div>`);
  c.querySelectorAll('.choice').forEach((b) => b.addEventListener('click', () => {
    if (b.disabled) return;
    const i = +b.dataset.i;
    c.querySelectorAll('.choice').forEach((x) => { x.disabled = true; });
    b.classList.add('on');
    ctx.prediction = { i, t: options[i].t, ok: !!options[i].ok };
    ctx.predMiss = options[i].ok ? 0 : 1;
    shell.msg(note, '');
    onPick(options[i], i, c);
  }));
  return c;
}

// Сравнение „Твоята прогноза / Какво стана / Защо“ след опита. Връща контейнера.
export function compare(ctx, { result, why, pick = ctx.prediction }) {
  const ok = pick && pick.ok;
  const html = `<div class="cmp ${ok ? 'ok' : 'miss'}">
    <p><span class="cmp-l">Твоята прогноза:</span> ${pick ? pick.t : '—'} ${ok ? '✔' : ''}</p>
    <p><span class="cmp-l">Какво стана:</span> ${result}</p>
    <p><span class="cmp-l">Защо:</span> ${why}</p>
    ${ok ? '' : '<p class="cmp-learn">Добре, че прогнозира — сега знаеш повече, отколкото преди опита.</p>'}
  </div>`;
  const c = ctx.shell.setControls(html);
  ctx.shell.msg(ok ? 'Прогнозата ти се потвърди!' : 'Опитът показа нещо различно от прогнозата ти. Виж защо.', ok ? 'good' : '');
  return c;
}

// Добавя бутон под текущите контроли.
export function nextBtn(ctx, label, fn) {
  const c = ctx.shell.controls;
  c.insertAdjacentHTML('beforeend', `<div class="row"><button class="btn primary nx">${label}</button></div>`);
  const all = c.querySelectorAll('.nx');
  const b = all[all.length - 1];
  b.addEventListener('click', fn, { once: true });
  return b;
}

// Последен бутон: резултат = средното от оценяваните стъпки.
export function finishBtn(ctx, onComplete, restart) {
  nextBtn(ctx, 'Виж резултата', () => {
    ctx.clearTip();
    ctx.ratio = ctx.result();
    ctx.shell.finish(ctx.ratio, onComplete, restart);
  });
}

// Стрелка за сила по оста +x. set(len) сменя дължината.
export function makeArrow(color, r = 0.06) {
  const g = new THREE.Group();
  const m = mat(color, { roughness: 0.4 });
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 1, 10), m);
  shaft.rotation.z = -Math.PI / 2;
  const head = new THREE.Mesh(new THREE.ConeGeometry(r * 2.6, r * 6, 14), m);
  head.rotation.z = -Math.PI / 2;
  g.add(shaft, head);
  const set = (len) => {
    const L = Math.max(0, len);
    g.visible = L > 0.01;
    const hl = r * 6;
    const sl = Math.max(0.001, L - hl);
    shaft.scale.y = sl;
    shaft.position.x = sl / 2;
    head.position.x = sl + hl / 2;
  };
  set(1);
  return { g, set };
}

// Стая с маса: стена, под, плот (горната страна на плота е на y = 0).
export function labRoom(scene, { w = 12, d = 4.5, color = 0xd7b98e } = {}) {
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(60, 24), mat(0xe2e8ef));
  wall.position.set(0, 6, -4);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(80, 40), mat(0xc9d2dc));
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -1.6;
  const top = new THREE.Mesh(new THREE.BoxGeometry(w, 0.25, d), mat(color));
  top.position.y = -0.125;
  const legs = [];
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1.35, 0.2), mat(0x8a6a44));
    leg.position.set(sx * (w / 2 - 0.4), -0.92, sz * (d / 2 - 0.4));
    legs.push(leg);
  }
  scene.add(wall, floor, top, ...legs);
  return { wall, floor, top };
}

// Прозрачно стъкло.
export function glass(opacity = 0.28) {
  return new THREE.MeshStandardMaterial({ color: 0xcfe9ff, transparent: true, opacity, roughness: 0.1, metalness: 0, depthWrite: false, side: THREE.DoubleSide });
}

// Дисплей с цифри (за везна, термометър и др.) като текстура върху равнина.
export function lcd(w = 1, h = 0.4) {
  const c = document.createElement('canvas');
  c.width = 256; c.height = Math.round(256 * h / w);
  const ctx2 = c.getContext('2d');
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex }));
  let last = null;
  const set = (text, color = '#0b3d1e') => {
    if (text === last) return;
    last = text;
    ctx2.fillStyle = '#c8e6c9';
    ctx2.fillRect(0, 0, c.width, c.height);
    ctx2.fillStyle = color;
    ctx2.font = `700 ${Math.round(c.height * 0.62)}px ui-monospace, Menlo, Consolas, monospace`;
    ctx2.textAlign = 'center';
    ctx2.textBaseline = 'middle';
    ctx2.fillText(text, c.width / 2, c.height / 2 + 2);
    tex.needsUpdate = true;
  };
  set('');
  return { mesh, set };
}

// Камера отпред, така че ширината 2·halfW да се вижда и на тесен екран.
export function view(ctx, target, halfW, { elev = 0.42, dur = 1.0, halfH = 0 } = {}) {
  const cam = ctx.camera;
  const vf = (cam.fov * Math.PI) / 180;
  const hf = 2 * Math.atan(Math.tan(vf / 2) * cam.aspect);
  const d = Math.max(halfW / Math.tan(hf / 2), halfH / Math.tan(vf / 2), 2.5);
  const [x, y, z] = target;
  ctx.stage.flyTo([x, y + d * Math.sin(elev), z + d * Math.cos(elev)], target, dur);
}

// Малка лента-показател (0–100%) за балончетата.
export function bar(p, color = '#e05555') {
  return `<span style="display:inline-block;width:64px;height:9px;background:#dfe5ec;border-radius:5px;overflow:hidden;vertical-align:middle"><i style="display:block;height:100%;width:${Math.max(0, Math.min(100, p)).toFixed(0)}%;background:${color}"></i></span>`;
}

// Число с десетична запетая.
export const fmt = (v, d = 1) => v.toFixed(d).replace('.', ',').replace('-', '−');
