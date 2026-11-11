// Обща рамка за преживяванията на високо качество: 3D сцена вляво, панел със задачата вдясно.
import { esc } from '../kit.js';
import { speak, speakEl } from '../voice.js';

export function createShell(container, { steps }) {
  container.innerHTML = `<div class="xp">
      <div class="xp-stage"></div>
      <div class="xp-panel">
        <button class="xp-min" type="button"></button>
        <div class="xp-steps">${steps.map(() => '<i></i>').join('')}</div>
        <div class="xp-title"></div>
        <div class="xp-task"></div>
        <div class="xp-msg" aria-live="polite"></div>
        <div class="xp-controls"></div>
        <div class="xp-score"></div>
      </div>
    </div>
    <p class="scene-hint">Върти сцената с пръст или мишка, приближавай с колелцето или с два пръста.</p>`;
  const q = (s) => container.querySelector(s);
  setupFullscreen(q('.xp'), q('.xp-stage'));
  // На цял екран панелът е плаваща карта върху сцената; този бутон я свива до заглавието.
  const minBtn = q('.xp-min'), drawMin = () => { const m = q('.xp-panel').classList.contains('min'); minBtn.textContent = m ? '▾' : '▴'; minBtn.title = m ? 'Покажи задачата' : 'Свий задачата'; minBtn.setAttribute('aria-label', minBtn.title); };
  minBtn.addEventListener('click', () => { q('.xp-panel').classList.toggle('min'); drawMin(); });
  drawMin();
  const shell = {
    stageEl: q('.xp-stage'),
    controls: q('.xp-controls'),
    step(i) {
      container.querySelectorAll('.xp-steps i').forEach((el, k) => {
        el.className = k < i ? 'done' : k === i ? 'cur' : '';
      });
      q('.xp-title').textContent = `${i + 1}. ${steps[i]}`;
      shell.msg('');
    },
    task(html) { q('.xp-task').innerHTML = html; speakEl(q('.xp-task')); },
    msg(text, kind = '') {
      const m = q('.xp-msg');
      m.className = 'xp-msg ' + kind;
      m.textContent = text;
      if (text) speak(text);
    },
    score(text) { q('.xp-score').textContent = text; },
    setControls(html) { shell.controls.innerHTML = html; return shell.controls; },
    // Последен екран с резултата.
    finish(ratio, onComplete, restart) {
      container.querySelectorAll('.xp-steps i').forEach((el) => { el.className = 'done'; });
      const r = onComplete ? onComplete(ratio) : null;
      q('.xp-title').textContent = 'Готово!';
      shell.msg('');
      shell.score('');
      q('.xp-task').innerHTML = `<p><b>Резултат: ${Math.round(ratio * 100)}%</b></p>
        ${r ? `<p>Ниво на умението: <b>${esc(r.levelName)}</b>${r.after > r.before ? ' ⬆' : ''}</p>` : ''}
        ${r && r.after === 3 ? '<p class="small">За „Овладяно“ реши правилно въпросите за това умение в теста върху раздела.</p>' : ''}
        ${ratio < 1 ? '<p class="small">Опитай пак без грешки, за да стигнеш до „Владее“.</p>' : ''}`;
      speakEl(q('.xp-task'));
      const c = shell.setControls(`<div class="row"><button class="btn again">Започни отначало</button>
        ${r && r.next ? `<a class="btn primary" href="#/s/${esc(r.next.id)}">Следващо умение →</a>` : ''}</div>`);
      c.querySelector('.again').addEventListener('click', restart);
    },
  };
  return shell;
}

// Брояч на грешки → резултат за стъпка (1 без грешки, намалява с всяка грешка).
export function stepScore(mistakes, allowed = 3) {
  return Math.max(0, 1 - mistakes / (allowed + 1));
}

// Бутон „На цял екран“ в горния десен ъгъл на сцената. Ползва Fullscreen API; където го няма
// (напр. iPhone), преживяването се разпъва върху целия прозорец. На широк екран сцената заема всичко,
// а панелът със задачата плава върху нея; на тесен екран панелът остава под сцената.
function setupFullscreen(xp, stageEl) {
  const btn = document.createElement('button');
  btn.className = 'xp-fs';
  btn.type = 'button';
  stageEl.appendChild(btn);
  ['pointerdown', 'wheel', 'touchstart'].forEach((ev) => btn.addEventListener(ev, (e) => e.stopPropagation(), { passive: true }));
  const native = !!(xp.requestFullscreen || xp.webkitRequestFullscreen);
  const isOn = () => document.fullscreenElement === xp || document.webkitFullscreenElement === xp || xp.classList.contains('xp-full');
  const draw = () => {
    const on = isOn();
    btn.textContent = on ? '✕' : '⛶';
    btn.title = on ? 'Изход от цял екран (Esc)' : 'На цял екран';
    btn.setAttribute('aria-label', btn.title);
    document.documentElement.classList.toggle('xp-full-open', xp.classList.contains('xp-full'));
  };
  const exitFallback = () => { xp.classList.remove('xp-full'); draw(); };
  btn.addEventListener('click', async () => {
    if (isOn()) {
      if (xp.classList.contains('xp-full')) exitFallback();
      else (document.exitFullscreen || document.webkitExitFullscreen).call(document);
      return;
    }
    try {
      if (!native) throw new Error('няма');
      await (xp.requestFullscreen || xp.webkitRequestFullscreen).call(xp);
    } catch (e) {
      xp.classList.add('xp-full');
      draw();
    }
  });
  const onKey = (e) => { if (e.key === 'Escape' && xp.classList.contains('xp-full')) exitFallback(); };
  document.addEventListener('keydown', onKey);
  document.addEventListener('fullscreenchange', draw);
  document.addEventListener('webkitfullscreenchange', draw);
  // Когато преживяването се махне от страницата, слушателите се махат с него.
  const mo = new MutationObserver(() => {
    if (!xp.isConnected) { document.removeEventListener('keydown', onKey); document.removeEventListener('fullscreenchange', draw); document.removeEventListener('webkitfullscreenchange', draw); document.documentElement.classList.remove('xp-full-open'); mo.disconnect(); }
  });
  mo.observe(document.body, { childList: true, subtree: true });
  draw();
}
