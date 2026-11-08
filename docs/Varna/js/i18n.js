// Език на играта: български по подразбиране, английски с бутона БГ/EN.
// Изборът се пази в браузъра; ?lang=en в адреса го задава еднократно.
// Малък вграден скрипт в <head> слага <html lang> още преди страницата да се покаже.
const KEY = 'varna-lang';

export function detectLang() {
  const q = new URLSearchParams(location.search).get('lang');
  if (q === 'en' || q === 'bg') return q;
  try {
    const v = localStorage.getItem(KEY);
    if (v === 'en' || v === 'bg') return v;
  } catch (e) { /* няма значение */ }
  return 'bg';
}

export const lang = detectLang();
document.documentElement.lang = lang;

export const EN = lang === 'en';
export const tr = (bg, en) => (EN ? en : bg);

// В английския режим полетата name_en, desc_en… заместват name, desc…
export function localize(...lists) {
  if (!EN) return;
  for (const list of lists) {
    for (const obj of Array.isArray(list) ? list : Object.values(list)) {
      for (const key of Object.keys(obj)) {
        if (key.endsWith('_en')) obj[key.slice(0, -3)] = obj[key];
      }
    }
  }
}

// Атрибутите title, aria-label и placeholder в HTML имат английски вариант в data-en-*.
export function localizeDom(root = document) {
  if (!EN) return;
  for (const attr of ['title', 'aria-label', 'placeholder']) {
    root.querySelectorAll(`[data-en-${attr}]`).forEach(el => el.setAttribute(attr, el.getAttribute(`data-en-${attr}`)));
  }
  const t = document.querySelector('meta[name="title-en"]');
  if (t) document.title = t.content;
}

// Сменя езика и презарежда страницата. beforeReload записва играта.
export function setLang(l, beforeReload) {
  if (l === lang) return;
  try { localStorage.setItem(KEY, l); } catch (e) { /* няма значение */ }
  if (beforeReload) beforeReload();
  const u = new URL(location.href);
  u.searchParams.delete('lang');
  history.replaceState(null, '', u);
  location.reload();
}

export function langSwitch(el, beforeReload) {
  el.innerHTML = '<button type="button" data-l="bg">БГ</button><button type="button" data-l="en">EN</button>';
  el.querySelectorAll('[data-l]').forEach(b => {
    b.setAttribute('aria-pressed', String(b.dataset.l === lang));
    b.onclick = () => setLang(b.dataset.l, beforeReload);
  });
}
