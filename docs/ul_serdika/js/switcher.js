// Style switcher for the 20 Serdika St walk: realistic, after Van Gogh, after the Master.
// Each style is its own page; when you switch, your place, view, time and season travel in the URL (#x=…&z=…).

const PAGES = [
  { id: 'real', dir: 'ul_serdika', bg: 'Истински', en: 'Realistic' },
  { id: 'vangogh', dir: 'ul_serdika_vangogh', bg: 'Ван Гог', en: 'Van Gogh' },
  { id: 'maistora', dir: 'ul_serdika_maistora', bg: 'Майстора', en: 'The Master' },
];
const LABEL = { bg: 'Стил', en: 'Style' };

// Fills every element with a data-styles attribute. getState() returns the walk's state, or null before it is ready.
export function mountSwitcher(current, lang, getState) {
  for (const el of document.querySelectorAll('[data-styles]')) {
    el.textContent = '';
    const label = document.createElement('span');
    label.className = 'styles-label';
    label.textContent = LABEL[lang] || LABEL.bg;
    const group = document.createElement('div');
    group.className = 'styles-group';
    group.setAttribute('role', 'group');
    group.setAttribute('aria-label', label.textContent);
    for (const p of PAGES) {
      const a = document.createElement('a');
      a.href = `../${p.dir}/`;
      a.textContent = p[lang] || p.bg;
      if (p.id === current) a.setAttribute('aria-current', 'page');
      a.addEventListener('click', (e) => {
        if (p.id === current) { e.preventDefault(); return; }
        const st = getState && getState();
        if (st) { e.preventDefault(); location.href = a.href + '#' + new URLSearchParams(st).toString(); }
      });
      group.appendChild(a);
    }
    el.append(label, group);
  }
}

// moves to the previous (-1) or next (+1) style, keeping the walk's state
export function goStyle(current, delta, getState) {
  const i = PAGES.findIndex((p) => p.id === current);
  const p = PAGES[(i + delta + PAGES.length) % PAGES.length];
  const st = getState && getState();
  location.href = `../${p.dir}/` + (st ? '#' + new URLSearchParams(st).toString() : '');
}

export function readState() {
  const h = location.hash.slice(1);
  if (!h) return null;
  const p = new URLSearchParams(h);
  const num = (k) => parseFloat(p.get(k));
  const st = { x: num('x'), z: num('z'), yaw: num('yaw'), pitch: num('pitch'), h: num('h'), s: p.get('s'), r: p.get('r'), go: p.get('go') === '1' };
  return Number.isFinite(st.x) && Number.isFinite(st.z) ? st : null;
}

export function clearState() {
  try { history.replaceState(null, '', location.pathname + location.search); } catch { /* ignore */ }
}
