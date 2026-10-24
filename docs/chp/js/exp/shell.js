// Обща рамка за преживяванията на високо качество: 3D сцена вляво, панел със задачата вдясно.
import { esc } from '../kit.js';
import { speak, speakEl } from '../voice.js';

export function createShell(container, { steps }) {
  container.innerHTML = `<div class="xp">
      <div class="xp-stage"></div>
      <div class="xp-panel">
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
