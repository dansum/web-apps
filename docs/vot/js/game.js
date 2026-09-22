/* Твоята партия — цялата игра. Без зависимости, без сървър. */
(function () {
'use strict';

var EMOJIS = ['🌱', '⭐', '🐝', '🔧', '📚', '🏔️', '🧭', '☀️', '🦉', '🚲'];
var COLORS = ['#e0663a', '#3f9ae0', '#59b36b', '#b45fd1', '#d9a441', '#e05a7d', '#3fb8ad', '#8d8fe0'];
var TURNS = 10;
var SEATS = 240;
var MAJORITY = 121;
var THRESHOLD = 4;
var SOFT_CAP = 95;      /* мек таван: последните проценти се свиват най-силно */
var SILENT = 20;        /* частта от рейтинга, която никога не става бюлетина */
var GAIN = 2.2;         /* колко бързо се изчерпва растежът нагоре */
var AXIS_RANGE = 20;    /* докъде стига компасът по всяка ос */
var STORE_KEY = 'tvoyata-partiya.best';
var THEME_KEY = 'tvoyata-partiya.theme';

var MODES = [
  { id: 'mix', icon: '🔀', name: 'Микс', line: 'Истински и измислени ситуации заедно — всичките 83.' },
  { id: 'real', icon: '📰', name: 'Само истински', line: '30 истории от последните пет години в България.' },
  { id: 'fiction', icon: '🎭', name: 'Само измислени', line: '53 ситуации, които спокойно биха могли да се случат.' }
];

var QUADRANTS = [
  { x: -1, y: -1, name: 'Силна държава' },
  { x: 1, y: -1, name: 'Пазар и ред' },
  { x: -1, y: 1, name: 'Социална свобода' },
  { x: 1, y: 1, name: 'Свободен избор' }
];

var el = function (id) { return document.getElementById(id); };
var state = null;

/* ---------------- помощни ---------------- */

function clamp(n, lo, hi) { return n < lo ? lo : n > hi ? hi : n; }

/* Върху светъл цвят пишем тъмно, върху тъмен — светло. */
function setAccent(color) {
  var r = parseInt(color.substr(1, 2), 16), g = parseInt(color.substr(3, 2), 16), b = parseInt(color.substr(5, 2), 16);
  var lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  var root = document.documentElement.style;
  root.setProperty('--accent', color);
  root.setProperty('--btn-text', lum > 0.62 ? '#12151d' : '#ffffff');
}

function groupById(id) {
  for (var i = 0; i < GROUPS.length; i++) if (GROUPS[i].id === id) return GROUPS[i];
  return null;
}

function shuffle(arr) {
  var a = arr.slice();
  for (var i = a.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var t = a[i]; a[i] = a[j]; a[j] = t;
  }
  return a;
}

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

var REDUCED = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* На телефон новата карта се появява под сгъвката — водим погледа до нея. */
function scrollToCard(node) {
  if (node.scrollIntoView) node.scrollIntoView({ block: 'start', behavior: REDUCED ? 'auto' : 'smooth' });
}

function show(screenId) {
  var screens = document.querySelectorAll('.screen');
  for (var i = 0; i < screens.length; i++) screens[i].classList.remove('active');
  el(screenId).classList.add('active');
  window.scrollTo(0, 0);
}

function readBest() {
  try { return JSON.parse(localStorage.getItem(STORE_KEY) || 'null'); } catch (e) { return null; }
}

function writeBest(obj) {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(obj)); } catch (e) { /* без запис е също игра */ }
}

/* „с“ или „със“: „със“ върви пред дума, която започва със „с“ или „з“ —
   а числото се брои по това как се чете (със сто и шест, но с шейсет). */
function numberWords(n) {
  var ones = ['нула', 'едно', 'две', 'три', 'четири', 'пет', 'шест', 'седем', 'осем', 'девет', 'десет',
    'единайсет', 'дванайсет', 'тринайсет', 'четиринайсет', 'петнайсет', 'шестнайсет',
    'седемнайсет', 'осемнайсет', 'деветнайсет'];
  var tens = ['', '', 'двайсет', 'трийсет', 'четирийсет', 'петдесет', 'шейсет', 'седемдесет', 'осемдесет', 'деветдесет'];
  var hundreds = ['', 'сто', 'двеста', 'триста', 'четиристотин', 'петстотин', 'шестстотин',
    'седемстотин', 'осемстотин', 'деветстотин'];
  if (n < 20) return ones[n];
  if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' и ' + ones[n % 10] : '');
  var rest = n % 100;
  /* „и“ стои пред последната част: сто и шест, но сто двайсет и едно. */
  return hundreds[Math.floor(n / 100)] +
    (rest ? (rest < 20 || rest % 10 === 0 ? ' и ' : ' ') + numberWords(rest) : '');
}

function sWith(word) {
  var first = String(word).replace(/^[^А-Яа-яA-Za-z0-9]+/, '').charAt(0).toLowerCase();
  return (first === 'с' || first === 'з') ? 'със' : 'с';
}

function sWithNumber(n) { return sWith(numberWords(n)); }

/* ---------------- тема ---------------- */

function applyTheme(name) {
  document.documentElement.setAttribute('data-theme', name);
  el('themeIcon').textContent = name === 'light' ? '🌙' : '☀️';
  el('themeBtn').setAttribute('aria-label', name === 'light' ? 'Тъмна тема' : 'Светла тема');
  try { localStorage.setItem(THEME_KEY, name); } catch (e) { /* няма страшно */ }
}

function initTheme() {
  var saved = null;
  try { saved = localStorage.getItem(THEME_KEY); } catch (e) { /* няма страшно */ }
  if (!saved) {
    var light = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
    saved = light ? 'light' : 'dark';
  }
  applyTheme(saved);
}

/* ---------------- сметките ---------------- */

/* Растежът се забавя нагоре: колкото повече хора вече са с теб в една група,
   толкова по-малко носи следващото добро решение. Загубите се броят изцяло. */
function applyRating(cur, d) {
  if (d <= 0) return clamp(cur + d, 0, 100);
  return clamp(cur + d * Math.min(1, (1 - cur / 100) * GAIN), 0, 100);
}

function weighted() {
  var sum = 0;
  for (var i = 0; i < GROUPS.length; i++) sum += state.ratings[GROUPS[i].id] * GROUPS[i].weight;
  return sum / 100;
}

/* Рейтингът показва колко харесват партията, доверието — колко от тях наистина
   отиват до урната. Накрая всичко минава през мек таван: първите проценти се
   печелят лесно, всеки следващ — все по-трудно. */
function projectedShare() {
  var turnout = 0.7 + 0.6 * (state.trust / 100);
  var raw = Math.max(0, (weighted() - SILENT) * turnout);
  return SOFT_CAP * Math.tanh(raw / SOFT_CAP);
}

function positionWords(e, p) {
  var econ = Math.abs(e) < 3 ? 'по средата по икономика'
    : (e > 0 ? (e > 11 ? 'силно за пазарна свобода' : 'по-скоро за пазарна свобода')
             : (e < -11 ? 'силно за държавна намеса' : 'по-скоро за държавна намеса'));
  var pers = Math.abs(p) < 3 ? 'по средата по лични свободи'
    : (p > 0 ? (p > 11 ? 'силно за лични свободи' : 'по-скоро за лични свободи')
             : (p < -11 ? 'силно за ред и ограничения' : 'по-скоро за ред и ограничения'));
  return econ + ', ' + pers;
}

/* ---------------- създаване на партия ---------------- */

var draft = { name: '', slogan: '', emoji: EMOJIS[0], color: COLORS[0], cause: null, mode: 'mix' };

function radioRow(host, items, current, onPick, render) {
  host.innerHTML = '';
  items.forEach(function (it) {
    var b = document.createElement('button');
    b.type = 'button';
    b.setAttribute('role', 'radio');
    b.setAttribute('aria-checked', current === it.id ? 'true' : 'false');
    render(b, it, current === it.id);
    b.onclick = function () { onPick(it); };
    host.appendChild(b);
  });
}

function buildCreateScreen() {
  var row = el('emojiRow');
  row.innerHTML = '';
  EMOJIS.forEach(function (e) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip emoji-chip' + (draft.emoji === e ? ' on' : '');
    b.textContent = e;
    b.setAttribute('role', 'radio');
    b.setAttribute('aria-checked', draft.emoji === e ? 'true' : 'false');
    b.setAttribute('aria-label', 'Знак ' + e);
    b.onclick = function () { draft.emoji = e; buildCreateScreen(); };
    row.appendChild(b);
  });

  var crow = el('colorRow');
  crow.innerHTML = '';
  COLORS.forEach(function (c, i) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip color-chip' + (draft.color === c ? ' on' : '');
    b.style.background = c;
    b.setAttribute('role', 'radio');
    b.setAttribute('aria-checked', draft.color === c ? 'true' : 'false');
    b.setAttribute('aria-label', 'Цвят ' + (i + 1));
    b.onclick = function () {
      draft.color = c;
      setAccent(c); /* цветът се вижда веднага */
      buildCreateScreen();
    };
    crow.appendChild(b);
  });

  radioRow(el('causeRow'), CAUSES, draft.cause, function (c) { draft.cause = c.id; buildCreateScreen(); },
    function (b, c, on) {
      b.className = 'cause' + (on ? ' on' : '');
      var bonus = Object.keys(c.eff).map(function (g) {
        return groupById(g).icon + ' ' + (c.eff[g] > 0 ? '+' : '') + c.eff[g];
      }).join('  ');
      b.innerHTML = '<span class="cause-icon" aria-hidden="true">' + c.icon + '</span>' +
        '<span class="cause-body"><b>' + esc(c.name) + '</b><em>' + esc(c.line) + '</em>' +
        '<span class="cause-bonus">' + bonus + '</span></span>';
    });

  radioRow(el('modeRow'), MODES, draft.mode, function (m) { draft.mode = m.id; buildCreateScreen(); },
    function (b, m, on) {
      b.className = 'cause' + (on ? ' on' : '');
      b.innerHTML = '<span class="cause-icon" aria-hidden="true">' + m.icon + '</span>' +
        '<span class="cause-body"><b>' + esc(m.name) + '</b><em>' + esc(m.line) + '</em></span>';
    });

  el('foundBtn').disabled = !(el('pName').value.trim() && draft.cause);
}

/* ---------------- начало на игра ---------------- */

function pickEvents(mode) {
  var pool = EVENTS.filter(function (e) {
    return mode === 'mix' || (mode === 'real' ? e.real : !e.real);
  });
  var by = { early: [], mid: [], late: [] };
  pool.forEach(function (e) { by[e.pool].push(e); });
  return shuffle(by.early).slice(0, 3)
    .concat(shuffle(by.mid).slice(0, 4))
    .concat(shuffle(by.late).slice(0, 3));
}

function startGame() {
  var cause = CAUSES.filter(function (c) { return c.id === draft.cause; })[0];
  state = {
    party: {
      name: el('pName').value.trim() || 'Нова партия',
      slogan: el('pSlogan').value.trim(),
      emoji: draft.emoji, color: draft.color, cause: cause
    },
    mode: draft.mode,
    ratings: {}, trust: 50, turn: 0,
    econ: 0, pers: 0, path: [{ e: 0, p: 0, label: 'учредяване' }],
    events: pickEvents(draft.mode), log: []
  };
  GROUPS.forEach(function (g) {
    state.ratings[g.id] = clamp(START_RATING + (cause.eff[g.id] || 0), 0, 100);
  });
  setAccent(state.party.color);
  el('backBtn').hidden = false;
  el('turnBadge').hidden = false;
  el('statsBtn').hidden = false;
  renderStats();
  show('screen-play');
  renderEvent();
}

/* ---------------- ход ---------------- */

function renderEvent() {
  var ev = state.events[state.turn];
  el('turnNow').textContent = state.turn + 1;
  el('newsTag').textContent = ev.tag;
  el('newsEmoji').textContent = ev.emoji;
  el('newsHead').textContent = ev.headline;
  el('newsBody').textContent = ev.body;

  var badge = el('realBadge');
  badge.hidden = !ev.real;
  if (ev.real) badge.textContent = 'истинска история · ' + ev.when;

  var list = el('optionList');
  list.innerHTML = '';
  ev.options.forEach(function (opt, i) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'option' + (i === ev.options.length - 1 ? ' option-skip' : '');
    b.innerHTML = '<span class="option-key" aria-hidden="true">' + (i === ev.options.length - 1 ? '–' : i + 1) + '</span>' +
      '<span>' + esc(opt.label) + '</span>';
    b.onclick = function () { choose(ev, opt, i); };
    list.appendChild(b);
  });

  el('newsCard').hidden = false;
  el('outcomeCard').hidden = true;
  scrollToCard(el('newsCard'));
}

function choose(ev, opt, index) {
  var deltas = [];
  Object.keys(opt.eff || {}).forEach(function (gid) {
    var before = state.ratings[gid];
    state.ratings[gid] = applyRating(before, opt.eff[gid]);
    deltas.push({ group: groupById(gid), value: Math.round(state.ratings[gid] - before) });
  });
  var trustBefore = state.trust;
  state.trust = clamp(state.trust + (opt.trust || 0), 0, 100);
  var trustDelta = state.trust - trustBefore;

  var ax = opt.ax || [0, 0];
  state.econ = clamp(state.econ + ax[0], -AXIS_RANGE, AXIS_RANGE);
  state.pers = clamp(state.pers + ax[1], -AXIS_RANGE, AXIS_RANGE);
  state.path.push({ e: state.econ, p: state.pers, label: ev.headline });

  state.log.push({
    headline: ev.headline,
    choice: opt.label,
    real: !!ev.real,
    skipped: index === ev.options.length - 1
  });

  deltas.sort(function (a, b) { return b.value - a.value; });

  el('outcomeText').textContent = opt.result;
  el('factText').textContent = ev.fact;
  el('factLabel').textContent = ev.real ? 'Какво стана наистина' : 'Знаеш ли?';
  el('factText').textContent = ev.real ? ev.fact.replace(/^Какво стана наистина:\s*/, '') : ev.fact;
  el('outcomeTitle').textContent = index === ev.options.length - 1 ? 'Не реагирахте' : 'Какво се случи';

  var dl = el('deltaList');
  dl.innerHTML = '';
  deltas.forEach(function (d) {
    if (!d.value) return;
    var s = document.createElement('span');
    s.className = 'delta ' + (d.value > 0 ? 'up' : 'down');
    s.textContent = d.group.icon + ' ' + d.group.name + ' ' + (d.value > 0 ? '+' : '') + d.value;
    dl.appendChild(s);
  });
  if (trustDelta) {
    var t = document.createElement('span');
    t.className = 'delta ' + (trustDelta > 0 ? 'up' : 'down');
    t.textContent = '🤝 Доверие ' + (trustDelta > 0 ? '+' : '') + trustDelta;
    dl.appendChild(t);
  }
  if (ax[0] || ax[1]) {
    var c = document.createElement('span');
    c.className = 'delta axis';
    c.textContent = '🧭 ' + (ax[0] ? (ax[0] > 0 ? 'пазар ' : 'държава ') : '') +
      (ax[1] ? (ax[1] > 0 ? 'свободи' : 'ред') : '');
    dl.appendChild(c);
  }
  if (!dl.children.length) dl.innerHTML = '<span class="delta flat">Нищо не се промени</span>';

  state.turn++;
  el('nextBtn').textContent = state.turn >= TURNS ? 'Изборна нощ' : 'Следваща новина';
  renderStats();
  el('newsCard').hidden = true;
  el('outcomeCard').hidden = false;
  scrollToCard(el('outcomeCard'));
}

function nextTurn() {
  if (state.turn >= TURNS) runElection();
  else renderEvent();
}

/* ---------------- табло ---------------- */

function renderStats() {
  var head = el('partyHead');
  head.innerHTML = '<span class="party-emoji" aria-hidden="true">' + state.party.emoji + '</span>' +
    '<span><b>' + esc(state.party.name) + '</b>' +
    (state.party.slogan ? '<em>„' + esc(state.party.slogan) + '“</em>' : '') + '</span>';

  el('trustVal').textContent = Math.round(state.trust);
  el('trustBar').style.width = state.trust + '%';

  var box = el('groupBars');
  box.innerHTML = '';
  GROUPS.forEach(function (g) {
    var v = state.ratings[g.id];
    var d = document.createElement('div');
    d.className = 'meter';
    d.innerHTML = '<div class="meter-top"><span title="' + esc(g.about) + '">' + g.icon + ' ' + g.name +
      ' <i class="wt">' + g.weight + '%</i></span><b>' + Math.round(v) + '</b></div>' +
      '<div class="bar"><i style="width:' + v + '%"></i></div>';
    box.appendChild(d);
  });

  el('pollVal').textContent = projectedShare().toFixed(1) + '%';
}

/* ---------------- компасът ---------------- */

function compassSVG(opts) {
  var S = 320, C = 160, R = 130;
  var k = R / AXIS_RANGE;
  var px = function (v) { return C + v * k; };
  var py = function (v) { return C + v * k; };   /* надолу = повече лични свободи */
  var out = ['<svg viewBox="0 0 ' + S + ' ' + S + '" class="compass" role="img" ' +
    'aria-label="Компас: икономическа свобода и лични свободи">'];

  out.push('<rect x="' + (C - R) + '" y="' + (C - R) + '" width="' + (2 * R) + '" height="' + (2 * R) +
    '" rx="10" class="c-plot"/>');
  for (var g = -AXIS_RANGE + 5; g < AXIS_RANGE; g += 5) {
    out.push('<line x1="' + px(g) + '" y1="' + (C - R) + '" x2="' + px(g) + '" y2="' + (C + R) + '" class="c-grid"/>');
    out.push('<line x1="' + (C - R) + '" y1="' + py(g) + '" x2="' + (C + R) + '" y2="' + py(g) + '" class="c-grid"/>');
  }
  out.push('<line x1="' + (C - R) + '" y1="' + C + '" x2="' + (C + R) + '" y2="' + C + '" class="c-axis"/>');
  out.push('<line x1="' + C + '" y1="' + (C - R) + '" x2="' + C + '" y2="' + (C + R) + '" class="c-axis"/>');

  QUADRANTS.forEach(function (q) {
    out.push('<text x="' + px(q.x * 12) + '" y="' + py(q.y * 17) + '" class="c-quad" text-anchor="middle">' +
      q.name + '</text>');
  });

  out.push('<text x="' + C + '" y="' + (C - R - 8) + '" class="c-axis-label" text-anchor="middle">повече ред и ограничения</text>');
  out.push('<text x="' + C + '" y="' + (C + R + 18) + '" class="c-axis-label" text-anchor="middle">повече лични свободи</text>');
  out.push('<text x="' + (C - R) + '" y="' + (C - 6) + '" class="c-axis-label" text-anchor="start">държава</text>');
  out.push('<text x="' + (C + R) + '" y="' + (C - 6) + '" class="c-axis-label" text-anchor="end">пазар</text>');

  if (opts.rivals) {
    RIVALS.forEach(function (r) {
      out.push('<circle cx="' + px(r.pos[0]) + '" cy="' + py(r.pos[1]) + '" r="5" fill="' + r.color + '" opacity=".75"/>');
      out.push('<text x="' + px(r.pos[0]) + '" y="' + (py(r.pos[1]) - 9) + '" class="c-rival" text-anchor="middle">' +
        esc(r.name) + '</text>');
    });
  }

  var path = opts.path || [];
  if (path.length > 1) {
    out.push('<polyline class="c-path" points="' + path.map(function (pt) {
      return px(pt.e) + ',' + py(pt.p);
    }).join(' ') + '"/>');
    path.slice(0, -1).forEach(function (pt) {
      out.push('<circle cx="' + px(pt.e) + '" cy="' + py(pt.p) + '" r="3" class="c-step"/>');
    });
  }
  var last = path[path.length - 1] || { e: 0, p: 0 };
  out.push('<circle cx="' + px(last.e) + '" cy="' + py(last.p) + '" r="11" class="c-me" fill="' +
    (opts.color || 'var(--accent)') + '"/>');
  out.push('<text x="' + px(last.e) + '" y="' + (py(last.p) + 5) + '" text-anchor="middle" font-size="12">' +
    (opts.emoji || '●') + '</text>');

  out.push('</svg>');
  return out.join('');
}

function compassBlock(withRivals) {
  return '<div class="compass-wrap">' +
    compassSVG({ path: state.path, emoji: state.party.emoji, color: state.party.color, rivals: withRivals }) +
    '</div>' +
    '<p class="compass-line"><b>Къде сте:</b> ' + positionWords(state.econ, state.pers) + '.</p>' +
    '<p class="compass-note">Всяко решение мести точката. Линията показва пътя от учредяването досега' +
    (withRivals ? ', а цветните точки са другите партии' : '') + '.</p>';
}

function openStats() {
  var b = el('statsBody');
  var skips = state.log.filter(function (l) { return l.skipped; }).length;
  var html = compassBlock(true);

  html += '<div class="stats-grid">';
  html += '<div><h4>Рейтинг по групи</h4>';
  GROUPS.forEach(function (g) {
    var v = state.ratings[g.id];
    html += '<div class="meter"><div class="meter-top"><span>' + g.icon + ' ' + g.name +
      ' <i class="wt">' + g.weight + '%</i></span><b>' + Math.round(v) + '</b></div>' +
      '<div class="bar"><i style="width:' + v + '%"></i></div></div>';
  });
  html += '<p class="compass-note">Колкото по-висок е рейтингът в една група, толкова по-малко носи следващият плюс. ' +
    'Първите проценти се печелят лесно, последните — трудно.</p></div>';

  html += '<div><h4>Общо</h4><ul class="facts-list">' +
    '<li>Ход: <b>' + Math.min(state.turn + 1, TURNS) + '</b> от ' + TURNS + '</li>' +
    '<li>Доверие: <b>' + Math.round(state.trust) + '</b>/100</li>' +
    '<li>Прогноза за вота: <b>' + projectedShare().toFixed(1) + '%</b></li>' +
    '<li>Без реакция: <b>' + skips + '</b> пъти</li>' +
    '<li>Истории: <b>' + (state.mode === 'real' ? 'само истински' : state.mode === 'fiction' ? 'само измислени' : 'микс') + '</b></li>' +
    '</ul>';
  if (state.log.length) {
    html += '<h4>Решенията досега</h4><div class="log">';
    state.log.forEach(function (l, i) {
      html += '<div class="log-row' + (l.skipped ? ' skipped' : '') + '"><b>' + (i + 1) + '. ' +
        esc(l.headline) + (l.real ? ' <i class="real-mark">истинско</i>' : '') + '</b><span>' + esc(l.choice) + '</span></div>';
    });
    html += '</div>';
  }
  html += '</div></div>';

  b.innerHTML = html;
  el('statsOverlay').hidden = false;
  el('closeStats').focus();
}

/* ---------------- избори ---------------- */

function distributeSeats(parties) {
  var passing = parties.filter(function (p) { return !p.other && p.share >= THRESHOLD; });
  var total = passing.reduce(function (s, p) { return s + p.share; }, 0);
  var rest = [], given = 0;
  passing.forEach(function (p) {
    var exact = p.share / total * SEATS;
    p.seats = Math.floor(exact);
    given += p.seats;
    rest.push({ p: p, frac: exact - p.seats });
  });
  rest.sort(function (a, b) { return b.frac - a.frac; });
  for (var i = 0; given < SEATS; i++, given++) rest[i % rest.length].p.seats++;
  parties.forEach(function (p) { if (p.other || p.share < THRESHOLD) p.seats = 0; });
}

function runElection() {
  el('turnBadge').hidden = true;

  var mine = projectedShare();
  var remainder = 100 - mine;
  var parties = [{
    name: state.party.name, emoji: state.party.emoji, color: state.party.color,
    share: mine, mine: true
  }];

  /* Съперниците имат свои размери и се свиват, когато партията на играча расте:
     гласовете са общо 100 и всеки процент за някого е процент по-малко за друг. */
  var baseSum = RIVALS.reduce(function (s, r) { return s + r.share; }, 0) + OTHERS_SHARE;
  var scale = remainder / baseSum;
  var noisy = RIVALS.map(function (r) {
    return { r: r, w: r.share * scale * (0.9 + Math.random() * 0.2) };
  });
  var others = OTHERS_SHARE * scale;
  var norm = remainder / (noisy.reduce(function (s, n) { return s + n.w; }, 0) + others);
  noisy.forEach(function (n) {
    parties.push({
      name: n.r.name, emoji: n.r.emoji, color: n.r.color,
      share: n.w * norm, rival: n.r
    });
  });
  parties.push({ name: 'Други партии', emoji: '▫️', color: '#7b849b', share: others * norm, other: true });

  parties.sort(function (a, b) { return b.share - a.share; });
  distributeSeats(parties);

  state.result = { parties: parties, mine: parties.filter(function (p) { return p.mine; })[0] };
  renderResult();
  show('screen-result');

  var best = readBest();
  if (!best || mine > best.share) {
    writeBest({ share: Math.round(mine * 10) / 10, name: state.party.name, date: new Date().toISOString().slice(0, 10) });
  }
}

function renderResult() {
  var parties = state.result.parties;
  var me = state.result.mine;
  var first = parties[0];
  var place = parties.indexOf(me) + 1;
  var ordinals = ['', 'първа', 'втора', 'трета', 'четвърта', 'пета', 'шеста'];

  var lead;
  if (me.share < THRESHOLD) {
    lead = 'Партията ви остава под прага от 4% и няма депутати. Гласовете ви обаче са истински хора — ' +
      'и следващите избори са след най-много четири години.';
  } else if (place === 1) {
    lead = 'Партията ви е първа политическа сила ' + sWithNumber(me.seats) + ' ' + me.seats +
      ' депутати от 240. За мнозинство трябват 121.';
  } else {
    lead = 'Партията ви влиза в парламента ' + sWithNumber(me.seats) + ' ' + me.seats + ' депутати и е ' +
      (ordinals[place] || place + '-та') + ' сила. Първи е „' + first.name + '“.';
  }
  el('resultLead').textContent = lead;

  var box = el('resultTable');
  box.innerHTML = '';
  var max = parties[0].share;
  parties.forEach(function (p) {
    var row = document.createElement('div');
    row.className = 'res-row' + (p.mine ? ' mine' : '');
    row.innerHTML =
      '<span class="res-name">' + p.emoji + ' ' + esc(p.name) + (p.mine ? ' <i>(вие)</i>' : '') + '</span>' +
      '<span class="res-bar"><i style="width:' + (p.share / max * 100) + '%;background:' + p.color + '"></i></span>' +
      '<span class="res-num">' + p.share.toFixed(1) + '%</span>' +
      '<span class="res-seats">' + (p.seats ? p.seats + ' места' : 'под прага') + '</span>';
    box.appendChild(row);
  });

  el('coalitionBox').hidden = true;
  el('endingBox').hidden = true;
  el('logBox').hidden = true;

  var winner = parties.filter(function (p) { return p.seats >= MAJORITY; })[0];

  if (me.share < THRESHOLD) ending('Оставате извън парламента', 'out');
  else if (me.seats >= MAJORITY) ending('Самостоятелно мнозинство', 'solo');
  else if (winner) ending('Друга партия има мнозинство', 'otherMajority', winner);
  else offerCoalition(me, place, parties);
}

/* Преговорите: партиите казват какво искат, играчът решава дали цената струва. */
function offerCoalition(me, place, parties) {
  var leadsTalks = place === 1;
  var withSeats = parties.filter(function (p) {
    return !p.mine && !p.other && p.seats > 0;
  }).sort(function (a, b) { return b.seats - a.seats; });
  var workable = withSeats.filter(function (p) { return me.seats + p.seats >= MAJORITY; });

  /* Който не води преговорите и с никого не стига до 121, няма какво да реши:
     мнозинството се събира без него. */
  if (!leadsTalks && !workable.length) { ending('Оставате в опозиция', 'noOffer'); return; }

  var candidates = leadsTalks ? withSeats : workable;

  el('coalitionBox').hidden = false;
  el('coalitionTitle').textContent = leadsTalks
    ? 'Мандатът е ваш. Сега трябва мнозинство: 121 места.'
    : 'Без вас мнозинство не се събира.';
  el('coalitionLead').textContent = leadsTalks
    ? 'Имате ' + me.seats + ' места. Президентът връчва първия мандат на най-голямата група. ' +
      'Всяка партия идва със своите условия — и никоя не влиза в правителство безплатно.'
    : 'Имате ' + me.seats + ' места и не вие водите преговорите. Но числата на другите не излизат ' +
      'без вашите гласове, затова условията идват при вас.';

  var box = el('coalitionOptions');
  box.innerHTML = '';
  candidates.forEach(function (p) {
    var together = me.seats + p.seats;
    var enough = together >= MAJORITY;
    var junior = p.seats > me.seats;
    var card = document.createElement('div');
    card.className = 'offer' + (enough ? '' : ' offer-weak');
    card.innerHTML = '<h4>' + p.emoji + ' ' + esc(p.name) + ' — ' + p.seats + ' места' +
      '<span class="offer-sum">' + (enough ? 'заедно: ' + together + ' ✔' : 'заедно: ' + together + ' — не стигат') + '</span></h4>' +
      '<p class="offer-line">' + esc(p.rival.line) + '</p>' +
      '<p class="offer-label">Иска в замяна:</p><ul>' +
      p.rival.demands.map(function (d) { return '<li>' + esc(d) + '</li>'; }).join('') + '</ul>' +
      '<p class="offer-label">Предлага ви:</p><p>' + esc(p.rival.gives) + '</p>';
    if (enough) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'big-btn';
      b.textContent = junior ? 'Влизаме като по-малък партньор' : 'Приемаме условията';
      b.onclick = function () { acceptCoalition(p, !junior); };
      card.appendChild(b);
    }
    box.appendChild(card);
  });

  var no = document.createElement('button');
  no.type = 'button';
  no.className = 'option option-skip';
  no.innerHTML = '<span class="option-key" aria-hidden="true">–</span><span>' +
    (leadsTalks ? 'Без коалиция — опитваме с управление без мнозинство'
                : 'Отказваме условията и оставаме в опозиция') + '</span>';
  no.onclick = function () { ending(leadsTalks ? 'Управление без мнозинство' : 'Оставате в опозиция',
    leadsTalks ? 'minority' : 'opposition'); };
  box.appendChild(no);
}

function acceptCoalition(partner, leadsTalks) {
  /* Коалицията мести партията към партньора — това се вижда на компаса. */
  state.econ = clamp(state.econ + (partner.rival.pos[0] - state.econ) * 0.35, -AXIS_RANGE, AXIS_RANGE);
  state.pers = clamp(state.pers + (partner.rival.pos[1] - state.pers) * 0.35, -AXIS_RANGE, AXIS_RANGE);
  state.path.push({ e: state.econ, p: state.pers, label: 'коалиция' });
  ending(leadsTalks ? 'Имате правителство' : 'Влизате в управлението', leadsTalks ? 'coalition' : 'junior', partner);
}

function ending(title, kind, partner) {
  el('coalitionBox').hidden = true;
  el('endingTitle').textContent = title;
  var me = state.result.mine;

  var texts = {
    solo: 'Рядко и трудно: 121 или повече депутати сами. Можете да управлявате без партньор — и нямате на кого да прехвърлите отговорността.',
    coalition: 'Подписвате споразумение ' + (partner ? sWith(partner.name) : 'с') + ' „' + (partner ? partner.name : '') +
      '“. Част от програмата ви остава за следващия път, ' +
      'защото в коалиция никой не получава всичко. Погледнете компаса: правителството ви стои на друго място от партията ви преди изборите.',
    junior: 'Влизате в правителство като по-малък партньор на „' + (partner ? partner.name : '') + '“. ' +
      'Имате министерства и влияние, но дневния ред определя друг. Компасът ви се измести към тях — това е цената на участието.',
    minority: 'Управлявате с по-малко от 121 гласа и събирате мнозинство за всеки отделен закон поотделно. ' +
      'Възможно е — правителства на малцинството е имало и у нас, и в Европа. Но всяко гласуване е нов преговор, ' +
      'бюджетът минава трудно, а един успешен вот на недоверие стига, за да се стигне до политическа криза и нови избори още същата година.',
    opposition: 'Опозицията не е загубено място: внасяте законопроекти, задавате въпроси на министрите в петък, ' +
      'работите в комисии и наблюдавате как се харчат парите. Много закони се променят именно оттам.',
    otherMajority: '„' + (partner ? partner.name : 'Друга партия') + '“ има мнозинство сама и управлява без коалиция. ' +
      'Работата ви е в опозицията — да проверявате, да питате и да предлагате.',
    noOffer: 'Другите партии имат достатъчно места помежду си и мнозинството се събира без вас — ' +
      'никоя двойка с ваше участие не стига до 121. Оставате в опозиция: с въпроси към министрите, ' +
      'със законопроекти и с работа в комисиите. Следващия път повече гласове означават и повече тежест на масата.',
    out: 'Под 4% няма депутати, но партията остава — с членове, с опит и със структура. ' +
      'Повечето парламентарни партии в Европа са влизали втори или трети път.'
  };
  el('endingText').textContent = texts[kind];
  el('finalCompass').innerHTML = '<h4>Къде свърши партията ви</h4>' + compassBlock(true);

  var learned = [
    'Резултатът ви е ' + me.share.toFixed(1) + '% при доверие ' + Math.round(state.trust) + '/100.',
    'Няма решение, което вдига всички групи. Всяко „да“ към едни е „не“ към други.',
    'Пенсионерите тежат 24% от гласовете, младите — 14%. Кой излиза да гласува има значение колкото и кой какво мисли.',
    'Компасът ви показва ' + positionWords(state.econ, state.pers) + ' — сбор от десет решения, а не от един лозунг.'
  ];
  if (me.share > 30) learned.push('Над 30% е много: последните проценти се печелят най-трудно, защото хората, които вече са с вас, не могат да гласуват два пъти.');
  var skips = state.log.filter(function (l) { return l.skipped; }).length;
  if (skips === 0) learned.push('Реагирахте на всички десет новини. Понякога мълчанието е по-доброто решение — но трябва да е избор, не навик.');
  else if (skips <= 3) learned.push('Пропуснахте ' + (skips === 1 ? 'една новина' : skips + ' новини') + '. Част от мълчанията ви спестиха грешка, други — струваха гласове.');
  else learned.push('Не реагирахте ' + skips + ' пъти. Мълчанието също е позиция и другите я тълкуват вместо вас.');
  if (state.trust >= 70) learned.push('Високото доверие изкара повече хора до урните. То се гради бавно и се губи с едно решение.');
  if (state.trust <= 35) learned.push('Ниското доверие свали резултата ви: хора, които ви харесват, просто не отидоха да гласуват.');
  var reals = state.log.filter(function (l) { return l.real; }).length;
  if (reals) learned.push(reals + ' от ситуациите бяха истински — случили са се в България през последните пет години.');

  var ul = el('learnedList');
  ul.innerHTML = '';
  learned.forEach(function (t) {
    var li = document.createElement('li');
    li.textContent = t;
    ul.appendChild(li);
  });

  el('endingBox').hidden = false;
  scrollToCard(el('endingBox'));
}

function renderLog() {
  var box = el('logBox');
  box.innerHTML = '';
  state.log.forEach(function (l, i) {
    var d = document.createElement('div');
    d.className = 'log-row' + (l.skipped ? ' skipped' : '');
    d.innerHTML = '<b>' + (i + 1) + '. ' + esc(l.headline) +
      (l.real ? ' <i class="real-mark">истинско</i>' : '') + '</b><span>' + esc(l.choice) + '</span>';
    box.appendChild(d);
  });
}

/* ---------------- свързване ---------------- */

function toIntro() {
  el('backBtn').hidden = true;
  el('turnBadge').hidden = true;
  el('statsBtn').hidden = true;
  var best = readBest();
  if (best) {
    el('bestLine').hidden = false;
    el('bestLine').textContent = 'Най-добър резултат досега: ' + best.share + '% ' + sWith(best.name) +
      ' „' + best.name + '“ (' + best.date + ').';
  }
  show('screen-intro');
}

el('startBtn').onclick = function () {
  el('backBtn').hidden = false;
  buildCreateScreen();
  show('screen-create');
};
el('pName').oninput = buildCreateScreen;
el('foundBtn').onclick = startGame;
el('nextBtn').onclick = nextTurn;
el('statsBtn').onclick = openStats;
el('closeStats').onclick = function () { el('statsOverlay').hidden = true; };
el('statsOverlay').onclick = function (e) { if (e.target === el('statsOverlay')) el('statsOverlay').hidden = true; };
el('themeBtn').onclick = function () {
  applyTheme(document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light');
};
el('backBtn').onclick = function () {
  if (el('screen-play').classList.contains('active') &&
      !window.confirm('Да започнем ли отначало? Текущата партия ще бъде разпусната.')) return;
  toIntro();
};
el('againBtn').onclick = function () { buildCreateScreen(); show('screen-create'); el('backBtn').hidden = false; };
el('logBtn').onclick = function () {
  var box = el('logBox');
  if (box.hidden) { renderLog(); box.hidden = false; el('logBtn').textContent = 'Скрий решенията'; }
  else { box.hidden = true; el('logBtn').textContent = 'Виж всичките си решения'; }
};

document.addEventListener('keydown', function (e) {
  if (!el('statsOverlay').hidden) {
    if (e.key === 'Escape') el('statsOverlay').hidden = true;
    return;
  }
  if (!el('screen-play').classList.contains('active')) return;
  if (e.key === 's' || e.key === 'S') { openStats(); return; }
  if (!el('newsCard').hidden) {
    var n = parseInt(e.key, 10);
    var btns = el('optionList').children;
    if (n >= 1 && n <= 3 && btns[n - 1]) btns[n - 1].click();
    if (e.key === '0' || e.key === '-') btns[btns.length - 1].click();
  } else if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    el('nextBtn').click();
  }
});

initTheme();
toIntro();
})();
