// Разходка: камерата върви по улицата от спирка до спирка; на всяка спирка детето може да се огледа.
// Употреба:
//   const walk = createWalk(stage, { stops: [{ id, label, icon, at: [x, z], look: [x, y, z] }], onArrive(stop) {} });
//   walk.go('gate');  walk.next();  walk.prev();  walk.showNav(true)
import { cornerMenu, esc } from '../../kit.js';

export function createWalk(stage, { stops, eye = 1.0, onArrive, menuTitle = 'Спирки' } = {}) {
  let cur = -1;
  let busy = false;
  const host = stage.renderer.domElement.parentElement;
  const nav = document.createElement('div');
  nav.className = 'walk-nav';
  host.appendChild(nav);
  ['pointerdown', 'wheel', 'touchstart'].forEach((ev) => nav.addEventListener(ev, (e) => e.stopPropagation(), { passive: true }));

  const menu = cornerMenu(stage, {
    title: menuTitle,
    items: stops.map((s) => ({ id: s.id, label: s.label, icon: s.icon })),
    onSelect: (id) => go(id),
  });

  const camAt = (s) => [s.at[0], s.eyeY ?? eye, s.at[1]];
  function draw() {
    const s = stops[cur];
    nav.innerHTML = `<button class="btn wn-prev" ${cur <= 0 ? 'disabled' : ''} aria-label="Предишна спирка">←</button>
      <span class="wn-lbl">${s ? `${esc(s.icon || '')} ${esc(s.label)}` : 'Разходка'} <small>${cur + 1}/${stops.length}</small></span>
      <button class="btn wn-next" ${cur >= stops.length - 1 ? 'disabled' : ''} aria-label="Следваща спирка">→</button>`;
    nav.querySelector('.wn-prev').addEventListener('click', () => prev());
    nav.querySelector('.wn-next').addEventListener('click', () => next());
  }

  // Върви през междинните спирки, за да не минава камерата през стени.
  function go(target) {
    const to = typeof target === 'number' ? target : stops.findIndex((s) => s.id === target);
    if (to < 0 || to === cur || busy) return;
    const path = [];
    if (cur < 0) path.push(to);
    else { const dir = to > cur ? 1 : -1; for (let i = cur + dir; dir > 0 ? i <= to : i >= to; i += dir) path.push(i); }
    busy = true;
    const stepTo = () => {
      const i = path.shift();
      const s = stops[i];
      const d = cur < 0 ? 1 : Math.hypot(s.at[0] - stops[cur].at[0], s.at[1] - stops[cur].at[1]);
      const dur = Math.min(1.6, Math.max(0.5, d * 0.22)) * (path.length ? 0.7 : 1);
      stage.stopFollow();
      stage.flyTo(camAt(s), s.look, dur);
      cur = i;
      draw();
      setTimeout(() => {
        if (path.length) return stepTo();
        busy = false;
        menu.setActive(s.id);
        onArrive && onArrive(s);
      }, dur * 1000 + 30);
    };
    stepTo();
  }
  const next = () => go(Math.min(cur + 1, stops.length - 1));
  const prev = () => go(Math.max(cur - 1, 0));
  draw();

  return {
    go, next, prev, menu,
    get current() { return stops[cur]; },
    get busy() { return busy; },
    mark(id) { menu.mark(id); },
    showNav(on) { nav.hidden = !on; menu.show(on); },
    dispose() { nav.remove(); menu.remove(); },
  };
}
