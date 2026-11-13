/* БУМ — общ код за всички страници. */
(function () {
  'use strict';
  var Art = window.BUMArt;

  /* ---------- тема ---------- */
  var THEMES = ['auto', 'light', 'dark'], ICON = { auto: '◐', light: '☀', dark: '☾' }, LABEL = { auto: 'Тема: автоматична', light: 'Тема: светла', dark: 'Тема: тъмна' };
  function getTheme() { try { var t = localStorage.getItem('bum-theme'); if (THEMES.indexOf(t) >= 0) return t; } catch (e) {} return 'auto'; }
  function applyTheme(t) {
    if (t === 'auto') document.documentElement.removeAttribute('data-theme'); else document.documentElement.setAttribute('data-theme', t);
    var b = document.getElementById('theme'); if (b) { b.textContent = ICON[t]; b.title = LABEL[t]; b.setAttribute('aria-label', LABEL[t]); }
  }
  applyTheme(getTheme());

  /* Страницата за дарения на „Образование без раници“ — сменя се само тук. */
  var DONATE_URL = 'https://obr.education/stani-daritel/';

  /* ---------- данни ---------- */
  var FIELDS = {
    math: 'Математика', cs: 'Информатика', physics: 'Физика', astro: 'Космос и астрономия', chem: 'Химия',
    bio: 'Биология', med: 'Медицина', eng: 'Инженерство', econ: 'Икономика', games: 'Шах и игри',
    edu: 'Образование', earth: 'Науки за Земята', business: 'Бизнес'
  };
  var SECTIONS = {
    ten: { name: '10 БУМа', href: 'deset.html' },
    sto: { name: 'СтоБУМ', href: 'sto.html' },
    kilo: { name: 'КилоБУМ', href: 'kilo.html' }
  };
  var LIVES = { bg: 'В България', abroad: 'В чужбина', both: 'И двете' };
  var COUNTRIES = ['САЩ', 'Русия', 'Австрия', 'Молдова', 'Германия', 'Франция', 'Швейцария', 'Румъния', 'Турция', 'Гърция', 'Сърбия', 'Северна Македония'];
  /* Град на раждане, изведен от полето place: „Студен извор, Трънско“ → „Студен извор“; „Виена, Австрия“ → „Виена (Австрия)“. */
  function cityOf(place) {
    if (!place || /^(България|Първо българско царство)$/.test(place)) return 'неизвестно';
    var parts = place.split(/,\s*/), last = parts[parts.length - 1], c = parts[0].replace(/^(село|гр\.)\s+/, '');
    return parts.length > 1 && COUNTRIES.indexOf(last) >= 0 ? c + ' (' + last + ')' : c;
  }
  function tag(list, sec) {
    var F = window.BUM_FACETS || {};
    return (list || []).map(function (p, i) {
      p.sec = sec; p.rank = i + 1; if (!FIELDS[p.field]) p.field = 'math';
      var f = F[p.id] || {};
      p.fields = (f.s && f.s.length ? f.s : [p.field]).filter(function (k) { return FIELDS[k]; });
      if (p.fields.indexOf(p.field) < 0) p.fields.unshift(p.field);
      p.lives = f.lv || 'bg'; p.city = cityOf(p.place);
      return p;
    });
  }
  var TEN = tag(window.BUM_TEN, 'ten');
  var STO = tag(window.BUM_STO, 'sto').sort(function (a, b) { return (a.born || 0) - (b.born || 0); });
  var KILO = tag(window.BUM_KILO, 'kilo');
  var ALL = TEN.concat(STO, KILO), BY = {};
  ALL.forEach(function (p) { BY[p.id] = p; });

  /* ---------- помощни ---------- */
  function el(t, cls, html) { var n = document.createElement(t); if (cls) n.className = cls; if (html != null) n.innerHTML = html; return n; }
  var esc = Art.esc;
  function shuffle(a, r) { a = a.slice(); r = r || Math.random; for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(r() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function roman(n) { var v = [[10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']], s = ''; v.forEach(function (x) { while (n >= x[0]) { s += x[1]; n -= x[0]; } }); return s; }
  function century(p) { return p.born ? Math.floor((p.born - 1) / 100) + 1 : 0; }
  function years(p) {
    if (p.bornLabel) return p.bornLabel;
    if (p.bornApprox && !p.died) return p.sex === 'f' ? 'съвременничка' : 'съвременник';
    var b = p.born ? (p.bornApprox ? 'ок. ' : '') + p.born : '?';
    if (p.died) return b + ' – ' + (p.diedApprox ? 'ок. ' : '') + p.died;
    return 'р. ' + b;
  }
  function initials(n) { return n.split(/\s+/).map(function (w) { return w.charAt(0); }).slice(0, 2).join(''); }
  function url(p) { return 'story.html?id=' + encodeURIComponent(p.id); }
  function fieldTag(p) { return '<span class="field-tag f-' + p.field + '">' + FIELDS[p.field] + '</span>'; }

  /* Блок „графика + портрет“ */
  function artBlock(p, cls) {
    var d = el('div', 'art' + (cls ? ' ' + cls : ''), Art.svg({ id: p.id, field: p.field, motif: p.motif, art: p.art }));
    var pr = el('div', 'portrait');
    if (p.avatar) pr.innerHTML = Art.avatar(p.avatar);
    else { pr.innerHTML = '<div class="mono">' + esc(initials(p.name)) + '</div>'; pr.setAttribute('data-pid', p.id); }
    d.appendChild(pr);
    return d;
  }

  /* ---------- снимки от Уикипедия ----------
     Браузърът пита API-то на Уикипедия за главната (свободна) снимка на статията.
     Резултатът се пази в localStorage за 7 дни. Ако няма снимка, остават инициалите. */
  var PKEY = 'bum-photos-v1', cache = {};
  try { var raw = JSON.parse(localStorage.getItem(PKEY) || '{}'); if (raw.t && Date.now() - raw.t < 7 * 864e5) cache = raw.d || {}; } catch (e) {}
  function saveCache() { try { localStorage.setItem(PKEY, JSON.stringify({ t: Date.now(), d: cache })); } catch (e) {} }
  var pending = {};
  function fetchLang(lang, people) {
    var titles = people.map(function (p) { return p.wiki[lang]; });
    var chunks = []; for (var i = 0; i < titles.length; i += 45) chunks.push(people.slice(i, i + 45));
    return Promise.all(chunks.map(function (ch) {
      var q = 'https://' + lang + '.wikipedia.org/w/api.php?action=query&format=json&origin=*&redirects=1&prop=pageimages&piprop=thumbnail%7Cname&pithumbsize=480&titles=' +
        encodeURIComponent(ch.map(function (p) { return p.wiki[lang]; }).join('|'));
      return fetch(q).then(function (r) { return r.json(); }).then(function (j) {
        var qu = j.query || {}, map = {};
        (qu.normalized || []).forEach(function (n) { map[n.from] = n.to; });
        var red = {}; (qu.redirects || []).forEach(function (n) { red[n.from] = n.to; });
        var pages = {}; Object.keys(qu.pages || {}).forEach(function (k) { var pg = qu.pages[k]; pages[pg.title] = pg; });
        ch.forEach(function (p) {
          var t = p.wiki[lang]; t = map[t] || t; t = red[t] || t; var pg = pages[t];
          if (pg && pg.thumbnail) cache[p.id] = { s: pg.thumbnail.source, l: lang, a: pg.title, f: pg.pageimage || '' };
        });
      });
    })).catch(function () {});
  }
  function loadPhotos(root) {
    var nodes = Array.prototype.slice.call((root || document).querySelectorAll('[data-pid]'));
    var want = [];
    nodes.forEach(function (n) { var id = n.getAttribute('data-pid'); if (cache[id]) put(n, cache[id]); else if (BY[id] && !pending[id] && BY[id].wiki && !(id in cache)) { want.push(BY[id]); pending[id] = 1; } });
    if (!want.length) return;
    var bg = want.filter(function (p) { return p.wiki.bg; });
    fetchLang('bg', bg).then(function () {
      var en = want.filter(function (p) { return !cache[p.id] && p.wiki.en; });
      return fetchLang('en', en);
    }).then(function () {
      want.forEach(function (p) { if (!cache[p.id]) cache[p.id] = 0; });
      saveCache();
      document.querySelectorAll('[data-pid]').forEach(function (n) { var c = cache[n.getAttribute('data-pid')]; if (c) put(n, c); });
      document.dispatchEvent(new CustomEvent('bum-photos'));
    });
  }
  function put(node, c) {
    if (node.querySelector('img')) return;
    var img = new Image(); img.alt = ''; img.decoding = 'async'; img.referrerPolicy = 'no-referrer';
    img.onload = function () { img.className = 'on'; var m = node.querySelector('.mono'); if (m) m.remove(); };
    img.onerror = function () { img.remove(); };
    img.src = c.s; node.appendChild(img);
  }

  /* ---------- шапка и долна част ---------- */
  function chrome(active) {
    var top = document.getElementById('top');
    if (top) {
      top.className = 'top';
      top.innerHTML = '<div class="wrap"><a class="brand" href="index.html" aria-label="БУМ — начало">' + logo() +
        '<span><b>БУМ</b><small>Български Успехи<br>с Математика</small></span></a>' +
        '<nav class="nav" aria-label="Секции"><a href="deset.html"' + (active === 'ten' ? ' aria-current="page"' : '') + '>10 БУМа</a>' +
        '<a href="sto.html"' + (active === 'sto' ? ' aria-current="page"' : '') + '>СтоБУМ</a>' +
        '<a href="kilo.html"' + (active === 'kilo' ? ' aria-current="page"' : '') + '>КилоБУМ</a>' +
        '<a href="statistika.html" class="nav-stats"' + (active === 'stats' ? ' aria-current="page"' : '') + ' aria-label="Статистика"><span aria-hidden="true">📊</span><span class="lbl"> Статистика</span></a></nav>' +
        '<button class="theme" id="theme" type="button"></button></div>';
      applyTheme(getTheme());
      document.getElementById('theme').addEventListener('click', function () {
        var t = THEMES[(THEMES.indexOf(getTheme()) + 1) % 3]; try { localStorage.setItem('bum-theme', t); } catch (e) {} applyTheme(t);
      });
    }
    var f = document.getElementById('foot');
    if (f) {
      f.className = 'foot';
      f.innerHTML = '<div class="obr-band"><div class="wrap"><p>БУМ е проект на „Образование без раници“ — сдружението, което превежда Кан Академия на български и помага на учители и ученици да учат умно с технологии.</p>' +
        '<a class="obr-link" href="' + DONATE_URL + '" target="_blank" rel="noopener" aria-label="Образование без раници — дари">' +
        '<img class="light" src="media/obr-logo.svg" alt="Образование без раници"><img class="dark" src="media/obr-logo-light.svg" alt="Образование без раници"><span class="give">Дари ♥</span></a></div></div>' +
        '<div class="wrap meta"><span><b>БУМ</b> — Български Успехи с Математика · истории за хора, които променят света с числа</span>' +
        '<span>Снимки: Уикипедия / Уикимедия Общомедия, свободни лицензи · <a href="../">Още проекти</a> · <button type="button" class="ck" onclick="window.d4Consent&&d4Consent.reset()">Бисквитки</button></span></div>';
    }
  }
  /* Блок с 1–2 урока от Кан Академия (data/ka.js). */
  function kaBlock(key, title) {
    var list = (window.BUM_KA || {})[key];
    if (!list || !list.length) return el('div');
    var d = el('aside', 'ka');
    d.setAttribute('aria-label', 'Уроци в Кан Академия');
    d.innerHTML = '<img class="logo" src="media/khan-academy.svg" alt="Кан Академия">' +
      '<div><h2>' + esc(title || 'Научи математиката зад историята') + '</h2><p>Безплатни уроци с видео и упражнения в българската Кан Академия.</p><ul>' +
      list.map(function (x) {
        return '<li><a href="' + esc(x.u) + '" target="_blank" rel="noopener"><img src="media/khan-academy.svg" alt="">' +
          '<div>' + esc(x.t) + '<span>Кан Академия · ' + esc(x.c) + '</span></div><b>Учи →</b></a></li>';
      }).join('') + '</ul></div>';
    return d;
  }
  function logo() {
    var pts = [], n = 12; for (var i = 0; i < n * 2; i++) { var a = i / (n * 2) * Math.PI * 2 - Math.PI / 2, r = i % 2 ? 11 : 20; pts.push((21 + r * Math.cos(a)).toFixed(1) + ',' + (21 + r * Math.sin(a)).toFixed(1)); }
    return '<svg viewBox="0 0 42 42" aria-hidden="true"><polygon points="' + pts.join(' ') + '" fill="var(--accent)"/><text x="21" y="26.5" text-anchor="middle" font-family="Georgia,serif" font-weight="900" font-size="15" fill="#fff">π</text></svg>';
  }

  /* ---------- малки карти ---------- */
  function stripCard(p) {
    var a = el('a'); a.href = url(p);
    a.appendChild(artBlock(p));
    a.appendChild(el('div', 'cap', esc(p.name) + '<small>' + esc(years(p)) + ' · ' + FIELDS[p.field] + '</small>'));
    return a;
  }
  function listItem(p) {
    var li = el('li', 'item f-' + p.field), a = el('a'); a.href = url(p);
    a.appendChild(artBlock(p));
    a.appendChild(el('div', '', fieldTag(p) + (p.fictional ? ' <span class="fict" style="font-size:10px;padding:2px 6px">измислен' + (p.sex === 'f' ? 'а' : '') + '</span>' : '') +
      '<h3>' + esc(p.name) + ' <span class="yrs">' + esc(years(p)) + '</span></h3><p>' + esc(p.title) + '</p>'));
    li.appendChild(a); return li;
  }

  /* ---------- НАЧАЛО ---------- */
  function pageHome() {
    chrome('home');
    var pool = TEN.concat(STO);
    var d = new Date(), key = d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(), h = 0;
    for (var i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
    var idx = h % pool.length;
    var box = document.getElementById('day');
    function show(p, isDay) {
      box.innerHTML = '';
      var a = artBlock(p); a.appendChild(el('div', 'stamp', isDay ? 'БУМ на деня' : 'Случаен БУМ'));
      box.appendChild(a);
      var b = el('div', 'body');
      b.innerHTML = '<div>' + fieldTag(p) + ' <span class="eyebrow" style="color:var(--muted)">· ' + SECTIONS[p.sec].name + '</span></div>' +
        '<h2>' + esc(p.title) + '</h2><div class="who">' + esc(p.name) + ' <span>' + esc(years(p)) + (p.place ? ' · ' + esc(p.place) : '') + '</span></div>' +
        '<p class="lede">' + esc(p.lede) + '</p><div class="acts"><a class="btn" href="' + url(p) + '">Прочети историята →</a><button class="btn ghost" type="button" id="again">🎲 Друг БУМ</button></div>';
      box.appendChild(b);
      document.getElementById('again').onclick = function () { var j; do { j = Math.floor(Math.random() * pool.length); } while (pool[j] === p && pool.length > 1); show(pool[j], false); };
      loadPhotos(box);
    }
    show(pool[idx], true);

    function faces(list) { return list.map(function (p) { return '<span data-pid="' + (p.avatar ? '' : p.id) + '">' + (p.avatar ? Art.avatar(p.avatar) : Art.svg(p)) + '</span>'; }).join(''); }
    var secs = document.getElementById('sections');
    secs.innerHTML =
      '<a class="sec" href="deset.html"><span class="big">10</span><h3>10 БУМа</h3><p>Десетте най-известни и най-важни приноса на българи чрез математика и науки — от първия електронен компютър до кристалите в лазерите.</p><div class="faces">' + faces(TEN.slice(0, 6)) + '</div></a>' +
      '<a class="sec" href="sto.html"><span class="big">100</span><h3>СтоБУМ</h3><p>Сто истории на успеха — не всички прочути, но всички истински. Жени и мъже от различни векове и области.</p><div class="faces">' + faces(shuffle(STO).slice(0, 6)) + '</div></a>' +
      '<a class="sec" href="kilo.html"><span class="big">1000</span><h3>КилоБУМ</h3><p>Истории, които събираме чрез интервюта — с хора около нас, които правят нещо важно с математика. Засега: примерни статии.</p><div class="faces">' + faces(KILO) + '</div></a>';
    secs.querySelectorAll('[data-pid=""]').forEach(function (n) { n.removeAttribute('data-pid'); });
    loadPhotos(secs);

    var real = TEN.concat(STO), women = real.filter(function (p) { return p.sex === 'f'; }).length;
    var cs = real.map(century).filter(Boolean), minC = Math.min.apply(null, cs), maxC = Math.max.apply(null, cs);
    document.querySelector('main').appendChild(kaBlock('@home', 'Математиката зад откритията'));
    document.getElementById('stats').innerHTML = '<div><b>' + real.length + '</b><span>истински истории</span></div><div><b>' + women + '</b><span>жени</span></div><div><b>' + roman(minC) + '–' + roman(maxC) + '</b><span>век</span></div>' + '<a class="stats-more" href="statistika.html">Всички числа и осева таблица →</a>';
  }

  /* ---------- 10 БУМа ---------- */
  function pageTen() {
    chrome('ten');
    var g = document.getElementById('ten');
    TEN.forEach(function (p) {
      var a = el('a', 'tcard f-' + p.field); a.href = url(p);
      var art = artBlock(p); art.appendChild(el('span', 'rank', String(p.rank)));
      a.appendChild(art);
      a.appendChild(el('div', 'meta', fieldTag(p) + '<h2>' + esc(p.name) + '</h2><div class="yrs">' + esc(years(p)) + '</div><p class="ttl">' + esc(p.title) + '</p>'));
      g.appendChild(a);
    });
    loadPhotos(g);
    g.parentNode.appendChild(kaBlock('@ten', 'Научи математиката зад десетте БУМа'));
  }

  /* ---------- СтоБУМ и КилоБУМ: снимки отгоре + списък с филтри ---------- */
  function pageList(sec) {
    chrome(sec);
    var data = sec === 'sto' ? STO : KILO;
    var strip = document.getElementById('strip');
    function deal() { strip.innerHTML = ''; shuffle(data).slice(0, 5).forEach(function (p) { strip.appendChild(stripCard(p)); }); loadPhotos(strip); }
    deal();
    var sh = document.getElementById('shuffle'); if (sh) sh.onclick = deal;

    var st = { q: '', sex: '', cent: '', field: '', sort: 'born' };
    var fieldsUsed = Object.keys(FIELDS).filter(function (k) { return data.some(function (p) { return p.fields.indexOf(k) >= 0; }); });
    var cents = []; data.forEach(function (p) { var c = century(p); if (c && cents.indexOf(c) < 0) cents.push(c); }); cents.sort(function (a, b) { return a - b; });

    function chips(id, items, key) {
      var box = document.getElementById(id); box.innerHTML = '';
      items.forEach(function (it) {
        var b = el('button', 'chip' + (it.cls ? ' ' + it.cls : ''), esc(it.t) + '<span class="n"></span>'); b.type = 'button'; b.dataset.v = it.v;
        b.onclick = function () { st[key] = it.v; render(); };
        box.appendChild(b);
      });
    }
    chips('f-sex', [{ v: '', t: 'Всички' }, { v: 'f', t: 'Жени' }, { v: 'm', t: 'Мъже' }], 'sex');
    chips('f-cent', [{ v: '', t: 'Всички векове' }].concat(cents.map(function (c) { return { v: String(c), t: roman(c) + ' век' }; })), 'cent');
    chips('f-field', [{ v: '', t: 'Всички области' }].concat(fieldsUsed.map(function (k) { return { v: k, t: FIELDS[k], cls: 'fdot f-' + k }; })), 'field');

    var q = document.getElementById('q'), sort = document.getElementById('sort');
    q.oninput = function () { st.q = q.value.trim().toLowerCase(); render(); };
    sort.onchange = function () { st.sort = sort.value; if (st.sort === 'random') rnd = shuffle(data); render(); };
    var rnd = shuffle(data);

    function match(p, skip) {
      if (st.q && (p.name + ' ' + p.title + ' ' + (p.tags || []).join(' ') + ' ' + (p.place || '') + ' ' + FIELDS[p.field]).toLowerCase().indexOf(st.q) < 0) return false;
      if (skip !== 'sex' && st.sex && p.sex !== st.sex) return false;
      if (skip !== 'cent' && st.cent && String(century(p)) !== st.cent) return false;
      if (skip !== 'field' && st.field && p.fields.indexOf(st.field) < 0) return false;
      return true;
    }
    function counts(id, key, fn) {
      document.querySelectorAll('#' + id + ' .chip').forEach(function (b) {
        var v = b.dataset.v; b.setAttribute('aria-pressed', String(st[key] === v));
        b.querySelector('.n').textContent = data.filter(function (p) { var x = fn(p); return match(p, key) && (!v || (Array.isArray(x) ? x.indexOf(v) >= 0 : x === v)); }).length;
      });
    }
    var list = document.getElementById('list'), cnt = document.getElementById('count');
    function render() {
      counts('f-sex', 'sex', function (p) { return p.sex; });
      counts('f-cent', 'cent', function (p) { return String(century(p)); });
      counts('f-field', 'field', function (p) { return p.fields; });
      var arr = (st.sort === 'random' ? rnd : data).filter(function (p) { return match(p); });
      if (st.sort === 'born-desc') arr = arr.slice().sort(function (a, b) { return b.born - a.born; });
      if (st.sort === 'name') arr = arr.slice().sort(function (a, b) { return a.name.localeCompare(b.name, 'bg'); });
      if (st.sort === 'born') arr = arr.slice().sort(function (a, b) { return a.born - b.born; });
      list.innerHTML = '';
      arr.forEach(function (p) { list.appendChild(listItem(p)); });
      cnt.textContent = arr.length === data.length ? 'Всички ' + arr.length + ' истории' : arr.length + ' от ' + data.length + ' истории';
      if (!arr.length) list.innerHTML = '<li class="empty">Няма истории с тези филтри. Опитай с по-малко.</li>';
      loadPhotos(list);
    }
    render();
    list.parentNode.appendChild(kaBlock('@' + sec, sec === 'kilo' ? 'Научи се да работиш с данни като героите на КилоБУМ' : 'Математика от сто истории'));
  }

  /* ---------- СТАТИЯ ---------- */
  function pageStory() {
    var id = new URLSearchParams(location.search).get('id'), p = BY[id];
    chrome(p ? p.sec : '');
    var main = document.getElementById('main');
    if (!p) { main.innerHTML = '<div class="wrap page-head"><h1>Няма такава история</h1><p><a href="index.html">Към началото</a></p></div>'; return; }
    document.title = p.name + ' — ' + p.title + ' · БУМ';
    var md = document.querySelector('meta[name=description]'); if (md) md.setAttribute('content', p.lede);
    var S = SECTIONS[p.sec];

    var hero = el('div', 'hero'), art = artBlock(p);
    hero.appendChild(art);
    hero.appendChild(el('div', 'crumbs', '<div class="wrap"><a href="' + S.href + '">← ' + S.name + '</a></div>'));
    main.appendChild(hero);

    var ar = el('article', 'article');
    var head = '<div class="head">' + (p.fictional ? '<span class="fict">Измислен' + (p.sex === 'f' ? 'а' : '') + ' човек · примерна статия</span>' : '') +
      '<div class="tags">' + p.fields.map(function (k) { return '<span class="field-tag f-' + k + '">' + FIELDS[k] + '</span>'; }).join(' ') + '</div>' + '<div class="name">' + esc(p.name) + ' <span>' + esc(years(p)) + (p.age ? ' · ' + p.age + ' г.' : '') + (p.place ? ' · ' + esc(p.place) : '') + '</span></div>' +
      '<h1>' + esc(p.title) + '</h1><p class="lede">' + esc(p.lede) + '</p>' +
      (p.tags && p.tags.length ? '<div class="tags">' + p.tags.map(function (t) { return '<span>' + esc(t) + '</span>'; }).join('') + '</div>' : '') + '</div>';
    var body = '';
    if (p.fictional) body += '<div class="notice" style="margin-top:28px"><span class="fict">!</span><p><b>Това е примерна статия.</b> ' + esc(p.name) + ' не съществува — човекът, историята, интервюто и видеото са измислени, за да покажат как ще изглеждат истинските истории в КилоБУМ, които ще събираме чрез интервюта. Линковете водят към истински статии по темата.</p></div>';
    body += '<div class="body">' + p.story.map(function (s) { return '<p>' + esc(s) + '</p>'; }).join('') + '</div>';
    if (p.num) body += '<div class="bignum"><b>' + esc(p.num.n) + '</b><span><small>БУМ число</small>' + esc(p.num.t) + '</span></div>';
    if (p.sec === 'kilo') {
      body += '<div class="kilo-media"><div><div class="vid"><span class="fict vtag">примерно видео</span><video controls playsinline preload="none" poster="' + esc(p.video.poster) + '" src="' + esc(p.video.src) + '"></video></div><div class="vcap">' + esc(p.video.caption) + '</div></div>' +
        '<figure class="figure"><div class="art">' + Art.svg({ id: p.id + '-work', field: p.field, motif: p.work.motif }) + '</div><figcaption><b>От работата ' + (p.sex === 'f' ? 'ѝ' : 'му') + '</b>' + esc(p.work.caption) + '</figcaption></figure></div>';
      body += '<section class="qa"><h2>Интервю</h2><dl>' + p.interview.map(function (x) { return '<div><dt>' + esc(x.q) + '</dt><dd>' + esc(x.a) + '</dd></div>'; }).join('') + '</dl></section>';
    }
    if (p.links && p.links.length) body += '<nav class="links" aria-label="Още информация"><h2>' + (p.fictional ? 'Прочети още по темата' : 'Прочети още') + '</h2>' + p.links.map(function (l) {
      var host = ''; try { host = new URL(l.u).hostname.replace(/^www\./, ''); } catch (e) {}
      return '<a href="' + esc(l.u) + '" target="_blank" rel="noopener">' + esc(l.t) + ' <span>' + esc(host) + ' ↗</span></a>';
    }).join('') + '</nav>';
    body += '<div id="ka-slot"></div><p class="credit" id="credit"></p>';

    var list = p.sec === 'ten' ? TEN : p.sec === 'sto' ? STO : KILO, i = list.indexOf(p);
    var prev = list[(i - 1 + list.length) % list.length], next = list[(i + 1) % list.length];
    body += '<div class="pager"><a href="' + url(prev) + '"><small>← Предишна</small><b>' + esc(prev.name) + '</b></a><a class="next" href="' + url(next) + '"><small>Следваща →</small><b>' + esc(next.name) + '</b></a></div>';
    ar.innerHTML = head + body;
    main.appendChild(ar);
    var slot = document.getElementById('ka-slot'); slot.parentNode.replaceChild(kaBlock(p.id), slot);

    var more = el('section', 'more wrap', '<h2>Още БУМ истории</h2>'), ul = el('div', 'strip');
    shuffle(TEN.concat(STO).filter(function (x) { return x !== p; })).slice(0, 5).forEach(function (x) { ul.appendChild(stripCard(x)); });
    more.appendChild(ul); main.appendChild(more);

    function credit() {
      var c = cache[p.id], n = document.getElementById('credit');
      if (c && n) n.innerHTML = 'Снимка: <a href="https://' + c.l + '.wikipedia.org/wiki/' + encodeURIComponent((c.f ? 'File:' + c.f : c.a).replace(/ /g, '_')) + '" target="_blank" rel="noopener">Уикипедия' + (c.f ? ' / ' + esc(c.f) : '') + '</a> (свободен лиценз). Графиката е рисувана за БУМ.';
      else if (n && p.avatar) n.textContent = 'Портретът е рисунка, а не снимка — човекът е измислен.';
    }
    document.addEventListener('bum-photos', credit);
    loadPhotos(document); credit();
  }

  /* ---------- СТАТИСТИКА: осева таблица ---------- */
  function pageStats() {
    chrome('stats');
    var DIMS = {
      cent: { t: 'Век на раждане', get: function (p) { var c = century(p); return c ? [String(c)] : ['?']; }, label: function (v) { return v === '?' ? 'неизвестен' : roman(+v) + ' век'; }, order: 'num' },
      field: { t: 'Сфера', get: function (p) { return p.fields; }, label: function (v) { return FIELDS[v]; }, order: 'count' },
      sex: { t: 'Пол', get: function (p) { return [p.sex]; }, label: function (v) { return v === 'f' ? 'Жени' : 'Мъже'; }, order: 'fixed', fixed: ['f', 'm'] },
      lives: { t: 'Живее (живял/а) основно', get: function (p) { return [p.lives]; }, label: function (v) { return LIVES[v]; }, order: 'fixed', fixed: ['bg', 'both', 'abroad'] },
      city: { t: 'Град на раждане', get: function (p) { return [p.city]; }, label: function (v) { return v; }, order: 'count' },
      sec: { t: 'Раздел', get: function (p) { return [p.sec]; }, label: function (v) { return SECTIONS[v].name; }, order: 'fixed', fixed: ['ten', 'sto', 'kilo'] },
      none: { t: '— (само общо)', get: function () { return ['all']; }, label: function () { return 'Брой'; }, order: 'fixed', fixed: ['all'] }
    };
    var rowSel = document.getElementById('rows'), colSel = document.getElementById('cols');
    Object.keys(DIMS).forEach(function (k) {
      if (k !== 'none') rowSel.add(new Option(DIMS[k].t, k));
      colSel.add(new Option(DIMS[k].t, k));
    });
    rowSel.value = 'cent'; colSel.value = 'sex';
    var inc = { ten: true, sto: true, kilo: false };
    ['ten', 'sto', 'kilo'].forEach(function (k) {
      var c = document.getElementById('inc-' + k); c.checked = inc[k];
      c.onchange = function () { inc[k] = c.checked; render(); };
    });
    rowSel.onchange = colSel.onchange = render;
    document.getElementById('swap').onclick = function () {
      if (colSel.value === 'none') return; var r = rowSel.value; rowSel.value = colSel.value; colSel.value = r; render();
    };
    var cur = null;
    function people() { return ALL.filter(function (p) { return inc[p.sec]; }); }
    function sortVals(dim, vals, cnt) {
      var D = DIMS[dim];
      if (D.order === 'fixed') return D.fixed.filter(function (v) { return vals.indexOf(v) >= 0; });
      if (D.order === 'num') return vals.sort(function (a, b) { return (a === '?') - (b === '?') || +a - +b; });
      return vals.sort(function (a, b) { return (a === 'неизвестно') - (b === 'неизвестно') || cnt[b] - cnt[a] || a.localeCompare(b, 'bg'); });
    }
    function render() {
      var P = people(), R = DIMS[rowSel.value], Cd = DIMS[colSel.value];
      var cells = {}, rowsSet = {}, colsSet = {}, rowP = {}, colP = {};
      P.forEach(function (p) {
        R.get(p).forEach(function (r) {
          rowsSet[r] = 1; (rowP[r] = rowP[r] || []).indexOf(p) < 0 && rowP[r].push(p);
          Cd.get(p).forEach(function (c) {
            colsSet[c] = 1; (colP[c] = colP[c] || []).indexOf(p) < 0 && colP[c].push(p);
            var k = r + '\u0001' + c; (cells[k] = cells[k] || []).push(p);
          });
        });
      });
      var rc = {}, cc = {}; Object.keys(rowP).forEach(function (k) { rc[k] = rowP[k].length; }); Object.keys(colP).forEach(function (k) { cc[k] = colP[k].length; });
      var rows = sortVals(rowSel.value, Object.keys(rowsSet), rc), cols = sortVals(colSel.value, Object.keys(colsSet), cc);
      var max = 0; Object.keys(cells).forEach(function (k) { max = Math.max(max, cells[k].length); });
      var showTotalCol = colSel.value !== 'none';
      var h = '<table class="pivot"><thead><tr><th scope="col" class="corner">' + esc(R.t) + (showTotalCol ? ' \\ ' + esc(Cd.t) : '') + '</th>' +
        cols.map(function (c) { return '<th scope="col">' + esc(Cd.label(c)) + '</th>'; }).join('') + (showTotalCol ? '<th scope="col" class="tot">Общо*</th>' : '') + '</tr></thead><tbody>';
      rows.forEach(function (r) {
        h += '<tr><th scope="row">' + esc(R.label(r)) + '</th>';
        cols.forEach(function (c) {
          var L = cells[r + '\u0001' + c] || [], n = L.length, pc = max ? Math.round(n / max * 70) : 0;
          h += n ? '<td><button type="button" data-r="' + esc(r) + '" data-c="' + esc(c) + '" style="--h:' + pc + '%">' + n + '</button></td>' : '<td class="z">·</td>';
        });
        if (showTotalCol) h += '<td class="tot"><button type="button" data-r="' + esc(r) + '" data-c="*">' + rowP[r].length + '</button></td>';
        h += '</tr>';
      });
      h += '</tbody><tfoot><tr><th scope="row">Общо*</th>' + cols.map(function (c) { return '<td><button type="button" data-r="*" data-c="' + esc(c) + '">' + colP[c].length + '</button></td>'; }).join('') +
        (showTotalCol ? '<td class="tot"><button type="button" data-r="*" data-c="*">' + P.length + '</button></td>' : '') + '</tr></tfoot></table>';
      var box = document.getElementById('pivot'); box.innerHTML = P.length ? h : '<p class="empty">Избери поне един раздел.</p>';
      box.querySelectorAll('button[data-r]').forEach(function (b) {
        b.onclick = function () {
          var r = b.dataset.r, c = b.dataset.c, L;
          if (r === '*' && c === '*') L = P; else if (r === '*') L = colP[c]; else if (c === '*') L = rowP[r]; else L = cells[r + '\u0001' + c];
          var title = (r === '*' ? '' : R.label(r)) + (r !== '*' && c !== '*' && colSel.value !== 'none' ? ' · ' : '') + (c === '*' || colSel.value === 'none' ? '' : Cd.label(c));
          showList(title || 'Всички', L);
          box.querySelectorAll('button.on').forEach(function (x) { x.classList.remove('on'); }); b.classList.add('on');
        };
      });
      var multi = rowSel.value === 'field' || colSel.value === 'field';
      document.getElementById('multi').hidden = !multi;
      cur = { rows: rows, cols: cols, cells: cells, rowP: rowP, colP: colP, R: R, C: Cd, P: P, tc: showTotalCol };
      cards(P);
      document.getElementById('cell').innerHTML = '';
    }
    function showList(title, L) {
      var d = document.getElementById('cell');
      L = L.slice().sort(function (a, b) { return (a.born || 0) - (b.born || 0); });
      d.innerHTML = '<h2>' + esc(title) + ' <span>· ' + L.length + '</span></h2>';
      var ul = el('ul', 'list'); L.forEach(function (p) { ul.appendChild(listItem(p)); }); d.appendChild(ul);
      loadPhotos(d); d.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    function cards(P) {
      var n = P.length || 1, f = P.filter(function (p) { return p.sex === 'f'; }).length, bg = P.filter(function (p) { return p.lives === 'bg'; }).length;
      var cs = P.map(century).filter(Boolean), cities = {}; P.forEach(function (p) { if (p.city !== 'неизвестно') cities[p.city] = 1; });
      var fl = {}; P.forEach(function (p) { p.fields.forEach(function (k) { fl[k] = 1; }); });
      document.getElementById('cards').innerHTML = [
        [P.length, 'истории'], [Math.round(f / n * 100) + '%', 'жени (' + f + ')'], [Math.round(bg / n * 100) + '%', 'живеят основно в България'],
        [cs.length ? roman(Math.min.apply(null, cs)) + '–' + roman(Math.max.apply(null, cs)) : '—', 'век на раждане'], [Object.keys(cities).length, 'града на раждане'], [Object.keys(fl).length, 'сфери']
      ].map(function (x) { return '<div><b>' + x[0] + '</b><span>' + x[1] + '</span></div>'; }).join('');
    }
    document.getElementById('csv').onclick = function () {
      if (!cur) return;
      var q = function (s) { return '"' + String(s).replace(/"/g, '""') + '"'; };
      var lines = [[cur.R.t].concat(cur.cols.map(function (c) { return cur.C.label(c); }), cur.tc ? ['Общо'] : []).map(q).join(',')];
      cur.rows.forEach(function (r) { lines.push([q(cur.R.label(r))].concat(cur.cols.map(function (c) { return (cur.cells[r + '\u0001' + c] || []).length; }), cur.tc ? [cur.rowP[r].length] : []).join(',')); });
      lines.push([q('Общо')].concat(cur.cols.map(function (c) { return cur.colP[c].length; }), cur.tc ? [cur.P.length] : []).join(','));
      var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['\ufeff' + lines.join('\n')], { type: 'text/csv;charset=utf-8' }));
      a.download = 'bum-statistika.csv'; document.body.appendChild(a); a.click(); a.remove();
    };
    render();
    document.querySelector('main').appendChild(kaBlock('@stats', 'Научи се да четеш таблици и данни'));
  }

  window.BUM = { TEN: TEN, STO: STO, KILO: KILO, FIELDS: FIELDS };
  var page = document.body.getAttribute('data-page');
  if (page === 'home') pageHome();
  else if (page === 'ten') pageTen();
  else if (page === 'sto') pageList('sto');
  else if (page === 'kilo') pageList('kilo');
  else if (page === 'story') pageStory();
  else if (page === 'stats') pageStats();
})();
