/* Твоята партия — цялата игра. Без зависимости, без сървър. */
(function () {
'use strict';

var EMOJIS = ['🌱', '⭐', '🐝', '🔧', '📚', '🏔️', '🧭', '☀️', '🦉', '🚲'];
var COLORS = ['#e0663a', '#3f9ae0', '#59b36b', '#b45fd1', '#d9a441', '#e05a7d', '#3fb8ad', '#8d8fe0'];
var TURNS = 10;
var SEATS = 240;
var MAJORITY = 121;
var THRESHOLD = 4;
var STORE_KEY = 'tvoyata-partiya.best';

var el = function (id) { return document.getElementById(id); };
var state = null;

/* ---------------- помощни ---------------- */

function clamp(n, lo, hi) { return n < lo ? lo : n > hi ? hi : n; }

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

/* Среден рейтинг, претеглен с дела на всяка група. */
function weighted() {
  var sum = 0;
  for (var i = 0; i < GROUPS.length; i++) sum += state.ratings[GROUPS[i].id] * GROUPS[i].weight;
  return sum / 100;
}

/* Прогнозен резултат: рейтингът решава колко харесват партията,
   доверието решава колко от тях наистина отиват да гласуват.
   Изваждането на 8 е „мълчаливата“ част от рейтинга — симпатия,
   която никога не се превръща в бюлетина. */
function projectedShare() {
  var turnout = 0.7 + 0.6 * (state.trust / 100);
  return clamp((weighted() - 8) * 0.5 * turnout, 0, 48);
}

/* ---------------- създаване на партия ---------------- */

var draft = { name: '', slogan: '', emoji: EMOJIS[0], color: COLORS[0], cause: null };

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
      document.documentElement.style.setProperty('--accent', c); /* цветът се вижда веднага */
      buildCreateScreen();
    };
    crow.appendChild(b);
  });

  var urow = el('causeRow');
  urow.innerHTML = '';
  CAUSES.forEach(function (c) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'cause' + (draft.cause === c.id ? ' on' : '');
    b.setAttribute('role', 'radio');
    b.setAttribute('aria-checked', draft.cause === c.id ? 'true' : 'false');
    var bonus = Object.keys(c.eff).map(function (g) {
      var sign = c.eff[g] > 0 ? '+' : '';
      return groupById(g).icon + ' ' + sign + c.eff[g];
    }).join('  ');
    b.innerHTML = '<span class="cause-icon" aria-hidden="true">' + c.icon + '</span>' +
      '<span class="cause-body"><b>' + c.name + '</b><em>' + c.line + '</em>' +
      '<span class="cause-bonus">' + bonus + '</span></span>';
    b.onclick = function () { draft.cause = c.id; buildCreateScreen(); };
    urow.appendChild(b);
  });

  el('foundBtn').disabled = !(el('pName').value.trim() && draft.cause);
}

/* ---------------- начало на игра ---------------- */

function pickEvents() {
  var by = { early: [], mid: [], late: [] };
  EVENTS.forEach(function (e) { by[e.pool].push(e); });
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
    ratings: {}, trust: 50, turn: 0, events: pickEvents(), log: []
  };
  GROUPS.forEach(function (g) {
    state.ratings[g.id] = clamp(START_RATING + (cause.eff[g.id] || 0), 0, 100);
  });
  document.documentElement.style.setProperty('--accent', state.party.color);
  el('backBtn').hidden = false;
  el('turnBadge').hidden = false;
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

  var list = el('optionList');
  list.innerHTML = '';
  ev.options.forEach(function (opt, i) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'option' + (i === ev.options.length - 1 ? ' option-skip' : '');
    b.innerHTML = '<span class="option-key" aria-hidden="true">' + (i === ev.options.length - 1 ? '–' : i + 1) + '</span>' +
      '<span>' + opt.label + '</span>';
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
    state.ratings[gid] = clamp(before + opt.eff[gid], 0, 100);
    deltas.push({ group: groupById(gid), value: state.ratings[gid] - before });
  });
  var trustBefore = state.trust;
  state.trust = clamp(state.trust + (opt.trust || 0), 0, 100);
  var trustDelta = state.trust - trustBefore;

  state.log.push({
    headline: ev.headline,
    choice: opt.label,
    skipped: index === ev.options.length - 1
  });

  deltas.sort(function (a, b) { return b.value - a.value; });

  el('outcomeText').textContent = opt.result;
  el('factText').textContent = ev.fact;
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
  if (!dl.children.length) {
    dl.innerHTML = '<span class="delta flat">Нищо не се промени</span>';
  }

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
    '<span><b>' + state.party.name + '</b>' +
    (state.party.slogan ? '<em>„' + state.party.slogan + '“</em>' : '') + '</span>';

  el('trustVal').textContent = state.trust;
  el('trustBar').style.width = state.trust + '%';

  var box = el('groupBars');
  box.innerHTML = '';
  GROUPS.forEach(function (g) {
    var v = state.ratings[g.id];
    var d = document.createElement('div');
    d.className = 'meter';
    d.innerHTML = '<div class="meter-top"><span title="' + g.about + '">' + g.icon + ' ' + g.name +
      ' <i class="wt">' + g.weight + '%</i></span><b>' + v + '</b></div>' +
      '<div class="bar"><i style="width:' + v + '%"></i></div>';
    box.appendChild(d);
  });

  el('pollVal').textContent = projectedShare().toFixed(1) + '%';
}

/* ---------------- избори ---------------- */

function distributeSeats(parties) {
  var passing = parties.filter(function (p) { return !p.other && p.share >= THRESHOLD; });
  var total = passing.reduce(function (s, p) { return s + p.share; }, 0);
  var rest = [];
  var given = 0;
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
  var noisy = RIVALS.map(function (r) {
    return { r: r, w: Math.max(0.04, r.share * (0.88 + Math.random() * 0.24)) };
  });
  var wsum = noisy.reduce(function (s, n) { return s + n.w; }, 0) / 0.9; /* 10% остават за партии под прага */
  noisy.forEach(function (n) {
    parties.push({ name: n.r.name, emoji: n.r.emoji, color: n.r.color, share: remainder * n.w / wsum });
  });
  var small = remainder - parties.slice(1).reduce(function (s, p) { return s + p.share; }, 0);
  parties.push({ name: 'Други партии', emoji: '▫️', color: '#7b849b', share: Math.max(0, small), other: true });

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

  el('resultTitle').textContent = 'Изборна нощ';
  var lead;
  if (me.share < THRESHOLD) {
    lead = 'Партията ви остава под прага от 4% и няма депутати. Гласовете ви обаче са истински хора — ' +
      'и следващите избори са след най-много четири години.';
  } else if (place === 1) {
    lead = 'Партията ви е първа политическа сила с ' + me.seats + ' депутати от 240.';
  } else {
    var ordinals = ['', 'първа', 'втора', 'трета', 'четвърта', 'пета', 'шеста'];
    lead = 'Партията ви влиза в парламента с ' + me.seats + ' депутати и е ' +
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
      '<span class="res-name">' + p.emoji + ' ' + p.name + (p.mine ? ' <i>(вие)</i>' : '') + '</span>' +
      '<span class="res-bar"><i style="width:' + (p.share / max * 100) + '%;background:' + p.color + '"></i></span>' +
      '<span class="res-num">' + p.share.toFixed(1) + '%</span>' +
      '<span class="res-seats">' + (p.seats ? p.seats + ' места' : 'под прага') + '</span>';
    box.appendChild(row);
  });

  el('coalitionBox').hidden = true;
  el('endingBox').hidden = true;
  el('logBox').hidden = true;

  if (place === 1 && me.seats >= MAJORITY) {
    ending('Самостоятелно мнозинство', me, 'solo');
  } else if (place === 1) {
    offerCoalition(me);
  } else if (me.share >= THRESHOLD) {
    ending('Влизате в парламента', me, 'opposition');
  } else {
    ending('Оставате извън парламента', me, 'out');
  }
}

function offerCoalition(me) {
  var partners = state.result.parties.filter(function (p) {
    return !p.mine && !p.other && p.seats > 0;
  });
  el('coalitionBox').hidden = false;
  el('coalitionLead').textContent = 'Имате ' + me.seats + ' места. Президентът ви връчва първия мандат. ' +
    'За правителство трябват поне 121 гласа — значи преговори.';

  var box = el('coalitionOptions');
  box.innerHTML = '';
  partners.forEach(function (p) {
    var together = me.seats + p.seats;
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'option' + (together >= MAJORITY ? '' : ' option-weak');
    b.innerHTML = '<span class="option-key" aria-hidden="true">' + p.emoji + '</span>' +
      '<span>Коалиция с „' + p.name + '“ — ' + together + ' места' +
      (together >= MAJORITY ? '' : ' <i>(не стигат)</i>') + '</span>';
    b.onclick = function () {
      if (together >= MAJORITY) ending('Имате правителство', me, 'coalition', p);
      else ending('Мандатът се връща', me, 'failed', p);
    };
    box.appendChild(b);
  });

  var alone = document.createElement('button');
  alone.type = 'button';
  alone.className = 'option option-skip';
  alone.innerHTML = '<span class="option-key" aria-hidden="true">–</span>' +
    '<span>Без коалиция — опитваме с малцинствено правителство</span>';
  alone.onclick = function () { ending('Малцинствено правителство', me, 'minority'); };
  box.appendChild(alone);
}

function ending(title, me, kind, partner) {
  el('coalitionBox').hidden = true;
  el('endingTitle').textContent = title;

  var texts = {
    solo: 'Рядко и трудно: 121 или повече депутати сами. Можете да управлявате без партньор — и нямате на кого да прехвърлите отговорността.',
    coalition: 'Подписвате споразумение с „' + (partner ? partner.name : '') + '“. Част от програмата ви остава за следващия път, защото в коалицията никой не получава всичко. Такива са били всички правителства в България от 1990 г. насам, освен няколко.',
    minority: 'Управлявате с по-малко от 121 гласа и събирате мнозинство за всеки отделен закон. Възможно е, но всяко гласуване е преговор наново.',
    failed: 'Сборът не стига до 121. Мандатът се връща на президента, който го дава на следващата партия. Ако и трите мандата се провалят, следват служебно правителство и нови избори.',
    opposition: 'Опозицията не е загубено място: внасяте законопроекти, задавате въпроси на министрите в петък, работите в комисии и наблюдавате как се харчат парите. Много закони се променят именно оттам.',
    out: 'Под 4% няма депутати, но партията остава — с членове, с опит и със структура. Повечето парламентарни партии в Европа са влизали втори или трети път.'
  };
  el('endingText').textContent = texts[kind];

  var learned = [
    'Рейтингът ви завърши на ' + me.share.toFixed(1) + '% при доверие ' + state.trust + '/100.',
    'Няма решение, което вдига всички групи. Всяко „да“ към едни е „не“ към други.',
    'Пенсионерите тежат 24% от гласовете, младите — 14%. Кой излиза да гласува има значение колкото и кой какво мисли.'
  ];
  var skips = state.log.filter(function (l) { return l.skipped; }).length;
  if (skips === 0) learned.push('Реагирахте на всички десет новини. Понякога мълчанието е по-доброто решение — но трябва да е избор, не навик.');
  else if (skips <= 3) learned.push('Пропуснахте ' + (skips === 1 ? 'една новина' : skips + ' новини') + '. Част от мълчанията ви спестиха грешка, други — струваха гласове.');
  else learned.push('Не реагирахте ' + skips + ' пъти. Мълчанието също е позиция и другите я тълкуват вместо вас.');
  if (state.trust >= 70) learned.push('Високото доверие изкара повече хора до урните. То се гради бавно и се губи с едно решение.');
  if (state.trust <= 35) learned.push('Ниското доверие свали резултата ви: хора, които ви харесват, просто не отидоха да гласуват.');

  var ul = el('learnedList');
  ul.innerHTML = '';
  learned.forEach(function (t) {
    var li = document.createElement('li');
    li.textContent = t;
    ul.appendChild(li);
  });

  el('endingBox').hidden = false;
}

function renderLog() {
  var box = el('logBox');
  box.innerHTML = '';
  state.log.forEach(function (l, i) {
    var d = document.createElement('div');
    d.className = 'log-row' + (l.skipped ? ' skipped' : '');
    d.innerHTML = '<b>' + (i + 1) + '. ' + l.headline + '</b><span>' + l.choice + '</span>';
    box.appendChild(d);
  });
}

/* ---------------- свързване ---------------- */

function toIntro() {
  el('backBtn').hidden = true;
  el('turnBadge').hidden = true;
  var best = readBest();
  if (best) {
    el('bestLine').hidden = false;
    el('bestLine').textContent = 'Най-добър резултат досега: ' + best.share + '% с „' + best.name + '“ (' + best.date + ').';
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
  if (!el('screen-play').classList.contains('active')) return;
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

toIntro();
})();
